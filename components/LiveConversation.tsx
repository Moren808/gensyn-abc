import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { decode, decodeAudioData, createBlob } from '../utils';

interface LiveConversationProps {
  onClose: () => void;
}

type Status = 'idle' | 'connecting' | 'listening' | 'speaking' | 'error';
type TranscriptItem = {
    speaker: 'user' | 'model';
    text: string;
};

const CloseIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);


const LiveConversation: React.FC<LiveConversationProps> = ({ onClose }) => {
    const [status, setStatus] = useState<Status>('connecting');
    const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
    const transcriptEndRef = useRef<HTMLDivElement>(null);
  
    const sessionPromiseRef = useRef<any>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const nextStartTimeRef = useRef<number>(0);

    const currentInputTranscription = useRef('');
    const currentOutputTranscription = useRef('');

    const scrollToBottom = () => {
        transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [transcript]);

    const stopConversation = useCallback(() => {
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
        }
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
        }
        if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
            inputAudioContextRef.current.close();
        }
        if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
            outputAudioContextRef.current.close();
        }
        if (sessionPromiseRef.current) {
            sessionPromiseRef.current.then((session: any) => session.close());
        }
        onClose();
    }, [onClose]);

    useEffect(() => {
        const start = async () => {
            try {
                if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                    throw new Error('Browser does not support audio capture.');
                }
                
                setStatus('connecting');
                
                // Fix: Cast window to any to allow for webkitAudioContext for older browser compatibility.
                inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                // Fix: Cast window to any to allow for webkitAudioContext for older browser compatibility.
                outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaStreamRef.current = stream;

                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
                
                sessionPromiseRef.current = ai.live.connect({
                    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                    callbacks: {
                        onopen: () => {
                            setStatus('listening');
                            const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
                            const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
                            scriptProcessorRef.current = scriptProcessor;

                            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                                const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                                const pcmBlob = createBlob(inputData);
                                sessionPromiseRef.current.then((session: any) => {
                                    session.sendRealtimeInput({ media: pcmBlob });
                                });
                            };
                            source.connect(scriptProcessor);
                            scriptProcessor.connect(inputAudioContextRef.current!.destination);
                        },
                        onmessage: async (message: LiveServerMessage) => {
                            // Handle transcriptions
                            if (message.serverContent?.inputTranscription) {
                                currentInputTranscription.current += message.serverContent.inputTranscription.text;
                            }
                            if (message.serverContent?.outputTranscription) {
                                currentOutputTranscription.current += message.serverContent.outputTranscription.text;
                                setStatus('speaking');
                            }

                            if (message.serverContent?.turnComplete) {
                                const fullInput = currentInputTranscription.current.trim();
                                const fullOutput = currentOutputTranscription.current.trim();
                                
                                setTranscript(prev => {
                                    const newTranscript = [...prev];
                                    if(fullInput) newTranscript.push({ speaker: 'user', text: fullInput});
                                    if(fullOutput) newTranscript.push({ speaker: 'model', text: fullOutput });
                                    return newTranscript;
                                });

                                currentInputTranscription.current = '';
                                currentOutputTranscription.current = '';
                                setStatus('listening');
                            }

                            // Handle audio playback
                            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                            if (base64Audio) {
                                const outputCtx = outputAudioContextRef.current!;
                                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
                                const audioBuffer = await decodeAudioData(decode(base64Audio), outputCtx, 24000, 1);
                                const source = outputCtx.createBufferSource();
                                source.buffer = audioBuffer;
                                source.connect(outputCtx.destination);
                                source.addEventListener('ended', () => {
                                    audioSourcesRef.current.delete(source);
                                });
                                source.start(nextStartTimeRef.current);
                                nextStartTimeRef.current += audioBuffer.duration;
                                audioSourcesRef.current.add(source);
                            }

                            if (message.serverContent?.interrupted) {
                                audioSourcesRef.current.forEach(source => {
                                    source.stop();
                                    audioSourcesRef.current.delete(source);
                                });
                                nextStartTimeRef.current = 0;
                            }
                        },
                        onerror: (e: ErrorEvent) => {
                            console.error('API Error:', e);
                            setStatus('error');
                        },
                        onclose: (e: CloseEvent) => {
                            console.log('API connection closed.');
                        },
                    },
                    config: {
                        responseModalities: [Modality.AUDIO],
                        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
                        systemInstruction: `You are an expert guide for Gensyn, a decentralized deep learning compute protocol. Your primary role is to explain Gensyn's mission and technology in a simple, clear, and friendly manner. Pronounce the name as "Jen-syn".

**Core Knowledge Base (The Big Picture):**

*   **What is Gensyn?**
    *   At its heart, Gensyn is a global 'supercomputer' built from a network of devices worldwide—from individual gaming PCs to large data centers. Its purpose is to make training powerful AI models affordable and accessible to everyone, breaking the dependency on expensive, centralized cloud providers. It's often described with the analogy of an "Airbnb for computer power."

*   **The Problem Gensyn Solves:**
    *   **Exploding Demand:** The computational need for top-tier AI models is doubling every 3-4 months.
    *   **Extreme Cost:** Training large models is incredibly expensive, centralizing AI development within a few tech giants.
    *   **Wasted Resources:** Gensyn aims to tap into the vast amount of idle computer power around the world.
    *   **Barriers to Innovation:** The high cost and lack of access stifle innovation for smaller teams and researchers.

*   **The "Secret Sauce" - Trustless Verification (Proof-of-Learning):**
    *   **The Challenge:** How do you prove that a computer in the network actually did the complex AI training it was paid for, without wastefully re-doing all the work?
    *   **Gensyn's Solution:** A highly efficient, multi-layered system that combines probabilistic checks, a pinpoint protocol for disputes, and a game-theoretic incentive structure (staking and slashing) to make honesty the most profitable strategy.

*   **The Network Participants:**
    *   **Submitters:** Users who pay to have their AI models trained.
    *   **Solvers:** The workers who perform the AI training.
    *   **Verifiers:** Who check the Solvers' work.
    *   **Whistleblowers:** The final line of defense, who check the Verifiers' work.

*   **Key Benefits & Vision:**
    *   **Cost:** Projected to be up to 80% cheaper than traditional cloud providers.
    *   **Scale:** Unprecedented scalability, limited only by the world's available hardware.
    *   **Democratization:** To allow anyone to innovate in AI, not just a select few.
    *   **Long-Term Goal:** To create a permanent, unstoppable resource for humanity's AI development.

**The Public Testnet & RL Swarm (The 'Right Now' Phase):**

*   **What is it?** The Gensyn Public Testnet is a live, open network (a custom Ethereum Rollup) that launched in March 2025. The current phase is focused on an application called "RL Swarm."

*   **RL Swarm Explained:**
    *   **Analogy:** Think of it as a global, collaborative study group for AI. Instead of learning alone, AI agents learn together over the internet.
    *   **How it Works:** Anyone can download RL Swarm and run a small, open-source language model on their computer. This model connects to a "swarm" of other models from around the world. Together, they tackle reasoning problems (like logic, math, or coding). They share answers, critique each other's work, and learn from the collective feedback using Reinforcement Learning (RL).
    *   **The Goal:** It's the first live demonstration of Gensyn's core technology, proving that AI can be trained collaboratively and trustlessly on a peer-to-peer network.

*   **How to Get Involved Right Now:**
    *   **Run a Node:** You can join the swarm by running a node on your own computer (Windows, macOS, or Linux). You'll need a Hugging Face account for a model.
    *   **Easy Mode (Octaspace):** For an even simpler setup, you can use a cloud service like Octaspace, which deploys a Gensyn node for you in a few clicks.
    *   **Why Participate?:** By joining, you help improve the swarm's overall intelligence. Your contributions are tracked on the Gensyn Testnet, and you can even keep the improved, locally trained model for your own applications.

**Your Persona & How to Answer:**
*   You are friendly, patient, and knowledgeable.
*   Start with simple explanations and analogies. Feel free to switch between explaining the big, long-term vision and the practical 'right now' details of the Testnet and RL Swarm.
*   Your goal is to make anyone, regardless of their technical background, understand the importance and innovation of Gensyn.
*   **Important Note:** Acknowledge that the protocol is constantly evolving. The core principles are the most important part.`,
                        inputAudioTranscription: {},
                        outputAudioTranscription: {},
                    },
                });

            } catch (error) {
                console.error("Failed to start conversation:", error);
                setStatus('error');
            }
        };

        start();

        return () => {
            stopConversation();
        };
    }, [stopConversation]);

    const getStatusMessage = () => {
        switch (status) {
            case 'connecting': return 'Connecting to the guide...';
            case 'listening': return 'Listening... Ask me anything about Gensyn!';
            case 'speaking': return 'Thinking...';
            case 'error': return 'An error occurred. Please try again.';
            default: return '';
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center animate-fadeIn" role="dialog" aria-modal="true" aria-labelledby="chat-title">
          <div className="bg-[#1a1a1a] border border-[#fad7d1]/20 rounded-2xl w-[90%] h-[90%] max-w-3xl flex flex-col shadow-2xl shadow-black/50">
            <header className="flex items-center justify-between p-4 border-b border-[#fad7d1]/20">
              <h2 id="chat-title" className="text-xl font-bold text-[#fad7d1]">Talk to a Gensyn Guide</h2>
              <button onClick={stopConversation} className="text-white/70 hover:text-white transition-colors" aria-label="Close conversation">
                <CloseIcon />
              </button>
            </header>
    
            <main className="flex-1 p-6 overflow-y-auto space-y-6">
              {transcript.map((item, index) => (
                <div key={index} className={`flex ${item.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-xl ${item.speaker === 'user' ? 'bg-[#fad7d1] text-[#230800]' : 'bg-[#2a2a2a] text-white/90'}`}>
                    <p>{item.text}</p>
                  </div>
                </div>
              ))}
               <div ref={transcriptEndRef} />
            </main>
    
            <footer className="p-4 text-center border-t border-[#fad7d1]/20">
                <p className="text-white/60 text-sm flex items-center justify-center gap-2">
                    {status === 'listening' && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
                    {status === 'speaking' && <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>}
                    {getStatusMessage()}
                </p>
            </footer>
          </div>
        </div>
      );
};

export default LiveConversation;

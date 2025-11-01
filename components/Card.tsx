import React from 'react';
import type { CardData } from '../types';
import { SpeakerWaveIcon } from '../App';

interface CardProps {
  data: CardData;
  isSpeaking: boolean;
  onSpeakClick: () => void;
}

const Card: React.FC<CardProps> = ({ data, isSpeaking, onSpeakClick }) => {
  return (
    <div 
      className={`bg-[#230800]/50 backdrop-blur-sm border border-[#fad7d1]/20 rounded-2xl p-5 sm:p-6 h-full flex flex-col transform transition-all duration-300 shadow-lg shadow-black/20 ${isSpeaking ? 'scale-105 border-[#fad7d1]/60' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div className="text-[#fad7d1]">
          {data.icon}
        </div>
        <div className="text-6xl md:text-8xl font-black text-white/10 -mt-2 md:-mt-4 relative w-16 h-16 md:w-24 md:h-24 flex items-center justify-center">
          <span className="absolute">{data.letter}</span>
        </div>
      </div>
      <div className="mt-4 flex-grow">
        <h3 className="text-xl sm:text-2xl font-bold text-white">{data.title}</h3>
        <p className="mt-2 text-white/70 text-base leading-relaxed">
          {data.description}
        </p>
      </div>
      <div className="mt-4 flex justify-end">
        <button
          onClick={onSpeakClick}
          className="p-2 rounded-full text-white/60 hover:bg-white/10 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
          aria-label={`Listen to ${data.title}`}
        >
          <SpeakerWaveIcon className={`w-6 h-6 transition-colors ${isSpeaking ? 'text-[#fad7d1] animate-pulse' : ''}`} />
        </button>
      </div>
    </div>
  );
};

export default Card;
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import Card from './components/Card';
import type { CardData } from './types';
import LiveConversation from './components/LiveConversation';
import { decode, decodeAudioData } from './utils';

// Gensyn Icon Component
const GensynIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 37 27" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path fillRule="evenodd" clipRule="evenodd" d="M11.8125 0H25.1875V3.8125H29V7.625H32.8125V11.4375H36.625V15.25H32.8125V19.0625H29V22.875H25.1875V26.6875H11.8125V22.875H8V19.0625H4.1875V15.25H0.375V11.4375H4.1875V7.625H8V3.8125H11.8125V0ZM21.375 3.8125H15.625V7.625H11.8125V11.4375H8V15.25H11.8125V19.0625H15.625V22.875H21.375V19.0625H25.1875V15.25H29V11.4375H25.1875V7.625H21.375V3.8125Z"/>
  </svg>
);


// Icon Components (defined outside the main App component to prevent re-creation on render)
const BrainIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5a6 6 0 00-6-6v-1.5a6 6 0 00-6 6v1.5a6 6 0 006 6zM6 11.25a6 6 0 016-6v1.5a6 6 0 01-6 6v-1.5z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 11.25a6 6 0 00-6-6v1.5a6 6 0 006 6v-1.5z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v-1.5m0 16.5v-1.5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75l-1.5-1.5m9 9l-1.5-1.5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 15.75l-1.5 1.5m9-12l1.5-1.5m-12 9l-1.5 1.5" />
  </svg>
);

const CloudIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
  </svg>
);


const CostIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.826-1.106-2.156 0-2.982C10.544 8.02 11.27 7.79 12 7.79c.768 0 1.536.219 2.121.659l.879.659" />
  </svg>
);

const NetworkIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
  </svg>
);

const ShieldIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.286zm0 13.036h.008v.008h-.008v-.008z" />
  </svg>
);

const VerifyIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const EconomyIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.75A.75.75 0 013 4.5h.75m0 0h.75A.75.75 0 015.25 6v.75m0 0v-.75A.75.75 0 015.25 4.5h-.75m0 0h.75a.75.75 0 01.75.75v.75m0 0v-.75a.75.75 0 01.75-.75h.75a.75.75 0 01.75.75v.75M9 12l-3 3m0 0l3 3m-3-3h12.75" />
  </svg>
);

const FoundationIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
  </svg>
);

const GlobeIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
  </svg>
);

const ChipIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 21v-1.5M15.75 3v1.5m0 15v1.5M12 4.5v-1.5m0 18v-1.5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 8.25a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
  </svg>
);

const GiftIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18m-6-12h12M4.5 9.75a2.25 2.25 0 01-2.25 2.25v2.25a2.25 2.25 0 012.25 2.25H12m0 0h7.5a2.25 2.25 0 002.25-2.25v-2.25a2.25 2.25 0 00-2.25-2.25H12m0 0V3m0 6.75A2.25 2.25 0 009.75 9.75h-5.25A2.25 2.25 0 002.25 12v2.25a2.25 2.25 0 002.25 2.25h5.25m6.75-6.75a2.25 2.25 0 012.25 2.25h5.25a2.25 2.25 0 012.25 2.25v-2.25a2.25 2.25 0 01-2.25-2.25h-5.25z" />
  </svg>
);

const PlusCircleIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const KeyIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
  </svg>
);

const ChatIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.76 9.76 0 01-2.53-.388A.75.75 0 008.25 20.25l.406-1.711a.75.75 0 00-.317-.665A9.753 9.753 0 013 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
  </svg>
);

const StoreIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5A2.25 2.25 0 0011.25 11.25H4.5A2.25 2.25 0 002.25 13.5V21M3 3h18M5.25 3v.001M7.5 3v.001m2.25 0v.001M12 3v.001m2.25 0v.001m2.25 0v.001m2.25 0v.001M10.5 6.75h3M4.5 11.25h6.75" />
    <path d="M18 21v-7.5a2.25 2.25 0 00-2.25-2.25H9" />
  </svg>
);

const NodeIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 4.5a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM10.5 4.5v3.75m0 0a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM21 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zm0 0v3.75m0 0a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
  </svg>
);

const LockOpenIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m11.25 3.75v-1.5a3.75 3.75 0 00-3.75-3.75h-1.5m-3.75 0h-1.5a3.75 3.75 0 00-3.75 3.75v1.5m11.25 0h-1.5a2.25 2.25 0 00-2.25 2.25v3.75c0 .621.504 1.125 1.125 1.125h3.75c.621 0 1.125-.504 1.125-1.125V16.5a2.25 2.25 0 00-2.25-2.25h-1.5m-3.75 0H8.25a2.25 2.25 0 00-2.25 2.25v3.75c0 .621.504 1.125 1.125 1.125h3.75c.621 0 1.125-.504 1.125-1.125V16.5a2.25 2.25 0 00-2.25-2.25z" />
  </svg>
);

const CheckBadgeIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.745 3.745 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
  </svg>
);

const BoltIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
  </svg>
);

const TrendingUpIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-3.94.882m3.94-.882l-1.22 2.74m0-2.74L18 15.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ChartPieIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 100 15 7.5 7.5 0 000-15zm0 0V3m0 3a7.5 7.5 0 00-4.133 13.417M10.5 3a7.5 7.5 0 014.133 13.417m0 0c-2.943 1.636-6.32 1.636-9.263 0" />
  </svg>
);

const FireIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.62a8.983 8.983 0 013.362-3.797z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75c3.362 0 6.362-2.146 8.014-5.214A8.252 8.252 0 0012 3a8.25 8.25 0 00-8.014 6.536A8.287 8.287 0 019 9.62a8.983 8.983 0 003 0.13z" />
  </svg>
);

const ArrowsRightLeftIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h18M16.5 3L21 7.5m0 0L16.5 12M21 7.5H3" />
  </svg>
);

const SparklesIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.562L16.25 21.75l-.648-1.188a2.25 2.25 0 01-1.423-1.423L13.25 18.5l1.188-.648a2.25 2.25 0 011.423-1.423L16.25 15l.648 1.188a2.25 2.25 0 011.423 1.423L19.25 18.5l-1.188.648a2.25 2.25 0 01-1.423 1.423z" />
  </svg>
);

const BanknotesIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.75A.75.75 0 013 4.5h.75m0 0h.75A.75.75 0 015.25 6v.75m0 0v-.75A.75.75 0 015.25 4.5h-.75m0 0h.75a.75.75 0 01.75.75v.75m0 0v-.75a.75.75 0 01.75-.75h.75a.75.75 0 01.75.75v.75M9 12l-3 3m0 0l3 3m-3-3h12.75" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ClockIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const MicIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-14 0m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
  );

export const SpeakerWaveIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5L6 9H2v6h4l5 4V5z M15.54 8.46a5 5 0 010 7.07 M19.07 4.93a10 10 0 010 14.14" />
    </svg>
);

const gensynData: CardData[] = [
  {
    letter: 'A',
    title: 'Accessible AI Training',
    description: "AI needs huge computer power to learn. Gensyn makes this power available to everyone, not just big tech companies.",
    icon: <BrainIcon />,
  },
  {
    letter: 'B',
    title: 'Beyond the Cloud',
    description: 'Instead of relying on a few giant cloud providers, Gensyn builds a network from computers all over the world.',
    icon: <CloudIcon />,
  },
  {
    letter: 'C',
    title: 'Cost Effective',
    description: 'By using a global, decentralized network, Gensyn dramatically lowers the cost of training powerful AI models.',
    icon: <CostIcon />,
  },
  {
    letter: 'D',
    title: 'Decentralized Network',
    description: "No single company owns or controls the network. It's a community-driven \"supercomputer\" for AI.",
    icon: <NetworkIcon />,
  },
  {
    letter: 'E',
    title: 'Economic Incentives',
    description: "The network runs on a token-based economy. People who provide computer power are rewarded, creating a self-sustaining ecosystem.",
    icon: <EconomyIcon />,
  },
  {
    letter: 'F',
    title: 'Foundation Models',
    description: "Gensyn is designed to handle the massive scale required to train the next generation of huge AI, like advanced foundation models.",
    icon: <FoundationIcon />,
  },
  {
    letter: 'G',
    title: 'Global Supercomputer',
    description: "By connecting machines worldwide, Gensyn creates a single, massively powerful computing resource accessible from anywhere.",
    icon: <GlobeIcon />,
  },
  {
    letter: 'H',
    title: 'Heterogeneous Hardware',
    description: "The network can use many different types of computer hardware, from gaming PCs to data centers, making it incredibly flexible.",
    icon: <ChipIcon />,
  },
  {
    letter: 'I',
    title: 'Incentivized Participation',
    description: "Anyone can earn rewards by connecting their hardware to the network, which encourages growth and increases available power.",
    icon: <GiftIcon />,
  },
  {
    letter: 'J',
    title: 'Joining is Simple',
    description: "The platform is being designed to make it easy for hardware owners to connect their machines and start earning rewards.",
    icon: <PlusCircleIcon />,
  },
  {
    letter: 'K',
    title: 'Knowledge Unlocked',
    description: "By democratizing AI training, Gensyn empowers more researchers and developers to innovate and build the future.",
    icon: <KeyIcon />,
  },
  {
    letter: 'L',
    title: 'Large Language Models',
    description: "Training massive models like GPT-4 requires enormous computation, a perfect use case for Gensyn's scalable network.",
    icon: <ChatIcon />,
  },
  {
    letter: 'M',
    title: 'Marketplace Dynamics',
    description: "Gensyn creates a transparent and competitive marketplace for machine learning compute, driven by supply and demand.",
    icon: <StoreIcon />,
  },
  {
    letter: 'N',
    title: 'Nodes',
    description: "The individual computers connected to the Gensyn network are called nodes. Together, they form the decentralized supercomputer.",
    icon: <NodeIcon />,
  },
  {
    letter: 'O',
    title: 'Open & Permissionless',
    description: "Anyone can use the network to train models or provide compute power without needing permission from a central authority.",
    icon: <LockOpenIcon />,
  },
  {
    letter: 'P',
    title: 'Proof-of-Learning',
    description: "Gensyn's special technology. It's a clever way to mathematically *prove* that AI training was done correctly, creating trust without a central authority.",
    icon: <ShieldIcon />,
  },
  {
    letter: 'Q',
    title: 'Quality of Service',
    description: "The network has mechanisms to ensure that the computational work is performed reliably and correctly by all participants.",
    icon: <CheckBadgeIcon />,
  },
  {
    letter: 'R',
    title: 'Resilient by Design',
    description: "Because the network is decentralized, it's incredibly robust. There is no single point of failure that can bring it down.",
    icon: <BoltIcon />,
  },
  {
    letter: 'S',
    title: 'Scalability',
    description: "As more computers (nodes) join the network, its total power grows, allowing it to scale to meet any computational demand.",
    icon: <TrendingUpIcon />,
  },
  {
    letter: 'T',
    title: 'Tokenomics',
    description: "The economic system that governs the network, using tokens to pay for compute, reward providers, and secure the protocol.",
    icon: <ChartPieIcon />,
  },
  {
    letter: 'U',
    title: 'Unstoppable Infrastructure',
    description: "As a decentralized protocol, Gensyn is designed to be a permanent and unstoppable resource for humanity's AI development.",
    icon: <FireIcon />,
  },
  {
    letter: 'V',
    title: 'Verifiable & Trustless',
    description: "Because the work is proven correct, you don't need to trust the person providing the computer power. The network is built on verifiable truth.",
    icon: <VerifyIcon />,
  },
  {
    letter: 'W',
    title: 'Workload Distribution',
    description: "Complex AI training tasks are intelligently broken down and distributed across many nodes in the network to be completed in parallel.",
    icon: <ArrowsRightLeftIcon />,
  },
  {
    letter: 'X',
    title: 'eXponential Growth',
    description: "The network is built for the exponential growth of AI, ensuring that computation power keeps pace with new innovations.",
    icon: <SparklesIcon />,
  },
  {
    letter: 'Y',
    title: 'Yield for Providers',
    description: "Hardware owners can put their idle machines to work, generating a consistent and valuable yield in the form of token rewards.",
    icon: <BanknotesIcon />,
  },
  {
    letter: 'Z',
    title: 'Zero Downtime',
    description: "The decentralized and resilient nature of the network means it's always available, aiming for zero downtime for users.",
    icon: <ClockIcon />,
  },
];


interface Analogy {
  id: string;
  concept: string;
  title: string;
  explanation: string;
}

const analogyData: Analogy[] = [
  {
    id: 'network',
    concept: 'Decentralized Network',
    title: 'Analogy: Airbnb for Computers',
    explanation:
      "Think of it like Airbnb, but for computer power. Instead of one giant hotel (a traditional cloud company), anyone with a spare room (a powerful computer) can rent it out. Gensyn connects all these 'spare rooms' into one massive, global network, making compute power accessible and affordable for everyone.",
  },
  {
    id: 'training',
    concept: 'AI Training',
    title: 'Analogy: Teaching a Super-Smart Student',
    explanation:
      "Imagine teaching a student a complex subject. You give them tons of books and examples (data). The student studies hard, making connections and learning patterns (training). Gensyn provides a global library and an infinitely scalable study group, so this 'student' can learn faster and more efficiently than ever before.",
  },
  {
    id: 'proof',
    concept: 'Proof-of-Learning',
    title: "Analogy: 'Showing Your Work' in Math Class",
    explanation:
      "Remember having to 'show your work' to prove you knew the answer? Gensyn's 'Proof-of-Learning' is a cryptographic way for computers to do just that. It proves they actually did the hard training they were paid for, creating a trustless system where no one can cheat. It's verifiable proof of effort.",
  },
    {
    id: 'supercomputer',
    concept: 'Global Supercomputer',
    title: 'Analogy: A Global Potluck Dinner',
    explanation:
      "Everyone brings a dish (their computer's power) to a huge dinner party. The result is a massive feast (a supercomputer) far greater and more diverse than any single person could prepare on their own. That's how Gensyn pools resources from around the world.",
  },
  {
    id: 'cost',
    concept: 'Cost-Effectiveness',
    title: 'Analogy: Buying Wholesale vs. Retail',
    explanation:
      "Instead of buying expensive computer time from a single high-end store (like AWS or Google Cloud), Gensyn lets you buy it directly from manufacturers and owners all over the world. By cutting out the middleman, the price drops significantly.",
  },
  {
    id: 'scale',
    concept: 'Scalability',
    title: 'Analogy: Building with LEGOs',
    explanation:
      "Gensyn's network is like a LEGO creation. You can always add more bricks (computers) to make it bigger and more powerful. It can grow to any size needed to handle even the most demanding AI projects, without having to start from scratch.",
  },
  {
    id: 'incentives',
    concept: 'Economic Incentives',
    title: 'Analogy: A Rewards Program for Your PC',
    explanation:
      "Just like you get loyalty points for shopping, connecting your computer to Gensyn earns you rewards. Your PC works on AI tasks when it would otherwise be idle, and you get paid for it. This encourages more people to join and strengthen the network.",
  },
  {
    id: 'resilience',
    concept: 'Resiliency',
    title: 'Analogy: The Internet Itself',
    explanation:
      "If one road is blocked, traffic finds another way. The internet is designed this way. Similarly, if one computer on the Gensyn network goes offline, tasks are automatically rerouted to other machines. There's no single point of failure.",
  },
  {
    id: 'trustless',
    concept: 'Verifiable & Trustless',
    title: 'Analogy: A Self-Grading Test',
    explanation:
      "The 'Proof-of-Learning' system is like a test that automatically checks its own answers and shows the steps. You don't need a teacher (a central company) to verify the results are correct; the math proves it for you, creating a trustless system.",
  },
  {
    id: 'hardware',
    concept: 'Heterogeneous Hardware',
    title: 'Analogy: A Universal Power Adapter',
    explanation:
      "It doesn't matter what brand of device you have (a gaming PC, a server, etc.), a universal adapter lets you plug it in. Gensyn is similar, allowing many different types of computer hardware to connect and contribute their unique power to the network.",
  },
  {
    id: 'permissionless',
    concept: 'Open & Permissionless',
    title: 'Analogy: A Public Library',
    explanation:
      "Anyone can walk into a public library, read a book (use compute), or even donate a book (provide compute). You don't need special permission or an expensive membership. Gensyn is open for anyone to join and use.",
  },
  {
    id: 'tokenomics',
    concept: 'Tokenomics',
    title: "Analogy: An Arcade's Token System",
    explanation:
      "You buy tokens at an arcade to play games. Developers use Gensyn tokens to 'play' or run their AI models. The arcade machine owners (hardware providers) collect those tokens as payment. It's the internal currency that makes everything work smoothly.",
  },
  {
    id: 'foundation',
    concept: 'Foundation Models',
    title: "Analogy: Building a Skyscraper's Foundation",
    explanation:
      "Training a massive AI model is like laying the deep, complex foundation for a skyscraper. It's a huge undertaking that supports everything built on top. Gensyn provides the global construction crew and heavy machinery for this monumental task.",
  },
];

const App: React.FC = () => {
  const [selectedAnalogy, setSelectedAnalogy] = useState<Analogy>(analogyData[0]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    // Initialize AudioContext on component mount
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    return () => {
      // Clean up on unmount
      if (currentSourceRef.current) {
        currentSourceRef.current.stop();
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  const handleSpeak = async (text: string, id: string) => {
    // If the same item is clicked, stop it (toggle off)
    if (speakingId === id) {
      if (currentSourceRef.current) {
        currentSourceRef.current.stop();
        currentSourceRef.current = null;
      }
      setSpeakingId(null);
      return;
    }

    // If another item is speaking, stop it before proceeding
    if (currentSourceRef.current) {
      currentSourceRef.current.stop();
      currentSourceRef.current = null;
    }
    
    setSpeakingId(id);

    try {
      const textToSpeak = text.replace(/Gensyn/g, 'Jensyn');
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: textToSpeak }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });
      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

      if (base64Audio && audioContextRef.current) {
        if (audioContextRef.current.state === 'suspended') {
            await audioContextRef.current.resume();
        }
        const audioBuffer = await decodeAudioData(decode(base64Audio), audioContextRef.current, 24000, 1);
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current.destination);
        source.onended = () => {
            setSpeakingId(null);
            currentSourceRef.current = null;
        };
        source.start();
        currentSourceRef.current = source;
      } else {
        setSpeakingId(null);
      }
    } catch (error) {
      console.error("TTS Error:", error);
      setSpeakingId(null);
    }
  };

  return (
    <div className="bg-[#0a0a0a] text-white font-sans antialiased">
      {/* Hero Section */}
      <div className="h-screen flex flex-col items-center justify-center text-center p-4 bg-black">
        <GensynIcon className="w-28 h-auto sm:w-36 text-[#fad7d1] mb-8 animate-pulseGlow" />

        {/* Title and Subtitle */}
        <div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white">
                The <span className="text-[#fad7d1]">ABCs</span> of Gensyn
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-white/80">
                A simple guide to understanding the future of AI computation.
            </p>
        </div>
      </div>


      {/* Content Section */}
      <div className="relative bg-[#0a0a0a]">
        <div className="absolute top-0 left-0 w-full h-full bg-grid-pattern z-0"></div>
        <div className="absolute top-0 left-0 w-full h-48 bg-gradient-to-b from-black to-transparent z-0"></div>
        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
            <main>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {gensynData.map((item) => (
                    <Card
                        key={item.letter}
                        data={item}
                        isSpeaking={speakingId === `card-${item.letter}`}
                        onSpeakClick={() => handleSpeak(`${item.title}. ${item.description}`, `card-${item.letter}`)}
                    />
                ))}
            </div>
            </main>
            
            <section className="mt-24 sm:mt-32">
            <div className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#fad7d1]">
                Explained with Analogies
                </h2>
                <p className="mt-3 max-w-xl mx-auto text-md text-white/60">
                Sometimes the best way to understand something new is to compare it to something familiar.
                </p>
            </div>

            <div className="max-w-4xl mx-auto">
                <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mb-8" role="tablist" aria-orientation="horizontal">
                {analogyData.map((analogy) => (
                    <button
                    key={analogy.id}
                    onClick={() => setSelectedAnalogy(analogy)}
                    className={`px-4 py-2 text-sm sm:text-base font-medium rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0a0a0a] focus:ring-[#fad7d1] ${
                        selectedAnalogy.id === analogy.id
                        ? 'bg-[#fad7d1] text-[#230800] shadow-lg shadow-[#fad7d1]/20'
                        : 'bg-[#230800]/60 text-white/80 hover:bg-[#230800]'
                    }`}
                    role="tab"
                    aria-selected={selectedAnalogy.id === analogy.id}
                    aria-controls={`analogy-panel-${analogy.id}`}
                    id={`analogy-tab-${analogy.id}`}
                    >
                    {analogy.concept}
                    </button>
                ))}
                </div>

                <div 
                  key={selectedAnalogy.id}
                  id={`analogy-panel-${selectedAnalogy.id}`}
                  role="tabpanel"
                  aria-labelledby={`analogy-tab-${selectedAnalogy.id}`}
                  className={`bg-[#230800]/50 backdrop-blur-sm border border-[#fad7d1]/20 rounded-2xl p-6 sm:p-8 text-center animate-fadeIn transition-all duration-300 ${speakingId === `analogy-${selectedAnalogy.id}` ? 'border-[#fad7d1]/60 shadow-lg shadow-[#fad7d1]/20' : ''}`}
                >
                  <h3 className="text-2xl font-bold text-[#fad7d1]">
                      {selectedAnalogy.title}
                  </h3>
                  <p className="mt-4 text-white/80 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
                  {selectedAnalogy.explanation}
                  </p>
                  <div className="mt-6 flex justify-center">
                    <button
                      onClick={() => handleSpeak(`${selectedAnalogy.title}. ${selectedAnalogy.explanation}`, `analogy-${selectedAnalogy.id}`)}
                      className="p-2 rounded-full text-white/60 hover:bg-white/10 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
                      aria-label={`Listen to explanation for ${selectedAnalogy.concept}`}
                    >
                      <SpeakerWaveIcon className={`w-8 h-8 transition-colors ${speakingId === `analogy-${selectedAnalogy.id}` ? 'text-[#fad7d1] animate-pulse' : ''}`} />
                    </button>
                  </div>
                </div>
            </div>
            </section>
            
            <footer className="text-center mt-20 space-y-2">
              <p className="text-white/60">
                  Learn more at the official{' '}
                  <a 
                  href="https://www.gensyn.ai/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="font-medium text-[#fad7d1] hover:text-[#fad7d1]/80 transition-colors"
                  >
                  Gensyn Website
                  </a>.
              </p>
              <p className="text-white/50 text-sm">
                Made by{' '}
                <a
                  href="https://x.com/neromtoobad"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-[#fad7d1]/80 hover:text-[#fad7d1] transition-colors"
                >
                  @neromtoobad
                </a>.
              </p>
            </footer>
        </div>
      </div>

      {/* FAB to open chat */}
      <button
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 bg-[#fad7d1] text-[#230800] rounded-full p-4 shadow-lg shadow-[#fad7d1]/30 hover:bg-white transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0a0a0a] focus:ring-[#fad7d1] z-50"
        aria-label="Start conversation with Gensyn guide"
      >
        <MicIcon />
      </button>

      {/* Live Conversation Modal */}
      {isChatOpen && <LiveConversation onClose={() => setIsChatOpen(false)} />}
    </div>
  );
};

export default App;
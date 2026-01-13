
import React from 'react';
import { Play, Settings, LogOut } from 'lucide-react';
import { TRANSLATIONS } from '../constants';

interface PauseModalProps {
  onResume: () => void;
  onSettings: () => void;
  onQuit: () => void;
  lang: 'zh' | 'en';
}

const PauseModal: React.FC<PauseModalProps> = ({ onResume, onSettings, onQuit, lang }) => {
  const t = TRANSLATIONS[lang];

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      {/* Container with pop-in animation */}
      <div className="bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-2xl border-[6px] border-yellow-300 text-center animate-pop-in relative overflow-hidden">
        
        {/* Decorative Background Circles inside modal */}
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-yellow-100 rounded-full opacity-50 pointer-events-none"></div>
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-pink-100 rounded-full opacity-50 pointer-events-none"></div>

        <div className="relative z-10">
          <div className="text-6xl mb-2 animate-bounce">⏸️</div>
          <h2 className="text-4xl font-black text-yellow-500 mb-8 drop-shadow-sm tracking-wide transform -rotate-2">
            {t.pause}
          </h2>
          
          <div className="flex flex-col gap-4">
            <button 
              onClick={onResume}
              className="w-full bg-gradient-to-r from-green-400 to-green-500 text-white py-4 rounded-2xl font-black text-xl shadow-[0_4px_0_#15803d] active:shadow-none active:translate-y-[4px] hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
            >
              <Play fill="currentColor" size={24} /> {t.resume}
            </button>

            <button 
              onClick={onSettings}
              className="w-full bg-white border-4 border-gray-100 text-gray-600 py-3 rounded-2xl font-bold text-lg shadow-[0_4px_0_#e5e7eb] active:shadow-none active:translate-y-[4px] hover:bg-gray-50 transition-all flex items-center justify-center gap-3"
            >
              <Settings size={24} /> {t.settings}
            </button>

            <button 
              onClick={onQuit}
              className="w-full bg-red-50 text-red-400 py-3 rounded-2xl font-bold text-lg border-2 border-red-100 hover:bg-red-100 active:scale-95 transition-all flex items-center justify-center gap-3 mt-2"
            >
              <LogOut size={24} /> {t.quit}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PauseModal;

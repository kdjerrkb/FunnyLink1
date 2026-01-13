
import React from 'react';
import { X, Volume2, Music, Languages } from 'lucide-react';
import { TRANSLATIONS } from '../constants';

interface SettingsModalProps {
  onClose: () => void;
  lang: 'zh' | 'en';
  setLang: (l: 'zh' | 'en') => void;
  bgmVolume: number;
  setBgmVolume: (v: number) => void;
  sfxVolume: number;
  setSfxVolume: (v: number) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  onClose, lang, setLang, bgmVolume, setBgmVolume, sfxVolume, setSfxVolume
}) => {
  const t = TRANSLATIONS[lang];

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl border-[6px] border-purple-300 p-6 animate-pop-in relative">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 border-b-2 border-purple-100 pb-4">
          <h2 className="text-2xl font-black text-purple-600 flex items-center gap-2">
            <span className="text-3xl">⚙️</span> {t.settings}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 active:scale-95 transition-all text-gray-500"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-8">
          
          {/* Language */}
          <div>
            <label className="block text-gray-500 font-bold mb-3 flex items-center gap-2">
              <Languages size={20} className="text-purple-400" /> {t.language}
            </label>
            <div className="flex bg-gray-100 p-1.5 rounded-2xl">
              <button 
                onClick={() => setLang('zh')}
                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${lang === 'zh' ? 'bg-white shadow-md text-purple-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                中文
              </button>
              <button 
                onClick={() => setLang('en')}
                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${lang === 'en' ? 'bg-white shadow-md text-purple-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                English
              </button>
            </div>
          </div>

          {/* Music Volume */}
          <div>
            <label className="block text-gray-500 font-bold mb-3 flex items-center gap-2">
              <Music size={20} className="text-purple-400" /> {t.musicVolume}
            </label>
            <input 
              type="range" 
              min="0" max="1" step="0.1" 
              value={bgmVolume}
              onChange={(e) => setBgmVolume(parseFloat(e.target.value))}
              className="w-full h-4 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
          </div>

          {/* SFX Volume */}
          <div>
            <label className="block text-gray-500 font-bold mb-3 flex items-center gap-2">
              <Volume2 size={20} className="text-purple-400" /> {t.sfxVolume}
            </label>
            <input 
              type="range" 
              min="0" max="1" step="0.1" 
              value={sfxVolume}
              onChange={(e) => setSfxVolume(parseFloat(e.target.value))}
              className="w-full h-4 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-pink-500"
            />
          </div>

        </div>

      </div>
    </div>
  );
};

export default SettingsModal;


import React from 'react';
import { RefreshCw, Clock, Trophy, Lightbulb, Bomb, Pause, Menu } from 'lucide-react';

interface HeaderProps {
  score: number;
  highScore: number;
  level: number;
  timeLeft: number;
  totalTime: number;
  bombs: number;
  hints: number;
  onShuffle: () => void;
  onUseBomb: () => void;
  onUseHint: () => void;
  onPause: () => void;
  t: any; // Translation object
}

const Header: React.FC<HeaderProps> = ({ 
  score, highScore, level, timeLeft, totalTime, bombs, hints, 
  onShuffle, onUseBomb, onUseHint, onPause, t
}) => {
  const timePercent = (timeLeft / totalTime) * 100;
  
  return (
    <div className="w-full max-w-2xl mx-auto mb-2 flex flex-col gap-3 px-3 pt-2">
      {/* Top Bar: Level & Score & Controls */}
      <div className="flex justify-between items-start">
         
         {/* Left: Score */}
         <div className="flex flex-col bg-white/60 backdrop-blur-sm p-2 rounded-2xl border-2 border-white shadow-sm min-w-[80px]">
            <span className="text-[10px] text-pink-500 font-black uppercase tracking-wider flex items-center gap-1">
              <Trophy size={10} /> {t.highScore}: {highScore}
            </span>
            <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-pink-500 to-purple-600 leading-none mt-1">
               {score}
            </div>
         </div>
         
         {/* Center: Level Badge */}
         <div className="absolute left-1/2 transform -translate-x-1/2 top-3 z-10">
            <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-6 py-1.5 rounded-full text-xl font-black shadow-[0_4px_0_rgba(234,179,8,1)] border-2 border-white transform -rotate-1 flex items-center gap-2">
              <span className="drop-shadow-sm">{t.level.replace('{n}', level)}</span>
            </div>
         </div>

         {/* Right: Tools & Pause */}
         <div className="flex flex-col items-end gap-2">
            
            {/* System Menu Button */}
            <button 
              onClick={onPause}
              className="bg-white p-2.5 rounded-xl shadow-[0_3px_0_#e5e7eb] text-gray-600 border-2 border-gray-200 active:shadow-none active:translate-y-[3px] active:bg-gray-50 transition-all hover:text-purple-500"
              aria-label="Pause Menu"
            >
              <Menu size={24} strokeWidth={2.5} />
            </button>
            
         </div>
      </div>

      {/* Second Row: Timer & Power-ups */}
      <div className="flex items-center gap-3">
         
         {/* Timer Bar */}
         <div className="relative flex-1 h-6 bg-white rounded-full border-[3px] border-pink-100 overflow-hidden shadow-inner">
            <div 
              className={`absolute top-0 left-0 h-full transition-all duration-1000 ease-linear ${
                 timePercent < 20 ? 'bg-red-400' : 'bg-gradient-to-r from-green-300 to-green-400'
              }`}
              style={{ width: `${timePercent}%` }}
            />
            {/* Striped texture overlay for timer */}
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)', backgroundSize: '1rem 1rem' }}></div>
            
            <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-gray-700 drop-shadow-sm z-10">
               <Clock size={12} className="mr-1" /> {timeLeft}s
            </div>
         </div>

         {/* Props Group - Moved next to timer for better reachability */}
         <div className="flex gap-2">
            <button 
              onClick={onShuffle}
              className="bg-white p-2 rounded-xl shadow-sm text-pink-400 border-2 border-pink-100 active:scale-95 hover:bg-pink-50 transition-all"
              title="Shuffle"
            >
              <RefreshCw size={18} strokeWidth={2.5} />
            </button>

            <button 
              onClick={onUseHint}
              disabled={hints <= 0}
              className={`relative p-2 rounded-xl border-2 transition-all active:scale-95 ${
                hints > 0 
                  ? 'bg-yellow-50 border-yellow-200 text-yellow-500 shadow-sm hover:bg-yellow-100' 
                  : 'bg-gray-100 border-gray-200 text-gray-300'
              }`}
            >
              <Lightbulb size={18} fill={hints > 0 ? "currentColor" : "none"} strokeWidth={2.5} />
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold border-2 border-white shadow-sm">
                {hints}
              </span>
            </button>

            <button 
              onClick={onUseBomb}
              disabled={bombs <= 0}
              className={`relative p-2 rounded-xl border-2 transition-all active:scale-95 ${
                bombs > 0 
                  ? 'bg-purple-50 border-purple-200 text-purple-500 shadow-sm hover:bg-purple-100' 
                  : 'bg-gray-100 border-gray-200 text-gray-300'
              }`}
            >
              <Bomb size={18} strokeWidth={2.5} />
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold border-2 border-white shadow-sm">
                {bombs}
              </span>
            </button>
         </div>

      </div>
    </div>
  );
};

export default Header;


import React from 'react';
import { RefreshCw, Clock, Trophy, Zap, Lightbulb, Bomb } from 'lucide-react';

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
}

const Header: React.FC<HeaderProps> = ({ 
  score, highScore, level, timeLeft, totalTime, bombs, hints, 
  onShuffle, onUseBomb, onUseHint 
}) => {
  const timePercent = (timeLeft / totalTime) * 100;
  
  return (
    <div className="w-full max-w-2xl mx-auto mb-1 flex flex-col gap-2 px-2">
      {/* Top Bar: Level & Score */}
      <div className="flex justify-between items-end px-2">
         <div className="flex flex-col">
            <span className="text-xs text-pink-500 font-bold flex items-center gap-1">
              <Trophy size={12} /> 最高分: {highScore}
            </span>
            <div className="text-3xl font-black text-pink-600 drop-shadow-sm leading-none">
               {score}
            </div>
         </div>
         
         <div className="flex flex-col items-center">
            <div className="bg-yellow-400 text-white px-4 py-1 rounded-full text-lg font-bold shadow-md border-2 border-white transform -rotate-2">
              第 {level} 关
            </div>
         </div>

         {/* Tools / Props Area */}
         <div className="flex gap-2">
            <button 
              onClick={onUseHint}
              disabled={hints <= 0}
              className={`relative bg-white p-2 rounded-full shadow-md border-2 ${hints > 0 ? 'border-yellow-200 text-yellow-500 active:scale-95' : 'border-gray-200 text-gray-300'} transition-all`}
              title="提示 (高亮一对)"
            >
              <Lightbulb size={20} fill={hints > 0 ? "currentColor" : "none"} />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold border border-white">
                {hints}
              </span>
            </button>

            <button 
              onClick={onUseBomb}
              disabled={bombs <= 0}
              className={`relative bg-white p-2 rounded-full shadow-md border-2 ${bombs > 0 ? 'border-purple-200 text-purple-500 active:scale-95' : 'border-gray-200 text-gray-300'} transition-all`}
              title="炸弹 (自动消除)"
            >
              <Bomb size={20} />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold border border-white">
                {bombs}
              </span>
            </button>

            <button 
              onClick={onShuffle}
              className="bg-white p-2 rounded-full shadow-md text-pink-500 hover:bg-pink-50 active:scale-95 transition-transform border-2 border-pink-100"
              title="洗牌"
            >
              <RefreshCw size={20} />
            </button>
         </div>
      </div>

      {/* Timer Bar */}
      <div className="relative w-full h-4 bg-white rounded-full border-2 border-pink-200 overflow-hidden shadow-inner">
        <div 
          className={`absolute top-0 left-0 h-full transition-all duration-1000 ease-linear ${
             timePercent < 20 ? 'bg-red-400' : 'bg-green-400'
          }`}
          style={{ width: `${timePercent}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-gray-600">
           <Clock size={10} className="mr-1" /> {timeLeft}s
        </div>
      </div>
    </div>
  );
};

export default Header;

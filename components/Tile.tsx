
import React, { useMemo } from 'react';

interface TileProps {
  emoji: string;
  selected: boolean;
  onClick: () => void;
  hint?: boolean;
  isObstacle?: boolean;
}

const Tile: React.FC<TileProps> = ({ emoji, selected, onClick, hint, isObstacle }) => {
  // Generate a random delay for the float animation so they don't all move in sync
  const animationDelay = useMemo(() => `${Math.random() * -3}s`, []);

  // Obstacle Rendering
  if (isObstacle) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-[96%] h-[96%] bg-stone-700 rounded-lg shadow-inner flex items-center justify-center border-4 border-stone-600 relative overflow-hidden">
             {/* Diagonal stripe texture for obstacle */}
             <div className="absolute inset-0 opacity-20" style={{
                 backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 10px, transparent 10px, transparent 20px)'
             }}></div>
             <span className="text-4xl sm:text-5xl md:text-6xl select-none z-10 animate-bounce" style={{ animationDuration: '3s' }}>
                💩
             </span>
        </div>
      </div>
    );
  }

  // Playable Tile Rendering
  return (
    <div 
      className={`
        relative w-full h-full flex items-center justify-center 
        cursor-pointer transition-all duration-200
        ${selected ? 'scale-110 z-30' : 'hover:scale-105 active:scale-95'}
        ${hint ? 'z-30' : 'z-0'}
      `}
      onClick={onClick}
    >
      {/* Ball Background with 3D effect */}
      <div 
        className={`
          w-[96%] h-[96%] rounded-full ball-shadow border-2
          ${selected ? 'bg-yellow-200 border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.6)]' : 'bg-white border-pink-200'}
          ${hint ? 'bg-yellow-100 border-yellow-500 animate-hint' : 'animate-float'}
          flex items-center justify-center
        `}
        style={{ animationDelay: hint ? '0s' : animationDelay }}
      >
        {/* Emoji - Increased size significantly */}
        <span className="text-4xl sm:text-4xl md:text-5xl lg:text-6xl select-none leading-none filter drop-shadow-sm">
          {emoji}
        </span>
      </div>
    </div>
  );
};

export default Tile;

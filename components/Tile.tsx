
import React, { useMemo } from 'react';

interface TileProps {
  emoji: string;
  selected: boolean;
  focused?: boolean;
  onClick: () => void;
  onMouseEnter?: () => void;
  hint?: boolean;
  isObstacle?: boolean;
  size?: number; // Size in pixels passed from parent for adaptive scaling
}

const Tile: React.FC<TileProps> = ({ 
  emoji, selected, focused, onClick, onMouseEnter, hint, isObstacle, size = 50 
}) => {
  // Generate a random delay for the float animation so they don't all move in sync
  const animationDelay = useMemo(() => `${Math.random() * -3}s`, []);
  
  // Dynamic font size calculation
  // We use roughly 65% of the cell size for the emoji to ensure it fits nicely inside the bubble
  const fontSize = Math.max(12, Math.floor(size * 0.65));

  // Obstacle Rendering
  if (isObstacle) {
    return (
      <div 
        className="w-full h-full flex items-center justify-center p-0.5"
        onMouseEnter={onMouseEnter}
      >
        <div className={`
          w-full h-full bg-stone-700 rounded-lg shadow-inner flex items-center justify-center border-4 border-stone-600 relative overflow-hidden transition-transform
          ${focused ? 'scale-105 ring-4 ring-blue-400 ring-offset-1 z-20' : ''}
        `}>
             {/* Diagonal stripe texture for obstacle */}
             <div className="absolute inset-0 opacity-20" style={{
                 backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 10px, transparent 10px, transparent 20px)'
             }}></div>
             <span 
                className="select-none z-10 animate-bounce" 
                style={{ 
                    animationDuration: '3s',
                    fontSize: `${fontSize}px` 
                }}
             >
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
        ${focused && !selected ? 'scale-110 z-20' : ''}
        ${hint ? 'z-30' : 'z-0'}
      `}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
    >
      {/* Focus Ring (Keyboard/Mouse Hover Indicator) */}
      {focused && !selected && (
        <div className="absolute inset-0 rounded-full border-4 border-blue-400/50 animate-pulse pointer-events-none scale-110"></div>
      )}

      {/* Ball Background with 3D effect */}
      <div 
        className={`
          w-[96%] h-[96%] rounded-full ball-shadow border-2 transition-colors duration-200
          ${selected ? 'bg-yellow-200 border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.6)]' : 'bg-white border-pink-200'}
          ${hint ? 'bg-yellow-100 border-yellow-500 animate-hint' : 'animate-float'}
          flex items-center justify-center
        `}
        style={{ animationDelay: hint ? '0s' : animationDelay }}
      >
        {/* Emoji - Dynamic Size */}
        <span 
            className="select-none leading-none filter drop-shadow-sm transition-[font-size] duration-100 ease-out"
            style={{ fontSize: `${fontSize}px` }}
        >
          {emoji}
        </span>
      </div>
    </div>
  );
};

export default Tile;
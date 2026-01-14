
import React, { useRef, useEffect, useState } from 'react';
import { Grid, Position, PathNode } from '../types';
import TileComponent from './Tile.tsx';
import { BOARD_WIDTH, BOARD_HEIGHT } from '../constants';

interface BoardProps {
  grid: Grid;
  selectedPos: Position | null;
  onTileClick: (pos: Position) => void;
  onTileHover?: (pos: Position) => void;
  path: PathNode[] | null;
  hintPairs: Position[] | null;
  cursorPos: Position;
}

const Board: React.FC<BoardProps> = ({ 
  grid, selectedPos, onTileClick, onTileHover, path, hintPairs, cursorPos 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    observer.observe(containerRef.current);
    
    // Also listen to window resize to catch layout shifts that ResizeObserver might miss in some edge cases
    window.addEventListener('resize', () => {
       if (containerRef.current) {
         setDimensions({
           width: containerRef.current.clientWidth,
           height: containerRef.current.clientHeight
         });
       }
    });

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', () => {});
    };
  }, []);

  // Calculate cell size based on container
  const cellWidth = dimensions.width / BOARD_WIDTH;
  const cellHeight = dimensions.height / BOARD_HEIGHT;
  
  // Dynamic font/element size for tiles based on cell size
  const tileBaseSize = Math.floor(Math.min(cellWidth, cellHeight));

  const getCenter = (p: PathNode) => ({
    x: (p.x * cellWidth) + (cellWidth / 2),
    y: (p.y * cellHeight) + (cellHeight / 2)
  });

  const isHinted = (x: number, y: number) => {
    if (!hintPairs) return false;
    return hintPairs.some(p => p.x === x && p.y === y);
  };

  return (
    // Outer Container: Flex Center, full available space
    <div className="w-full h-full flex justify-center items-center">
      
      {/* 
         Resolution Adaptive Logic:
         1. aspect-[4/5]: Forces the ratio.
         2. max-w-full: Ensures it doesn't overflow horizontally.
         3. max-h-full: Ensures it doesn't overflow vertically.
         4. w-auto, h-auto: Allows it to grow until one of the max constraints is hit.
      */}
      <div className="relative aspect-[4/5] max-w-full max-h-full w-auto h-auto m-1">
        
        {/* 1. The Hollow Spinning Border */}
        <div className="hollow-rainbow-border"></div>

        {/* 2. The Board Content (Glass effect) */}
        <div className="h-full w-full bg-white/60 backdrop-blur-md rounded-xl shadow-xl p-1 box-border overflow-hidden relative z-10">
          {/* Grid Container */}
          <div 
            ref={containerRef}
            className="relative w-full h-full"
          >
            <div 
              className="w-full h-full grid"
              style={{
                gridTemplateColumns: `repeat(${BOARD_WIDTH}, 1fr)`,
                gridTemplateRows: `repeat(${BOARD_HEIGHT}, 1fr)`
              }}
            >
              {grid.map((row, y) => (
                row.map((tile, x) => {
                  // Determine if this tile should be highlighted (selected)
                  const isSelected = (selectedPos?.x === x && selectedPos?.y === y) || 
                                     (!!path && path.length > 0 && (
                                       (path[0].x === x && path[0].y === y) || 
                                       (path[path.length - 1].x === x && path[path.length - 1].y === y)
                                     ));
                  
                  // Keyboard focus state
                  const isFocused = cursorPos.x === x && cursorPos.y === y;

                  return (
                    <div key={`${x}-${y}`} className="w-full h-full p-0.5 relative">
                      {tile ? (
                        <TileComponent
                          key={tile.key}
                          emoji={tile.type}
                          selected={isSelected}
                          focused={isFocused}
                          hint={isHinted(x, y)}
                          isObstacle={tile.isObstacle}
                          onClick={() => onTileClick({ x, y })}
                          onMouseEnter={() => onTileHover && onTileHover({ x, y })}
                          size={tileBaseSize}
                        />
                      ) : (
                        <div 
                           className={`w-full h-full rounded-full transition-all duration-200 ${isFocused ? 'bg-white/30 scale-50' : ''}`} 
                           onMouseEnter={() => onTileHover && onTileHover({ x, y })}
                        />
                      )}
                    </div>
                  );
                })
              ))}
            </div>

            {/* Connection Line Overlay */}
            {path && path.length > 0 && (
              <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-30 overflow-visible">
                {/* White outline for visibility */}
                <polyline
                  points={path.map(p => {
                    const c = getCenter(p);
                    return `${c.x},${c.y}`;
                  }).join(' ')}
                  fill="none"
                  stroke="white"
                  strokeWidth={tileBaseSize * 0.15} // Scalable stroke width
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="opacity-80"
                />
                {/* Main pink line */}
                <polyline
                  points={path.map(p => {
                    const c = getCenter(p);
                    return `${c.x},${c.y}`;
                  }).join(' ')}
                  fill="none"
                  stroke="#ec4899" // Pink-500
                  strokeWidth={tileBaseSize * 0.08} // Scalable stroke width
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Endpoints */}
                <circle cx={getCenter(path[0]).x} cy={getCenter(path[0]).y} r={tileBaseSize * 0.12} fill="#ec4899" stroke="white" strokeWidth="2" />
                <circle cx={getCenter(path[path.length-1]).x} cy={getCenter(path[path.length-1]).y} r={tileBaseSize * 0.12} fill="#ec4899" stroke="white" strokeWidth="2" />
              </svg>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Board;
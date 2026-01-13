
import React, { useRef, useEffect, useState } from 'react';
import { Grid, Position, PathNode } from '../types';
import TileComponent from './Tile.tsx';
import { BOARD_WIDTH, BOARD_HEIGHT } from '../constants';

interface BoardProps {
  grid: Grid;
  selectedPos: Position | null;
  onTileClick: (pos: Position) => void;
  path: PathNode[] | null;
  hintPairs: Position[] | null;
}

const Board: React.FC<BoardProps> = ({ grid, selectedPos, onTileClick, path, hintPairs }) => {
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
    return () => observer.disconnect();
  }, []);

  // Calculate cell size based on container
  const cellWidth = dimensions.width / BOARD_WIDTH;
  const cellHeight = dimensions.height / BOARD_HEIGHT;

  const getCenter = (p: PathNode) => ({
    x: (p.x * cellWidth) + (cellWidth / 2),
    y: (p.y * cellHeight) + (cellHeight / 2)
  });

  const isHinted = (x: number, y: number) => {
    if (!hintPairs) return false;
    return hintPairs.some(p => p.x === x && p.y === y);
  };

  return (
    <div className="relative h-full w-auto aspect-[4/5] max-w-full bg-white/40 backdrop-blur-sm rounded-xl border-4 border-white shadow-xl p-1 box-border">
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
            row.map((tile, x) => (
              <div key={`${x}-${y}`} className="w-full h-full p-0.5 relative">
                {tile ? (
                  <TileComponent
                    emoji={tile.type}
                    selected={selectedPos?.x === x && selectedPos?.y === y}
                    hint={isHinted(x, y)}
                    isObstacle={tile.isObstacle}
                    onClick={() => onTileClick({ x, y })}
                  />
                ) : (
                  <div className="w-full h-full" />
                )}
              </div>
            ))
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
              strokeWidth="8"
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
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Endpoints */}
            <circle cx={getCenter(path[0]).x} cy={getCenter(path[0]).y} r="6" fill="#ec4899" stroke="white" strokeWidth="2" />
            <circle cx={getCenter(path[path.length-1]).x} cy={getCenter(path[path.length-1]).y} r="6" fill="#ec4899" stroke="white" strokeWidth="2" />
          </svg>
        )}
      </div>
    </div>
  );
};

export default Board;

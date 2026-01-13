
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Board from './components/Board';
import Header from './components/Header';
import { GameState, Grid, Position, Tile, PathNode } from './types';
import { EMOJIS, BOARD_WIDTH, BOARD_HEIGHT, BASE_TIME, TIME_DECREMENT_PER_LEVEL, MIN_TIME } from './constants';
import { findPath, hasPossibleMoves, findAvailablePair } from './utils/pathfinding';
import { Play, RotateCcw, Award } from 'lucide-react';

const getInitialTime = (level: number) => Math.max(MIN_TIME, BASE_TIME - (level - 1) * TIME_DECREMENT_PER_LEVEL);

// --- Graffiti Background Component for Menu ---
const GraffitiBackground = () => {
  // Generate static random layout once on mount
  const stickers = useMemo(() => {
    return Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
      top: Math.random() * 100,
      left: Math.random() * 100,
      rotate: Math.random() * 360 - 180,
      scale: 0.5 + Math.random() * 2.5, // Range from small to huge
      opacity: 0.15 + Math.random() * 0.25,
      filter: Math.random() > 0.5 ? 'blur(2px)' : 'none'
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden w-full h-full bg-gradient-to-br from-yellow-300 via-pink-400 to-purple-500 z-0">
      {/* Texture Overlay */}
      <div className="absolute inset-0 opacity-20" style={{ 
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'0.2\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' 
      }}></div>

      {/* Random Emojis */}
      {stickers.map((s) => (
        <div
          key={s.id}
          className="absolute select-none pointer-events-none"
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            transform: `translate(-50%, -50%) rotate(${s.rotate}deg) scale(${s.scale})`,
            opacity: s.opacity,
            fontSize: '5rem',
            filter: s.filter,
            mixBlendMode: 'overlay' 
          }}
        >
          {s.emoji}
        </div>
      ))}
      
      {/* Glass Overlay to make foreground readable */}
      <div className="absolute inset-0 bg-white/10 backdrop-blur-[3px]"></div>
    </div>
  );
};

// --- Pop Art Background for Gameplay ---
const PopArtBackground = () => {
  // Generate a fixed grid of colorful panels
  const panels = useMemo(() => {
    // Distinct Pop Art colors
    const colors = ['#FF0099', '#FFFF00', '#00CCFF', '#00FF00', '#FF3300', '#9900FF'];
    return Array.from({ length: 24 }).map((_, i) => ({
      id: i,
      color: colors[Math.floor(Math.random() * colors.length)],
      emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
      rotate: Math.floor(Math.random() * 4) * 90,
      scale: 0.7 + Math.random() * 0.6
    }));
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full z-0 overflow-hidden grid grid-cols-4 md:grid-cols-6 grid-rows-6">
      {panels.map((p) => (
        <div 
          key={p.id} 
          className="relative overflow-hidden border-2 border-black"
          style={{ backgroundColor: p.color }}
        >
           {/* Halftone Dot Pattern */}
           <div className="absolute inset-0 opacity-20 pointer-events-none" 
                style={{ 
                  backgroundImage: 'radial-gradient(circle, #000 2px, transparent 2.5px)', 
                  backgroundSize: '6px 6px' 
                }}>
           </div>
           
           {/* Artistic Emoji */}
           <div 
             className="absolute inset-0 flex items-center justify-center text-7xl md:text-9xl select-none pointer-events-none opacity-80 mix-blend-multiply"
             style={{ 
               transform: `rotate(${p.rotate}deg) scale(${p.scale})`,
               filter: 'grayscale(0.3) contrast(1.2)'
             }}
           >
             {p.emoji}
           </div>
        </div>
      ))}
      {/* Heavy overlay to ensure game board is readable over the busy art */}
      <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px]"></div>
    </div>
  );
};

const App: React.FC = () => {
  // --- State ---
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    level: 1,
    timeLeft: BASE_TIME,
    status: 'menu',
    highScore: 0,
    bombs: 1, // Start with 1 bomb
    hints: 1  // Start with 1 hint
  });

  const [grid, setGrid] = useState<Grid>([]);
  const [selectedPos, setSelectedPos] = useState<Position | null>(null);
  const [path, setPath] = useState<PathNode[] | null>(null);
  const [hintPairs, setHintPairs] = useState<Position[] | null>(null);
  const [comboMessage, setComboMessage] = useState<string | null>(null);
  
  const timerRef = useRef<number | null>(null);
  // Track the timestamp (in game time) of the last successful match for combo logic
  const lastMatchTimeRef = useRef<number>(BASE_TIME);

  // --- Sound Effect ---
  const playSound = useCallback((type: 'match' | 'prop' | 'combo') => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;

      if (type === 'match') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === 'prop') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.linearRampToValueAtTime(800, now + 0.1);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
      } else if (type === 'combo') {
        // Higher pitched pleasant sound
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(880, now); // A5
        osc.frequency.setValueAtTime(1108, now + 0.1); // C#6
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
      }
    } catch (e) {
      console.error("Audio play failed", e);
    }
  }, []);

  // --- Initialization ---
  useEffect(() => {
    const savedScore = localStorage.getItem('funnyLinkHighScore');
    if (savedScore) {
      setGameState(prev => ({ ...prev, highScore: parseInt(savedScore, 10) }));
    }
  }, []);

  const initLevel = useCallback((level: number, currentScore: number) => {
    const totalCells = BOARD_WIDTH * BOARD_HEIGHT;
    
    // Calculate number of obstacles
    // Start appearing from level 2
    // Level 2: 2, Level 3: 4, etc.
    let numObstacles = level > 1 ? Math.min(20, (level - 1) * 2) : 0;
    
    // Ensure the remaining playable cells are even, so we can make pairs
    if ((totalCells - numObstacles) % 2 !== 0) {
        numObstacles++; // Add one more to make remainder even
    }

    const playableCount = totalCells - numObstacles;
    const pairs = playableCount / 2;

    const numTypes = Math.min(EMOJIS.length, 5 + Math.floor(level / 2));
    const availableEmojis = EMOJIS.slice(0, numTypes);
    
    let tilesArray: Tile[] = [];
    let keyCounter = 0;

    // 1. Add Obstacles
    for (let i = 0; i < numObstacles; i++) {
        tilesArray.push({
            id: `obs_${keyCounter}`,
            key: keyCounter++,
            type: 'OBSTACLE', // Special type
            isObstacle: true,
            x: 0,
            y: 0
        });
    }

    // 2. Add Playable Pairs
    for (let i = 0; i < pairs; i++) {
      const type = availableEmojis[i % numTypes];
      tilesArray.push({ id: `t_${keyCounter}`, key: keyCounter++, type, x: 0, y: 0 });
      tilesArray.push({ id: `t_${keyCounter}`, key: keyCounter++, type, x: 0, y: 0 });
    }

    // 3. Shuffle
    tilesArray.sort(() => Math.random() - 0.5);

    // 4. Fill Grid
    const newGrid: Grid = [];
    let idx = 0;
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      const row: (Tile | null)[] = [];
      for (let x = 0; x < BOARD_WIDTH; x++) {
        if (idx < tilesArray.length) {
          tilesArray[idx].x = x;
          tilesArray[idx].y = y;
          row.push(tilesArray[idx]);
          idx++;
        } else {
          row.push(null);
        }
      }
      newGrid.push(row);
    }

    setGrid(newGrid);
    const newTime = getInitialTime(level);
    setGameState(prev => ({
      ...prev,
      level,
      score: currentScore,
      timeLeft: newTime,
      status: 'playing',
      bombs: prev.bombs > 0 ? prev.bombs : 1, // Keep accumulated props, min 1
      hints: prev.hints > 0 ? prev.hints : 1
    }));
    setSelectedPos(null);
    setPath(null);
    setHintPairs(null);
    lastMatchTimeRef.current = newTime; // Reset combo timer
  }, []);

  const startGame = () => {
    initLevel(1, 0);
  };

  const nextLevel = () => {
    initLevel(gameState.level + 1, gameState.score);
  };

  // --- Timer Logic ---
  useEffect(() => {
    if (gameState.status === 'playing') {
      timerRef.current = window.setInterval(() => {
        setGameState(prev => {
          if (prev.timeLeft <= 1) {
             if (timerRef.current) clearInterval(timerRef.current);
             const newHigh = Math.max(prev.score, prev.highScore);
             localStorage.setItem('funnyLinkHighScore', newHigh.toString());
             return { ...prev, timeLeft: 0, status: 'game-over', highScore: newHigh };
          }
          return { ...prev, timeLeft: prev.timeLeft - 1 };
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState.status]);

  // --- Check Win Condition ---
  useEffect(() => {
    if (gameState.status === 'playing') {
      // Check if all PLAYABLE tiles are gone
      let hasPlayableTiles = false;
      for (let y = 0; y < BOARD_HEIGHT; y++) {
        for (let x = 0; x < BOARD_WIDTH; x++) {
          const t = grid[y][x];
          if (t !== null && !t.isObstacle) {
            hasPlayableTiles = true;
            break;
          }
        }
        if (hasPlayableTiles) break;
      }

      if (!hasPlayableTiles) {
        if (timerRef.current) clearInterval(timerRef.current);
        const bonus = gameState.timeLeft * 10;
        const newScore = gameState.score + bonus;
        setGameState(prev => ({ ...prev, score: newScore, status: 'level-success' }));
        setTimeout(() => {
          nextLevel();
        }, 1500);
      } else {
        if (!hasPossibleMoves(grid) && hasPlayableTiles) {
           // Optional: Auto shuffle if no moves but tiles remain.
           // Since we have shuffle button, we leave it to user strategy.
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grid, gameState.status]);

  // --- Interaction & Core Logic ---

  const executeMatch = (pos1: Position, pos2: Position, isAuto: boolean = false) => {
    const currentTime = gameState.timeLeft;
    const timeDelta = lastMatchTimeRef.current - currentTime;
    
    let rewardMsg = null;
    let earnedBomb = 0;
    let earnedHint = 0;

    if (!isAuto && timeDelta <= 20) {
      if (Math.random() > 0.5) {
        earnedBomb = 1;
        rewardMsg = "连击! +1 炸弹";
      } else {
        earnedHint = 1;
        rewardMsg = "连击! +1 提示";
      }
      playSound('combo');
    } else {
      playSound('match');
    }

    lastMatchTimeRef.current = currentTime;

    // Remove Tiles
    const newGrid = grid.map(row => [...row]);
    newGrid[pos1.y][pos1.x] = null;
    newGrid[pos2.y][pos2.x] = null;
    setGrid(newGrid);

    // Update State
    setGameState(prev => ({
      ...prev,
      score: prev.score + 20,
      bombs: prev.bombs + earnedBomb,
      hints: prev.hints + earnedHint
    }));
    setSelectedPos(null);
    setPath(null);
    setHintPairs(null);

    // Show Feedback
    if (rewardMsg) {
      setComboMessage(rewardMsg);
      setTimeout(() => setComboMessage(null), 2000);
    }
  };

  const handleTileClick = (pos: Position) => {
    if (gameState.status !== 'playing') return;

    const tile = grid[pos.y][pos.x];
    if (!tile) return; 
    
    // Ignore obstacles
    if (tile.isObstacle) return;

    if (selectedPos && selectedPos.x === pos.x && selectedPos.y === pos.y) {
      setSelectedPos(null);
      return;
    }

    if (!selectedPos) {
      setSelectedPos(pos);
    } else {
      const prevTile = grid[selectedPos.y][selectedPos.x];
      
      if (prevTile && prevTile.type === tile.type) {
        const calculatedPath = findPath(grid, selectedPos, pos);
        
        if (calculatedPath) {
          setPath(calculatedPath);
          setTimeout(() => {
            executeMatch(selectedPos, pos, false);
          }, 200); 
        } else {
          setSelectedPos(pos);
        }
      } else {
        setSelectedPos(pos);
      }
    }
  };

  const shuffleBoard = () => {
    if (gameState.status !== 'playing') return;
    
    let tiles: Tile[] = [];
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        if (grid[y][x]) tiles.push(grid[y][x]!);
      }
    }
    
    tiles.sort(() => Math.random() - 0.5);
    
    const newGrid: Grid = Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(null));
    let idx = 0;
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        if (idx < tiles.length) {
          const t = tiles[idx];
          t.x = x;
          t.y = y;
          newGrid[y][x] = t;
          idx++;
        }
      }
    }
    setGrid(newGrid);
    setSelectedPos(null);
    setHintPairs(null);
  };

  // --- Props Handlers ---

  const handleUseBomb = () => {
    if (gameState.status !== 'playing' || gameState.bombs <= 0) return;
    
    const pair = findAvailablePair(grid);
    if (pair) {
      playSound('prop');
      setGameState(prev => ({ ...prev, bombs: prev.bombs - 1 }));
      const bombPath = findPath(grid, pair[0], pair[1]);
      if (bombPath) setPath(bombPath);

      setTimeout(() => {
         executeMatch(pair[0], pair[1], true);
      }, 300);
    } else {
      shuffleBoard();
    }
  };

  const handleUseHint = () => {
    if (gameState.status !== 'playing' || gameState.hints <= 0) return;

    const pair = findAvailablePair(grid);
    if (pair) {
      playSound('prop');
      setGameState(prev => ({ ...prev, hints: prev.hints - 1 }));
      setHintPairs([pair[0], pair[1]]);
    } else {
      shuffleBoard();
    }
  };

  // Scene: Menu
  if (gameState.status === 'menu') {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center p-4 relative">
         <GraffitiBackground />
         
         <div className="z-10 bg-white/90 backdrop-blur-md p-8 rounded-3xl shadow-2xl border-4 border-white max-w-sm w-full text-center">
            <h1 className="text-5xl mb-2 text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600 font-black tracking-tighter drop-shadow-sm transform -rotate-2">
              搞怪<br/>连连看
            </h1>
            <p className="text-gray-500 mb-8 font-bold text-lg tracking-widest uppercase">Funny Link</p>
            
            <div className="mb-8 bg-pink-50/80 p-4 rounded-2xl border-2 border-pink-100">
               <div className="text-sm text-pink-400 mb-1 flex justify-center items-center gap-2">
                 <Award size={16}/> 历史最高分
               </div>
               <div className="text-4xl font-bold text-pink-600">{gameState.highScore}</div>
            </div>

            <button 
              onClick={startGame}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xl py-4 rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2 active:scale-95 group"
            >
              <span className="group-hover:rotate-12 transition-transform duration-300">
                <Play fill="currentColor" /> 
              </span>
              开始游戏
            </button>
         </div>
         <div className="z-10 mt-8 text-center bg-black/20 backdrop-blur-md text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
           规则：20秒内连续消除可获得炸弹或提示！
         </div>
      </div>
    );
  }

  // Scene: Game Over
  if (gameState.status === 'game-over') {
    return (
      <div className="h-screen w-full game-bg flex flex-col items-center justify-center p-4">
         <div className="bg-white/90 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border-4 border-red-100 max-w-sm w-full text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-red-400"></div>
            
            <div className="text-6xl mb-4">😵</div>
            <h2 className="text-4xl font-black text-gray-800 mb-2">游戏结束!</h2>
            <p className="text-gray-500 mb-6">时间耗尽啦</p>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-gray-50 p-3 rounded-xl">
                 <div className="text-xs text-gray-400">最终关卡</div>
                 <div className="text-2xl font-bold text-gray-700">{gameState.level}</div>
              </div>
              <div className="bg-yellow-50 p-3 rounded-xl">
                 <div className="text-xs text-yellow-600">本局得分</div>
                 <div className="text-2xl font-bold text-yellow-600">{gameState.score}</div>
              </div>
            </div>

            <button 
              onClick={() => setGameState(prev => ({ ...prev, status: 'menu' }))}
              className="w-full bg-gray-800 text-white text-lg py-3 rounded-xl font-bold shadow-lg hover:bg-gray-700 transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw size={20} /> 返回主菜单
            </button>
         </div>
      </div>
    );
  }

  // Scene: Playing & Level Transition
  return (
    <div className="h-screen w-full flex flex-col items-center py-2 px-2 overflow-hidden relative">
      {/* Pop Art Background */}
      <PopArtBackground />

      {/* Combo/Reward Notification */}
      {comboMessage && (
        <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none">
          <div className="bg-yellow-400 text-white px-6 py-2 rounded-full font-black text-xl shadow-lg animate-bounce border-2 border-white whitespace-nowrap">
            {comboMessage}
          </div>
        </div>
      )}

      {/* Overlay for Level Success */}
      {gameState.status === 'level-success' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
           <div className="bg-white p-8 rounded-3xl shadow-2xl animate-bounce text-center">
              <div className="text-6xl mb-2">🤩</div>
              <h2 className="text-3xl font-black text-pink-500">通关成功!</h2>
              <p className="text-gray-400 font-bold">下一关加载中...</p>
           </div>
        </div>
      )}

      <Header 
        score={gameState.score} 
        highScore={gameState.highScore}
        level={gameState.level} 
        timeLeft={gameState.timeLeft}
        totalTime={getInitialTime(gameState.level)}
        bombs={gameState.bombs}
        hints={gameState.hints}
        onShuffle={shuffleBoard}
        onUseBomb={handleUseBomb}
        onUseHint={handleUseHint}
      />
      
      {/* Main Board Container - Flex Grow to fill space */}
      <div className="flex-1 w-full min-h-0 flex items-center justify-center py-2 z-10">
        <Board 
          grid={grid} 
          selectedPos={selectedPos} 
          onTileClick={handleTileClick}
          path={path}
          hintPairs={hintPairs}
        />
      </div>

    </div>
  );
};

export default App;

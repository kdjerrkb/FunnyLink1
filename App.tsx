
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Board from './components/Board';
import Header from './components/Header';
import SettingsModal from './components/SettingsModal';
import PauseModal from './components/PauseModal';
import { GameState, Grid, Position, Tile, PathNode } from './types';
import { EMOJIS, BOARD_WIDTH, BOARD_HEIGHT, BASE_TIME, TIME_DECREMENT_PER_LEVEL, MIN_TIME, TRANSLATIONS } from './constants';
import { findPath, hasPossibleMoves, findAvailablePair } from './utils/pathfinding';
import { audioManager } from './utils/audio';
import { Play, RotateCcw, Award, Settings as SettingsIcon } from 'lucide-react';

const getInitialTime = (level: number) => Math.max(MIN_TIME, BASE_TIME - (level - 1) * TIME_DECREMENT_PER_LEVEL);

// --- Dynamic Floating Background Component ---
interface FloatingBackgroundProps {
  variant: 'menu' | 'game';
}

const FloatingBackground: React.FC<FloatingBackgroundProps> = ({ variant }) => {
  const particles = useMemo(() => {
    return Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
      left: `${Math.random() * 100}%`,
      duration: `${10 + Math.random() * 20}s`,
      delay: `${Math.random() * -20}s`,
      rotate: `${Math.random() * 360}deg`,
      scale: 0.5 + Math.random() * 1.5,
      opacity: variant === 'menu' ? 0.3 : 0.15
    }));
  }, [variant]);

  // Determine gradient based on variant
  const bgClass = variant === 'menu' 
    ? 'bg-gradient-to-br from-yellow-300 via-pink-400 to-purple-500' 
    : 'bg-gradient-to-b from-pink-50 to-purple-50';

  return (
    <div className={`absolute inset-0 overflow-hidden w-full h-full ${bgClass} z-0`}>
      {/* Texture Overlay */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ 
          backgroundImage: 'radial-gradient(#000 1px, transparent 1px)',
          backgroundSize: '20px 20px'
      }}></div>

      {particles.map((p) => (
        <div
          key={p.id}
          className="emoji-particle select-none pointer-events-none"
          style={{
            '--left': p.left,
            '--duration': p.duration,
            '--delay': p.delay,
            '--rotate': p.rotate,
            '--opacity': p.opacity,
            fontSize: `${p.scale * 4}rem`,
            filter: variant === 'menu' ? 'blur(1px)' : 'none'
          } as React.CSSProperties}
        >
          {p.emoji}
        </div>
      ))}
      
      {/* Glass Overlay */}
      <div className={`absolute inset-0 ${variant === 'menu' ? 'bg-white/10' : 'bg-white/40'} backdrop-blur-[1px]`}></div>
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
    bombs: 1,
    hints: 1
  });

  const [grid, setGrid] = useState<Grid>([]);
  const [selectedPos, setSelectedPos] = useState<Position | null>(null);
  const [path, setPath] = useState<PathNode[] | null>(null);
  const [hintPairs, setHintPairs] = useState<Position[] | null>(null);
  const [comboMessage, setComboMessage] = useState<string | null>(null);
  
  // New States
  const [isPaused, setIsPaused] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [language, setLanguage] = useState<'zh'|'en'>('zh');
  const [bgmVolume, setBgmVolume] = useState(0.5);
  const [sfxVolume, setSfxVolume] = useState(0.5);

  const t = TRANSLATIONS[language];
  
  const timerRef = useRef<number | null>(null);
  const lastMatchTimeRef = useRef<number>(BASE_TIME);

  // --- Audio Effects Wrapper ---
  const playSound = (type: 'match' | 'prop' | 'combo' | 'select' | 'win' | 'lose') => {
    audioManager.playSfx(type);
  };

  // Sync Volume State with Audio Manager
  useEffect(() => {
    audioManager.setBgmVolume(bgmVolume);
  }, [bgmVolume]);

  useEffect(() => {
    audioManager.setSfxVolume(sfxVolume);
  }, [sfxVolume]);

  // --- Initialization ---
  useEffect(() => {
    const savedScore = localStorage.getItem('funnyLinkHighScore');
    if (savedScore) setGameState(prev => ({ ...prev, highScore: parseInt(savedScore, 10) }));
    
    // Attempt to init audio if user interacted before (mostly for reload)
    // Real init happens on 'Start Game'
  }, []);

  const initLevel = useCallback((level: number, currentScore: number) => {
    const totalCells = BOARD_WIDTH * BOARD_HEIGHT;
    let numObstacles = level > 1 ? Math.min(20, (level - 1) * 2) : 0;
    if ((totalCells - numObstacles) % 2 !== 0) numObstacles++;

    const playableCount = totalCells - numObstacles;
    const pairs = playableCount / 2;
    const numTypes = Math.min(EMOJIS.length, 5 + Math.floor(level / 2));
    const availableEmojis = EMOJIS.slice(0, numTypes);
    
    let tilesArray: Tile[] = [];
    let keyCounter = 0;

    for (let i = 0; i < numObstacles; i++) {
        tilesArray.push({ id: `obs_${keyCounter}`, key: keyCounter++, type: 'OBSTACLE', isObstacle: true, x: 0, y: 0 });
    }
    for (let i = 0; i < pairs; i++) {
      const type = availableEmojis[i % numTypes];
      tilesArray.push({ id: `t_${keyCounter}`, key: keyCounter++, type, x: 0, y: 0 });
      tilesArray.push({ id: `t_${keyCounter}`, key: keyCounter++, type, x: 0, y: 0 });
    }

    tilesArray.sort(() => Math.random() - 0.5);

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
      ...prev, level, score: currentScore, timeLeft: newTime, status: 'playing',
      bombs: prev.bombs > 0 ? prev.bombs : 1, hints: prev.hints > 0 ? prev.hints : 1
    }));
    setSelectedPos(null);
    setPath(null);
    setHintPairs(null);
    setIsPaused(false);
    lastMatchTimeRef.current = newTime;
    
    // Ensure BGM is playing
    audioManager.playBgm();
  }, []);

  const startGame = () => {
    playSound('select');
    audioManager.playBgm(); // Start music on interaction
    initLevel(1, 0);
  };

  const nextLevel = () => {
    initLevel(gameState.level + 1, gameState.score);
  };

  // --- Timer Logic ---
  useEffect(() => {
    if (gameState.status === 'playing' && !isPaused) {
      timerRef.current = window.setInterval(() => {
        setGameState(prev => {
          if (prev.timeLeft <= 1) {
             if (timerRef.current) clearInterval(timerRef.current);
             const newHigh = Math.max(prev.score, prev.highScore);
             localStorage.setItem('funnyLinkHighScore', newHigh.toString());
             playSound('lose');
             audioManager.stopBgm();
             return { ...prev, timeLeft: 0, status: 'game-over', highScore: newHigh };
          }
          return { ...prev, timeLeft: prev.timeLeft - 1 };
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState.status, isPaused]);

  // --- Check Win Condition ---
  useEffect(() => {
    if (gameState.status === 'playing') {
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
        playSound('win');
        setTimeout(() => {
          nextLevel();
        }, 1500);
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
        rewardMsg = t.comboBomb;
      } else {
        earnedHint = 1;
        rewardMsg = t.comboHint;
      }
      playSound('combo');
    } else {
      playSound('match');
    }

    lastMatchTimeRef.current = currentTime;
    const newGrid = grid.map(row => [...row]);
    newGrid[pos1.y][pos1.x] = null;
    newGrid[pos2.y][pos2.x] = null;
    setGrid(newGrid);

    setGameState(prev => ({
      ...prev, score: prev.score + 20, bombs: prev.bombs + earnedBomb, hints: prev.hints + earnedHint
    }));
    setSelectedPos(null);
    setPath(null);
    setHintPairs(null);

    if (rewardMsg) {
      setComboMessage(rewardMsg);
      setTimeout(() => setComboMessage(null), 2000);
    }
  };

  const handleTileClick = (pos: Position) => {
    if (gameState.status !== 'playing' || isPaused) return;

    const tile = grid[pos.y][pos.x];
    if (!tile || tile.isObstacle) return; 

    playSound('select');

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
          setTimeout(() => executeMatch(selectedPos, pos, false), 200); 
        } else {
          setSelectedPos(pos);
        }
      } else {
        setSelectedPos(pos);
      }
    }
  };

  const shuffleBoard = () => {
    if (gameState.status !== 'playing' || isPaused) return;
    playSound('prop');
    
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

  const handleUseBomb = () => {
    if (gameState.status !== 'playing' || gameState.bombs <= 0 || isPaused) return;
    const pair = findAvailablePair(grid);
    if (pair) {
      playSound('prop');
      setGameState(prev => ({ ...prev, bombs: prev.bombs - 1 }));
      const bombPath = findPath(grid, pair[0], pair[1]);
      if (bombPath) setPath(bombPath);
      setTimeout(() => executeMatch(pair[0], pair[1], true), 300);
    } else {
      shuffleBoard();
    }
  };

  const handleUseHint = () => {
    if (gameState.status !== 'playing' || gameState.hints <= 0 || isPaused) return;
    const pair = findAvailablePair(grid);
    if (pair) {
      playSound('prop');
      setGameState(prev => ({ ...prev, hints: prev.hints - 1 }));
      setHintPairs([pair[0], pair[1]]);
    } else {
      shuffleBoard();
    }
  };

  // --- Menu Handlers ---
  const handleQuitGame = () => {
    setIsPaused(false);
    audioManager.stopBgm();
    setGameState(prev => ({ ...prev, status: 'menu' }));
  };

  // Scene: Menu
  if (gameState.status === 'menu') {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center p-4 relative overflow-hidden">
         <FloatingBackground variant="menu" />
         
         {/* Increased box size: max-w-xl and larger internal padding */}
         <div className="z-10 bg-white/90 backdrop-blur-md p-10 rounded-[3rem] shadow-2xl border-8 border-white w-11/12 max-w-xl text-center relative animate-float">
            <button 
              onClick={() => setShowSettings(true)}
              className="absolute top-6 right-6 text-gray-400 hover:text-purple-500 transition-colors p-2 bg-gray-100 rounded-full"
            >
              <SettingsIcon size={28} />
            </button>

            {/* Title with Breathing Animation */}
            <div className="animate-breathe mb-6">
              <h1 className="text-7xl mb-2 text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600 font-black tracking-tighter drop-shadow-sm whitespace-pre-line leading-tight">
                {t.title}
              </h1>
            </div>
            
            <p className="text-gray-500 mb-10 font-bold text-2xl tracking-[0.2em] uppercase text-pink-400">{t.subtitle}</p>
            
            <div className="mb-10 bg-gradient-to-r from-pink-50 to-purple-50 p-6 rounded-3xl border-2 border-pink-100 shadow-inner">
               <div className="text-base text-pink-400 mb-2 flex justify-center items-center gap-2 font-bold uppercase tracking-wide">
                 <Award size={20}/> {t.highScore}
               </div>
               <div className="text-6xl font-black text-pink-500 drop-shadow-sm">{gameState.highScore}</div>
            </div>

            <button 
              onClick={startGame}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white text-3xl py-6 rounded-2xl font-black shadow-[0_10px_0_rgb(168,85,247)] hover:shadow-[0_5px_0_rgb(168,85,247)] hover:translate-y-[5px] active:shadow-none active:translate-y-[10px] transition-all flex items-center justify-center gap-4 group"
            >
              <span className="group-hover:rotate-12 transition-transform duration-300">
                <Play fill="currentColor" size={32} /> 
              </span>
              {t.startGame}
            </button>
         </div>
         
         <div className="z-10 mt-12 text-center bg-black/20 backdrop-blur-md text-white px-8 py-3 rounded-full text-lg font-bold shadow-xl border border-white/30">
           {t.rules}
         </div>

         {showSettings && (
           <SettingsModal 
             onClose={() => setShowSettings(false)}
             lang={language} setLang={setLanguage}
             bgmVolume={bgmVolume} setBgmVolume={setBgmVolume}
             sfxVolume={sfxVolume} setSfxVolume={setSfxVolume}
           />
         )}
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
            <h2 className="text-4xl font-black text-gray-800 mb-2">{t.gameOver}</h2>
            <p className="text-gray-500 mb-6">{t.timeUp}</p>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-gray-50 p-3 rounded-xl">
                 <div className="text-xs text-gray-400">{t.finalLevel}</div>
                 <div className="text-2xl font-bold text-gray-700">{gameState.level}</div>
              </div>
              <div className="bg-yellow-50 p-3 rounded-xl">
                 <div className="text-xs text-yellow-600">{t.score}</div>
                 <div className="text-2xl font-bold text-yellow-600">{gameState.score}</div>
              </div>
            </div>

            <button 
              onClick={() => { playSound('select'); setGameState(prev => ({ ...prev, status: 'menu' })); }}
              className="w-full bg-gray-800 text-white text-lg py-3 rounded-xl font-bold shadow-lg hover:bg-gray-700 transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw size={20} /> {t.backToMenu}
            </button>
         </div>
      </div>
    );
  }

  // Scene: Playing
  return (
    <div className="h-screen w-full flex flex-col items-center py-2 px-2 overflow-hidden relative">
      <FloatingBackground variant="game" />

      {comboMessage && (
        <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none">
          <div className="bg-yellow-400 text-white px-6 py-2 rounded-full font-black text-xl shadow-lg animate-bounce border-2 border-white whitespace-nowrap">
            {comboMessage}
          </div>
        </div>
      )}

      {/* Modals */}
      {isPaused && (
        <PauseModal 
          onResume={() => setIsPaused(false)}
          onSettings={() => setShowSettings(true)}
          onQuit={handleQuitGame}
          lang={language}
        />
      )}
      
      {showSettings && (
        <SettingsModal 
           onClose={() => setShowSettings(false)}
           lang={language} setLang={setLanguage}
           bgmVolume={bgmVolume} setBgmVolume={setBgmVolume}
           sfxVolume={sfxVolume} setSfxVolume={setSfxVolume}
        />
      )}

      {gameState.status === 'level-success' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
           <div className="bg-white p-8 rounded-3xl shadow-2xl animate-bounce text-center">
              <div className="text-6xl mb-2">🤩</div>
              <h2 className="text-3xl font-black text-pink-500">{t.levelSuccess}</h2>
              <p className="text-gray-400 font-bold">{t.loading}</p>
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
        onPause={() => setIsPaused(true)}
        t={t}
      />
      
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

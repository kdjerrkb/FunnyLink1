
export interface Position {
  x: number;
  y: number;
}

export interface Tile {
  id: string;
  type: string; // The emoji char
  x: number;
  y: number;
  key: number; // Unique identifier for React lists
  isObstacle?: boolean;
}

export type Grid = (Tile | null)[][];

export interface GameState {
  score: number;
  level: number;
  timeLeft: number;
  status: 'menu' | 'playing' | 'level-success' | 'game-over';
  highScore: number;
  bombs: number;
  hints: number;
}

export interface PathNode {
  x: number;
  y: number;
}

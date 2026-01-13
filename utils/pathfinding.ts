
import { Grid, Position, PathNode } from '../types';
import { BOARD_WIDTH, BOARD_HEIGHT } from '../constants';

// Check if a point is within bounds
const isValid = (x: number, y: number) => {
  return x >= 0 && x < BOARD_WIDTH && y >= 0 && y < BOARD_HEIGHT;
};

// Check if a path is clear (horizontal)
const isHorizontalClear = (grid: Grid, y: number, x1: number, x2: number): boolean => {
  const start = Math.min(x1, x2);
  const end = Math.max(x1, x2);
  for (let x = start + 1; x < end; x++) {
    if (grid[y][x] !== null) return false;
  }
  return true;
};

// Check if a path is clear (vertical)
const isVerticalClear = (grid: Grid, x: number, y1: number, y2: number): boolean => {
  const start = Math.min(y1, y2);
  const end = Math.max(y1, y2);
  for (let y = start + 1; y < end; y++) {
    if (grid[y][x] !== null) return false;
  }
  return true;
};

// Main function to find path with max 2 turns (3 segments)
export const findPath = (grid: Grid, p1: Position, p2: Position): PathNode[] | null => {
  // 1. Check direct connection (0 turns)
  if (p1.x === p2.x) {
    if (isVerticalClear(grid, p1.x, p1.y, p2.y)) return [p1, p2];
  }
  if (p1.y === p2.y) {
    if (isHorizontalClear(grid, p1.y, p1.x, p2.x)) return [p1, p2];
  }

  // 2. Check 1 turn connection
  // Try corner 1: (p1.x, p2.y)
  let c1 = { x: p1.x, y: p2.y };
  if (grid[c1.y][c1.x] === null) {
    if (isVerticalClear(grid, p1.x, p1.y, c1.y) && isHorizontalClear(grid, c1.y, c1.x, p2.x)) {
      return [p1, c1, p2];
    }
  }
  // Try corner 2: (p2.x, p1.y)
  let c2 = { x: p2.x, y: p1.y };
  if (grid[c2.y][c2.x] === null) {
    if (isHorizontalClear(grid, p1.y, p1.x, c2.x) && isVerticalClear(grid, c2.x, c2.y, p2.y)) {
      return [p1, c2, p2];
    }
  }

  // 3. Check 2 turns connection
  // Strategy: Scan horizontal lines from p1 to find an empty spot 's1', then try 1-turn from s1 to p2
  for (let x = 0; x < BOARD_WIDTH; x++) {
    if (x === p1.x) continue;
    // Check if we can reach (x, p1.y) from p1
    if (grid[p1.y][x] === null && isHorizontalClear(grid, p1.y, p1.x, x)) {
       // From this temporary point (x, p1.y), can we make a 1-turn to p2?
       const A = { x: x, y: p1.y };
       const B = { x: x, y: p2.y };

       if (grid[B.y][B.x] === null && isVerticalClear(grid, x, A.y, B.y) && isHorizontalClear(grid, B.y, B.x, p2.x)) {
         return [p1, A, B, p2];
       }
    }
  }

  // Strategy: Scan vertical lines from p1
  for (let y = 0; y < BOARD_HEIGHT; y++) {
    if (y === p1.y) continue;
    if (grid[y][p1.x] === null && isVerticalClear(grid, p1.x, p1.y, y)) {
      const A = { x: p1.x, y: y };
      const B = { x: p2.x, y: y };

      if (grid[B.y][B.x] === null && isHorizontalClear(grid, y, A.x, B.x) && isVerticalClear(grid, B.x, B.y, p2.y)) {
        return [p1, A, B, p2];
      }
    }
  }

  return null;
};

// Check if any move is possible
export const hasPossibleMoves = (grid: Grid): boolean => {
  const pair = findAvailablePair(grid);
  return pair !== null;
};

// Returns a specific pair of connectable tiles if found
export const findAvailablePair = (grid: Grid): [Position, Position] | null => {
  const tiles: {t: string, p: Position}[] = [];
  for(let y=0; y<BOARD_HEIGHT; y++){
    for(let x=0; x<BOARD_WIDTH; x++){
      // Only check tiles that are NOT obstacles
      if(grid[y][x] && !grid[y][x]!.isObstacle){
        tiles.push({t: grid[y][x]!.type, p: {x,y}});
      }
    }
  }

  for(let i=0; i<tiles.length; i++){
    for(let j=i+1; j<tiles.length; j++){
      if(tiles[i].t === tiles[j].t){
        if(findPath(grid, tiles[i].p, tiles[j].p)){
          return [tiles[i].p, tiles[j].p];
        }
      }
    }
  }
  return null;
};

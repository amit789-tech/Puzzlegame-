export type Cell = { r: number; c: number };

export type GridSize = { rows: number; cols: number };

export type Difficulty = 'easy' | 'medium' | 'hard';

export type PuzzleType = 'snap' | 'shikaku' | 'pips';

export interface BasePuzzle {
  id: string; // stable hash, e.g. "snap-7x7-000123"
  type: PuzzleType;
  level: number; // global ordering, ascending = harder
  difficulty: Difficulty;
  rows: number;
  cols: number;
}

export interface ValidationResult {
  solved: boolean;
  reason?: string;
}

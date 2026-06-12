import type { BasePuzzle } from '../../engine/types';

export interface ShikakuClue {
  value: number; // area the rectangle containing this clue must have
  r: number;
  c: number;
}

export interface Rect {
  r: number; // top-left row
  c: number; // top-left col
  w: number;
  h: number;
}

export interface ShikakuPuzzle extends BasePuzzle {
  type: 'shikaku';
  clues: ShikakuClue[]; // sum(value) === rows*cols (invariant)
  solution: Rect[]; // one rect per clue, same index order as clues
}

/** Runtime board state for the Shikaku mode. */
export interface ShikakuState {
  rects: Rect[];
}

import type { BasePuzzle, Cell } from '../../engine/types';

export interface SnapWaypoint {
  n: number; // 1..N, ascending
  r: number;
  c: number;
}

export interface SnapPuzzle extends BasePuzzle {
  type: 'snap';
  waypoints: SnapWaypoint[]; // sorted by n; waypoints[0].n === 1
  solution: Cell[]; // full Hamiltonian path, length rows*cols
}

/** Runtime board state for the Snap mode. */
export interface SnapState {
  path: Cell[];
}

export type SnapMove =
  | { kind: 'extend'; cell: Cell }
  | { kind: 'backtrack' }
  | { kind: 'clear' };

import type { BasePuzzle, Cell } from '../../engine/types';

/**
 * Region constraint kinds (NYT Pips):
 *  - 'sum': the pips in the region add up to exactly `value`
 *  - 'gt' : the pips add up to strictly more than `value`
 *  - 'lt' : the pips add up to strictly less than `value`
 *  - 'eq' : every cell in the region shows the same pip value
 *  - 'neq': every cell in the region shows a different pip value
 *  - 'none': no constraint (free cells, must still be covered)
 */
export type PipsConstraintKind = 'sum' | 'gt' | 'lt' | 'eq' | 'neq' | 'none';

export interface PipsRegion {
  cells: Cell[]; // cells belonging to this region (board is partitioned)
  kind: PipsConstraintKind;
  value?: number; // present for 'sum' | 'gt' | 'lt'
  colorIndex: number; // index into the region palette
}

/** A tray piece: a domino with two pip ends (0..6 each). */
export interface Domino {
  a: number;
  b: number;
}

/**
 * A placed domino: tray slot `slot` covers cells `a` and `b` (orthogonally
 * adjacent). The slot's `.a` value sits on cell `a`, `.b` on cell `b`.
 */
export interface Placement {
  slot: number;
  a: Cell;
  b: Cell;
}

export interface PipsPuzzle extends BasePuzzle {
  type: 'pips';
  // Board shape: the set of playable cells inside the rows×cols bounding box.
  cells: Cell[];
  regions: PipsRegion[]; // partition of `cells`
  dominoes: Domino[]; // the tray (a multiset; 2 * length === cells.length)
  solution: Placement[];
}

export interface PipsState {
  placements: Placement[];
}

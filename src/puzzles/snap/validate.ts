import { cellIndex, inBounds, isAdjacent } from '../../engine/grid';
import type { Cell, ValidationResult } from '../../engine/types';
import type { SnapPuzzle } from './types';

/** Map from row-major cell index to waypoint number n (1..N). */
function waypointIndexMap(p: SnapPuzzle): Map<number, number> {
  const map = new Map<number, number>();
  for (const w of p.waypoints) map.set(w.r * p.cols + w.c, w.n);
  return map;
}

/**
 * Full check used on release / completion attempt. All rules must hold:
 *  1. path covers every cell exactly once (length === rows*cols)
 *  2. all cells distinct and in-bounds
 *  3. consecutive cells orthogonally adjacent
 *  4. path starts at waypoint 1 and ends at waypoint N
 *  5. waypoint cells appear in strictly increasing n order
 */
export function validatePath(p: SnapPuzzle, path: Cell[]): ValidationResult {
  const total = p.rows * p.cols;
  if (path.length !== total) {
    return { solved: false, reason: 'path does not cover every cell' };
  }

  const seen = new Set<number>();
  for (let i = 0; i < path.length; i++) {
    const cell = path[i];
    if (!inBounds(cell.r, cell.c, p.rows, p.cols)) {
      return { solved: false, reason: 'cell out of bounds' };
    }
    const idx = cellIndex(cell, p.cols);
    if (seen.has(idx)) {
      return { solved: false, reason: 'cell visited twice' };
    }
    seen.add(idx);
    if (i > 0 && !isAdjacent(path[i - 1], cell)) {
      return { solved: false, reason: 'non-adjacent step' };
    }
  }

  const wps = waypointIndexMap(p);
  const first = p.waypoints[0];
  const last = p.waypoints[p.waypoints.length - 1];
  if (path[0].r !== first.r || path[0].c !== first.c) {
    return { solved: false, reason: 'path must start at waypoint 1' };
  }
  const end = path[path.length - 1];
  if (end.r !== last.r || end.c !== last.c) {
    return { solved: false, reason: 'path must end at the last waypoint' };
  }

  let expected = 1;
  for (const cell of path) {
    const n = wps.get(cellIndex(cell, p.cols));
    if (n === undefined) continue;
    if (n !== expected) {
      return { solved: false, reason: 'waypoints visited out of order' };
    }
    expected++;
  }
  if (expected !== p.waypoints.length + 1) {
    return { solved: false, reason: 'not all waypoints visited' };
  }

  return { solved: true };
}

/**
 * Live check while dragging (cheap, allows incomplete path): distinct +
 * adjacent + starts at waypoint 1 + does not step onto a waypoint out of
 * order.
 */
export function isPartialValid(p: SnapPuzzle, path: Cell[]): boolean {
  if (path.length === 0) return true;

  const first = p.waypoints[0];
  if (path[0].r !== first.r || path[0].c !== first.c) return false;

  const wps = waypointIndexMap(p);
  const seen = new Set<number>();
  let expected = 1;

  for (let i = 0; i < path.length; i++) {
    const cell = path[i];
    if (!inBounds(cell.r, cell.c, p.rows, p.cols)) return false;
    const idx = cellIndex(cell, p.cols);
    if (seen.has(idx)) return false;
    seen.add(idx);
    if (i > 0 && !isAdjacent(path[i - 1], cell)) return false;

    const n = wps.get(idx);
    if (n !== undefined) {
      if (n !== expected) return false;
      expected++;
    }
  }
  return true;
}

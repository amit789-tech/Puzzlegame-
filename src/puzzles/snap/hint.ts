import type { Cell } from '../../engine/types';
import type { SnapPuzzle } from './types';

/**
 * Returns the next cell of the stored solution given that `current` is a
 * correct prefix of it; null if `current` is not a prefix (or the path is
 * already complete).
 */
export function nextPathStep(p: SnapPuzzle, current: Cell[]): Cell | null {
  if (current.length >= p.solution.length) return null;
  for (let i = 0; i < current.length; i++) {
    if (current[i].r !== p.solution[i].r || current[i].c !== p.solution[i].c) {
      return null;
    }
  }
  const next = p.solution[current.length];
  return { r: next.r, c: next.c };
}

/** Length of the longest prefix of `current` that matches the solution. */
export function longestCorrectPrefix(p: SnapPuzzle, current: Cell[]): number {
  const n = Math.min(current.length, p.solution.length);
  for (let i = 0; i < n; i++) {
    if (current[i].r !== p.solution[i].r || current[i].c !== p.solution[i].c) {
      return i;
    }
  }
  return n;
}

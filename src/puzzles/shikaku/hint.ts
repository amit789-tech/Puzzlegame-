import type { Rect, ShikakuPuzzle } from './types';

function sameRect(a: Rect, b: Rect): boolean {
  return a.r === b.r && a.c === b.c && a.w === b.w && a.h === b.h;
}

/**
 * Returns one rect from the stored solution that the player has not placed
 * yet (exactly), or null when every solution rect is already on the board.
 * The caller is responsible for clearing any placed rects that overlap it.
 */
export function revealOneRect(p: ShikakuPuzzle, placed: Rect[]): Rect | null {
  for (const rect of p.solution) {
    if (!placed.some((other) => sameRect(other, rect))) {
      return { ...rect };
    }
  }
  return null;
}

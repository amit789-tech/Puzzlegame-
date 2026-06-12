import type { Cell, ValidationResult } from '../../engine/types';
import type { Rect, ShikakuPuzzle } from './types';

export function rectContains(rect: Rect, r: number, c: number): boolean {
  return r >= rect.r && r < rect.r + rect.h && c >= rect.c && c < rect.c + rect.w;
}

export function rectsOverlap(a: Rect, b: Rect): boolean {
  return a.r < b.r + b.h && b.r < a.r + a.h && a.c < b.c + b.w && b.c < a.c + a.w;
}

export function rectInBounds(rect: Rect, rows: number, cols: number): boolean {
  return (
    rect.w >= 1 &&
    rect.h >= 1 &&
    rect.r >= 0 &&
    rect.c >= 0 &&
    rect.r + rect.h <= rows &&
    rect.c + rect.w <= cols
  );
}

/** Hit-test for the eraser: the placed rect covering `cell`, or null. */
export function rectAt(rects: Rect[], cell: Cell): Rect | null {
  for (const rect of rects) {
    if (rectContains(rect, cell.r, cell.c)) return rect;
  }
  return null;
}

/**
 * Full solution check. All rules must hold:
 *  1. every rect in-bounds with w>=1, h>=1
 *  2. rects pairwise non-overlapping; covered cells === rows*cols (full tiling)
 *  3. each rect contains exactly one clue cell, and clue.value === w*h
 *  4. each clue covered by exactly one rect
 */
export function validateRects(p: ShikakuPuzzle, rects: Rect[]): ValidationResult {
  let covered = 0;
  for (const rect of rects) {
    if (!rectInBounds(rect, p.rows, p.cols)) {
      return { solved: false, reason: 'rectangle out of bounds' };
    }
    covered += rect.w * rect.h;
  }

  for (let i = 0; i < rects.length; i++) {
    for (let j = i + 1; j < rects.length; j++) {
      if (rectsOverlap(rects[i], rects[j])) {
        return { solved: false, reason: 'rectangles overlap' };
      }
    }
  }

  if (covered !== p.rows * p.cols) {
    return { solved: false, reason: 'board not fully covered' };
  }

  const clueUses = new Array(p.clues.length).fill(0);
  for (const rect of rects) {
    let cluesInRect = 0;
    let clueValue = -1;
    for (let k = 0; k < p.clues.length; k++) {
      const clue = p.clues[k];
      if (rectContains(rect, clue.r, clue.c)) {
        cluesInRect++;
        clueValue = clue.value;
        clueUses[k]++;
      }
    }
    if (cluesInRect === 0) {
      return { solved: false, reason: 'rectangle contains no clue' };
    }
    if (cluesInRect > 1) {
      return { solved: false, reason: 'rectangle contains more than one clue' };
    }
    if (clueValue !== rect.w * rect.h) {
      return { solved: false, reason: 'rectangle area does not match its clue' };
    }
  }

  for (const uses of clueUses) {
    if (uses !== 1) {
      return { solved: false, reason: 'a clue is not covered by exactly one rectangle' };
    }
  }

  return { solved: true };
}

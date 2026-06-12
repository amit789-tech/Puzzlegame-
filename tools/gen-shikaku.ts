import type { Difficulty } from '../src/engine/types';
import type { Rect, ShikakuClue, ShikakuPuzzle } from '../src/puzzles/shikaku/types';
import { mulberry32, pick, randInt, type Rng } from './rng';
import { countShikakuSolutions } from './solve-shikaku';

export interface LayoutOptions {
  minArea?: number;
  maxArea?: number;
  maxDim?: number;
}

/**
 * Tiling by first-empty-cell anchoring: repeatedly grow a rectangle whose
 * top-left corner is the first uncovered cell in row-major order. This
 * always terminates in a complete, gap-free tiling.
 */
export function generateShikakuLayout(
  rows: number,
  cols: number,
  rng: Rng,
  { minArea = 2, maxArea = 10, maxDim = Math.max(rows, cols) }: LayoutOptions = {},
): Rect[] {
  const covered = new Uint8Array(rows * cols);
  const rects: Rect[] = [];

  let scan = 0;
  while (scan < rows * cols) {
    if (covered[scan]) {
      scan++;
      continue;
    }
    const r = Math.floor(scan / cols);
    const c = scan % cols;

    // Widths available to the right of (r,c) over empty cells only.
    let maxW = 0;
    while (c + maxW < cols && maxW < maxDim && !covered[r * cols + c + maxW]) maxW++;

    const candidates: { w: number; h: number }[] = [];
    for (let w = 1; w <= maxW; w++) {
      // Max height for which the full w-wide block is empty.
      let maxH = 0;
      outer: while (r + maxH < rows && maxH < maxDim) {
        for (let cc = c; cc < c + w; cc++) {
          if (covered[(r + maxH) * cols + cc]) break outer;
        }
        maxH++;
      }
      for (let h = 1; h <= maxH; h++) {
        const area = w * h;
        if (area >= minArea && area <= maxArea) candidates.push({ w, h });
      }
    }
    if (candidates.length === 0) candidates.push({ w: 1, h: 1 }); // forced

    // Bias toward area >= 2 so the board is not littered with 1x1 cells.
    const big = candidates.filter(({ w, h }) => w * h >= 2);
    const pool = big.length > 0 && rng() < 0.95 ? big : candidates;
    const { w, h } = pick(rng, pool);

    for (let rr = r; rr < r + h; rr++) {
      for (let cc = c; cc < c + w; cc++) covered[rr * cols + cc] = 1;
    }
    rects.push({ r, c, w, h });
  }

  return rects;
}

/** One clue per rect, at a random cell inside it. */
export function placeClues(rects: Rect[], rng: Rng): ShikakuClue[] {
  return rects.map((rect) => ({
    value: rect.w * rect.h,
    r: rect.r + randInt(rng, rect.h),
    c: rect.c + randInt(rng, rect.w),
  }));
}

export interface GenShikakuOptions extends LayoutOptions {
  rows: number;
  cols: number;
  seed: number;
  difficulty: Difficulty;
  maxAttempts?: number;
}

/**
 * Builds one uniqueness-checked Shikaku puzzle. For each generated layout a
 * few different clue placements are tried (clue position inside its rect is
 * often what disambiguates a layout) before a new layout is drawn. Returns
 * null if nothing unique was found within maxAttempts layouts.
 */
export function generateShikaku(
  opts: GenShikakuOptions,
): Omit<ShikakuPuzzle, 'id' | 'level'> | null {
  const { rows, cols, seed, difficulty, ...layoutOpts } = opts;
  const maxAttempts = opts.maxAttempts ?? 25;
  const rng = mulberry32(seed);

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const rects = generateShikakuLayout(rows, cols, rng, layoutOpts);
    for (let placement = 0; placement < 6; placement++) {
      const clues = placeClues(rects, rng);
      if (countShikakuSolutions({ rows, cols, clues }) === 1) {
        return { type: 'shikaku', difficulty, rows, cols, clues, solution: rects };
      }
    }
  }
  return null;
}

/** Stable content hash for deduping puzzles inside a bank. */
export function shikakuContentKey(p: {
  rows: number;
  cols: number;
  clues: ShikakuClue[];
}): string {
  const clues = [...p.clues]
    .sort((a, b) => a.r - b.r || a.c - b.c)
    .map((cl) => `${cl.value}:${cl.r},${cl.c}`)
    .join(';');
  return `${p.rows}x${p.cols}|${clues}`;
}

import { mulberry32 } from '../src/engine/rng';
import type { ShikakuPuzzle } from '../src/puzzles/shikaku/types';
import { validateRects } from '../src/puzzles/shikaku/validate';
import {
  generateShikaku,
  generateShikakuLayout,
  placeClues,
} from '../tools/gen-shikaku';
import { countShikakuSolutions } from '../tools/solve-shikaku';

describe('countShikakuSolutions', () => {
  it('counts 1 for a uniquely solvable instance', () => {
    // 4x4, two 8-cell rects. The vertical alternative for the (0,0) clue
    // would swallow the (2,0) clue, so only horizontal halves remain.
    const count = countShikakuSolutions({
      rows: 4,
      cols: 4,
      clues: [
        { value: 8, r: 0, c: 0 },
        { value: 8, r: 2, c: 0 },
      ],
    });
    expect(count).toBe(1);
  });

  it('counts 2 for an ambiguous instance', () => {
    // Same two 8s placed in opposite corners: horizontal and vertical
    // halvings both work.
    const count = countShikakuSolutions({
      rows: 4,
      cols: 4,
      clues: [
        { value: 8, r: 0, c: 0 },
        { value: 8, r: 3, c: 3 },
      ],
    });
    expect(count).toBe(2);
  });

  it('counts 0 when clue areas cannot tile the grid', () => {
    const count = countShikakuSolutions({
      rows: 4,
      cols: 4,
      clues: [
        { value: 8, r: 0, c: 0 },
        { value: 4, r: 3, c: 3 },
      ],
    });
    expect(count).toBe(0);
  });
});

describe('generateShikakuLayout', () => {
  it('always produces a complete, non-overlapping tiling', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const rng = mulberry32(seed);
      const rects = generateShikakuLayout(7, 7, rng, { maxArea: 9, maxDim: 5 });
      const covered = new Uint8Array(49);
      for (const rect of rects) {
        expect(rect.r).toBeGreaterThanOrEqual(0);
        expect(rect.c).toBeGreaterThanOrEqual(0);
        expect(rect.r + rect.h).toBeLessThanOrEqual(7);
        expect(rect.c + rect.w).toBeLessThanOrEqual(7);
        for (let r = rect.r; r < rect.r + rect.h; r++) {
          for (let c = rect.c; c < rect.c + rect.w; c++) {
            expect(covered[r * 7 + c]).toBe(0); // no overlap
            covered[r * 7 + c] = 1;
          }
        }
      }
      expect(covered.every((v) => v === 1)).toBe(true); // no gap
    }
  });

  it('places one clue per rect, inside it, with matching value', () => {
    const rng = mulberry32(7);
    const rects = generateShikakuLayout(6, 6, rng);
    const clues = placeClues(rects, rng);
    expect(clues).toHaveLength(rects.length);
    clues.forEach((clue, i) => {
      const rect = rects[i];
      expect(clue.value).toBe(rect.w * rect.h);
      expect(clue.r).toBeGreaterThanOrEqual(rect.r);
      expect(clue.r).toBeLessThan(rect.r + rect.h);
      expect(clue.c).toBeGreaterThanOrEqual(rect.c);
      expect(clue.c).toBeLessThan(rect.c + rect.w);
    });
  });
});

describe('generateShikaku', () => {
  it('produces a unique, self-consistent puzzle', () => {
    const core = generateShikaku({
      rows: 5,
      cols: 5,
      seed: 4242,
      difficulty: 'easy',
      minArea: 2,
      maxArea: 6,
      maxDim: 4,
    });
    expect(core).not.toBeNull();
    const puzzle: ShikakuPuzzle = { ...core!, id: 'shikaku-test', level: 2 };

    // Clue areas tile the grid exactly (PRD invariant).
    const sum = puzzle.clues.reduce((acc, clue) => acc + clue.value, 0);
    expect(sum).toBe(puzzle.rows * puzzle.cols);

    // The stored solution satisfies the puzzle, and it is the only one.
    expect(validateRects(puzzle, puzzle.solution)).toEqual({ solved: true });
    expect(countShikakuSolutions(puzzle)).toBe(1);
  });

  it('is deterministic for a given seed', () => {
    const opts = {
      rows: 5,
      cols: 5,
      seed: 31337,
      difficulty: 'easy' as const,
      maxArea: 6,
      maxDim: 4,
    };
    expect(generateShikaku(opts)).toEqual(generateShikaku(opts));
  });
});

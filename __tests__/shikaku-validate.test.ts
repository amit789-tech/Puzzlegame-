import { revealOneRect } from '../src/puzzles/shikaku/hint';
import type { Rect, ShikakuPuzzle } from '../src/puzzles/shikaku/types';
import { rectAt, validateRects } from '../src/puzzles/shikaku/validate';

// 4x4 fixture, four 4-cell rects:
//   A A B B      A: 2x2 at (0,0)   B: 2x2 at (0,2)
//   A A B B      C: 4x1 at (2,0)   D: 4x1 at (3,0)
//   C C C C
//   D D D D
const SOLUTION: Rect[] = [
  { r: 0, c: 0, w: 2, h: 2 },
  { r: 0, c: 2, w: 2, h: 2 },
  { r: 2, c: 0, w: 4, h: 1 },
  { r: 3, c: 0, w: 4, h: 1 },
];

const PUZZLE: ShikakuPuzzle = {
  id: 'shikaku-4x4-test',
  type: 'shikaku',
  level: 2,
  difficulty: 'easy',
  rows: 4,
  cols: 4,
  clues: [
    { value: 4, r: 0, c: 0 },
    { value: 4, r: 1, c: 3 },
    { value: 4, r: 2, c: 1 },
    { value: 4, r: 3, c: 2 },
  ],
  solution: SOLUTION,
};

describe('validateRects', () => {
  it('accepts the canonical solution', () => {
    expect(validateRects(PUZZLE, SOLUTION)).toEqual({ solved: true });
  });

  it('rejects incomplete coverage (gap)', () => {
    const result = validateRects(PUZZLE, SOLUTION.slice(0, 3));
    expect(result.solved).toBe(false);
    expect(result.reason).toMatch(/covered/);
  });

  it('rejects overlapping rectangles', () => {
    const rects: Rect[] = [
      { r: 0, c: 0, w: 3, h: 2 }, // overlaps B's column 2
      { r: 0, c: 2, w: 2, h: 2 },
      { r: 2, c: 0, w: 4, h: 1 },
      { r: 3, c: 0, w: 4, h: 1 },
    ];
    const result = validateRects(PUZZLE, rects);
    expect(result.solved).toBe(false);
    expect(result.reason).toMatch(/overlap/);
  });

  it('rejects an out-of-bounds rectangle', () => {
    const rects: Rect[] = [...SOLUTION.slice(0, 3), { r: 3, c: 1, w: 4, h: 1 }];
    const result = validateRects(PUZZLE, rects);
    expect(result.solved).toBe(false);
    expect(result.reason).toMatch(/bounds/);
  });

  it('rejects a rectangle whose area does not match its clue', () => {
    // Same full tiling, but splits B's area into two 1x2s: the half without
    // a clue fails first; force the area error with a 2x1 over B's clue and
    // a wrong-area rect elsewhere.
    const rects: Rect[] = [
      { r: 0, c: 0, w: 2, h: 2 },
      { r: 0, c: 2, w: 2, h: 1 }, // contains no clue OR wrong area paths both rejected
      { r: 1, c: 2, w: 2, h: 1 }, // contains clue B (value 4) but area 2
      { r: 2, c: 0, w: 4, h: 1 },
      { r: 3, c: 0, w: 4, h: 1 },
    ];
    expect(validateRects(PUZZLE, rects).solved).toBe(false);
  });

  it('rejects a rectangle containing two clues', () => {
    const rects: Rect[] = [
      { r: 0, c: 0, w: 2, h: 2 },
      { r: 0, c: 2, w: 2, h: 2 },
      { r: 2, c: 0, w: 4, h: 2 }, // swallows clues C and D
    ];
    const result = validateRects(PUZZLE, rects);
    expect(result.solved).toBe(false);
    expect(result.reason).toMatch(/more than one clue/);
  });

  it('accepts an alternative tiling that also satisfies every clue', () => {
    // Four horizontal strips: each holds exactly one value-4 clue. The
    // validator checks the rules, not equality with the stored solution.
    const strips: Rect[] = [
      { r: 0, c: 0, w: 4, h: 1 },
      { r: 1, c: 0, w: 4, h: 1 },
      { r: 2, c: 0, w: 4, h: 1 },
      { r: 3, c: 0, w: 4, h: 1 },
    ];
    expect(validateRects(PUZZLE, strips)).toEqual({ solved: true });
  });

  it('rejects a rectangle containing no clue', () => {
    // Full tiling, but B's 2x2 is split into two 1-row halves; the top half
    // (cells (0,2),(0,3)) holds no clue.
    const rects: Rect[] = [
      { r: 0, c: 2, w: 2, h: 1 }, // no clue
      { r: 1, c: 2, w: 2, h: 1 }, // clue B, wrong area
      { r: 0, c: 0, w: 2, h: 2 },
      { r: 2, c: 0, w: 4, h: 1 },
      { r: 3, c: 0, w: 4, h: 1 },
    ];
    const result = validateRects(PUZZLE, rects);
    expect(result.solved).toBe(false);
    expect(result.reason).toMatch(/no clue/);
  });
});

describe('rectAt', () => {
  it('returns the rect covering a cell, or null', () => {
    expect(rectAt(SOLUTION, { r: 1, c: 1 })).toEqual({ r: 0, c: 0, w: 2, h: 2 });
    expect(rectAt(SOLUTION, { r: 2, c: 3 })).toEqual({ r: 2, c: 0, w: 4, h: 1 });
    expect(rectAt(SOLUTION.slice(0, 2), { r: 3, c: 0 })).toBeNull();
  });
});

describe('revealOneRect', () => {
  it('returns a missing solution rect', () => {
    const placed = [SOLUTION[0], SOLUTION[2]];
    expect(revealOneRect(PUZZLE, placed)).toEqual(SOLUTION[1]);
  });

  it('returns null when everything is placed', () => {
    expect(revealOneRect(PUZZLE, [...SOLUTION])).toBeNull();
  });
});

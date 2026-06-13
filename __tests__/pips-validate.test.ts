import type { PipsPuzzle, Placement } from '../src/puzzles/pips/types';
import { validatePips, isPartialValid, placementAt } from '../src/puzzles/pips/validate';

// A 2x2 board, two dominoes. Region A (top row) must sum to 5; region B
// (bottom row) requires all-equal. Tray: {2,3} and {4,4}.
const puzzle: PipsPuzzle = {
  id: 'test',
  type: 'pips',
  level: 1,
  difficulty: 'easy',
  rows: 2,
  cols: 2,
  cells: [
    { r: 0, c: 0 },
    { r: 0, c: 1 },
    { r: 1, c: 0 },
    { r: 1, c: 1 },
  ],
  regions: [
    { cells: [{ r: 0, c: 0 }, { r: 0, c: 1 }], kind: 'sum', value: 5, colorIndex: 0 },
    { cells: [{ r: 1, c: 0 }, { r: 1, c: 1 }], kind: 'eq', colorIndex: 1 },
  ],
  dominoes: [
    { a: 2, b: 3 },
    { a: 4, b: 4 },
  ],
  solution: [
    { slot: 0, a: { r: 0, c: 0 }, b: { r: 0, c: 1 } },
    { slot: 1, a: { r: 1, c: 0 }, b: { r: 1, c: 1 } },
  ],
};

describe('validatePips', () => {
  it('accepts the intended solution', () => {
    expect(validatePips(puzzle, puzzle.solution).solved).toBe(true);
  });

  it('rejects an incomplete board', () => {
    expect(validatePips(puzzle, [puzzle.solution[0]]).solved).toBe(false);
  });

  it('rejects when a region condition fails', () => {
    // Put the {4,4} on top (sum 8 != 5) and {2,3} on bottom (not equal).
    const bad: Placement[] = [
      { slot: 1, a: { r: 0, c: 0 }, b: { r: 0, c: 1 } },
      { slot: 0, a: { r: 1, c: 0 }, b: { r: 1, c: 1 } },
    ];
    expect(validatePips(puzzle, bad).solved).toBe(false);
  });

  it('rejects overlapping pieces', () => {
    const overlap: Placement[] = [
      { slot: 0, a: { r: 0, c: 0 }, b: { r: 0, c: 1 } },
      { slot: 1, a: { r: 0, c: 1 }, b: { r: 1, c: 1 } },
    ];
    expect(validatePips(puzzle, overlap).solved).toBe(false);
  });
});

describe('isPartialValid', () => {
  it('flags a sum region that already overshoots', () => {
    // {4,4} on the top row already sums to 8 > 5.
    const partial: Placement[] = [{ slot: 1, a: { r: 0, c: 0 }, b: { r: 0, c: 1 } }];
    expect(isPartialValid(puzzle, partial)).toBe(false);
  });

  it('accepts a valid partial placement', () => {
    const partial: Placement[] = [{ slot: 0, a: { r: 0, c: 0 }, b: { r: 0, c: 1 } }];
    expect(isPartialValid(puzzle, partial)).toBe(true);
  });
});

describe('placementAt', () => {
  it('finds the piece covering a cell', () => {
    const found = placementAt(puzzle.solution, { r: 1, c: 1 });
    expect(found?.slot).toBe(1);
  });
  it('returns null for an empty cell', () => {
    expect(placementAt([], { r: 0, c: 0 })).toBeNull();
  });
});

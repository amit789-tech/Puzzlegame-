import type { Cell } from '../src/engine/types';
import { nextPathStep } from '../src/puzzles/snap/hint';
import type { SnapPuzzle } from '../src/puzzles/snap/types';
import { isPartialValid, validatePath } from '../src/puzzles/snap/validate';

// 3x3 fixture. Solution is the row-serpentine path; waypoints pin it down.
//   1 2 .        path: (0,0)(0,1)(0,2)(1,2)(1,1)(1,0)(2,0)(2,1)(2,2)
//   . 3 .
//   . . 4
const SERPENTINE: Cell[] = [
  { r: 0, c: 0 },
  { r: 0, c: 1 },
  { r: 0, c: 2 },
  { r: 1, c: 2 },
  { r: 1, c: 1 },
  { r: 1, c: 0 },
  { r: 2, c: 0 },
  { r: 2, c: 1 },
  { r: 2, c: 2 },
];

const PUZZLE: SnapPuzzle = {
  id: 'snap-3x3-test',
  type: 'snap',
  level: 1,
  difficulty: 'easy',
  rows: 3,
  cols: 3,
  waypoints: [
    { n: 1, r: 0, c: 0 },
    { n: 2, r: 0, c: 1 },
    { n: 3, r: 1, c: 1 },
    { n: 4, r: 2, c: 2 },
  ],
  solution: SERPENTINE,
};

// Column-serpentine alternative: also a corner-to-corner Hamiltonian path,
// but it reaches waypoint 3 at (1,1) before waypoint 2 at (0,1).
const COLUMN_PATH: Cell[] = [
  { r: 0, c: 0 },
  { r: 1, c: 0 },
  { r: 2, c: 0 },
  { r: 2, c: 1 },
  { r: 1, c: 1 },
  { r: 0, c: 1 },
  { r: 0, c: 2 },
  { r: 1, c: 2 },
  { r: 2, c: 2 },
];

describe('validatePath', () => {
  it('accepts the canonical solution', () => {
    expect(validatePath(PUZZLE, SERPENTINE)).toEqual({ solved: true });
  });

  it('rejects an incomplete path', () => {
    const result = validatePath(PUZZLE, SERPENTINE.slice(0, 8));
    expect(result.solved).toBe(false);
    expect(result.reason).toMatch(/cover/);
  });

  it('rejects a path visiting a cell twice', () => {
    const path = [...SERPENTINE.slice(0, 8), { r: 2, c: 0 }];
    expect(validatePath(PUZZLE, path).solved).toBe(false);
  });

  it('rejects an out-of-bounds cell', () => {
    const path = [...SERPENTINE.slice(0, 8), { r: 2, c: 3 }];
    expect(validatePath(PUZZLE, path).solved).toBe(false);
  });

  it('rejects a non-adjacent step', () => {
    const path: Cell[] = [
      { r: 0, c: 0 },
      { r: 0, c: 1 },
      { r: 0, c: 2 },
      { r: 1, c: 2 },
      { r: 1, c: 1 },
      { r: 2, c: 1 }, // skip ahead, then jump diagonally back
      { r: 1, c: 0 },
      { r: 2, c: 0 },
      { r: 2, c: 2 },
    ];
    expect(validatePath(PUZZLE, path).solved).toBe(false);
  });

  it('rejects a path that does not start at waypoint 1', () => {
    const reversed = [...SERPENTINE].reverse();
    const result = validatePath(PUZZLE, reversed);
    expect(result.solved).toBe(false);
  });

  it('rejects waypoints visited out of order', () => {
    const result = validatePath(PUZZLE, COLUMN_PATH);
    expect(result.solved).toBe(false);
    expect(result.reason).toMatch(/order/);
  });
});

describe('isPartialValid', () => {
  it('accepts the empty path and any solution prefix', () => {
    expect(isPartialValid(PUZZLE, [])).toBe(true);
    for (let len = 1; len <= SERPENTINE.length; len++) {
      expect(isPartialValid(PUZZLE, SERPENTINE.slice(0, len))).toBe(true);
    }
  });

  it('rejects a path starting off waypoint 1', () => {
    expect(isPartialValid(PUZZLE, [{ r: 1, c: 1 }])).toBe(false);
  });

  it('rejects revisiting a cell', () => {
    expect(
      isPartialValid(PUZZLE, [
        { r: 0, c: 0 },
        { r: 0, c: 1 },
        { r: 0, c: 0 },
      ]),
    ).toBe(false);
  });

  it('rejects stepping onto a waypoint out of order', () => {
    // (0,0) -> (1,0) -> (1,1) hits waypoint 3 before waypoint 2.
    expect(
      isPartialValid(PUZZLE, [
        { r: 0, c: 0 },
        { r: 1, c: 0 },
        { r: 1, c: 1 },
      ]),
    ).toBe(false);
  });

  it('rejects a non-adjacent step', () => {
    expect(
      isPartialValid(PUZZLE, [
        { r: 0, c: 0 },
        { r: 0, c: 2 },
      ]),
    ).toBe(false);
  });
});

describe('nextPathStep', () => {
  it('returns the first solution cell for an empty path', () => {
    expect(nextPathStep(PUZZLE, [])).toEqual({ r: 0, c: 0 });
  });

  it('returns the next cell after a correct prefix', () => {
    expect(nextPathStep(PUZZLE, SERPENTINE.slice(0, 4))).toEqual({ r: 1, c: 1 });
  });

  it('returns null when the current path deviates from the solution', () => {
    expect(
      nextPathStep(PUZZLE, [
        { r: 0, c: 0 },
        { r: 1, c: 0 },
      ]),
    ).toBeNull();
  });

  it('returns null when the path is already complete', () => {
    expect(nextPathStep(PUZZLE, SERPENTINE)).toBeNull();
  });
});

import { generatePips } from '../tools/gen-pips';
import { countPipsSolutions } from '../tools/solve-pips';
import { validatePips } from '../src/puzzles/pips/validate';
import type { PipsPuzzle } from '../src/puzzles/pips/types';

describe('countPipsSolutions', () => {
  it('counts the unique solution of a hand-built 1x2', () => {
    // Two single-cell regions pin each value: left must be 2, right must be 5,
    // so the {2,5} domino can only sit one way.
    const inst = {
      cells: [
        { r: 0, c: 0 },
        { r: 0, c: 1 },
      ],
      regions: [
        { cells: [{ r: 0, c: 0 }], kind: 'sum' as const, value: 2, colorIndex: 0 },
        { cells: [{ r: 0, c: 1 }], kind: 'sum' as const, value: 5, colorIndex: 1 },
      ],
      dominoes: [{ a: 2, b: 5 }],
    };
    expect(countPipsSolutions(inst)).toBe(1);
  });

  it('counts both flips of a domino inside one sum region as distinct', () => {
    // A {2,3} domino in a single sum-5 region can sit two ways → 2 grids.
    const inst = {
      cells: [
        { r: 0, c: 0 },
        { r: 0, c: 1 },
      ],
      regions: [
        { cells: [{ r: 0, c: 0 }, { r: 0, c: 1 }], kind: 'sum' as const, value: 5, colorIndex: 0 },
      ],
      dominoes: [{ a: 2, b: 3 }],
    };
    expect(countPipsSolutions(inst)).toBe(2);
  });

  it('reports zero when the tray cannot satisfy the regions', () => {
    const inst = {
      cells: [
        { r: 0, c: 0 },
        { r: 0, c: 1 },
      ],
      regions: [
        { cells: [{ r: 0, c: 0 }, { r: 0, c: 1 }], kind: 'sum' as const, value: 12, colorIndex: 0 },
      ],
      dominoes: [{ a: 1, b: 1 }],
    };
    expect(countPipsSolutions(inst)).toBe(0);
  });
});

describe('generatePips', () => {
  it('produces unique, self-consistent puzzles for each difficulty', () => {
    const cases = [
      { difficulty: 'easy' as const, dominoes: 4, maxRows: 4, maxCols: 4, maxRegion: 3 },
      { difficulty: 'medium' as const, dominoes: 6, maxRows: 5, maxCols: 5, maxRegion: 3 },
    ];
    for (const c of cases) {
      const core = generatePips({ seed: 12345 + c.dominoes, ...c });
      expect(core).not.toBeNull();
      const puzzle = { ...core!, id: 'x', level: 1 } as PipsPuzzle;
      // The stored solution actually solves it.
      expect(validatePips(puzzle, puzzle.solution).solved).toBe(true);
      // And it's the only value-grid that does.
      expect(countPipsSolutions(puzzle)).toBe(1);
      // Tray exactly tiles the board.
      expect(puzzle.dominoes.length * 2).toBe(puzzle.cells.length);
    }
  });
});

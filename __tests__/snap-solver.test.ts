import { mulberry32 } from '../src/engine/rng';
import { validatePath } from '../src/puzzles/snap/validate';
import type { SnapPuzzle } from '../src/puzzles/snap/types';
import { randomHamiltonianPath } from '../tools/backbite';
import { generateSnap } from '../tools/gen-snap';
import { countSnapSolutions } from '../tools/solve-snap';

describe('randomHamiltonianPath (backbite)', () => {
  it.each([
    [4, 4],
    [5, 5],
    [6, 6],
  ])('produces a valid Hamiltonian path on %dx%d', (rows, cols) => {
    const rng = mulberry32(42);
    const path = randomHamiltonianPath(rows, cols, rng);
    expect(path).toHaveLength(rows * cols);
    const seen = new Set(path.map((cell) => `${cell.r},${cell.c}`));
    expect(seen.size).toBe(rows * cols);
    for (let i = 1; i < path.length; i++) {
      const dist =
        Math.abs(path[i].r - path[i - 1].r) + Math.abs(path[i].c - path[i - 1].c);
      expect(dist).toBe(1);
    }
  });
});

describe('countSnapSolutions', () => {
  // On a 3x3 grid there are exactly two corner-to-corner Hamiltonian paths
  // through the center: the row serpentine and the column serpentine.
  it('counts 2 for the under-constrained 3x3 instance', () => {
    const count = countSnapSolutions({
      rows: 3,
      cols: 3,
      waypoints: [
        { n: 1, r: 0, c: 0 },
        { n: 2, r: 1, c: 1 },
        { n: 3, r: 2, c: 2 },
      ],
    });
    expect(count).toBe(2);
  });

  it('counts 1 once an extra waypoint disambiguates the order', () => {
    const count = countSnapSolutions({
      rows: 3,
      cols: 3,
      waypoints: [
        { n: 1, r: 0, c: 0 },
        { n: 2, r: 0, c: 1 },
        { n: 3, r: 1, c: 1 },
        { n: 4, r: 2, c: 2 },
      ],
    });
    expect(count).toBe(1);
  });

  it('counts 0 for an unsatisfiable instance', () => {
    // Checkerboard parity: a 4-cell path must end on the opposite color of
    // its start, but (0,0) and (1,1) share a color, so no Hamiltonian path
    // on 2x2 connects them.
    const count = countSnapSolutions({
      rows: 2,
      cols: 2,
      waypoints: [
        { n: 1, r: 0, c: 0 },
        { n: 2, r: 1, c: 1 },
      ],
    });
    expect(count).toBe(0);
  });
});

describe('generateSnap', () => {
  it('produces a unique, self-consistent puzzle', () => {
    const core = generateSnap({
      rows: 5,
      cols: 5,
      seed: 12345,
      difficulty: 'easy',
      targetWaypoints: 8,
    });
    expect(core).not.toBeNull();
    const puzzle: SnapPuzzle = { ...core!, id: 'snap-test', level: 1 };

    // The stored solution must satisfy its own waypoints.
    expect(validatePath(puzzle, puzzle.solution)).toEqual({ solved: true });

    // Waypoints are 1..N ascending, starting and ending on the path ends.
    puzzle.waypoints.forEach((w, i) => expect(w.n).toBe(i + 1));
    expect(puzzle.solution[0]).toMatchObject({
      r: puzzle.waypoints[0].r,
      c: puzzle.waypoints[0].c,
    });
    const last = puzzle.waypoints[puzzle.waypoints.length - 1];
    expect(puzzle.solution[puzzle.solution.length - 1]).toMatchObject({
      r: last.r,
      c: last.c,
    });

    // And the instance is provably unique.
    expect(countSnapSolutions(puzzle)).toBe(1);
  });

  it('is deterministic for a given seed', () => {
    const opts = {
      rows: 5,
      cols: 5,
      seed: 999,
      difficulty: 'easy' as const,
      targetWaypoints: 8,
    };
    expect(generateSnap(opts)).toEqual(generateSnap(opts));
  });
});

import type { Cell, Difficulty } from '../src/engine/types';
import type { SnapPuzzle, SnapWaypoint } from '../src/puzzles/snap/types';
import { randomHamiltonianPath } from './backbite';
import { mulberry32, randInt, shuffle } from './rng';
import { countSnapSolutions } from './solve-snap';

export interface GenSnapOptions {
  rows: number;
  cols: number;
  seed: number;
  difficulty: Difficulty;
  /** Aim for this many numbered cells (fewer = harder). Always >= 2. */
  targetWaypoints: number;
  maxAttempts?: number;
}

/**
 * Builds one uniqueness-checked Snap puzzle: a random Hamiltonian path plus
 * the smallest waypoint set (around targetWaypoints) that still pins the
 * path down to exactly one solution. Returns null if no unique puzzle was
 * found within maxAttempts paths.
 */
export function generateSnap(
  opts: GenSnapOptions,
): Omit<SnapPuzzle, 'id' | 'level'> | null {
  const { rows, cols, seed, difficulty, targetWaypoints } = opts;
  const maxAttempts = opts.maxAttempts ?? 12;
  const rng = mulberry32(seed);
  const total = rows * cols;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const path = randomHamiltonianPath(rows, cols, rng);

    // Start dense: endpoints plus every 3rd path cell, then thin out while
    // the solution stays unique.
    const wpPositions = new Set<number>([0, total - 1]);
    for (let i = 3; i < total - 1; i += 3) wpPositions.add(i);

    const instance = (positions: Set<number>) => {
      const sorted = [...positions].sort((a, b) => a - b);
      const waypoints: SnapWaypoint[] = sorted.map((pos, i) => ({
        n: i + 1,
        r: path[pos].r,
        c: path[pos].c,
      }));
      return { rows, cols, waypoints };
    };

    if (countSnapSolutions(instance(wpPositions)) !== 1) continue;

    // Greedy minimization: drop random interior waypoints while uniqueness
    // holds, until we reach the target count or nothing can be removed.
    let interior = [...wpPositions].filter((p) => p !== 0 && p !== total - 1);
    shuffle(rng, interior);
    for (const pos of interior) {
      if (wpPositions.size <= targetWaypoints) break;
      wpPositions.delete(pos);
      if (countSnapSolutions(instance(wpPositions)) !== 1) {
        wpPositions.add(pos); // removal broke uniqueness — keep it
      }
    }

    const { waypoints } = instance(wpPositions);
    const solution: Cell[] = path.map((cell) => ({ r: cell.r, c: cell.c }));
    return { type: 'snap', difficulty, rows, cols, waypoints, solution };
  }

  return null;
}

/** Stable content hash for deduping puzzles inside a bank. */
export function snapContentKey(p: { waypoints: SnapWaypoint[]; rows: number; cols: number }): string {
  return `${p.rows}x${p.cols}|${p.waypoints.map((w) => `${w.n}:${w.r},${w.c}`).join(';')}`;
}

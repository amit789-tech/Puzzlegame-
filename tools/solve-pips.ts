import { cellKey } from '../src/engine/grid';
import type { Cell } from '../src/engine/types';
import { regionStillPossible, regionSatisfied } from '../src/puzzles/pips/validate';
import type { Domino, PipsRegion } from '../src/puzzles/pips/types';

export interface PipsInstance {
  cells: Cell[];
  regions: PipsRegion[];
  dominoes: Domino[];
}

/**
 * Counts the distinct *value grids* that solve the instance, stopping at
 * `cap`. Two different domino tilings that paint the cells with identical
 * pip values count as one solution (the player only ever sees the values).
 * Returns -1 if the search budget is exhausted before settling.
 */
export function countPipsSolutions(inst: PipsInstance, cap = 2, nodeBudget = 3_000_000): number {
  const { cells, regions, dominoes } = inst;
  const n = cells.length;
  if (n === 0 || n % 2 !== 0) return 0;
  if (dominoes.length * 2 !== n) return 0;

  // Index cells and build orthogonal adjacency over board cells only.
  const indexOf = new Map<string, number>();
  cells.forEach((c, i) => indexOf.set(cellKey(c), i));
  const neighbors: number[][] = cells.map((c) => {
    const out: number[] = [];
    for (const [dr, dc] of [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ]) {
      const j = indexOf.get(cellKey({ r: c.r + dr, c: c.c + dc }));
      if (j !== undefined) out.push(j);
    }
    return out;
  });

  // Region membership per cell + each region's member indices.
  const regionOf = new Int32Array(n).fill(-1);
  const regionCells: number[][] = regions.map((region, ri) => {
    const list: number[] = [];
    for (const c of region.cells) {
      const idx = indexOf.get(cellKey(c));
      if (idx !== undefined) {
        regionOf[idx] = ri;
        list.push(idx);
      }
    }
    return list;
  });

  // Tray as a multiset of unordered piece types with counts.
  const typeKey = (a: number, b: number) => (a <= b ? `${a}-${b}` : `${b}-${a}`);
  const counts = new Map<string, number>();
  const pieces: { lo: number; hi: number }[] = [];
  for (const d of dominoes) {
    const lo = Math.min(d.a, d.b);
    const hi = Math.max(d.a, d.b);
    const k = typeKey(lo, hi);
    if (!counts.has(k)) {
      counts.set(k, 0);
      pieces.push({ lo, hi });
    }
    counts.set(k, counts.get(k)! + 1);
  }

  const values = new Int8Array(n).fill(-1);
  const grids = new Set<string>();
  let nodes = 0;
  let aborted = false;

  // Does region `ri` still permit a solution given current values?
  const regionOk = (ri: number): boolean => {
    if (ri < 0) return true;
    const placed: number[] = [];
    let empty = 0;
    for (const idx of regionCells[ri]) {
      if (values[idx] === -1) empty++;
      else placed.push(values[idx]);
    }
    if (empty === 0) return regionSatisfied(regions[ri], placed);
    return regionStillPossible(regions[ri], placed, empty);
  };

  function firstEmpty(): number {
    for (let i = 0; i < n; i++) if (values[i] === -1) return i;
    return -1;
  }

  function dfs(): void {
    if (aborted || grids.size >= cap) return;
    if (++nodes > nodeBudget) {
      aborted = true;
      return;
    }
    const i = firstEmpty();
    if (i === -1) {
      grids.add(values.join(','));
      return;
    }
    for (const piece of pieces) {
      const k = typeKey(piece.lo, piece.hi);
      if ((counts.get(k) ?? 0) === 0) continue;
      for (const j of neighbors[i]) {
        if (values[j] !== -1) continue;
        // Two value orientations (one if it's a double).
        const orients: [number, number][] =
          piece.lo === piece.hi
            ? [[piece.lo, piece.hi]]
            : [
                [piece.lo, piece.hi],
                [piece.hi, piece.lo],
              ];
        for (const [vi, vj] of orients) {
          values[i] = vi;
          values[j] = vj;
          counts.set(k, counts.get(k)! - 1);
          if (regionOk(regionOf[i]) && regionOk(regionOf[j])) dfs();
          counts.set(k, counts.get(k)! + 1);
          values[i] = -1;
          values[j] = -1;
          if (aborted || grids.size >= cap) return;
        }
      }
    }
  }

  dfs();
  return aborted ? -1 : grids.size;
}

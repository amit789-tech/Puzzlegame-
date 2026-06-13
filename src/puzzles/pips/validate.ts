import { cellKey } from '../../engine/grid';
import type { Cell, ValidationResult } from '../../engine/types';
import type { Domino, PipsPuzzle, PipsRegion, Placement } from './types';

/** Map of cellKey -> pip value, derived from the current placements. */
export function valueGrid(dominoes: Domino[], placements: Placement[]): Map<string, number> {
  const grid = new Map<string, number>();
  for (const p of placements) {
    const d = dominoes[p.slot];
    if (!d) continue;
    grid.set(cellKey(p.a), d.a);
    grid.set(cellKey(p.b), d.b);
  }
  return grid;
}

/** Whether a fully-filled region satisfies its constraint. */
export function regionSatisfied(region: PipsRegion, values: number[]): boolean {
  switch (region.kind) {
    case 'sum':
      return values.reduce((s, v) => s + v, 0) === region.value;
    case 'gt':
      return values.reduce((s, v) => s + v, 0) > (region.value ?? 0);
    case 'lt':
      return values.reduce((s, v) => s + v, 0) < (region.value ?? 0);
    case 'eq':
      return values.every((v) => v === values[0]);
    case 'neq':
      return new Set(values).size === values.length;
    case 'none':
      return true;
  }
}

/**
 * A partially-filled region can already be doomed before it's complete — e.g.
 * a 'sum' region whose placed pips already exceed the target, or an 'eq'
 * region with two different values. Returns false when the region can no
 * longer be satisfied no matter what fills the remaining cells.
 */
export function regionStillPossible(
  region: PipsRegion,
  placedValues: number[],
  emptyCount: number,
): boolean {
  const sum = placedValues.reduce((s, v) => s + v, 0);
  switch (region.kind) {
    case 'sum': {
      const target = region.value ?? 0;
      // Remaining cells add 0..6 each.
      return sum <= target && sum + emptyCount * 6 >= target;
    }
    case 'lt':
      // Strictly less; remaining add >= 0, so current sum must stay under it.
      return sum < (region.value ?? 0);
    case 'gt':
      return sum + emptyCount * 6 > (region.value ?? 0);
    case 'eq':
      return placedValues.every((v) => v === placedValues[0]);
    case 'neq':
      return new Set(placedValues).size === placedValues.length;
    case 'none':
      return true;
  }
}

/** Full validation: board completely covered and every region satisfied. */
export function validatePips(puzzle: PipsPuzzle, placements: Placement[]): ValidationResult {
  const boardKeys = new Set(puzzle.cells.map(cellKey));
  const covered = new Set<string>();

  for (const p of placements) {
    const ka = cellKey(p.a);
    const kb = cellKey(p.b);
    if (!boardKeys.has(ka) || !boardKeys.has(kb)) {
      return { solved: false, reason: 'piece off the board' };
    }
    if (Math.abs(p.a.r - p.b.r) + Math.abs(p.a.c - p.b.c) !== 1) {
      return { solved: false, reason: 'piece cells not adjacent' };
    }
    if (covered.has(ka) || covered.has(kb)) {
      return { solved: false, reason: 'pieces overlap' };
    }
    covered.add(ka);
    covered.add(kb);
  }

  if (covered.size !== boardKeys.size) {
    return { solved: false, reason: 'board not fully covered' };
  }

  const grid = valueGrid(puzzle.dominoes, placements);
  for (const region of puzzle.regions) {
    const values = region.cells.map((c) => grid.get(cellKey(c)) ?? 0);
    if (!regionSatisfied(region, values)) {
      return { solved: false, reason: 'a region condition is not met' };
    }
  }
  return { solved: true };
}

/**
 * Lightweight check used for live feedback while placing: no overlaps, every
 * piece on the board and adjacent, and no region already impossible.
 */
export function isPartialValid(puzzle: PipsPuzzle, placements: Placement[]): boolean {
  const boardKeys = new Set(puzzle.cells.map(cellKey));
  const covered = new Set<string>();
  for (const p of placements) {
    const ka = cellKey(p.a);
    const kb = cellKey(p.b);
    if (!boardKeys.has(ka) || !boardKeys.has(kb)) return false;
    if (Math.abs(p.a.r - p.b.r) + Math.abs(p.a.c - p.b.c) !== 1) return false;
    if (covered.has(ka) || covered.has(kb)) return false;
    covered.add(ka);
    covered.add(kb);
  }

  const grid = valueGrid(puzzle.dominoes, placements);
  for (const region of puzzle.regions) {
    const placed: number[] = [];
    let empty = 0;
    for (const c of region.cells) {
      const v = grid.get(cellKey(c));
      if (v === undefined) empty++;
      else placed.push(v);
    }
    if (!regionStillPossible(region, placed, empty)) return false;
  }
  return true;
}

/** Cell currently occupied by a placement, if any (for tap-to-remove). */
export function placementAt(placements: Placement[], cell: Cell): Placement | null {
  return (
    placements.find(
      (p) =>
        (p.a.r === cell.r && p.a.c === cell.c) || (p.b.r === cell.r && p.b.c === cell.c),
    ) ?? null
  );
}

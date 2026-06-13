import type { Cell } from '../../engine/types';
import type { PipsPuzzle, PipsRegion } from '../../puzzles/pips/types';

/** Dot layout (unit square fractions) for a domino/dice face value 0..6. */
export const DOT_LAYOUT: Record<number, [number, number][]> = {
  0: [],
  1: [[0.5, 0.5]],
  2: [
    [0.3, 0.3],
    [0.7, 0.7],
  ],
  3: [
    [0.3, 0.3],
    [0.5, 0.5],
    [0.7, 0.7],
  ],
  4: [
    [0.3, 0.3],
    [0.7, 0.3],
    [0.3, 0.7],
    [0.7, 0.7],
  ],
  5: [
    [0.3, 0.3],
    [0.7, 0.3],
    [0.5, 0.5],
    [0.3, 0.7],
    [0.7, 0.7],
  ],
  6: [
    [0.3, 0.28],
    [0.7, 0.28],
    [0.3, 0.5],
    [0.7, 0.5],
    [0.3, 0.72],
    [0.7, 0.72],
  ],
};

/** Pixel centers of the pips for `value` inside the cell at (r,c). */
export function dotCenters(value: number, r: number, c: number, cell: number): [number, number][] {
  return (DOT_LAYOUT[value] ?? []).map(([fx, fy]) => [
    (c + fx) * cell,
    (r + fy) * cell,
  ]);
}

/** The label drawn in a region's constraint badge ('' when there's no rule). */
export function badgeLabel(region: PipsRegion): string {
  switch (region.kind) {
    case 'sum':
      return String(region.value ?? 0);
    case 'gt':
      return `>${region.value ?? 0}`;
    case 'lt':
      return `<${region.value ?? 0}`;
    case 'eq':
      return '=';
    case 'neq':
      return '≠';
    case 'none':
      return '';
  }
}

/**
 * Grid-corner vertex (in cell units) where a region's badge should sit: the
 * corner touched by the most of the region's cells, biased toward the
 * region's centroid so it lands inside the shape.
 */
export function badgeVertex(region: PipsRegion): { vr: number; vc: number } {
  const cellSet = new Set(region.cells.map((c) => `${c.r},${c.c}`));
  const cr = region.cells.reduce((s, c) => s + c.r + 0.5, 0) / region.cells.length;
  const cc = region.cells.reduce((s, c) => s + c.c + 0.5, 0) / region.cells.length;

  const score = new Map<string, { vr: number; vc: number; count: number; dist: number }>();
  for (const c of region.cells) {
    for (const [vr, vc] of [
      [c.r, c.c],
      [c.r, c.c + 1],
      [c.r + 1, c.c],
      [c.r + 1, c.c + 1],
    ]) {
      const key = `${vr},${vc}`;
      // How many of the region's cells touch this vertex.
      let count = 0;
      for (const [dr, dc] of [
        [-1, -1],
        [-1, 0],
        [0, -1],
        [0, 0],
      ]) {
        if (cellSet.has(`${vr + dr},${vc + dc}`)) count++;
      }
      const dist = Math.hypot(vr - cr, vc - cc);
      const existing = score.get(key);
      if (!existing || count > existing.count || (count === existing.count && dist < existing.dist)) {
        score.set(key, { vr, vc, count, dist });
      }
    }
  }

  let best: { vr: number; vc: number; count: number; dist: number } | null = null;
  for (const v of score.values()) {
    if (!best || v.count > best.count || (v.count === best.count && v.dist < best.dist)) best = v;
  }
  return best ? { vr: best.vr, vc: best.vc } : { vr: 0, vc: 0 };
}

/** Lookup map: cell key -> region index. */
export function regionIndexByCell(puzzle: PipsPuzzle): Map<string, number> {
  const map = new Map<string, number>();
  puzzle.regions.forEach((region, i) => {
    for (const c of region.cells) map.set(`${c.r},${c.c}`, i);
  });
  return map;
}

export function cellKeySet(cells: Cell[]): Set<string> {
  return new Set(cells.map((c) => `${c.r},${c.c}`));
}

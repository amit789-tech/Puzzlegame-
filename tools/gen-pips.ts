import { cellKey } from '../src/engine/grid';
import type { Cell, Difficulty } from '../src/engine/types';
import type { Domino, PipsConstraintKind, PipsPuzzle, PipsRegion, Placement } from '../src/puzzles/pips/types';
import { mulberry32, pick, randInt, shuffle, type Rng } from './rng';
import { countPipsSolutions } from './solve-pips';

const ORTHO: readonly [number, number][] = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];

interface TileDomino {
  a: Cell;
  b: Cell;
}

/**
 * Builds a connected board as a set of dominoes (so a perfect tiling is
 * guaranteed to exist — it's the one we just built). Grows from a seed
 * domino by repeatedly attaching a new domino to the frontier.
 */
function buildTiling(rng: Rng, target: number, maxRows: number, maxCols: number): TileDomino[] {
  const occupied = new Set<string>();
  const tiles: TileDomino[] = [];
  const inBounds = (c: Cell) => c.r >= 0 && c.r < maxRows && c.c >= 0 && c.c < maxCols;

  const start: Cell = { r: (maxRows >> 1), c: Math.max(0, (maxCols >> 1) - 1) };
  const startB: Cell = { r: start.r, c: start.c + 1 };
  tiles.push({ a: start, b: startB });
  occupied.add(cellKey(start));
  occupied.add(cellKey(startB));

  let guard = 0;
  while (tiles.length < target && guard++ < 5000) {
    // Frontier: empty cells adjacent to the occupied region.
    const frontier: Cell[] = [];
    for (const key of occupied) {
      const [r, c] = key.split(',').map(Number);
      for (const [dr, dc] of ORTHO) {
        const nc = { r: r + dr, c: c + dc };
        if (inBounds(nc) && !occupied.has(cellKey(nc))) frontier.push(nc);
      }
    }
    if (frontier.length === 0) break;
    const first = pick(rng, frontier);
    // A free neighbor of `first` to complete the new domino.
    const partners = ORTHO.map(([dr, dc]) => ({ r: first.r + dr, c: first.c + dc })).filter(
      (c) => inBounds(c) && !occupied.has(cellKey(c)),
    );
    if (partners.length === 0) continue;
    const second = pick(rng, partners);
    tiles.push({ a: first, b: second });
    occupied.add(cellKey(first));
    occupied.add(cellKey(second));
  }
  return tiles;
}

/** Partition the board cells into connected regions of size 1..maxSize. */
function partition(cells: Cell[], rng: Rng, maxSize: number): Cell[][] {
  const keys = new Set(cells.map(cellKey));
  const unassigned = new Set(cells.map(cellKey));
  const regions: Cell[][] = [];

  const order = shuffle(rng, [...cells]);
  for (const seed of order) {
    if (!unassigned.has(cellKey(seed))) continue;
    const size = 1 + randInt(rng, maxSize);
    const region: Cell[] = [];
    const queue: Cell[] = [seed];
    unassigned.delete(cellKey(seed));
    while (queue.length > 0 && region.length < size) {
      const cur = queue.shift()!;
      region.push(cur);
      const grow = shuffle(
        rng,
        ORTHO.map(([dr, dc]) => ({ r: cur.r + dr, c: cur.c + dc })).filter(
          (c) => keys.has(cellKey(c)) && unassigned.has(cellKey(c)),
        ),
      );
      for (const g of grow) {
        if (region.length + queue.length >= size) break;
        unassigned.delete(cellKey(g));
        queue.push(g);
      }
    }
    regions.push(region);
  }
  return regions;
}

/** Pick a constraint for a region that the solution satisfies. */
function chooseConstraint(
  values: number[],
  rng: Rng,
  allowLoose: boolean,
): { kind: PipsConstraintKind; value?: number } {
  const sum = values.reduce((s, v) => s + v, 0);
  const allEqual = values.every((v) => v === values[0]);
  const allDistinct = new Set(values).size === values.length;

  if (!allowLoose) return { kind: 'sum', value: sum };

  const options: { kind: PipsConstraintKind; value?: number; weight: number }[] = [
    { kind: 'sum', value: sum, weight: 6 },
  ];
  if (values.length >= 2 && allEqual) options.push({ kind: 'eq', weight: 3 });
  if (values.length >= 2 && allDistinct) options.push({ kind: 'neq', weight: 2 });
  if (sum >= 1) options.push({ kind: 'gt', value: sum - 1, weight: 2 });
  options.push({ kind: 'lt', value: sum + 1, weight: 2 });

  const totalWeight = options.reduce((s, o) => s + o.weight, 0);
  let roll = rng() * totalWeight;
  for (const o of options) {
    roll -= o.weight;
    if (roll <= 0) return { kind: o.kind, value: o.value };
  }
  return { kind: 'sum', value: sum };
}

export interface GenPipsOptions {
  seed: number;
  difficulty: Difficulty;
  dominoes: number;
  maxRows: number;
  maxCols: number;
  maxRegion: number;
  maxAttempts?: number;
}

export function generatePips(opts: GenPipsOptions): Omit<PipsPuzzle, 'id' | 'level'> | null {
  const { seed, difficulty, dominoes: target, maxRows, maxCols, maxRegion } = opts;
  const maxAttempts = opts.maxAttempts ?? 60;
  const rng = mulberry32(seed);

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const tiles = buildTiling(rng, target, maxRows, maxCols);
    if (tiles.length !== target) continue;

    // Normalize coordinates so the bounding box starts at (0,0).
    const allCells = tiles.flatMap((t) => [t.a, t.b]);
    const minR = Math.min(...allCells.map((c) => c.r));
    const minC = Math.min(...allCells.map((c) => c.c));
    const norm = (c: Cell): Cell => ({ r: c.r - minR, c: c.c - minC });
    const tilesN = tiles.map((t) => ({ a: norm(t.a), b: norm(t.b) }));
    const cells = tilesN.flatMap((t) => [t.a, t.b]);
    const rows = Math.max(...cells.map((c) => c.r)) + 1;
    const cols = Math.max(...cells.map((c) => c.c)) + 1;

    // Assign pip values to each tiling domino → the tray + the solution.
    const dominoes: Domino[] = tilesN.map(() => ({ a: randInt(rng, 7), b: randInt(rng, 7) }));
    const solution: Placement[] = tilesN.map((t, i) => ({ slot: i, a: t.a, b: t.b }));
    const valueAt = new Map<string, number>();
    tilesN.forEach((t, i) => {
      valueAt.set(cellKey(t.a), dominoes[i].a);
      valueAt.set(cellKey(t.b), dominoes[i].b);
    });

    // A few partitions × constraint mixes per tiling before giving up on it.
    for (let pAttempt = 0; pAttempt < 8; pAttempt++) {
      const groups = partition(cells, rng, maxRegion);
      const allowLoose = pAttempt < 6; // last tries are all-'sum' (tightest)

      const regions: PipsRegion[] = groups.map((group, gi) => {
        const values = group.map((c) => valueAt.get(cellKey(c))!);
        const { kind, value } = chooseConstraint(values, rng, allowLoose);
        return { cells: group, kind, value, colorIndex: gi };
      });

      const solutions = countPipsSolutions({ cells, regions, dominoes });
      if (solutions === 1) {
        return { type: 'pips', difficulty, rows, cols, cells, regions, dominoes, solution };
      }
    }
  }
  return null;
}

/** Stable content hash for deduping puzzles inside a bank. */
export function pipsContentKey(p: { regions: PipsRegion[]; dominoes: Domino[] }): string {
  const regions = p.regions
    .map((r) => {
      const cells = [...r.cells].sort((a, b) => a.r - b.r || a.c - b.c).map(cellKey).join('|');
      return `${r.kind}${r.value ?? ''}@${cells}`;
    })
    .sort()
    .join(';');
  const tray = [...p.dominoes]
    .map((d) => (d.a <= d.b ? `${d.a}-${d.b}` : `${d.b}-${d.a}`))
    .sort()
    .join(',');
  return `${regions}#${tray}`;
}

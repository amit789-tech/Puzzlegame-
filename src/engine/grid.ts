import type { Cell } from './types';

export function inBounds(r: number, c: number, rows: number, cols: number): boolean {
  return r >= 0 && r < rows && c >= 0 && c < cols;
}

export function cellsEqual(a: Cell, b: Cell): boolean {
  return a.r === b.r && a.c === b.c;
}

export function cellKey(cell: Cell): string {
  return `${cell.r},${cell.c}`;
}

/** True when a and b share an edge (orthogonal neighbors). */
export function isAdjacent(a: Cell, b: Cell): boolean {
  return Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1;
}

/** Row-major index of a cell. */
export function cellIndex(cell: Cell, cols: number): number {
  return cell.r * cols + cell.c;
}

/** Cell at a row-major index. */
export function cellAt(index: number, cols: number): Cell {
  return { r: Math.floor(index / cols), c: index % cols };
}

const ORTHO: ReadonlyArray<readonly [number, number]> = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];

export function neighbors(cell: Cell, rows: number, cols: number): Cell[] {
  const out: Cell[] = [];
  for (const [dr, dc] of ORTHO) {
    const r = cell.r + dr;
    const c = cell.c + dc;
    if (inBounds(r, c, rows, cols)) out.push({ r, c });
  }
  return out;
}

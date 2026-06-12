import type { ShikakuClue } from '../src/puzzles/shikaku/types';

export interface ShikakuInstance {
  rows: number;
  cols: number;
  clues: ShikakuClue[];
}

interface Candidate {
  r: number;
  c: number;
  w: number;
  h: number;
  cells: number[]; // row-major indices covered
}

/**
 * Exact-cover style solution counter. For every clue it enumerates each
 * in-bounds rect of the clue's area that contains the clue and no other
 * clue, then backtracks over clues (most-constrained first), stopping at
 * `cap`. Returns -1 if the node budget runs out before the count settles.
 */
export function countShikakuSolutions(
  inst: ShikakuInstance,
  cap = 2,
  nodeBudget = 2_000_000,
): number {
  const { rows, cols, clues } = inst;
  const total = rows * cols;

  const clueAt = new Uint8Array(total);
  for (const clue of clues) clueAt[clue.r * cols + clue.c] = 1;

  // All legal rects per clue.
  const candidates: Candidate[][] = clues.map((clue) => {
    const list: Candidate[] = [];
    for (let w = 1; w <= clue.value; w++) {
      if (clue.value % w !== 0) continue;
      const h = clue.value / w;
      if (w > cols || h > rows) continue;
      for (let r = clue.r - h + 1; r <= clue.r; r++) {
        if (r < 0 || r + h > rows) continue;
        for (let c = clue.c - w + 1; c <= clue.c; c++) {
          if (c < 0 || c + w > cols) continue;
          const cells: number[] = [];
          let otherClue = false;
          for (let rr = r; rr < r + h && !otherClue; rr++) {
            for (let cc = c; cc < c + w; cc++) {
              const idx = rr * cols + cc;
              if (clueAt[idx] && !(rr === clue.r && cc === clue.c)) {
                otherClue = true;
                break;
              }
              cells.push(idx);
            }
          }
          if (!otherClue) list.push({ r, c, w, h, cells });
        }
      }
    }
    return list;
  });

  if (candidates.some((list) => list.length === 0)) return 0;
  const totalClueArea = clues.reduce((sum, clue) => sum + clue.value, 0);
  if (totalClueArea !== total) return 0; // cannot tile

  const covered = new Uint8Array(total);
  const assigned = new Uint8Array(clues.length);
  let nodes = 0;
  let count = 0;
  let aborted = false;

  const fits = (cand: Candidate): boolean => {
    for (const cell of cand.cells) if (covered[cell]) return false;
    return true;
  };

  function dfs(remaining: number): void {
    if (aborted || count >= cap) return;
    if (++nodes > nodeBudget) {
      aborted = true;
      return;
    }
    if (remaining === 0) {
      count++;
      return;
    }

    // Most-constrained clue first.
    let best = -1;
    let bestList: Candidate[] | null = null;
    for (let i = 0; i < clues.length; i++) {
      if (assigned[i]) continue;
      const usable = candidates[i].filter(fits);
      if (usable.length === 0) return; // dead end
      if (bestList === null || usable.length < bestList.length) {
        best = i;
        bestList = usable;
        if (usable.length === 1) break;
      }
    }
    if (best === -1 || bestList === null) return;

    assigned[best] = 1;
    for (const cand of bestList) {
      if (!fits(cand)) continue;
      for (const cell of cand.cells) covered[cell] = 1;
      dfs(remaining - 1);
      for (const cell of cand.cells) covered[cell] = 0;
      if (aborted || count >= cap) break;
    }
    assigned[best] = 0;
  }

  dfs(clues.length);
  return aborted ? -1 : count;
}

import type { SnapWaypoint } from '../src/puzzles/snap/types';

export interface SnapInstance {
  rows: number;
  cols: number;
  waypoints: SnapWaypoint[]; // sorted by n
}

/**
 * Counts Hamiltonian paths that satisfy the waypoint-order constraints,
 * stopping early at `cap` (uniqueness only needs to distinguish 1 from 2+).
 * Returns -1 if the node budget is exhausted before the count is settled —
 * callers must treat that as "not proven unique".
 */
export function countSnapSolutions(
  inst: SnapInstance,
  cap = 2,
  nodeBudget = 4_000_000,
): number {
  const { rows, cols } = inst;
  const total = rows * cols;

  const waypointAt = new Int16Array(total).fill(0); // 0 = none, else n
  for (const w of inst.waypoints) waypointAt[w.r * cols + w.c] = w.n;
  const lastN = inst.waypoints.length;
  const start = inst.waypoints[0].r * cols + inst.waypoints[0].c;
  const target = inst.waypoints[lastN - 1].r * cols + inst.waypoints[lastN - 1].c;

  // Precomputed orthogonal neighbor lists per cell.
  const neighborsOf: number[][] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const list: number[] = [];
      if (r > 0) list.push((r - 1) * cols + c);
      if (r < rows - 1) list.push((r + 1) * cols + c);
      if (c > 0) list.push(r * cols + c - 1);
      if (c < cols - 1) list.push(r * cols + c + 1);
      neighborsOf.push(list);
    }
  }

  const visited = new Uint8Array(total);
  const floodSeen = new Int32Array(total).fill(-1);
  const floodStack = new Int32Array(total);
  let floodTag = 0;
  let nodes = 0;
  let count = 0;
  let aborted = false;

  /**
   * Prune: every unvisited cell must be reachable from `cur` through
   * unvisited cells, and no unvisited non-target cell may have fewer than 2
   * connections (an interior cell of the remaining path needs an entry and
   * an exit; only the target may be a dead end).
   */
  function feasible(cur: number, visitedCount: number): boolean {
    const remaining = total - visitedCount;
    if (remaining === 0) return true;

    floodTag++;
    let top = 0;
    let reached = 0;
    for (const nb of neighborsOf[cur]) {
      if (!visited[nb] && floodSeen[nb] !== floodTag) {
        floodSeen[nb] = floodTag;
        floodStack[top++] = nb;
        reached++;
      }
    }
    if (reached === 0) return false;
    while (top > 0) {
      const cell = floodStack[--top];
      for (const nb of neighborsOf[cell]) {
        if (!visited[nb] && floodSeen[nb] !== floodTag) {
          floodSeen[nb] = floodTag;
          floodStack[top++] = nb;
          reached++;
        }
      }
    }
    if (reached !== remaining) return false;

    if (remaining > 2) {
      for (let cell = 0; cell < total; cell++) {
        if (visited[cell] || cell === target) continue;
        let deg = 0;
        for (const nb of neighborsOf[cell]) {
          if (!visited[nb] || nb === cur) deg++;
        }
        if (deg < 2) return false;
      }
    }
    return true;
  }

  function dfs(cur: number, visitedCount: number, expected: number): void {
    if (aborted || count >= cap) return;
    if (++nodes > nodeBudget) {
      aborted = true;
      return;
    }
    if (visitedCount === total) {
      if (cur === target && expected === lastN + 1) count++;
      return;
    }
    if (!feasible(cur, visitedCount)) return;

    for (const nb of neighborsOf[cur]) {
      if (visited[nb]) continue;
      const n = waypointAt[nb];
      if (n !== 0 && n !== expected) continue;
      // The final waypoint must be the last cell of the path.
      if (nb === target && visitedCount + 1 !== total) continue;
      visited[nb] = 1;
      dfs(nb, visitedCount + 1, n !== 0 ? expected + 1 : expected);
      visited[nb] = 0;
      if (aborted || count >= cap) return;
    }
  }

  visited[start] = 1;
  // Starting cell is waypoint 1 by construction.
  dfs(start, 1, 2);

  return aborted ? -1 : count;
}

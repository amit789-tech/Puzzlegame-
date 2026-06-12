import type { Cell } from '../src/engine/types';
import { randInt, type Rng } from './rng';

/**
 * Random Hamiltonian path on a rows×cols grid via the backbite algorithm:
 * start from a serpentine path, then repeatedly pick an endpoint, jump to a
 * non-path-adjacent grid neighbor that is already on the path, and reverse
 * the loop this creates. Converges to a uniformly-ish random Hamiltonian
 * path.
 */
export function randomHamiltonianPath(rows: number, cols: number, rng: Rng): Cell[] {
  // Serpentine start: row 0 left→right, row 1 right→left, ...
  let path: Cell[] = [];
  for (let r = 0; r < rows; r++) {
    for (let i = 0; i < cols; i++) {
      const c = r % 2 === 0 ? i : cols - 1 - i;
      path.push({ r, c });
    }
  }

  const total = rows * cols;
  const posOf = new Array<number>(total); // cell index -> position in path
  const sync = () => {
    for (let i = 0; i < path.length; i++) posOf[path[i].r * cols + path[i].c] = i;
  };
  sync();

  const iterations = 12 * total * Math.max(1, Math.round(Math.log2(total)));
  for (let it = 0; it < iterations; it++) {
    // Work on a random endpoint; reverse the whole path to always treat the
    // head as the active end.
    if (randInt(rng, 2) === 1) {
      path.reverse();
      sync();
    }
    const head = path[0];
    // Grid neighbors of the head that are not its path successor.
    const options: number[] = [];
    const tryAdd = (r: number, c: number) => {
      if (r < 0 || r >= rows || c < 0 || c >= cols) return;
      const pos = posOf[r * cols + c];
      if (pos >= 2) options.push(pos);
    };
    tryAdd(head.r - 1, head.c);
    tryAdd(head.r + 1, head.c);
    tryAdd(head.r, head.c - 1);
    tryAdd(head.r, head.c + 1);
    if (options.length === 0) continue;

    const i = options[randInt(rng, options.length)];
    // New path: reverse(path[0..i-1]) + path[i..]; the head's new neighbor
    // is path[i], which is a grid neighbor, so the path stays valid.
    const prefix = path.slice(0, i).reverse();
    path = prefix.concat(path.slice(i));
    sync();
  }

  return path;
}

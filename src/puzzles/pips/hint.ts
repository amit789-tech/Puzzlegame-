import { cellKey } from '../../engine/grid';
import type { PipsPuzzle, Placement } from './types';

/**
 * Returns one correct domino placement from the solution that isn't yet
 * placed correctly, along with the list of currently-placed pieces that
 * occupy its cells (and must be removed first). Returns null when the board
 * already matches the solution everywhere a hint could help.
 */
export function revealOnePlacement(
  puzzle: PipsPuzzle,
  placements: Placement[],
): { add: Placement; remove: Placement[] } | null {
  const occupant = new Map<string, Placement>();
  for (const p of placements) {
    occupant.set(cellKey(p.a), p);
    occupant.set(cellKey(p.b), p);
  }

  for (const sol of puzzle.solution) {
    const ka = cellKey(sol.a);
    const kb = cellKey(sol.b);
    const onA = occupant.get(ka);
    const onB = occupant.get(kb);
    // Already correctly placed? (same slot covering the same two cells)
    const correct =
      onA &&
      onA === onB &&
      onA.slot === sol.slot &&
      ((cellKey(onA.a) === ka && cellKey(onA.b) === kb) ||
        (cellKey(onA.a) === kb && cellKey(onA.b) === ka));
    if (correct) continue;

    const remove: Placement[] = [];
    if (onA) remove.push(onA);
    if (onB && onB !== onA) remove.push(onB);
    // Also free the tray slot if that exact domino is placed elsewhere.
    for (const p of placements) {
      if (p.slot === sol.slot && !remove.includes(p)) remove.push(p);
    }
    return { add: { slot: sol.slot, a: sol.a, b: sol.b }, remove };
  }
  return null;
}

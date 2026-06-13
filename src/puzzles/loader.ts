import type { PuzzleType } from '../engine/types';
import pipsBankJson from '../data/pips-bank.json';
import shikakuBankJson from '../data/shikaku-bank.json';
import snapBankJson from '../data/snap-bank.json';
import { addSolvedId, setCurrentPuzzleId } from '../state/progress';
import { incrementSolved } from '../state/stats';
import { recordSolveDay } from '../state/streak';
import type { AnyPuzzle } from './index';
import type { PipsPuzzle } from './pips/types';
import type { ShikakuPuzzle } from './shikaku/types';
import type { SnapPuzzle } from './snap/types';

const snapBank = snapBankJson as unknown as SnapPuzzle[];
const shikakuBank = shikakuBankJson as unknown as ShikakuPuzzle[];
const pipsBank = pipsBankJson as unknown as PipsPuzzle[];

/** Every puzzle across all banks, for id lookups. */
const track: AnyPuzzle[] = [...snapBank, ...shikakuBank, ...pipsBank].sort(
  (a, b) => a.level - b.level,
);

export function getPuzzleById(id: string): AnyPuzzle | null {
  return track.find((p) => p.id === id) ?? null;
}

/**
 * Picks the lowest-level unsolved puzzle with puzzle.level >= level. Passing
 * a mode restricts the search to that mode's puzzles (Snap-only / Shikaku-only
 * tracks); omitting it uses the mixed track. When the bank is exhausted
 * at/above the requested level, falls back to a random hard-tier puzzle from
 * the same pool so play never stops.
 */
export function getNextPuzzle(
  level: number,
  solvedIds: string[],
  mode?: PuzzleType,
): AnyPuzzle {
  const solved = new Set(solvedIds);
  // The mixed track (no mode) alternates Snap + Shikaku only; Pips is a
  // mode-only track with its own level numbering.
  const pool = mode
    ? track.filter((p) => p.type === mode)
    : track.filter((p) => p.type === 'snap' || p.type === 'shikaku');
  const next = pool.find((p) => p.level >= level && !solved.has(p.id));
  if (next) return next;

  console.warn('bank exhausted — regenerate with tools/build-bank.ts');
  const hard = pool.filter((p) => p.difficulty === 'hard');
  const fallback = hard.length > 0 ? hard : pool;
  return fallback[Math.floor(Math.random() * fallback.length)];
}

/** Level of the next puzzle a track would serve — for home-screen display. */
export function peekNextLevel(level: number, solvedIds: string[], mode?: PuzzleType): number {
  return getNextPuzzle(level, solvedIds, mode).level;
}

/**
 * Records a solve: solved-id list, per-mode stats, and the streak/session
 * counters. (Best-time stats are recorded separately by the play screen,
 * which owns the timer.) Returns the updated streak/session for the header.
 */
export function markSolved(
  id: string,
  mode?: PuzzleType,
): { streak: number; session: number } {
  const puzzle = getPuzzleById(id);
  addSolvedId(id);
  setCurrentPuzzleId(null, mode);
  if (puzzle) incrementSolved(puzzle.type);
  return recordSolveDay();
}

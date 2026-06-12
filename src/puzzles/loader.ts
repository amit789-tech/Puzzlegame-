import shikakuBankJson from '../data/shikaku-bank.json';
import snapBankJson from '../data/snap-bank.json';
import { addSolvedId, setCurrentPuzzleId } from '../state/progress';
import { incrementSolved } from '../state/stats';
import { recordSolveDay } from '../state/streak';
import type { AnyPuzzle } from './index';
import type { ShikakuPuzzle } from './shikaku/types';
import type { SnapPuzzle } from './snap/types';

const snapBank = snapBankJson as unknown as SnapPuzzle[];
const shikakuBank = shikakuBankJson as unknown as ShikakuPuzzle[];

/** Both banks merged, ascending by global level (types interleave). */
const track: AnyPuzzle[] = [...snapBank, ...shikakuBank].sort(
  (a, b) => a.level - b.level,
);

export function getPuzzleById(id: string): AnyPuzzle | null {
  return track.find((p) => p.id === id) ?? null;
}

/**
 * Picks the lowest-level unsolved puzzle with puzzle.level >= level. When
 * the bank is exhausted at/above the requested level, falls back to a
 * random hard-tier puzzle so play never stops.
 */
export function getNextPuzzle(level: number, solvedIds: string[]): AnyPuzzle {
  const solved = new Set(solvedIds);
  const next = track.find((p) => p.level >= level && !solved.has(p.id));
  if (next) return next;

  console.warn('bank exhausted — regenerate with tools/build-bank.ts');
  const hard = track.filter((p) => p.difficulty === 'hard');
  const pool = hard.length > 0 ? hard : track;
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Records a solve: solved-id list, per-mode stats, and the streak/session
 * counters. (Best-time stats are recorded separately by the play screen,
 * which owns the timer.) Returns the updated streak/session for the header.
 */
export function markSolved(id: string): { streak: number; session: number } {
  const puzzle = getPuzzleById(id);
  addSolvedId(id);
  setCurrentPuzzleId(null);
  if (puzzle) incrementSolved(puzzle.type);
  return recordSolveDay();
}

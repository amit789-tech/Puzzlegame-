import type { PuzzleType } from '../engine/types';
import { getJSON, getNumber, setJSON, setNumber } from './storage';

export function getSolvedCount(type: PuzzleType): number {
  return getNumber(`stats.solved.${type}`, 0);
}

export function incrementSolved(type: PuzzleType): void {
  setNumber(`stats.solved.${type}`, getSolvedCount(type) + 1);
}

export type BestTimes = Record<string, number>; // "{type}:{rows}x{cols}" -> ms

export function getBestTimes(): BestTimes {
  return getJSON<BestTimes>('stats.bestMs', {});
}

/** Returns true when this time is a new personal best for the grid size. */
export function recordTime(
  type: PuzzleType,
  rows: number,
  cols: number,
  ms: number,
): boolean {
  const key = `${type}:${rows}x${cols}`;
  const best = getBestTimes();
  if (best[key] !== undefined && best[key] <= ms) return false;
  best[key] = ms;
  setJSON('stats.bestMs', best);
  return true;
}

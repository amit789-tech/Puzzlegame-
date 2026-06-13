import type { PuzzleType } from '../engine/types';
import { getJSON, getNumber, getString, setJSON, setNumber, setString, storage } from './storage';

// Progress is tracked per "track": the default mixed track (mode === undefined,
// alternating Snap/Shikaku) plus one dedicated track per mode, so the player
// can play only Snap or only Shikaku and each remembers its own place.
function levelKey(mode?: PuzzleType): string {
  return mode ? `progress.level.${mode}` : 'progress.level';
}
function currentKey(mode?: PuzzleType): string {
  return mode ? `progress.currentPuzzleId.${mode}` : 'progress.currentPuzzleId';
}

export function getLevel(mode?: PuzzleType): number {
  return getNumber(levelKey(mode), 1);
}

export function getSolvedIds(): string[] {
  return getJSON<string[]>('progress.solvedIds', []);
}

export function getCurrentPuzzleId(mode?: PuzzleType): string | null {
  const id = getString(currentKey(mode), '');
  return id === '' ? null : id;
}

export function setCurrentPuzzleId(id: string | null, mode?: PuzzleType): void {
  setString(currentKey(mode), id ?? '');
}

export function addSolvedId(id: string): void {
  const ids = getSolvedIds();
  if (!ids.includes(id)) {
    ids.push(id);
    setJSON('progress.solvedIds', ids);
  }
}

/** Move a track's pointer forward after a solve. */
export function advance(mode?: PuzzleType): void {
  setNumber(levelKey(mode), getLevel(mode) + 1);
  setCurrentPuzzleId(null, mode);
}

/** Full local reset (settings are kept). */
export function resetProgress(): void {
  storage.remove('progress.level');
  storage.remove('progress.solvedIds');
  storage.remove('progress.currentPuzzleId');
  for (const mode of ['snap', 'shikaku'] as const) {
    storage.remove(levelKey(mode));
    storage.remove(currentKey(mode));
  }
  storage.remove('streak.count');
  storage.remove('streak.longest');
  storage.remove('streak.lastSolvedDate');
  storage.remove('session.date');
  storage.remove('session.count');
  storage.remove('stats.solved.snap');
  storage.remove('stats.solved.shikaku');
  storage.remove('stats.bestMs');
  storage.remove('hints.remaining');
  storage.remove('hints.date');
}

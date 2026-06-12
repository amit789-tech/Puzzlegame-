import { getJSON, getNumber, getString, setJSON, setNumber, setString, storage } from './storage';

export function getLevel(): number {
  return getNumber('progress.level', 1);
}

export function getSolvedIds(): string[] {
  return getJSON<string[]>('progress.solvedIds', []);
}

export function getCurrentPuzzleId(): string | null {
  const id = getString('progress.currentPuzzleId', '');
  return id === '' ? null : id;
}

export function setCurrentPuzzleId(id: string | null): void {
  setString('progress.currentPuzzleId', id ?? '');
}

export function addSolvedId(id: string): void {
  const ids = getSolvedIds();
  if (!ids.includes(id)) {
    ids.push(id);
    setJSON('progress.solvedIds', ids);
  }
}

/** Move the global track pointer forward after a solve. */
export function advance(): void {
  setNumber('progress.level', getLevel() + 1);
  setCurrentPuzzleId(null);
}

/** Full local reset (settings are kept). */
export function resetProgress(): void {
  storage.remove('progress.level');
  storage.remove('progress.solvedIds');
  storage.remove('progress.currentPuzzleId');
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

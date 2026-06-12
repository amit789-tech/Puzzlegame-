import { getNumber, getString, setNumber, setString } from './storage';

/** Local date as YYYY-MM-DD (device timezone — streaks are personal days). */
export function localDate(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function yesterdayOf(today: string): string {
  const [y, m, d] = today.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() - 1);
  return localDate(date);
}

export function getStreak(): number {
  return getNumber('streak.count', 0);
}

export function getLongestStreak(): number {
  return getNumber('streak.longest', 0);
}

export function getSessionCount(): number {
  // The session counter only counts for today.
  return getString('session.date', '') === localDate() ? getNumber('session.count', 0) : 0;
}

/**
 * PRD §9 streak rule, applied on every solve:
 * - same day: streak unchanged
 * - solved yesterday: streak + 1
 * - otherwise: streak resets to 1
 * Session: counter resets when the stored session date is not today.
 */
export function recordSolveDay(now = new Date()): { streak: number; session: number } {
  const today = localDate(now);
  const last = getString('streak.lastSolvedDate', '');

  let count = getNumber('streak.count', 0);
  if (last !== today) {
    count = last === yesterdayOf(today) ? count + 1 : 1;
    setNumber('streak.count', count);
    setString('streak.lastSolvedDate', today);
    const longest = getNumber('streak.longest', 0);
    if (count > longest) setNumber('streak.longest', count);
  }

  if (getString('session.date', '') !== today) {
    setString('session.date', today);
    setNumber('session.count', 0);
  }
  const session = getNumber('session.count', 0) + 1;
  setNumber('session.count', session);

  return { streak: count, session };
}

import { getNumber, getString, setNumber, setString } from './storage';
import { localDate } from './streak';

const DAILY_HINTS = 9; // generous: this is a personal, ad-free game

/** The hint pool refills to DAILY_HINTS on the first check of each day. */
export function hintsRemaining(): number {
  const today = localDate();
  if (getString('hints.date', '') !== today) {
    setString('hints.date', today);
    setNumber('hints.remaining', DAILY_HINTS);
    return DAILY_HINTS;
  }
  return getNumber('hints.remaining', DAILY_HINTS);
}

/** Returns false when no hint was available. */
export function consumeHint(): boolean {
  const remaining = hintsRemaining();
  if (remaining <= 0) return false;
  setNumber('hints.remaining', remaining - 1);
  return true;
}

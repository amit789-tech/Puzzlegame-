import { getBool, setBool } from './storage';

export function soundEnabled(): boolean {
  return getBool('settings.sound', true);
}

export function setSoundEnabled(on: boolean): void {
  setBool('settings.sound', on);
}

export function hapticsEnabled(): boolean {
  return getBool('settings.haptics', true);
}

export function setHapticsEnabled(on: boolean): void {
  setBool('settings.haptics', on);
}

/** First-time "how to play" cards, one per mode. */
export function helpSeen(mode: string): boolean {
  return getBool(`help.seen.${mode}`, false);
}

export function markHelpSeen(mode: string): void {
  setBool(`help.seen.${mode}`, true);
}

import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import { soundEnabled } from '../state/settings';

const SOURCES = {
  tap: require('../../assets/sfx/tap.wav'),
  tick: require('../../assets/sfx/tick.wav'),
  place: require('../../assets/sfx/place.wav'),
  success: require('../../assets/sfx/success.wav'),
  error: require('../../assets/sfx/error.wav'),
} as const;

export type SfxName = keyof typeof SOURCES;

const players = new Map<SfxName, AudioPlayer>();

/** Create all players up front so the first tick has no load latency. */
export function preloadSfx(): void {
  for (const name of Object.keys(SOURCES) as SfxName[]) {
    if (!players.has(name)) players.set(name, createAudioPlayer(SOURCES[name]));
  }
}

export function play(name: SfxName): void {
  if (!soundEnabled()) return;
  let player = players.get(name);
  if (!player) {
    player = createAudioPlayer(SOURCES[name]);
    players.set(name, player);
  }
  try {
    player.seekTo(0);
    player.play();
  } catch {
    // Audio must never crash gameplay.
  }
}

/**
 * Offline bank builder. Run on a computer (never on device):
 *
 *   npm run bank            # writes src/data/snap-bank.json + shikaku-bank.json
 *
 * Levels 1..TOTAL_LEVELS form one global difficulty track, alternating
 * types (odd = snap, even = shikaku) so the loader naturally interleaves
 * them. Every puzzle is uniqueness-checked and content-deduped.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Difficulty } from '../src/engine/types';
import type { SnapPuzzle } from '../src/puzzles/snap/types';
import type { ShikakuPuzzle } from '../src/puzzles/shikaku/types';
import { generateSnap, snapContentKey } from './gen-snap';
import { generateShikaku, shikakuContentKey } from './gen-shikaku';

const TOTAL_LEVELS = 640;
const BASE_SEED = 0x5eed2026;

function tierOf(level: number): Difficulty {
  if (level <= 200) return 'easy';
  if (level <= 440) return 'medium';
  return 'hard';
}

const SNAP_TIERS: Record<Difficulty, { rows: number; cols: number; targetWaypoints: number }> = {
  easy: { rows: 5, cols: 5, targetWaypoints: 8 },
  medium: { rows: 6, cols: 6, targetWaypoints: 9 },
  hard: { rows: 7, cols: 7, targetWaypoints: 9 },
};

const SHIKAKU_TIERS: Record<
  Difficulty,
  { rows: number; cols: number; minArea: number; maxArea: number; maxDim: number }
> = {
  easy: { rows: 5, cols: 5, minArea: 2, maxArea: 6, maxDim: 4 },
  medium: { rows: 7, cols: 7, minArea: 2, maxArea: 9, maxDim: 5 },
  hard: { rows: 9, cols: 9, minArea: 2, maxArea: 12, maxDim: 6 },
};

function main() {
  const snapBank: SnapPuzzle[] = [];
  const shikakuBank: ShikakuPuzzle[] = [];
  const seenSnap = new Set<string>();
  const seenShikaku = new Set<string>();
  const started = Date.now();

  for (let level = 1; level <= TOTAL_LEVELS; level++) {
    const difficulty = tierOf(level);
    const isSnap = level % 2 === 1;

    let placed = false;
    for (let retry = 0; retry < 50 && !placed; retry++) {
      const seed = (BASE_SEED + level * 7919 + retry * 104729) >>> 0;
      if (isSnap) {
        const tier = SNAP_TIERS[difficulty];
        const core = generateSnap({ ...tier, seed, difficulty });
        if (!core) continue;
        const key = snapContentKey(core);
        if (seenSnap.has(key)) continue;
        seenSnap.add(key);
        snapBank.push({
          ...core,
          id: `snap-${core.rows}x${core.cols}-${String(level).padStart(6, '0')}`,
          level,
        });
        placed = true;
      } else {
        const tier = SHIKAKU_TIERS[difficulty];
        const core = generateShikaku({ ...tier, seed, difficulty });
        if (!core) continue;
        const key = shikakuContentKey(core);
        if (seenShikaku.has(key)) continue;
        seenShikaku.add(key);
        shikakuBank.push({
          ...core,
          id: `shikaku-${core.rows}x${core.cols}-${String(level).padStart(6, '0')}`,
          level,
        });
        placed = true;
      }
    }
    if (!placed) {
      throw new Error(`could not generate a unique puzzle for level ${level}`);
    }
    if (level % 50 === 0) {
      console.log(`level ${level}/${TOTAL_LEVELS} (${((Date.now() - started) / 1000).toFixed(1)}s)`);
    }
  }

  const here = dirname(fileURLToPath(import.meta.url));
  const dataDir = join(here, '..', 'src', 'data');
  mkdirSync(dataDir, { recursive: true });
  writeFileSync(join(dataDir, 'snap-bank.json'), JSON.stringify(snapBank));
  writeFileSync(join(dataDir, 'shikaku-bank.json'), JSON.stringify(shikakuBank));

  console.log(
    `wrote ${snapBank.length} snap + ${shikakuBank.length} shikaku puzzles in ${((Date.now() - started) / 1000).toFixed(1)}s`,
  );
}

main();

/**
 * Offline bank builder for the Pips mode. Run on a computer (never on device):
 *
 *   npm run bank:pips       # writes src/data/pips-bank.json
 *
 * Pips has its own level track (1..TOTAL), climbing three difficulty tiers.
 * Every puzzle is uniqueness-checked (one value-grid solves it) and deduped.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Difficulty } from '../src/engine/types';
import type { PipsPuzzle } from '../src/puzzles/pips/types';
import { generatePips, pipsContentKey } from './gen-pips';

const TOTAL_LEVELS = 120;
const BASE_SEED = 0x91059105; // deterministic seed

const TIERS: Record<
  Difficulty,
  { dominoes: number; maxRows: number; maxCols: number; maxRegion: number }
> = {
  easy: { dominoes: 4, maxRows: 4, maxCols: 4, maxRegion: 3 },
  medium: { dominoes: 6, maxRows: 5, maxCols: 5, maxRegion: 3 },
  hard: { dominoes: 8, maxRows: 6, maxCols: 6, maxRegion: 4 },
};

function tierOf(level: number): Difficulty {
  if (level <= 40) return 'easy';
  if (level <= 80) return 'medium';
  return 'hard';
}

function main() {
  const bank: PipsPuzzle[] = [];
  const seen = new Set<string>();
  const started = Date.now();

  for (let level = 1; level <= TOTAL_LEVELS; level++) {
    const difficulty = tierOf(level);
    const tier = TIERS[difficulty];

    let placed = false;
    for (let retry = 0; retry < 200 && !placed; retry++) {
      const seed = (BASE_SEED + level * 7919 + retry * 104729) >>> 0;
      const core = generatePips({ ...tier, seed, difficulty });
      if (!core) continue;
      const key = pipsContentKey(core);
      if (seen.has(key)) continue;
      seen.add(key);
      bank.push({
        ...core,
        id: `pips-${core.rows}x${core.cols}-${String(level).padStart(6, '0')}`,
        level,
      });
      placed = true;
    }
    if (!placed) throw new Error(`could not generate a unique pips puzzle for level ${level}`);
    if (level % 20 === 0) {
      console.log(`level ${level}/${TOTAL_LEVELS} (${((Date.now() - started) / 1000).toFixed(1)}s)`);
    }
  }

  const here = dirname(fileURLToPath(import.meta.url));
  const dataDir = join(here, '..', 'src', 'data');
  mkdirSync(dataDir, { recursive: true });
  writeFileSync(join(dataDir, 'pips-bank.json'), JSON.stringify(bank));
  console.log(
    `wrote ${bank.length} pips puzzles in ${((Date.now() - started) / 1000).toFixed(1)}s`,
  );
}

main();

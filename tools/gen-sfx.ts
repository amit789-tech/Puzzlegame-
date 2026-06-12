/**
 * Synthesizes the app's five sound effects as 16-bit mono WAV files in
 * assets/sfx. All sounds are generated from scratch (sines + envelopes), so
 * they are original and license-free. Run with: npm run sfx
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SAMPLE_RATE = 44100;

function wavFile(samples: Float32Array): Buffer {
  const data = Buffer.alloc(samples.length * 2);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    data.writeInt16LE(Math.round(s * 32767), i * 2);
  }
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // PCM chunk size
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(SAMPLE_RATE, 24);
  header.writeUInt32LE(SAMPLE_RATE * 2, 28); // byte rate
  header.writeUInt16LE(2, 32); // block align
  header.writeUInt16LE(16, 34); // bits per sample
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

/** A sine burst with exponential decay; the building block of every SFX. */
function blip(
  out: Float32Array,
  startSec: number,
  freq: number,
  durSec: number,
  gain: number,
  decay = 18,
) {
  const start = Math.floor(startSec * SAMPLE_RATE);
  const len = Math.floor(durSec * SAMPLE_RATE);
  for (let i = 0; i < len && start + i < out.length; i++) {
    const t = i / SAMPLE_RATE;
    const env = Math.exp(-decay * (t / durSec)) * Math.min(1, i / 64); // declick
    out[start + i] += Math.sin(2 * Math.PI * freq * t) * env * gain;
  }
}

function seconds(s: number): Float32Array {
  return new Float32Array(Math.ceil(s * SAMPLE_RATE));
}

// tap: crisp UI press
const tap = seconds(0.06);
blip(tap, 0, 1800, 0.06, 0.5, 22);

// tick: softer per-cell haptic companion while drawing
const tick = seconds(0.04);
blip(tick, 0, 1250, 0.04, 0.32, 26);

// place: a low thunk for committing a rectangle
const place = seconds(0.12);
blip(place, 0, 392, 0.12, 0.55, 14);
blip(place, 0, 588, 0.08, 0.25, 18);

// success: rising major arpeggio (C5 E5 G5 C6)
const success = seconds(0.55);
blip(success, 0.0, 523.25, 0.3, 0.4, 8);
blip(success, 0.09, 659.25, 0.3, 0.4, 8);
blip(success, 0.18, 783.99, 0.32, 0.4, 8);
blip(success, 0.27, 1046.5, 0.38, 0.45, 7);

// error: short low buzz (two close frequencies beating)
const error = seconds(0.18);
blip(error, 0, 165, 0.18, 0.5, 9);
blip(error, 0, 185, 0.18, 0.35, 9);

const here = dirname(fileURLToPath(import.meta.url));
const dir = join(here, '..', 'assets', 'sfx');
mkdirSync(dir, { recursive: true });
for (const [name, buf] of Object.entries({ tap, tick, place, success, error })) {
  writeFileSync(join(dir, `${name}.wav`), wavFile(buf));
}
console.log('wrote 5 wav files to assets/sfx');

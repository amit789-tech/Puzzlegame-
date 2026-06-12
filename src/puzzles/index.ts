import type { PuzzleType } from '../engine/types';
import type { SnapPuzzle } from './snap/types';
import type { ShikakuPuzzle } from './shikaku/types';

export type { PuzzleType };

export type AnyPuzzle = SnapPuzzle | ShikakuPuzzle;

export interface ModeInfo {
  type: PuzzleType;
  name: string;
  tagline: string;
  howToPlay: string[];
}

/** Registry of playable modes; adding mode #3 starts here. */
export const MODES: Record<PuzzleType, ModeInfo> = {
  snap: {
    type: 'snap',
    name: 'Snap',
    tagline: 'One line through every cell.',
    howToPlay: [
      'Draw a single line that visits every cell exactly once.',
      'Start on 1 and pass through the numbers in order.',
      'The line must end on the highest number.',
      'Drag backwards along the line to erase it.',
    ],
  },
  shikaku: {
    type: 'shikaku',
    name: 'Shikaku',
    tagline: 'Carve the grid into rectangles.',
    howToPlay: [
      'Split the whole grid into rectangles.',
      'Each rectangle must contain exactly one number.',
      'That number is the area the rectangle must have.',
      'Drag diagonally to draw a rectangle; tap one to erase it.',
    ],
  },
};

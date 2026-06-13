import type { PuzzleType } from '../engine/types';
import type { SnapPuzzle } from './snap/types';
import type { ShikakuPuzzle } from './shikaku/types';
import type { PipsPuzzle } from './pips/types';

export type { PuzzleType };

export type AnyPuzzle = SnapPuzzle | ShikakuPuzzle | PipsPuzzle;

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
      'Tap a number (or any cell) on your line to rewind back to it.',
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
      'Tap an empty cell to place a 1×1 box.',
    ],
  },
  pips: {
    type: 'pips',
    name: 'Pips',
    tagline: 'Fill the board with dominoes.',
    howToPlay: [
      'Place every domino from the tray to fill the whole board.',
      'Tap a tray domino to pick it up; tap it again to rotate it.',
      'Tap a board cell to drop it there; tap a placed domino to remove it.',
      'Each coloured region shows its rule: a number is the total pips it must hold.',
      '“>3” means more than 3, “<3” fewer; “=” all pips equal, “≠” all different.',
    ],
  },
};

import {
  Canvas,
  Group,
  RoundedRect,
  Text as SkiaText,
  useFont,
} from '@shopify/react-native-skia';
import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS, useSharedValue } from 'react-native-reanimated';
import type { Cell } from '../../engine/types';
import type { Rect, ShikakuPuzzle } from '../../puzzles/shikaku/types';
import { rectContains } from '../../puzzles/shikaku/validate';
import { monoFontAsset } from '../theme/fonts';
import { colors } from '../theme/tokens';

interface Props {
  puzzle: ShikakuPuzzle;
  rects: Rect[];
  /** Drag finished over a cell span (parent commits / replaces overlaps). */
  onCommit: (rect: Rect) => void;
  /** Tap on a cell (parent erases the rect there, if any). */
  onTapCell: (cell: Cell) => void;
}

/** Bounding rect of two cells, in grid units. */
function spanRect(a: Cell, b: Cell): Rect {
  const r = Math.min(a.r, b.r);
  const c = Math.min(a.c, b.c);
  return {
    r,
    c,
    w: Math.abs(a.c - b.c) + 1,
    h: Math.abs(a.r - b.r) + 1,
  };
}

/** Stable fill color per rect so colors don't shuffle as you place more. */
function fillFor(rect: Rect, cols: number): string {
  return colors.rectFills[(rect.r * cols + rect.c) % colors.rectFills.length];
}

export function ShikakuBoard({ puzzle, rects, onCommit, onTapCell }: Props) {
  const [size, setSize] = useState(0);
  const cell = size > 0 ? size / puzzle.cols : 0;
  const height = cell * puzzle.rows;
  const clueFont = useFont(monoFontAsset, cell * 0.42);

  const [preview, setPreview] = useState<Rect | null>(null);

  const clamp = useCallback(
    (r: number, c: number): Cell => ({
      r: Math.min(Math.max(r, 0), puzzle.rows - 1),
      c: Math.min(Math.max(c, 0), puzzle.cols - 1),
    }),
    [puzzle.rows, puzzle.cols],
  );

  const updatePreview = useCallback(
    (ar: number, ac: number, br: number, bc: number) => {
      setPreview(spanRect(clamp(ar, ac), clamp(br, bc)));
    },
    [clamp],
  );

  const commitPreview = useCallback(
    (ar: number, ac: number, br: number, bc: number) => {
      setPreview(null);
      onCommit(spanRect(clamp(ar, ac), clamp(br, bc)));
    },
    [clamp, onCommit],
  );

  const tapCell = useCallback(
    (r: number, c: number) => {
      onTapCell(clamp(r, c));
    },
    [clamp, onTapCell],
  );

  const anchorR = useSharedValue(0);
  const anchorC = useSharedValue(0);
  const lastR = useSharedValue(0);
  const lastC = useSharedValue(0);

  const pan = Gesture.Pan()
    .minDistance(6)
    .onBegin((e) => {
      anchorR.value = Math.floor(e.y / cell);
      anchorC.value = Math.floor(e.x / cell);
      lastR.value = anchorR.value;
      lastC.value = anchorC.value;
    })
    .onUpdate((e) => {
      const r = Math.floor(e.y / cell);
      const c = Math.floor(e.x / cell);
      if (r !== lastR.value || c !== lastC.value) {
        lastR.value = r;
        lastC.value = c;
        runOnJS(updatePreview)(anchorR.value, anchorC.value, r, c);
      }
    })
    .onEnd(() => {
      runOnJS(commitPreview)(anchorR.value, anchorC.value, lastR.value, lastC.value);
    })
    .onFinalize((_e, success) => {
      if (!success) runOnJS(setPreview)(null);
    });

  const tap = Gesture.Tap().onEnd((e) => {
    runOnJS(tapCell)(Math.floor(e.y / cell), Math.floor(e.x / cell));
  });

  const gesture = Gesture.Exclusive(pan, tap);

  const px = (rect: Rect) => ({
    x: rect.c * cell + 2,
    y: rect.r * cell + 2,
    width: rect.w * cell - 4,
    height: rect.h * cell - 4,
  });

  return (
    <View style={styles.board} onLayout={(e) => setSize(e.nativeEvent.layout.width)}>
      {size > 0 && (
        <GestureDetector gesture={gesture}>
          <Canvas style={{ width: size, height }}>
            {/* Cell tiles */}
            {Array.from({ length: puzzle.rows * puzzle.cols }, (_, i) => {
              const r = Math.floor(i / puzzle.cols);
              const c = i % puzzle.cols;
              return (
                <RoundedRect
                  key={i}
                  x={c * cell + 1.5}
                  y={r * cell + 1.5}
                  width={cell - 3}
                  height={cell - 3}
                  r={cell * 0.12}
                  color={colors.surface}
                />
              );
            })}

            {/* Placed rects */}
            {rects.map((rect, i) => {
              const box = px(rect);
              return (
                <Group key={`${rect.r}-${rect.c}-${i}`}>
                  <RoundedRect {...box} r={cell * 0.12} color={fillFor(rect, puzzle.cols)} />
                  <RoundedRect
                    {...box}
                    r={cell * 0.12}
                    style="stroke"
                    strokeWidth={2}
                    color={colors.rectStroke}
                    opacity={0.7}
                  />
                </Group>
              );
            })}

            {/* Drag preview */}
            {preview && (
              <RoundedRect
                {...px(preview)}
                r={cell * 0.12}
                style="stroke"
                strokeWidth={3}
                color={colors.accent}
              />
            )}

            {/* Clue numbers */}
            {clueFont &&
              puzzle.clues.map((clue, i) => {
                const label = String(clue.value);
                // getTextWidth (not measureText) — implemented on web too.
                const textWidth = clueFont.getTextWidth(label);
                const covered = rects.some(
                  (rect) =>
                    rectContains(rect, clue.r, clue.c) &&
                    rect.w * rect.h === clue.value,
                );
                return (
                  <SkiaText
                    key={i}
                    x={(clue.c + 0.5) * cell - textWidth / 2}
                    y={(clue.r + 0.5) * cell + cell * 0.15}
                    text={label}
                    font={clueFont}
                    color={covered ? colors.text : colors.textDim}
                  />
                );
              })}
          </Canvas>
        </GestureDetector>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    alignSelf: 'stretch',
  },
});

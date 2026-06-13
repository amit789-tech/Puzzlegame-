import {
  Canvas,
  Circle,
  Group,
  RoundedRect,
  Text as SkiaText,
  useFont,
} from '@shopify/react-native-skia';
import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import type { Cell } from '../../engine/types';
import type { PipsPuzzle, Placement } from '../../puzzles/pips/types';
import { monoFontAsset } from '../theme/fonts';
import { colors } from '../theme/tokens';
import {
  badgeLabel,
  badgeVertex,
  cellKeySet,
  dotCenters,
  regionIndexByCell,
} from './pips-render';

interface Props {
  puzzle: PipsPuzzle;
  placements: Placement[];
  /** Tap on a board cell (parent places / removes / ignores). */
  onTapCell: (cell: Cell) => void;
  /** Highlight the currently selected tray piece's footprint, if any. */
  selectedSlot: number | null;
}

const region = (i: number) => colors.pipsRegions[i % colors.pipsRegions.length];

export function PipsBoard({ puzzle, placements, onTapCell, selectedSlot }: Props) {
  const [size, setSize] = useState(0);
  // Leave a little margin around the bounding box so corner badges aren't clipped.
  const margin = size > 0 ? size * 0.06 : 0;
  const cell = size > 0 ? (size - margin * 2) / puzzle.cols : 0;
  const height = cell * puzzle.rows + margin * 2;
  const badgeFont = useFont(monoFontAsset, cell * 0.4);

  const board = useMemo(() => cellKeySet(puzzle.cells), [puzzle.cells]);
  const regionOf = useMemo(() => regionIndexByCell(puzzle), [puzzle]);

  const tapCell = useCallback(
    (x: number, y: number) => {
      const c = Math.floor((x - margin) / cell);
      const r = Math.floor((y - margin) / cell);
      if (r < 0 || c < 0 || r >= puzzle.rows || c >= puzzle.cols) return;
      if (!board.has(`${r},${c}`)) return;
      onTapCell({ r, c });
    },
    [cell, margin, board, puzzle.rows, puzzle.cols, onTapCell],
  );

  const tap = Gesture.Tap().maxDistance(14).onEnd((e) => {
    runOnJS(tapCell)(e.x, e.y);
  });

  // Pixel helpers (include the margin offset).
  const px = (c: number) => margin + c * cell;
  const py = (r: number) => margin + r * cell;

  const dotR = cell * 0.07;
  const selectedKeys = useMemo(() => {
    if (selectedSlot === null) return new Set<string>();
    const p = placements.find((pl) => pl.slot === selectedSlot);
    return p ? new Set([`${p.a.r},${p.a.c}`, `${p.b.r},${p.b.c}`]) : new Set<string>();
  }, [selectedSlot, placements]);

  return (
    <View style={styles.board} onLayout={(e) => setSize(e.nativeEvent.layout.width)}>
      {size > 0 && (
        <GestureDetector gesture={tap}>
          <Canvas style={{ width: size, height }}>
            {/* Region-tinted cells */}
            {puzzle.cells.map((c) => {
              const ri = regionOf.get(`${c.r},${c.c}`) ?? 0;
              const kind = puzzle.regions[ri]?.kind;
              const fill = kind === 'none' ? colors.surfaceAlt : region(ri).fill;
              return (
                <RoundedRect
                  key={`bg-${c.r}-${c.c}`}
                  x={px(c.c) + 2}
                  y={py(c.r) + 2}
                  width={cell - 4}
                  height={cell - 4}
                  r={cell * 0.16}
                  color={fill}
                />
              );
            })}

            {/* Placed dominoes: linkage outline + pips */}
            {placements.map((p, i) => {
              const d = puzzle.dominoes[p.slot];
              if (!d) return null;
              const minC = Math.min(p.a.c, p.b.c);
              const minR = Math.min(p.a.r, p.b.r);
              const maxC = Math.max(p.a.c, p.b.c);
              const maxR = Math.max(p.a.r, p.b.r);
              const sel = selectedKeys.has(`${p.a.r},${p.a.c}`);
              return (
                <Group key={`pl-${i}`}>
                  <RoundedRect
                    x={px(minC) + 4}
                    y={py(minR) + 4}
                    width={(maxC - minC + 1) * cell - 8}
                    height={(maxR - minR + 1) * cell - 8}
                    r={cell * 0.14}
                    color={sel ? 'rgba(245,197,24,0.30)' : 'rgba(255,255,255,0.14)'}
                  />
                  <RoundedRect
                    x={px(minC) + 4}
                    y={py(minR) + 4}
                    width={(maxC - minC + 1) * cell - 8}
                    height={(maxR - minR + 1) * cell - 8}
                    r={cell * 0.14}
                    style="stroke"
                    strokeWidth={2.5}
                    color={sel ? colors.gold : 'rgba(20,26,32,0.5)'}
                  />
                  {[
                    { v: d.a, cellRef: p.a },
                    { v: d.b, cellRef: p.b },
                  ].map(({ v, cellRef }, k) =>
                    dotCenters(v, cellRef.r, cellRef.c, cell).map(([dx, dy], j) => (
                      <Circle
                        key={`dot-${i}-${k}-${j}`}
                        cx={margin + dx}
                        cy={margin + dy}
                        r={dotR}
                        color={colors.pipsDot}
                      />
                    )),
                  )}
                </Group>
              );
            })}

            {/* Region constraint badges */}
            {badgeFont &&
              puzzle.regions.map((reg, i) => {
                const label = badgeLabel(reg);
                if (label === '') return null;
                const { vr, vc } = badgeVertex(reg);
                const half = cell * 0.34;
                let bx = margin + vc * cell;
                let by = margin + vr * cell;
                bx = Math.min(Math.max(bx, half), size - half);
                by = Math.min(Math.max(by, half), height - half);
                const tw = badgeFont.getTextWidth(label);
                return (
                  <Group key={`badge-${i}`}>
                    <RoundedRect
                      x={bx - half}
                      y={by - half}
                      width={half * 2}
                      height={half * 2}
                      r={cell * 0.12}
                      color={region(i).solid}
                    />
                    <SkiaText
                      x={bx - tw / 2}
                      y={by + cell * 0.14}
                      text={label}
                      font={badgeFont}
                      color="#FFFFFF"
                    />
                  </Group>
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

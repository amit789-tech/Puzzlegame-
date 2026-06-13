import {
  Canvas,
  Circle,
  Group,
  RoundedRect,
  Text as SkiaText,
  useFont,
  vec,
} from '@shopify/react-native-skia';
import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { Cell } from '../../engine/types';
import type { PipsPuzzle } from '../../puzzles/pips/types';
import { monoFontAsset } from '../theme/fonts';
import { colors } from '../theme/tokens';
import { badgeLabel, badgeVertex, dotCenters, regionIndexByCell } from './pips-render';

export interface BoardGeom {
  size: number;
  cell: number;
  margin: number;
  height: number;
}

interface Props {
  puzzle: PipsPuzzle;
  placements: { slot: number; a: Cell; b: Cell }[];
  /** Cells the held piece would cover on drop, and whether that's legal. */
  preview?: { cells: Cell[]; valid: boolean } | null;
  /** Reports the canvas geometry so the parent can hit-test drops. */
  onGeom?: (g: BoardGeom) => void;
}

const region = (i: number) => colors.pipsRegions[i % colors.pipsRegions.length];

export function PipsBoard({ puzzle, placements, preview, onGeom }: Props) {
  const [size, setSize] = useState(0);
  const margin = size > 0 ? size * 0.06 : 0;
  const cell = size > 0 ? (size - margin * 2) / puzzle.cols : 0;
  const height = cell * puzzle.rows + margin * 2;
  const badgeFont = useFont(monoFontAsset, cell * 0.34);

  const regionOf = useMemo(() => regionIndexByCell(puzzle), [puzzle]);

  const px = (c: number) => margin + c * cell;
  const py = (r: number) => margin + r * cell;
  const dotR = cell * 0.07;

  return (
    <View
      style={styles.board}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        setSize(w);
        const m = w * 0.06;
        const cl = (w - m * 2) / puzzle.cols;
        onGeom?.({ size: w, cell: cl, margin: m, height: cl * puzzle.rows + m * 2 });
      }}
    >
      {size > 0 && (
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
            return (
              <Group key={`pl-${i}`}>
                <RoundedRect
                  x={px(minC) + 4}
                  y={py(minR) + 4}
                  width={(maxC - minC + 1) * cell - 8}
                  height={(maxR - minR + 1) * cell - 8}
                  r={cell * 0.14}
                  color="rgba(255,255,255,0.14)"
                />
                <RoundedRect
                  x={px(minC) + 4}
                  y={py(minR) + 4}
                  width={(maxC - minC + 1) * cell - 8}
                  height={(maxR - minR + 1) * cell - 8}
                  r={cell * 0.14}
                  style="stroke"
                  strokeWidth={2.5}
                  color="rgba(20,26,32,0.5)"
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

          {/* Drop preview */}
          {preview &&
            preview.cells.map((c, i) => (
              <RoundedRect
                key={`pv-${i}`}
                x={px(c.c) + 3}
                y={py(c.r) + 3}
                width={cell - 6}
                height={cell - 6}
                r={cell * 0.14}
                style="stroke"
                strokeWidth={3}
                color={preview.valid ? colors.success : colors.error}
              />
            ))}

          {/* Region constraint badges (small rotated diamonds) */}
          {badgeFont &&
            puzzle.regions.map((reg, i) => {
              const label = badgeLabel(reg);
              if (label === '') return null;
              const { vr, vc } = badgeVertex(reg);
              const half = cell * 0.3;
              const bx = Math.min(Math.max(margin + vc * cell, half), size - half);
              const by = Math.min(Math.max(margin + vr * cell, half), height - half);
              const tw = badgeFont.getTextWidth(label);
              return (
                <Group key={`badge-${i}`}>
                  <Group transform={[{ rotate: Math.PI / 4 }]} origin={vec(bx, by)}>
                    <RoundedRect
                      x={bx - half}
                      y={by - half}
                      width={half * 2}
                      height={half * 2}
                      r={cell * 0.1}
                      color={region(i).solid}
                    />
                  </Group>
                  <SkiaText
                    x={bx - tw / 2}
                    y={by + cell * 0.12}
                    text={label}
                    font={badgeFont}
                    color="#FFFFFF"
                  />
                </Group>
              );
            })}
        </Canvas>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    alignSelf: 'stretch',
  },
});

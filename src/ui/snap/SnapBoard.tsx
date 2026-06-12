import {
  Canvas,
  Circle,
  Group,
  LinearGradient,
  Path,
  RoundedRect,
  Skia,
  Text as SkiaText,
  useFont,
  vec,
} from '@shopify/react-native-skia';
import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  runOnJS,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';
import type { Cell } from '../../engine/types';
import type { SnapPuzzle } from '../../puzzles/snap/types';
import { monoFontAsset } from '../theme/fonts';
import { colors } from '../theme/tokens';

interface Props {
  puzzle: SnapPuzzle;
  path: Cell[];
  /** Finger entered a new cell while dragging (parent applies game rules). */
  onCellEnter: (cell: Cell) => void;
  /** Finger lifted (parent checks for completion). */
  onRelease: () => void;
  /** Tap in eraser mode. */
  onEraseAt: (cell: Cell) => void;
  eraserActive: boolean;
}

/**
 * Skia-rendered Snap board: tiled grid, numbered waypoints, gradient path
 * trail, and a live "elastic" segment that follows the finger on the UI
 * thread between cell commits.
 */
export function SnapBoard({
  puzzle,
  path,
  onCellEnter,
  onRelease,
  onEraseAt,
  eraserActive,
}: Props) {
  const [size, setSize] = useState(0);
  const cell = size > 0 ? size / puzzle.cols : 0;
  const height = cell * puzzle.rows;
  const waypointFont = useFont(monoFontAsset, cell * 0.42);

  // Live finger position for the elastic segment (UI thread only).
  const fingerX = useSharedValue(0);
  const fingerY = useSharedValue(0);
  const fingerActive = useSharedValue(false);
  // Center of the last committed path cell, mirrored from React state.
  const lastCX = useSharedValue(-1);
  const lastCY = useSharedValue(-1);

  const last = path.length > 0 ? path[path.length - 1] : null;
  React.useEffect(() => {
    lastCX.value = last ? (last.c + 0.5) * cell : -1;
    lastCY.value = last ? (last.r + 0.5) * cell : -1;
  }, [last, cell, lastCX, lastCY]);

  const handleEnter = useCallback(
    (r: number, c: number) => {
      if (r < 0 || r >= puzzle.rows || c < 0 || c >= puzzle.cols) return;
      if (eraserActive) onEraseAt({ r, c });
      else onCellEnter({ r, c });
    },
    [puzzle.rows, puzzle.cols, eraserActive, onEraseAt, onCellEnter],
  );

  const lastCellIndex = useSharedValue(-1);

  const pan = Gesture.Pan()
    .minDistance(0)
    .onBegin((e) => {
      fingerActive.value = true;
      fingerX.value = e.x;
      fingerY.value = e.y;
      const r = Math.floor(e.y / cell);
      const c = Math.floor(e.x / cell);
      lastCellIndex.value = r * puzzle.cols + c;
      runOnJS(handleEnter)(r, c);
    })
    .onUpdate((e) => {
      fingerX.value = Math.min(Math.max(e.x, 0), size);
      fingerY.value = Math.min(Math.max(e.y, 0), height);
      const r = Math.floor(e.y / cell);
      const c = Math.floor(e.x / cell);
      const idx = r * puzzle.cols + c;
      if (idx !== lastCellIndex.value) {
        lastCellIndex.value = idx;
        runOnJS(handleEnter)(r, c);
      }
    })
    .onFinalize(() => {
      fingerActive.value = false;
      lastCellIndex.value = -1;
      runOnJS(onRelease)();
    });

  // Committed trail through cell centers.
  const trailPath = useMemo(() => {
    const p = Skia.Path.Make();
    if (cell === 0 || path.length === 0) return p;
    p.moveTo((path[0].c + 0.5) * cell, (path[0].r + 0.5) * cell);
    for (let i = 1; i < path.length; i++) {
      p.lineTo((path[i].c + 0.5) * cell, (path[i].r + 0.5) * cell);
    }
    return p;
  }, [path, cell]);

  // Elastic segment from the last committed cell to the finger.
  const elasticPath = useDerivedValue(() => {
    const p = Skia.Path.Make();
    if (fingerActive.value && lastCX.value >= 0) {
      p.moveTo(lastCX.value, lastCY.value);
      p.lineTo(fingerX.value, fingerY.value);
    }
    return p;
  });

  const onPathCells = useMemo(
    () => new Set(path.map((pc) => pc.r * puzzle.cols + pc.c)),
    [path, puzzle.cols],
  );

  const strokeWidth = cell * 0.45;

  return (
    <View
      style={styles.board}
      onLayout={(e) => setSize(e.nativeEvent.layout.width)}
    >
      {size > 0 && (
        <GestureDetector gesture={pan}>
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
                  r={cell * 0.16}
                  color={onPathCells.has(i) ? colors.surfaceAlt : colors.surface}
                />
              );
            })}

            {/* Gradient trail + elastic finger segment */}
            <Group>
              <LinearGradient
                start={vec(0, 0)}
                end={vec(size, height)}
                colors={[...colors.pathGradient]}
              />
              <Path
                path={trailPath}
                style="stroke"
                strokeWidth={strokeWidth}
                strokeCap="round"
                strokeJoin="round"
              />
              <Path
                path={elasticPath}
                style="stroke"
                strokeWidth={strokeWidth * 0.85}
                strokeCap="round"
              />
            </Group>

            {/* Numbered waypoints */}
            {waypointFont &&
              puzzle.waypoints.map((w) => {
                const cx = (w.c + 0.5) * cell;
                const cy = (w.r + 0.5) * cell;
                const label = String(w.n);
                const textWidth = waypointFont.measureText(label).width;
                return (
                  <Group key={w.n}>
                    <Circle cx={cx} cy={cy} r={cell * 0.32} color={colors.waypoint} />
                    <SkiaText
                      x={cx - textWidth / 2}
                      y={cy + cell * 0.15}
                      text={label}
                      font={waypointFont}
                      color={colors.waypointText}
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

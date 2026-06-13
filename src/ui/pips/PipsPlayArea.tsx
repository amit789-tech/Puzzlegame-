import React, { useCallback, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as haptics from '../../audio/haptics';
import { play as playSfx } from '../../audio/sfx';
import { cellKey } from '../../engine/grid';
import type { Cell } from '../../engine/types';
import type { PipsPuzzle, Placement } from '../../puzzles/pips/types';
import { placementAt } from '../../puzzles/pips/validate';
import { colors, radii, spacing } from '../theme/tokens';
import { PipFace } from './PipFace';
import { PipsBoard, type BoardGeom } from './PipsBoard';

// Direction the second cell extends from the anchor (right/down/left/up).
const OFFSETS: [number, number][] = [
  [0, 1],
  [1, 0],
  [0, -1],
  [-1, 0],
];

interface Props {
  puzzle: PipsPuzzle;
  placements: Placement[];
  /** Place tray `slot` so its .a value sits on cell `a`, .b on `b`. */
  onPlace: (slot: number, a: Cell, b: Cell) => void;
  /** Remove an already-placed domino. */
  onRemove: (placement: Placement) => void;
  solved: boolean;
}

export function PipsPlayArea({ puzzle, placements, onPlace, onRemove, solved }: Props) {
  const [held, setHeld] = useState<{ slot: number; orient: number } | null>(null);
  const [preview, setPreview] = useState<{ cells: Cell[]; valid: boolean } | null>(null);
  const [areaSize, setAreaSize] = useState({ w: 0, h: 0 });

  const areaRef = useRef<View>(null);
  const boardInnerRef = useRef<View>(null);
  const geomRef = useRef<BoardGeom | null>(null);
  const boardOffset = useRef({ x: 0, y: 0 });
  const heldRef = useRef<{ slot: number; orient: number } | null>(null);
  const canRotateRef = useRef(false);
  const placementsRef = useRef<Placement[]>(placements);
  placementsRef.current = placements;
  heldRef.current = held;

  // Floating piece, in area-local coordinates.
  const fx = useSharedValue(0);
  const fy = useSharedValue(0);
  const lifted = useSharedValue(0);
  const rot = useSharedValue(0);
  const areaWinX = useSharedValue(0);
  const areaWinY = useSharedValue(0);

  // Resolve the area's window origin and the board's origin within the area.
  // Using window measurements keeps it correct regardless of padding/nesting.
  const measureAll = useCallback(() => {
    areaRef.current?.measureInWindow((ax, ay) => {
      areaWinX.value = ax;
      areaWinY.value = ay;
      boardInnerRef.current?.measureInWindow((bx, by) => {
        boardOffset.current = { x: bx - ax, y: by - ay };
      });
    });
  }, [areaWinX, areaWinY]);

  const board = useRef(new Set<string>());
  board.current = new Set(puzzle.cells.map(cellKey));

  /** Cell under an area-local point, or null if off the board. */
  const cellAtLocal = useCallback((lx: number, ly: number): Cell | null => {
    const g = geomRef.current;
    if (!g) return null;
    const c = Math.floor((lx - boardOffset.current.x - g.margin) / g.cell);
    const r = Math.floor((ly - boardOffset.current.y - g.margin) / g.cell);
    if (!board.current.has(`${r},${c}`)) return null;
    return { r, c };
  }, []);

  const footprint = useCallback(
    (anchor: Cell, orient: number) => {
      const [dr, dc] = OFFSETS[orient];
      const b = { r: anchor.r + dr, c: anchor.c + dc };
      const covered = new Set(
        placementsRef.current.flatMap((p) => [cellKey(p.a), cellKey(p.b)]),
      );
      const valid =
        board.current.has(cellKey(anchor)) &&
        board.current.has(cellKey(b)) &&
        !covered.has(cellKey(anchor)) &&
        !covered.has(cellKey(b));
      return { a: anchor, b, valid };
    },
    [],
  );

  const updatePreview = useCallback(
    (lx: number, ly: number) => {
      const h = heldRef.current;
      const anchor = cellAtLocal(lx, ly);
      if (!h || !anchor) {
        setPreview(null);
        return;
      }
      const fp = footprint(anchor, h.orient);
      setPreview({ cells: [fp.a, fp.b], valid: fp.valid });
    },
    [cellAtLocal, footprint],
  );

  const restPosition = useCallback(() => {
    const g = geomRef.current;
    const restY = g ? boardOffset.current.y + g.height + 26 : areaSize.h * 0.7;
    return { x: areaSize.w / 2, y: Math.min(restY, areaSize.h - 40) };
  }, [areaSize]);

  const liftToRest = useCallback(
    (slot: number) => {
      if (placementsRef.current.some((p) => p.slot === slot)) return;
      const rest = restPosition();
      fx.value = rest.x;
      fy.value = rest.y;
      rot.value = withTiming(0, { duration: 120 });
      lifted.value = withSpring(1, { damping: 18, stiffness: 220 });
      setHeld({ slot, orient: 0 });
      canRotateRef.current = true;
      setPreview(null);
      haptics.tick();
      playSfx('tap');
    },
    [fx, fy, rot, lifted, restPosition],
  );

  const grab = useCallback(
    (slot: number, lx: number, ly: number) => {
      if (placementsRef.current.some((p) => p.slot === slot)) return;
      fx.value = lx;
      fy.value = ly;
      rot.value = withTiming(0, { duration: 120 });
      lifted.value = withSpring(1, { damping: 18, stiffness: 220 });
      setHeld({ slot, orient: 0 });
      canRotateRef.current = false;
      haptics.tick();
      playSfx('tap');
      updatePreview(lx, ly);
    },
    [fx, fy, rot, lifted, updatePreview],
  );

  const rotate = useCallback(() => {
    const h = heldRef.current;
    if (!h || !canRotateRef.current) return;
    const next = (h.orient + 1) % 4;
    rot.value = withTiming(next * 90, { duration: 160 });
    setHeld({ slot: h.slot, orient: next });
    haptics.tick();
    playSfx('tick');
    updatePreview(fx.value, fy.value);
  }, [rot, fx, fy, updatePreview]);

  const drop = useCallback(
    (lx: number, ly: number) => {
      const h = heldRef.current;
      if (!h) return;
      const anchor = cellAtLocal(lx, ly);
      if (anchor) {
        const fp = footprint(anchor, h.orient);
        if (fp.valid) {
          onPlace(h.slot, fp.a, fp.b);
          lifted.value = withTiming(0, { duration: 120 });
          setHeld(null);
          setPreview(null);
          return;
        }
      }
      // Missed the board (or illegal): send it back to the tray.
      lifted.value = withTiming(0, { duration: 150 });
      setHeld(null);
      setPreview(null);
      haptics.error();
    },
    [cellAtLocal, footprint, onPlace, lifted],
  );

  const tapBoard = useCallback(
    (lx: number, ly: number) => {
      const cell = cellAtLocal(lx, ly);
      if (!cell) return;
      const hit = placementAt(placementsRef.current, cell);
      if (hit) {
        haptics.tick();
        playSfx('tap');
        onRemove(hit);
        return;
      }
      // Convenience: if a piece is floating, a board tap also drops it.
      if (heldRef.current) drop(lx, ly);
    },
    [cellAtLocal, onRemove, drop],
  );

  // ---- gestures ----
  const boardTap = Gesture.Tap()
    .maxDistance(14)
    .onEnd((e) => {
      runOnJS(tapBoard)(e.x + boardOffset.current.x, e.y + boardOffset.current.y);
    });

  const floatTap = Gesture.Tap().maxDistance(14).onEnd(() => {
    runOnJS(rotate)();
  });
  const floatPan = Gesture.Pan()
    .onUpdate((e) => {
      fx.value = e.absoluteX - areaWinX.value;
      fy.value = e.absoluteY - areaWinY.value;
      runOnJS(updatePreview)(fx.value, fy.value);
    })
    .onEnd(() => {
      runOnJS(drop)(fx.value, fy.value);
    });
  const floatGesture = Gesture.Race(floatPan, floatTap);

  const floatStyle = useAnimatedStyle(() => ({
    opacity: lifted.value,
    transform: [
      { translateX: fx.value },
      { translateY: fy.value },
      { rotate: `${rot.value}deg` },
      { scale: 0.85 + lifted.value * 0.25 },
    ],
  }));

  const g = geomRef.current;
  const faceSize = g ? g.cell * 0.86 : 30;
  const heldDomino = held ? puzzle.dominoes[held.slot] : null;

  return (
    <View
      ref={areaRef}
      style={styles.area}
      onLayout={(e) => {
        setAreaSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });
        measureAll();
      }}
    >
      <View style={styles.boardWrap}>
        <GestureDetector gesture={boardTap}>
          <View
            ref={boardInnerRef}
            style={styles.boardInner}
            onLayout={measureAll}
          >
            <PipsBoard
              puzzle={puzzle}
              placements={placements}
              preview={preview}
              onGeom={(geom) => {
                geomRef.current = geom;
                measureAll();
              }}
            />
          </View>
        </GestureDetector>
      </View>

      {/* Tray */}
      <View style={styles.tray}>
        {puzzle.dominoes.map((d, slot) => {
          const used = placements.some((p) => p.slot === slot);
          if (used) {
            return (
              <View key={slot} testID={`pips-tray-${slot}`} style={[styles.slot, styles.slotEmpty]} />
            );
          }
          const isHeld = held?.slot === slot;
          const tilePan = Gesture.Pan()
            .onStart((e) => {
              runOnJS(grab)(slot, e.absoluteX - areaWinX.value, e.absoluteY - areaWinY.value);
            })
            .onUpdate((e) => {
              fx.value = e.absoluteX - areaWinX.value;
              fy.value = e.absoluteY - areaWinY.value;
              runOnJS(updatePreview)(fx.value, fy.value);
            })
            .onEnd(() => {
              runOnJS(drop)(fx.value, fy.value);
            });
          const tileTap = Gesture.Tap().maxDistance(10).onEnd(() => {
            runOnJS(liftToRest)(slot);
          });
          // Keep the GestureDetector mounted even while this tile is held:
          // if we swapped it for a plain placeholder, an in-flight pan would
          // lose its host view and the drag would die ("stuck" until lifted).
          return (
            <GestureDetector key={slot} gesture={Gesture.Race(tilePan, tileTap)}>
              <View
                testID={`pips-tray-${slot}`}
                style={isHeld ? [styles.slot, styles.slotEmpty] : styles.slot}
              >
                {!isHeld && (
                  <>
                    <PipFace value={d.a} size={28} />
                    <View style={styles.dividerV} />
                    <PipFace value={d.b} size={28} />
                  </>
                )}
              </View>
            </GestureDetector>
          );
        })}
      </View>

      {/* Floating held piece */}
      {heldDomino && !solved && (
        <Animated.View pointerEvents="box-none" style={[styles.floatWrap, floatStyle]}>
          <GestureDetector gesture={floatGesture}>
            <View
              testID="pips-float"
              style={[
                styles.floatTile,
                {
                  left: -faceSize - 5,
                  top: -faceSize / 2 - 3,
                },
              ]}
            >
              <PipFace value={heldDomino.a} size={faceSize} />
              <View style={styles.dividerV} />
              <PipFace value={heldDomino.b} size={faceSize} />
            </View>
          </GestureDetector>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  area: {
    flex: 1,
    justifyContent: 'center',
  },
  boardWrap: {
    alignSelf: 'stretch',
    paddingHorizontal: spacing.md,
  },
  boardInner: {
    alignSelf: 'stretch',
  },
  tray: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: 72,
  },
  slot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.pipsTile,
    borderRadius: radii.sm,
    padding: 4,
    gap: 3,
  },
  slotEmpty: {
    width: 28 * 2 + 11,
    height: 28 + 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    opacity: 0.45,
  },
  floatWrap: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 0,
    height: 0,
  },
  floatTile: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.pipsTileSelected,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.gold,
    padding: 4,
    gap: 4,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  dividerV: {
    width: 1,
    alignSelf: 'stretch',
    marginVertical: 2,
    backgroundColor: colors.pipsDivider,
  },
});

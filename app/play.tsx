import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as haptics from '../src/audio/haptics';
import { play as playSfx } from '../src/audio/sfx';
import { useLocalSearchParams } from 'expo-router';
import { cellsEqual } from '../src/engine/grid';
import type { Cell, PuzzleType } from '../src/engine/types';
import { MODES, type AnyPuzzle } from '../src/puzzles';
import { getNextPuzzle, getPuzzleById, markSolved } from '../src/puzzles/loader';
import { longestCorrectPrefix } from '../src/puzzles/snap/hint';
import type { SnapPuzzle } from '../src/puzzles/snap/types';
import { isPartialValid, validatePath } from '../src/puzzles/snap/validate';
import { revealOneRect } from '../src/puzzles/shikaku/hint';
import type { Rect, ShikakuPuzzle } from '../src/puzzles/shikaku/types';
import { rectAt, rectsOverlap, validateRects } from '../src/puzzles/shikaku/validate';
import { consumeHint, hintsRemaining } from '../src/state/hints';
import {
  advance,
  getCurrentPuzzleId,
  getLevel,
  getSolvedIds,
  setCurrentPuzzleId,
} from '../src/state/progress';
import { helpSeen, markHelpSeen } from '../src/state/settings';
import { recordTime } from '../src/state/stats';
import { getSessionCount, getStreak } from '../src/state/streak';
import { CelebrationOverlay } from '../src/ui/components/CelebrationOverlay';
import { PrimaryButton } from '../src/ui/components/PrimaryButton';
import { ToolBar } from '../src/ui/components/ToolBar';
import { TopBar } from '../src/ui/components/TopBar';
import { ShikakuBoard } from '../src/ui/shikaku/ShikakuBoard';
import { SnapBoard } from '../src/ui/snap/SnapBoard';
import { fonts } from '../src/ui/theme/fonts';
import { colors, radii, spacing } from '../src/ui/theme/tokens';

interface SolvedInfo {
  elapsedMs: number;
  isBestTime: boolean;
  nextLevel: number;
  tierProgress: number;
}

type ShikakuAction = { added: Rect | null; removed: Rect[] };

/** 0..1 position of a level inside its difficulty tier (PRD §11 tiers). */
function tierProgressOf(level: number): number {
  const [start, end] = level <= 200 ? [1, 200] : level <= 440 ? [201, 440] : [441, 640];
  return Math.min(1, (level - start) / (end - start));
}

export default function Play() {
  // ?mode=snap / ?mode=shikaku restricts play to one mode's track; absent =
  // the mixed alternating track.
  const params = useLocalSearchParams<{ mode?: string }>();
  const mode: PuzzleType | undefined =
    params.mode === 'snap' || params.mode === 'shikaku' ? params.mode : undefined;

  const [puzzle, setPuzzle] = useState<AnyPuzzle | null>(null);
  const [path, setPathState] = useState<Cell[]>([]);
  const [rects, setRectsState] = useState<Rect[]>([]);
  const [eraser, setEraser] = useState(false);
  const [hintsLeft, setHintsLeft] = useState(0);
  const [solved, setSolved] = useState<SolvedInfo | null>(null);
  const [helpVisible, setHelpVisible] = useState(false);
  const [header, setHeader] = useState({ streak: getStreak(), session: getSessionCount() });
  const startRef = useRef(Date.now());
  const shikakuUndo = useRef<ShikakuAction[]>([]);

  // Gesture events can arrive faster than re-renders, so the handlers read
  // and write these refs as the source of truth; state mirrors them for
  // rendering.
  const pathRef = useRef<Cell[]>([]);
  const rectsRef = useRef<Rect[]>([]);
  const solvedRef = useRef(false);

  const setPath = useCallback((next: Cell[]) => {
    pathRef.current = next;
    setPathState(next);
  }, []);

  const setRects = useCallback((next: Rect[]) => {
    rectsRef.current = next;
    setRectsState(next);
  }, []);

  const loadPuzzle = useCallback(() => {
    const resumeId = getCurrentPuzzleId(mode);
    let next: AnyPuzzle | null = null;
    if (resumeId && !getSolvedIds().includes(resumeId)) {
      const resumed = getPuzzleById(resumeId);
      // Guard against a stale id from the wrong track.
      if (resumed && (!mode || resumed.type === mode)) next = resumed;
    }
    if (!next) next = getNextPuzzle(getLevel(mode), getSolvedIds(), mode);
    setCurrentPuzzleId(next.id, mode);

    setPuzzle(next);
    setPath([]);
    setRects([]);
    setEraser(false);
    setSolved(null);
    solvedRef.current = false;
    shikakuUndo.current = [];
    setHintsLeft(hintsRemaining());
    startRef.current = Date.now();

    if (!helpSeen(next.type)) {
      setHelpVisible(true);
      markHelpSeen(next.type);
    }
  }, [mode, setPath, setRects]);

  useEffect(() => {
    loadPuzzle();
  }, [loadPuzzle]);

  const handleSolved = useCallback((p: AnyPuzzle) => {
    solvedRef.current = true;
    const elapsedMs = Date.now() - startRef.current;
    const { streak, session } = markSolved(p.id, mode);
    const isBestTime = recordTime(p.type, p.rows, p.cols, elapsedMs);
    setHeader({ streak, session });
    playSfx('success');
    haptics.success();
    const nextLevel = getLevel(mode) + 1;
    setSolved({ elapsedMs, isBestTime, nextLevel, tierProgress: tierProgressOf(nextLevel) });
  }, [mode]);

  // ----- Snap -----

  const snapEnter = useCallback(
    (cell: Cell) => {
      if (!puzzle || puzzle.type !== 'snap' || solvedRef.current) return;
      const p = puzzle as SnapPuzzle;
      const total = p.rows * p.cols;
      const prev = pathRef.current;

      if (prev.length === 0) {
        const first = p.waypoints[0];
        if (cell.r === first.r && cell.c === first.c) {
          haptics.tick();
          setPath([cell]);
        }
        return;
      }
      if (cellsEqual(cell, prev[prev.length - 1])) return;
      // Dragging back along the line erases the last segment.
      if (prev.length >= 2 && cellsEqual(cell, prev[prev.length - 2])) {
        haptics.tick();
        setPath(prev.slice(0, -1));
        return;
      }
      if (prev.some((pc) => cellsEqual(pc, cell))) return;

      const candidate = [...prev, cell];
      const lastWp = p.waypoints[p.waypoints.length - 1];
      const isFinal = cell.r === lastWp.r && cell.c === lastWp.c;
      if ((isFinal && candidate.length !== total) || !isPartialValid(p, candidate)) {
        haptics.error();
        return;
      }

      haptics.tick();
      playSfx('tick');
      setPath(candidate);
      if (candidate.length === total) {
        if (validatePath(p, candidate).solved) {
          handleSolved(p);
        } else {
          playSfx('error');
          haptics.error();
        }
      }
    },
    [puzzle, setPath, handleSolved],
  );

  // Pressing down on a cell already on the line rewinds the path back to
  // that point (tap a numbered checkpoint to jump back there); the same
  // gesture can then keep drawing from it.
  const snapDown = useCallback(
    (cell: Cell) => {
      if (solvedRef.current) return;
      const prev = pathRef.current;
      const i = prev.findIndex((pc) => cellsEqual(pc, cell));
      if (i !== -1 && i < prev.length - 1) {
        haptics.place();
        playSfx('tap');
        setPath(prev.slice(0, i + 1));
        return;
      }
      snapEnter(cell);
    },
    [setPath, snapEnter],
  );

  const snapErase = useCallback(
    (cell: Cell) => {
      if (solvedRef.current) return;
      const i = pathRef.current.findIndex((pc) => cellsEqual(pc, cell));
      if (i === -1) return;
      haptics.place();
      setPath(pathRef.current.slice(0, i));
    },
    [setPath],
  );

  // ----- Shikaku -----

  const shikakuCommit = useCallback(
    (rect: Rect) => {
      if (!puzzle || puzzle.type !== 'shikaku' || solvedRef.current) return;
      const p = puzzle as ShikakuPuzzle;
      const prev = rectsRef.current;

      // If the new rect would overlap an existing one, cancel it — the
      // existing block wins and a short error pulse tells the player why.
      const collides = prev.some((other) => rectsOverlap(other, rect));
      if (collides) {
        haptics.error();
        playSfx('error');
        return;
      }
      shikakuUndo.current.push({ added: rect, removed: [] });
      haptics.place();
      playSfx('place');
      const next = [...prev, rect];
      setRects(next);

      const covered = next.reduce((sum, other) => sum + other.w * other.h, 0);
      if (covered === p.rows * p.cols) {
        if (validateRects(p, next).solved) {
          handleSolved(p);
        } else {
          playSfx('error');
          haptics.error();
        }
      }
    },
    [puzzle, setRects, handleSolved],
  );

  const shikakuTap = useCallback(
    (cell: Cell) => {
      if (solvedRef.current) return;
      const hit = rectAt(rectsRef.current, cell);
      if (!hit) {
        // Tapping an empty cell places a 1x1 box (the only way to cover
        // a "1" clue, since the pan gesture needs movement to start).
        shikakuCommit({ r: cell.r, c: cell.c, w: 1, h: 1 });
        return;
      }
      shikakuUndo.current.push({ added: null, removed: [hit] });
      haptics.tick();
      playSfx('tap');
      setRects(rectsRef.current.filter((other) => other !== hit));
    },
    [setRects, shikakuCommit],
  );

  // ----- Tools -----

  const handleUndo = useCallback(() => {
    if (!puzzle || solvedRef.current) return;
    if (puzzle.type === 'snap') {
      if (pathRef.current.length > 0) setPath(pathRef.current.slice(0, -1));
    } else {
      const action = shikakuUndo.current.pop();
      if (!action) return;
      let next = rectsRef.current;
      if (action.added) next = next.filter((other) => other !== action.added);
      setRects([...next, ...action.removed]);
    }
    playSfx('tap');
  }, [puzzle, setPath, setRects]);

  const handleHint = useCallback(() => {
    if (!puzzle || solvedRef.current) return;
    if (!consumeHint()) return;
    setHintsLeft(hintsRemaining());

    if (puzzle.type === 'snap') {
      const p = puzzle as SnapPuzzle;
      const prefix = longestCorrectPrefix(p, pathRef.current);
      const next = p.solution.slice(0, prefix + 1).map((c) => ({ ...c }));
      setPath(next);
      haptics.place();
      playSfx('place');
      if (next.length === p.rows * p.cols && validatePath(p, next).solved) {
        handleSolved(p);
      }
    } else {
      const p = puzzle as ShikakuPuzzle;
      const rect = revealOneRect(p, rectsRef.current);
      if (rect) shikakuCommit(rect);
    }
  }, [puzzle, setPath, shikakuCommit, handleSolved]);

  const canUndo =
    puzzle?.type === 'snap' ? path.length > 0 : shikakuUndo.current.length > 0;

  if (!puzzle) return <View style={styles.screen} />;

  const modeInfo = MODES[puzzle.type];

  return (
    <SafeAreaView style={styles.screen}>
      <TopBar
        modeName={modeInfo.name}
        streak={header.streak}
        session={header.session}
        onHelp={() => setHelpVisible(true)}
      />

      <View style={styles.boardArea}>
        {puzzle.type === 'snap' ? (
          <SnapBoard
            puzzle={puzzle as SnapPuzzle}
            path={path}
            onCellDown={snapDown}
            onCellEnter={snapEnter}
            onRelease={() => {}}
            onEraseAt={snapErase}
            eraserActive={eraser}
          />
        ) : (
          <ShikakuBoard
            puzzle={puzzle as ShikakuPuzzle}
            rects={rects}
            onCommit={shikakuCommit}
            onTapCell={shikakuTap}
          />
        )}
      </View>

      <ToolBar
        eraserActive={eraser}
        onEraser={() => setEraser((on) => !on)}
        onUndo={handleUndo}
        canUndo={canUndo}
        onHint={handleHint}
        hintsLeft={hintsLeft}
      />

      {solved && (
        <CelebrationOverlay
          difficulty={puzzle.difficulty}
          nextLevel={solved.nextLevel}
          tierProgress={solved.tierProgress}
          elapsedMs={solved.elapsedMs}
          isBestTime={solved.isBestTime}
          onContinue={() => {
            advance(mode);
            loadPuzzle();
          }}
        />
      )}

      {helpVisible && (
        <View style={styles.helpBackdrop}>
          <View style={styles.helpCard}>
            <Text style={styles.helpTitle}>{modeInfo.name}</Text>
            <Text style={styles.helpTagline}>{modeInfo.tagline}</Text>
            {modeInfo.howToPlay.map((line, i) => (
              <View key={i} style={styles.helpRow}>
                <Text style={styles.helpBullet}>•</Text>
                <Text style={styles.helpText}>{line}</Text>
              </View>
            ))}
            <PrimaryButton
              label="Got it"
              onPress={() => setHelpVisible(false)}
              style={styles.helpButton}
            />
          </View>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setHelpVisible(false)}
            accessibilityLabel="Dismiss help"
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  boardArea: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  helpBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(8, 10, 13, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  helpCard: {
    alignSelf: 'stretch',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
    zIndex: 1,
  },
  helpTitle: {
    color: colors.text,
    fontFamily: fonts.serif,
    fontSize: 30,
  },
  helpTagline: {
    color: colors.textDim,
    fontFamily: fonts.sans,
    fontSize: 14,
    marginBottom: spacing.sm,
  },
  helpRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  helpBullet: {
    color: colors.accent,
    fontSize: 15,
  },
  helpText: {
    color: colors.text,
    fontFamily: fonts.sans,
    fontSize: 15,
    flex: 1,
    lineHeight: 21,
  },
  helpButton: {
    marginTop: spacing.md,
  },
});

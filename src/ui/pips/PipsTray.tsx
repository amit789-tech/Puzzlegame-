import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { Domino } from '../../puzzles/pips/types';
import { colors, radii, spacing } from '../theme/tokens';
import { DOT_LAYOUT } from './pips-render';

const FACE = 34; // px per pip face

/** One pip face: a square with dots laid out for `value`. */
function PipFace({ value }: { value: number }) {
  const dot = FACE * 0.16;
  return (
    <View style={styles.face}>
      {(DOT_LAYOUT[value] ?? []).map(([fx, fy], i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            width: dot,
            height: dot,
            borderRadius: dot / 2,
            backgroundColor: colors.pipsDot,
            left: fx * FACE - dot / 2,
            top: fy * FACE - dot / 2,
          }}
        />
      ))}
    </View>
  );
}

interface TileProps {
  slot: number;
  domino: Domino;
  used: boolean;
  selected: boolean;
  vertical: boolean;
  swapped: boolean; // show [b, a] instead of [a, b]
  onPress: () => void;
}

function TrayTile({ slot, domino, used, selected, vertical, swapped, onPress }: TileProps) {
  if (used) {
    return <View testID={`pips-tray-${slot}`} style={[styles.tile, styles.tileUsed]} />;
  }
  const faces = swapped ? [domino.b, domino.a] : [domino.a, domino.b];
  return (
    <Pressable
      testID={`pips-tray-${slot}`}
      accessibilityRole="button"
      onPress={onPress}
      style={[
        styles.tile,
        selected && styles.tileSelected,
        { flexDirection: vertical ? 'column' : 'row' },
      ]}
    >
      <PipFace value={faces[0]} />
      <View style={vertical ? styles.dividerH : styles.dividerV} />
      <PipFace value={faces[1]} />
    </Pressable>
  );
}

interface Props {
  dominoes: Domino[];
  placedSlots: Set<number>;
  selectedSlot: number | null;
  orient: number; // 0 right, 1 down, 2 left, 3 up
  onSelect: (slot: number) => void;
}

export function PipsTray({ dominoes, placedSlots, selectedSlot, orient, onSelect }: Props) {
  return (
    <View style={styles.tray}>
      {dominoes.map((d, slot) => {
        const selected = slot === selectedSlot;
        // Selected piece reflects its live orientation; others sit canonical.
        const vertical = selected && (orient === 1 || orient === 3);
        const swapped = selected && (orient === 2 || orient === 3);
        return (
          <TrayTile
            key={slot}
            slot={slot}
            domino={d}
            used={placedSlots.has(slot)}
            selected={selected}
            vertical={vertical}
            swapped={swapped}
            onPress={() => onSelect(slot)}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tray: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    minHeight: FACE + spacing.md,
  },
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.pipsTile,
    borderRadius: radii.sm,
    borderWidth: 2,
    borderColor: 'transparent',
    padding: 3,
  },
  tileSelected: {
    borderColor: colors.gold,
    backgroundColor: colors.pipsTileSelected,
  },
  tileUsed: {
    width: FACE * 2 + 9,
    height: FACE + 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    opacity: 0.5,
  },
  face: {
    width: FACE,
    height: FACE,
  },
  dividerV: {
    width: 1,
    alignSelf: 'stretch',
    marginVertical: 2,
    backgroundColor: colors.pipsDivider,
  },
  dividerH: {
    height: 1,
    alignSelf: 'stretch',
    marginHorizontal: 2,
    backgroundColor: colors.pipsDivider,
  },
});

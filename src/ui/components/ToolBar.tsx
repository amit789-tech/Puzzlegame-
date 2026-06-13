import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '../theme/tokens';
import { fonts } from '../theme/fonts';

interface Props {
  eraserActive: boolean;
  onEraser: () => void;
  onUndo: () => void;
  canUndo: boolean;
  onHint: () => void;
  hintsLeft: number;
  showEraser?: boolean;
}

function Tool({
  glyph,
  label,
  onPress,
  active,
  disabled,
  badge,
}: {
  glyph: string;
  label: string;
  onPress: () => void;
  active?: boolean;
  disabled?: boolean;
  badge?: number;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      disabled={disabled}
      style={[styles.tool, active && styles.toolActive, disabled && styles.toolDisabled]}
    >
      <Text style={styles.glyph}>{glyph}</Text>
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
      {badge !== undefined && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
    </Pressable>
  );
}

export function ToolBar({
  eraserActive,
  onEraser,
  onUndo,
  canUndo,
  onHint,
  hintsLeft,
  showEraser = true,
}: Props) {
  return (
    <View style={styles.bar}>
      {showEraser && (
        <Tool glyph="◫" label="Eraser" onPress={onEraser} active={eraserActive} />
      )}
      <Tool glyph="↩" label="Undo" onPress={onUndo} disabled={!canUndo} />
      <Tool glyph="✦" label="Hint" onPress={onHint} disabled={hintsLeft <= 0} badge={hintsLeft} />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  tool: {
    minWidth: 86,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    gap: 2,
  },
  toolActive: {
    borderColor: colors.accent,
    backgroundColor: colors.surfaceAlt,
  },
  toolDisabled: {
    opacity: 0.4,
  },
  glyph: {
    color: colors.text,
    fontSize: 18,
  },
  label: {
    color: colors.textDim,
    fontFamily: fonts.sans,
    fontSize: 12,
  },
  labelActive: {
    color: colors.text,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: colors.accentText,
    fontFamily: fonts.mono,
    fontSize: 11,
  },
});

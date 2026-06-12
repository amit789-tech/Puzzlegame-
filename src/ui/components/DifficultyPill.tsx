import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Difficulty } from '../../engine/types';
import { difficultyColors, radii, spacing } from '../theme/tokens';
import { fonts } from '../theme/fonts';

export function DifficultyPill({ difficulty }: { difficulty: Difficulty }) {
  const color = difficultyColors[difficulty];
  return (
    <View style={[styles.pill, { borderColor: color }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.label, { color }]}>{difficulty.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
    gap: spacing.xs + 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 1.2,
  },
});

import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import type { Difficulty } from '../../engine/types';
import { colors, spacing } from '../theme/tokens';
import { fonts } from '../theme/fonts';
import { DifficultyPill } from './DifficultyPill';
import { PrimaryButton } from './PrimaryButton';
import { ProgressBar } from './ProgressBar';

const HEADLINES = [
  'Smooth Solve!',
  'Textbook!',
  'Clean Lines!',
  'Effortless!',
  'Dialed In!',
  'Razor Sharp!',
  'Picture Perfect!',
];

interface Props {
  difficulty: Difficulty;
  nextLevel: number;
  /** 0..1 position inside the current difficulty tier. */
  tierProgress: number;
  elapsedMs: number;
  isBestTime: boolean;
  onContinue: () => void;
}

function formatMs(ms: number): string {
  const totalSec = Math.round(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function CelebrationOverlay({
  difficulty,
  nextLevel,
  tierProgress,
  elapsedMs,
  isBestTime,
  onContinue,
}: Props) {
  const headline = useMemo(
    () => HEADLINES[Math.floor(Math.random() * HEADLINES.length)],
    [],
  );

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View entering={FadeIn.duration(250)} style={styles.backdrop} />
      <View style={styles.center}>
        <Animated.Text
          entering={ZoomIn.springify().damping(14).delay(120)}
          style={styles.headline}
        >
          {headline}
        </Animated.Text>

        <Animated.View entering={FadeInDown.delay(280)} style={styles.meta}>
          <DifficultyPill difficulty={difficulty} />
          <Text style={styles.time}>
            {formatMs(elapsedMs)}
            {isBestTime ? '  ★ best' : ''}
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(420)} style={styles.progress}>
          <ProgressBar progress={tierProgress} label={`New game at level ${nextLevel}`} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(560)} style={styles.cta}>
          <PrimaryButton label="Continue" onPress={onContinue} />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(8, 10, 13, 0.92)',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  headline: {
    color: colors.text,
    fontFamily: fonts.serifItalic,
    fontSize: 44,
    textAlign: 'center',
  },
  meta: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  time: {
    color: colors.textDim,
    fontFamily: fonts.mono,
    fontSize: 16,
  },
  progress: {
    alignSelf: 'stretch',
    marginTop: spacing.md,
  },
  cta: {
    alignSelf: 'stretch',
    marginTop: spacing.md,
  },
});

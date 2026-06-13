import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { PuzzleType } from '../src/engine/types';
import { getLevel, getCurrentPuzzleId, getSolvedIds } from '../src/state/progress';
import { getSessionCount, getStreak } from '../src/state/streak';
import { StreakBadge } from '../src/ui/components/StreakBadge';
import { fonts } from '../src/ui/theme/fonts';
import { colors, radii, spacing } from '../src/ui/theme/tokens';
import { play as playSfx } from '../src/audio/sfx';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ModeCardProps {
  label: string;
  subtitle: string;
  accentColor: string;
  level: number;
  hasProgress: boolean;
  onPress: () => void;
}

function ModeCard({ label, subtitle, accentColor, level, hasProgress, onPress }: ModeCardProps) {
  const pressed = useSharedValue(0);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - pressed.value * 0.03 }],
  }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      onPressIn={() => { pressed.value = withSpring(1, { damping: 20, stiffness: 400 }); }}
      onPressOut={() => { pressed.value = withSpring(0, { damping: 20, stiffness: 400 }); }}
      onPress={() => { playSfx('tap'); onPress(); }}
      style={[styles.card, animStyle]}
    >
      <View style={[styles.cardAccent, { backgroundColor: accentColor }]} />
      <View style={styles.cardBody}>
        <Text style={styles.cardLabel}>{label}</Text>
        <Text style={styles.cardSubtitle}>{subtitle}</Text>
      </View>
      <View style={styles.cardRight}>
        <Text style={[styles.cardLevel, { color: accentColor }]}>
          {hasProgress ? `Lvl ${level}` : 'New'}
        </Text>
        <Text style={styles.cardCta}>Play →</Text>
      </View>
    </AnimatedPressable>
  );
}

export default function Home() {
  const router = useRouter();
  const [streak, setStreak] = useState(getStreak());
  const [session, setSession] = useState(getSessionCount());
  const [levels, setLevels] = useState({
    mixed: getLevel(),
    snap: getLevel('snap'),
    shikaku: getLevel('shikaku'),
  });

  useFocusEffect(
    useCallback(() => {
      setStreak(getStreak());
      setSession(getSessionCount());
      setLevels({
        mixed: getLevel(),
        snap: getLevel('snap'),
        shikaku: getLevel('shikaku'),
      });
    }, []),
  );

  const go = (mode?: PuzzleType) => {
    if (mode) router.push(`/play?mode=${mode}`);
    else router.push('/play');
  };

  const mixedHasProgress = levels.mixed > 1 || getCurrentPuzzleId() !== null;
  const snapHasProgress = levels.snap > 1 || getCurrentPuzzleId('snap') !== null;
  const shikakuHasProgress = levels.shikaku > 1 || getCurrentPuzzleId('shikaku') !== null;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <StreakBadge streak={streak} session={session} />
      </View>

      <View style={styles.center}>
        <Text style={styles.title}>Puzzlebook</Text>
        <Text style={styles.subtitle}>Pick a mode and play.</Text>
      </View>

      <View style={styles.cards}>
        <ModeCard
          label="Mixed"
          subtitle="Snap + Shikaku · alternating"
          accentColor={colors.accent}
          level={levels.mixed}
          hasProgress={mixedHasProgress}
          onPress={() => go()}
        />
        <ModeCard
          label="Snap"
          subtitle="Draw one line through every cell"
          accentColor="#FFB347"
          level={levels.snap}
          hasProgress={snapHasProgress}
          onPress={() => go('snap')}
        />
        <ModeCard
          label="Shikaku"
          subtitle="Carve the grid into rectangles"
          accentColor="#52A9FF"
          level={levels.shikaku}
          hasProgress={shikakuHasProgress}
          onPress={() => go('shikaku')}
        />
      </View>

      <View style={styles.footer}>
        <View style={styles.links}>
          <Pressable hitSlop={8} onPress={() => router.push('/stats')}>
            <Text style={styles.link}>Stats</Text>
          </Pressable>
          <Text style={styles.linkDivider}>·</Text>
          <Pressable hitSlop={8} onPress={() => router.push('/settings')}>
            <Text style={styles.link}>Settings</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingVertical: spacing.sm,
  },
  center: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.xs,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.serif,
    fontSize: 46,
  },
  subtitle: {
    color: colors.textDim,
    fontFamily: fonts.sans,
    fontSize: 14,
  },
  cards: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardAccent: {
    width: 5,
    alignSelf: 'stretch',
  },
  cardBody: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingLeft: spacing.md,
    gap: 3,
  },
  cardLabel: {
    color: colors.text,
    fontFamily: fonts.serif,
    fontSize: 22,
  },
  cardSubtitle: {
    color: colors.textDim,
    fontFamily: fonts.sans,
    fontSize: 13,
  },
  cardRight: {
    paddingHorizontal: spacing.md,
    alignItems: 'flex-end',
    gap: 3,
  },
  cardLevel: {
    fontFamily: fonts.mono,
    fontSize: 13,
    fontWeight: '700',
  },
  cardCta: {
    color: colors.textDim,
    fontFamily: fonts.sans,
    fontSize: 13,
  },
  footer: {
    paddingBottom: spacing.xl,
  },
  links: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
  },
  link: {
    color: colors.textDim,
    fontFamily: fonts.sans,
    fontSize: 15,
  },
  linkDivider: {
    color: colors.textDim,
  },
});

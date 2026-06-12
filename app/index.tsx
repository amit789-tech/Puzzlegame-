import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getLevel } from '../src/state/progress';
import { getSessionCount, getStreak } from '../src/state/streak';
import { PrimaryButton } from '../src/ui/components/PrimaryButton';
import { StreakBadge } from '../src/ui/components/StreakBadge';
import { fonts } from '../src/ui/theme/fonts';
import { colors, spacing } from '../src/ui/theme/tokens';

export default function Home() {
  const router = useRouter();
  const [level, setLevel] = useState(getLevel());
  const [streak, setStreak] = useState(getStreak());
  const [session, setSession] = useState(getSessionCount());

  // Refresh after returning from a play session.
  useFocusEffect(
    useCallback(() => {
      setLevel(getLevel());
      setStreak(getStreak());
      setSession(getSessionCount());
    }, []),
  );

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <StreakBadge streak={streak} session={session} />
      </View>

      <View style={styles.center}>
        <Text style={styles.title}>Puzzlebook</Text>
        <Text style={styles.subtitle}>One line. One grid. Every day.</Text>
        <Text style={styles.level}>
          Level <Text style={styles.levelNumber}>{level}</Text>
        </Text>
      </View>

      <View style={styles.footer}>
        <PrimaryButton
          label={level > 1 ? 'Continue' : 'Play'}
          onPress={() => router.push('/play')}
        />
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
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.serif,
    fontSize: 52,
  },
  subtitle: {
    color: colors.textDim,
    fontFamily: fonts.sans,
    fontSize: 15,
  },
  level: {
    marginTop: spacing.xl,
    color: colors.textDim,
    fontFamily: fonts.sans,
    fontSize: 18,
  },
  levelNumber: {
    color: colors.text,
    fontFamily: fonts.mono,
    fontSize: 20,
  },
  footer: {
    paddingBottom: spacing.xl,
    gap: spacing.lg,
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

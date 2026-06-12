import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../theme/tokens';
import { fonts } from '../theme/fonts';
import { StreakBadge } from './StreakBadge';

interface Props {
  modeName: string;
  streak: number;
  session: number;
  onHelp: () => void;
}

/** Play-screen header: close, "Mode {streak}-{session}", help, settings. */
export function TopBar({ modeName, streak, session, onHelp }: Props) {
  const router = useRouter();
  return (
    <View style={styles.bar}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back to home"
        hitSlop={12}
        onPress={() => router.back()}
        style={styles.iconButton}
      >
        <Text style={styles.icon}>✕</Text>
      </Pressable>

      <View style={styles.title}>
        <Text style={styles.mode}>{modeName}</Text>
        <StreakBadge streak={streak} session={session} />
      </View>

      <View style={styles.right}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="How to play"
          hitSlop={12}
          onPress={onHelp}
          style={styles.iconButton}
        >
          <Text style={styles.icon}>?</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Settings"
          hitSlop={12}
          onPress={() => router.push('/settings')}
          style={styles.iconButton}
        >
          <Text style={styles.icon}>⚙</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  title: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  mode: {
    color: colors.text,
    fontFamily: fonts.serif,
    fontSize: 22,
  },
  right: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    color: colors.textDim,
    fontSize: 16,
    fontFamily: fonts.sans,
  },
});

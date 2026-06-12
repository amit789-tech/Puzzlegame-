import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '../theme/tokens';
import { fonts } from '../theme/fonts';

interface Props {
  streak: number;
  /** When set, renders the "{streak}-{session}" header form. */
  session?: number;
}

export function StreakBadge({ streak, session }: Props) {
  return (
    <View style={styles.badge}>
      <Text style={styles.flame}>🔥</Text>
      <Text style={styles.count}>
        {session !== undefined ? `${streak}-${session}` : streak}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.pill,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
    gap: spacing.xs,
  },
  flame: {
    fontSize: 13,
  },
  count: {
    color: colors.text,
    fontFamily: fonts.mono,
    fontSize: 14,
  },
});

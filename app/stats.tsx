import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getBestTimes, getSolvedCount } from '../src/state/stats';
import { getLongestStreak, getStreak } from '../src/state/streak';
import { fonts } from '../src/ui/theme/fonts';
import { colors, radii, spacing } from '../src/ui/theme/tokens';

function formatMs(ms: number): string {
  const totalSec = Math.round(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.tile}>
      <Text style={styles.tileValue}>{value}</Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </View>
  );
}

export default function Stats() {
  const router = useRouter();
  const best = getBestTimes();
  const bestRows = Object.entries(best).sort(([a], [b]) => a.localeCompare(b));

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable hitSlop={12} onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>
        <Text style={styles.title}>Stats</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.tiles}>
          <StatTile label="Streak" value={getStreak()} />
          <StatTile label="Longest" value={getLongestStreak()} />
          <StatTile label="Snap solves" value={getSolvedCount('snap')} />
          <StatTile label="Shikaku solves" value={getSolvedCount('shikaku')} />
          <StatTile label="Pips solves" value={getSolvedCount('pips')} />
        </View>

        <Text style={styles.section}>Best times</Text>
        {bestRows.length === 0 ? (
          <Text style={styles.empty}>Solve a puzzle to set your first best time.</Text>
        ) : (
          <View style={styles.card}>
            {bestRows.map(([key, ms], i) => {
              const [type, size] = key.split(':');
              return (
                <View key={key}>
                  {i > 0 && <View style={styles.divider} />}
                  <View style={styles.bestRow}>
                    <Text style={styles.bestLabel}>
                      {type === 'snap' ? 'Snap' : type === 'shikaku' ? 'Shikaku' : 'Pips'} {size}
                    </Text>
                    <Text style={styles.bestTime}>{formatMs(ms)}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
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
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  back: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    color: colors.text,
    fontSize: 22,
    marginTop: -2,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.serif,
    fontSize: 30,
  },
  content: {
    paddingBottom: spacing.xl,
  },
  tiles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  tile: {
    flexBasis: '48%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
    gap: 2,
  },
  tileValue: {
    color: colors.text,
    fontFamily: fonts.mono,
    fontSize: 26,
  },
  tileLabel: {
    color: colors.textDim,
    fontFamily: fonts.sans,
    fontSize: 12,
  },
  section: {
    color: colors.text,
    fontFamily: fonts.serif,
    fontSize: 22,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  empty: {
    color: colors.textDim,
    fontFamily: fonts.sans,
    fontSize: 14,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  bestRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  bestLabel: {
    color: colors.text,
    fontFamily: fonts.sans,
    fontSize: 15,
  },
  bestTime: {
    color: colors.gold,
    fontFamily: fonts.mono,
    fontSize: 15,
  },
});

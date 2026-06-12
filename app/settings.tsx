import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  hapticsEnabled,
  setHapticsEnabled,
  setSoundEnabled,
  soundEnabled,
} from '../src/state/settings';
import { resetProgress } from '../src/state/progress';
import { fonts } from '../src/ui/theme/fonts';
import { colors, radii, spacing } from '../src/ui/theme/tokens';

function Row({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (on: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.surfaceAlt, true: colors.accent }}
        thumbColor={colors.text}
      />
    </View>
  );
}

export default function Settings() {
  const router = useRouter();
  const [sound, setSound] = useState(soundEnabled());
  const [haptics, setHaptics] = useState(hapticsEnabled());

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable hitSlop={12} onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>
        <Text style={styles.title}>Settings</Text>
      </View>

      <View style={styles.card}>
        <Row
          label="Sound"
          value={sound}
          onChange={(on) => {
            setSound(on);
            setSoundEnabled(on);
          }}
        />
        <View style={styles.divider} />
        <Row
          label="Haptics"
          value={haptics}
          onChange={(on) => {
            setHaptics(on);
            setHapticsEnabled(on);
          }}
        />
      </View>

      <Pressable
        style={styles.danger}
        onPress={() =>
          Alert.alert(
            'Reset progress?',
            'Level, streak, and stats go back to zero. Settings are kept.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Reset',
                style: 'destructive',
                onPress: () => {
                  resetProgress();
                  router.back();
                },
              },
            ],
          )
        }
      >
        <Text style={styles.dangerText}>Reset progress</Text>
      </Pressable>
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  rowLabel: {
    color: colors.text,
    fontFamily: fonts.sans,
    fontSize: 16,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  danger: {
    marginTop: spacing.xl,
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  dangerText: {
    color: colors.error,
    fontFamily: fonts.sans,
    fontSize: 15,
  },
});

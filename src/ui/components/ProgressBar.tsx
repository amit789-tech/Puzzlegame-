import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { colors, radii, spacing } from '../theme/tokens';
import { fonts } from '../theme/fonts';

interface Props {
  /** 0..1 fill, animated in on mount. */
  progress: number;
  label: string;
}

/** "New game at level N" bar on the celebration screen. */
export function ProgressBar({ progress, label }: Props) {
  const fill = useSharedValue(0);

  useEffect(() => {
    fill.value = withDelay(350, withTiming(progress, { duration: 700 }));
  }, [fill, progress]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${Math.min(1, Math.max(0, fill.value)) * 100}%`,
  }));

  return (
    <View style={styles.wrap}>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, fillStyle]} />
      </View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'stretch',
    gap: spacing.sm,
    alignItems: 'center',
  },
  track: {
    alignSelf: 'stretch',
    height: 10,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceAlt,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radii.pill,
    backgroundColor: colors.accent,
  },
  label: {
    color: colors.textDim,
    fontFamily: fonts.sans,
    fontSize: 13,
  },
});

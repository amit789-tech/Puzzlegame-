import React from 'react';
import { Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { play } from '../../audio/sfx';
import { colors, radii, spacing } from '../theme/tokens';
import { fonts } from '../theme/fonts';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Props {
  label: string;
  onPress: () => void;
  style?: ViewStyle;
  disabled?: boolean;
}

/** The big red Continue button. */
export function PrimaryButton({ label, onPress, style, disabled }: Props) {
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - pressed.value * 0.04 }],
  }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      disabled={disabled}
      onPressIn={() => {
        pressed.value = withSpring(1, { damping: 20, stiffness: 400 });
      }}
      onPressOut={() => {
        pressed.value = withSpring(0, { damping: 20, stiffness: 400 });
      }}
      onPress={() => {
        play('tap');
        onPress();
      }}
      style={[styles.button, disabled && styles.disabled, animatedStyle, style]}
    >
      <Text style={styles.label}>{label}</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.accent,
    borderRadius: radii.pill,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    color: colors.accentText,
    fontFamily: fonts.sans,
    fontWeight: '700',
    fontSize: 17,
    letterSpacing: 0.4,
  },
});

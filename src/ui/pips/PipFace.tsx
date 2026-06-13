import React from 'react';
import { View } from 'react-native';
import { colors } from '../theme/tokens';
import { DOT_LAYOUT } from './pips-render';

/** One pip face: a square of `size` px with dice-style dots for `value`. */
export function PipFace({ value, size }: { value: number; size: number }) {
  const dot = size * 0.16;
  return (
    <View style={{ width: size, height: size }}>
      {(DOT_LAYOUT[value] ?? []).map(([fx, fy], i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            width: dot,
            height: dot,
            borderRadius: dot / 2,
            backgroundColor: colors.pipsDot,
            left: fx * size - dot / 2,
            top: fy * size - dot / 2,
          }}
        />
      ))}
    </View>
  );
}

import * as Haptics from 'expo-haptics';
import { hapticsEnabled } from '../state/settings';

/** Per-cell tick while drawing. */
export function tick(): void {
  if (!hapticsEnabled()) return;
  Haptics.selectionAsync().catch(() => {});
}

/** Committing a rectangle / meaningful placement. */
export function place(): void {
  if (!hapticsEnabled()) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
}

export function success(): void {
  if (!hapticsEnabled()) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

export function error(): void {
  if (!hapticsEnabled()) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
}

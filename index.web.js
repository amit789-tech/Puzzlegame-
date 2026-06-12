// Web entry: Skia on web renders through CanvasKit (WASM), which must be
// loaded before any Skia component mounts. The .wasm file is served from
// public/ so the game stays fully offline-capable. EXPO_BASE_URL is set by
// the exporter when the app is hosted under a subpath (e.g. GitHub Pages).
import { LoadSkiaWeb } from '@shopify/react-native-skia/lib/module/web';

const base = process.env.EXPO_BASE_URL ?? '';

LoadSkiaWeb({ locateFile: (file) => `${base}/${file}` })
  .then(() => require('expo-router/entry'))
  .catch((err) => console.error('Failed to load CanvasKit', err));

// Web entry: Skia on web renders through CanvasKit (WASM), which must be
// loaded before any Skia component mounts. The .wasm file is served from
// public/ so the game stays fully offline-capable.
import { LoadSkiaWeb } from '@shopify/react-native-skia/lib/module/web';

LoadSkiaWeb({ locateFile: (file) => `/${file}` })
  .then(() => require('expo-router/entry'))
  .catch((err) => console.error('Failed to load CanvasKit', err));

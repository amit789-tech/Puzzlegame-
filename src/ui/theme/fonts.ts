/** Font family names + the map fed to expo-font's useFonts in _layout. */
export const fonts = {
  serif: 'DMSerifDisplay',
  serifItalic: 'DMSerifDisplay-Italic',
  sans: 'Inter',
  mono: 'JetBrainsMono',
} as const;

export const fontAssets = {
  [fonts.serif]: require('../../../assets/fonts/DMSerifDisplay-Regular.ttf'),
  [fonts.serifItalic]: require('../../../assets/fonts/DMSerifDisplay-Italic.ttf'),
  [fonts.sans]: require('../../../assets/fonts/Inter-Regular.ttf'),
  [fonts.mono]: require('../../../assets/fonts/JetBrainsMono-Medium.ttf'),
};

/** The mono TTF is also rendered inside Skia canvases (board numbers). */
export const monoFontAsset = require('../../../assets/fonts/JetBrainsMono-Medium.ttf');

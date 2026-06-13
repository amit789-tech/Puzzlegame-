/** Design tokens. Dark, paper-textbook mood: serif headlines, mono numbers. */
export const colors = {
  bg: '#101418',
  surface: '#1A2026',
  surfaceAlt: '#232B34',
  border: '#2E3842',
  text: '#F2F4F6',
  textDim: '#97A3AF',
  accent: '#E5484D', // the red Continue button
  accentText: '#FFFFFF',
  success: '#4CC38A',
  error: '#FF6369',
  gold: '#F5C518',
  // Snap path trail gradient (start → end).
  pathGradient: ['#FFB347', '#FF5D5D', '#E5484D'] as const,
  waypoint: '#F2F4F6',
  waypointText: '#101418',
  gridLine: '#2A333D',
  // Shikaku rect fills cycle through these translucent hues.
  rectFills: [
    'rgba(229, 72, 77, 0.35)',
    'rgba(76, 195, 138, 0.32)',
    'rgba(82, 169, 255, 0.32)',
    'rgba(245, 197, 24, 0.30)',
    'rgba(192, 132, 252, 0.32)',
    'rgba(255, 138, 92, 0.32)',
  ] as const,
  rectStroke: '#F2F4F6',
  // Pips: a region palette of [solid badge color, translucent cell fill].
  pipsRegions: [
    { solid: '#7C5CD9', fill: 'rgba(124, 92, 217, 0.28)' },
    { solid: '#C2185B', fill: 'rgba(229, 72, 130, 0.28)' },
    { solid: '#0E8C8C', fill: 'rgba(38, 178, 178, 0.26)' },
    { solid: '#D9730D', fill: 'rgba(229, 138, 24, 0.28)' },
    { solid: '#4C7A2E', fill: 'rgba(124, 179, 66, 0.26)' },
    { solid: '#1E5BB0', fill: 'rgba(56, 132, 224, 0.28)' },
    { solid: '#9A6AD9', fill: 'rgba(176, 132, 252, 0.26)' },
    { solid: '#B0641E', fill: 'rgba(255, 138, 92, 0.26)' },
  ] as const,
  // Pips: domino tile + pip dot colors.
  pipsTile: '#ECEFF2',
  pipsTileSelected: '#FFF4CC',
  pipsDot: '#1A2026',
  pipsDivider: '#B8C0C8',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radii = {
  sm: 8,
  md: 14,
  lg: 22,
  pill: 999,
};

export const difficultyColors = {
  easy: '#4CC38A',
  medium: '#F5C518',
  hard: '#FF6369',
} as const;

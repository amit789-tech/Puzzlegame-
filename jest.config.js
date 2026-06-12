/**
 * Tests cover only the pure-TypeScript puzzle logic (src/engine, src/puzzles,
 * tools). No React Native imports are allowed in those modules, so plain
 * ts-jest in a node environment is enough — no jest-expo needed.
 */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      { tsconfig: { jsx: 'react-jsx', types: ['jest', 'node'] } },
    ],
  },
};

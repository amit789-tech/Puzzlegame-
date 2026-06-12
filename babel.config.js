module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Reanimated v4 worklets: babel-preset-expo auto-includes
    // 'react-native-worklets/plugin' (must run last) when the package is
    // installed, so it is not listed here a second time.
    plugins: [],
  };
};

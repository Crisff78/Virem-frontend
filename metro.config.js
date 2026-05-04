const { getDefaultConfig } = require('@expo/metro-config');

const config = getDefaultConfig(__dirname);

// Support for web platform and mocking native-only modules
config.resolver.sourceExts.push('mjs');

if (process.env.EXPO_PUBLIC_PLATFORM === 'web' || process.env.npm_lifecycle_event?.includes('web')) {
  config.resolver.extraNodeModules = {
    ...config.resolver.extraNodeModules,
    'react-native-webrtc': require.resolve('./mocks/react-native-webrtc.js'),
    '@livekit/react-native': require.resolve('./mocks/livekit-react-native.js'),
  };
}

module.exports = config;

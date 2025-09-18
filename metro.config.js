// Metro configuration
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Basic optimization settings
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    // Basic minification
    mangle: {
      keep_fnames: true,
    },
    compress: {
      drop_console: process.env.NODE_ENV === 'production',
      drop_debugger: process.env.NODE_ENV === 'production',
    },
  },
};

// Simple resolver configuration
config.resolver = {
  ...config.resolver,
  alias: {
    // Alias commonly used modules
    'react-native-vector-icons': '@expo/vector-icons',
  },
};

module.exports = config;

// Metro configuration for bundle optimization
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Bundle optimization settings
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    // Enable advanced minification
    mangle: {
      keep_fnames: true,
    },
    compress: {
      drop_console: process.env.NODE_ENV === 'production',
      drop_debugger: process.env.NODE_ENV === 'production',
      pure_funcs: process.env.NODE_ENV === 'production' ? ['console.log', 'console.info', 'console.debug'] : [],
    },
  },
};

// Tree shaking optimization
config.resolver = {
  ...config.resolver,
  alias: {
    // Alias commonly used modules to reduce bundle size
    'react-native-vector-icons': '@expo/vector-icons',
  },
  // Enable tree shaking
  unstable_enablePackageExports: true,
};

// Bundle splitting for better performance
config.serializer = {
  ...config.serializer,
  // Enable code splitting
  createModuleIdFactory: () => (path) => {
    // Create deterministic module IDs for better caching
    return require('crypto').createHash('md5').update(path).digest('hex').substr(0, 8);
  },
};

module.exports = config;

// Environment configuration management

// Environment types
export type Environment = 'development' | 'production' | 'staging';

// Get current environment
export const getEnvironment = (): Environment => {
  if (__DEV__) {
    return 'development';
  }
  
  // Check if we're in staging (you can add staging logic here)
  if (process.env.EXPO_PUBLIC_ENVIRONMENT === 'staging') {
    return 'staging';
  }
  
  return 'production';
};

// Environment-specific configuration
const configs = {
  development: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL || (process.env.EXPO_PUBLIC_RAILWAY_DEPLOYMENT === 'true' ? 'https://ladder-backend-production.up.railway.app/api' : 'http://localhost:3001/api'),
    appName: 'Ladder (Dev)',
    appVersion: '1.0.0-dev',
    debugMode: true,
    enableAnalytics: false,
    enableCrashReporting: false,
    enablePushNotifications: false,
    logLevel: 'debug' as const,
  },
  staging: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL || process.env.EXPO_PUBLIC_STAGING_API_URL || 'https://ladder-backend-production.up.railway.app/api',
    appName: 'Ladder (Staging)',
    appVersion: '1.0.0-staging',
    debugMode: true,
    enableAnalytics: false,
    enableCrashReporting: true,
    enablePushNotifications: false,
    logLevel: 'info' as const,
  },
  production: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL || process.env.EXPO_PUBLIC_PRODUCTION_API_URL || 'https://ladder-backend-production.up.railway.app/api',
    appName: 'Ladder',
    appVersion: '1.0.0',
    debugMode: false,
    enableAnalytics: true,
    enableCrashReporting: true,
    enablePushNotifications: true,
    logLevel: 'warn' as const,
  },
};

// Get current configuration
export const getConfig = () => {
  const environment = getEnvironment();
  const baseConfig = configs[environment];
  
  // Override with environment variables if provided
  return {
    ...baseConfig,
    apiUrl: process.env.EXPO_PUBLIC_API_URL || baseConfig.apiUrl,
    appName: process.env.EXPO_PUBLIC_APP_NAME || baseConfig.appName,
    appVersion: process.env.EXPO_PUBLIC_APP_VERSION || baseConfig.appVersion,
    debugMode: process.env.EXPO_PUBLIC_DEBUG_MODE === 'true' || baseConfig.debugMode,
    enableAnalytics: process.env.EXPO_PUBLIC_ENABLE_ANALYTICS === 'true' || baseConfig.enableAnalytics,
    enableCrashReporting: process.env.EXPO_PUBLIC_ENABLE_CRASH_REPORTING === 'true' || baseConfig.enableCrashReporting,
    enablePushNotifications: process.env.EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS === 'true' || baseConfig.enablePushNotifications,
  };
};

// Helper function to get API URL for Expo Go testing
export const getApiUrlForExpoGo = () => {
  // Check if we're running in Expo Go or have Railway deployment flag
  const isExpoGo = __DEV__ && (
    (typeof window !== 'undefined' && window.location?.hostname?.includes('exp.host')) ||
    process.env.EXPO_PUBLIC_RAILWAY_DEPLOYMENT === 'true'
  );
  
  if (isExpoGo) {
    // For Expo Go, prioritize Railway URL since localhost won't work
    const railwayUrl = process.env.EXPO_PUBLIC_API_URL || 'https://ladder-backend-production.up.railway.app/api';
    
    // Validate that the URL is properly configured
    if (railwayUrl.includes('your-railway-app-name') || railwayUrl.includes('localhost')) {
      console.warn('⚠️ Please update EXPO_PUBLIC_API_URL in .env.expo-go with your actual Railway deployment URL');
      console.warn('⚠️ Current URL:', railwayUrl);
    }
    
    return railwayUrl;
  }
  
  return getConfig().apiUrl;
};

// Export current configuration
export const config = getConfig();

// Validate configuration
export const validateConfig = () => {
  const errors: string[] = [];
  
  if (!config.apiUrl) {
    errors.push('API URL is not configured');
  }
  
  if (!config.apiUrl.startsWith('http://') && !config.apiUrl.startsWith('https://')) {
    errors.push('API URL must start with http:// or https://');
  }
  
  // Check for Railway-specific configuration issues
  if (config.apiUrl.includes('railway.app') && !config.apiUrl.includes('https://')) {
    errors.push('Railway URLs must use HTTPS');
  }
  
  if (errors.length > 0) {
    console.warn(`Configuration validation warnings: ${errors.join(', ')}`);
    // Don't throw in production, just warn
    if (__DEV__) {
      throw new Error(`Configuration validation failed: ${errors.join(', ')}`);
    }
  }
  
  return true;
};

// Log configuration (only in development)
if (__DEV__) {
  console.log('🔧 App Configuration:', {
    environment: getEnvironment(),
    apiUrl: config.apiUrl,
    appName: config.appName,
    appVersion: config.appVersion,
    debugMode: config.debugMode,
  });
}

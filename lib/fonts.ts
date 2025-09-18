// Font configuration for Expo Go compatibility
export const Fonts = {
  // System fonts that work reliably in Expo Go
  system: 'System',
  systemBold: 'System',
  
  // Platform-specific system fonts
  ios: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  android: {
    regular: 'System',
    medium: 'System', 
    bold: 'System',
  },
  
  // Custom fonts (only use these in development builds, not Expo Go)
  custom: {
    // SpaceMono: 'SpaceMono', // Uncomment when using development builds
  }
};

// Font weights that work across platforms
export const FontWeights = {
  light: '300' as const,
  regular: '400' as const,
  medium: '500' as const,
  semiBold: '600' as const,
  bold: '700' as const,
  extraBold: '800' as const,
};

// Safe font styles for Expo Go
export const SafeFontStyles = {
  heading: {
    fontFamily: Fonts.system,
    fontWeight: FontWeights.bold,
    fontSize: 24,
  },
  subheading: {
    fontFamily: Fonts.system,
    fontWeight: FontWeights.semiBold,
    fontSize: 18,
  },
  body: {
    fontFamily: Fonts.system,
    fontWeight: FontWeights.regular,
    fontSize: 16,
  },
  caption: {
    fontFamily: Fonts.system,
    fontWeight: FontWeights.regular,
    fontSize: 12,
  },
  button: {
    fontFamily: Fonts.system,
    fontWeight: FontWeights.semiBold,
    fontSize: 16,
  },
};

// Helper function to get safe font family
export const getSafeFontFamily = (fontName?: string): string => {
  if (!fontName) return Fonts.system;
  
  // In Expo Go, always return system font for safety
  if (__DEV__) {
    return Fonts.system;
  }
  
  // In development builds, you can use custom fonts
  return fontName;
};

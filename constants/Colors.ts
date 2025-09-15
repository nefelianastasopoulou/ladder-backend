/**
 * Updated color palette for Ladder student platform.
 * Brand color: blue (#3b82f6)
 */

const brandBlue = '#4f46e5'; // Warmer, more approachable blue
const accentBlue = '#60a5fa'; // Lighter blue accent
const backgroundLight = '#fafbfc';
const backgroundDark = '#0f172a';
const cardLight = '#ffffff';
const cardDark = '#1e293b';
const textLight = '#1e293b';
const textDark = '#f1f5f9';

export const Colors = {
  light: {
    text: textLight,
    background: backgroundLight,
    tint: brandBlue,
    accent: accentBlue,
    card: cardLight,
    icon: brandBlue,
    tabIconDefault: '#94a3b8',
    tabIconSelected: brandBlue,
    filterBg: '#e0e7ef',
    filterActive: brandBlue,
    border: '#e2e8f0',
  },
  dark: {
    text: textDark,
    background: backgroundDark,
    tint: brandBlue,
    accent: accentBlue,
    card: cardDark,
    icon: accentBlue,
    tabIconDefault: '#64748b',
    tabIconSelected: brandBlue,
    filterBg: '#1e293b',
    filterActive: brandBlue,
    border: '#334155',
  },
};

export const Colors = {
  black: '#1A1A1A',
  white: '#FFFFFF',
  gold: '#A59466',
  goldLight: '#C4B58A',
  goldDark: '#8A7A52',

  gray50: '#F7F7F7',
  gray100: '#EEEEEE',
  gray200: '#D9D9D9',
  gray300: '#B3B3B3',
  gray500: '#666666',
  gray700: '#3A3A3A',

  // Emergency / stress colors
  emergencyRed: '#D32F2F',
  emergencyRedDark: '#B71C1C',
  safeGreen: '#2E7D32',
  warningOrange: '#F57C00',
};

export const Fonts = {
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 999,
};

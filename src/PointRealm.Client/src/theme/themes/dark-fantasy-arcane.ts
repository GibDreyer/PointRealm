import { Theme } from '../types';

export const darkFantasyArcane: Theme = {
  key: 'dark-fantasy-arcane',
  name: 'Dark Fantasy Arcane',
  description: 'A deep, mystical theme with cyan and gold accents against a void-like background.',
  version: '1.0.0',
  tokens: {
    colors: {
      bg: '#0a0b14', // Near-black navy
      surface: '#131620', // Dark slate
      surfaceElevated: '#1c202e',
      text: '#e2e8f0', // Slate 200
      textMuted: '#94a3b8', // Slate 400
      border: '#2d3748',
      primary: '#06b6d4', // Arcane Cyan
      secondary: '#f59e0b', // Ember Gold
      success: '#10b981', // Potion Green
      danger: '#ef4444', // Blood Red
      warning: '#f59e0b',
      info: '#3b82f6',
    },
    glow: {
      primaryGlow: '0 0 20px rgba(6, 182, 212, 0.4)',
      secondaryGlow: '0 0 20px rgba(245, 158, 11, 0.3)',
    },
    typography: {
      headingFont: '"Cinzel", serif',
      bodyFont: '"Inter", sans-serif',
      monoFont: '"Fira Code", monospace',
      fontScaleBase: '16px',
      fontScaleRatio: '1.25',
    },
    radii: {
      sm: '4px',
      md: '8px',
      lg: '16px',
      xl: '24px',
    },
    shadows: {
      soft: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.15)',
      hover: '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(6, 182, 212, 0.2)',
      pressed: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.3)',
    },
    motion: {
      fastMs: '150ms',
      baseMs: '300ms',
      slowMs: '500ms',
      enterEasing: 'cubic-bezier(0.16, 1, 0.3, 1)',
      loopEasing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
  effects: {
    particlesEnabled: true,
    vignettePulseEnabled: true,
  }
};

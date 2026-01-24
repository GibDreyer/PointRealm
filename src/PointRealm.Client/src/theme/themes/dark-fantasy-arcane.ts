import { Theme } from '../types';

export const darkFantasyArcane: Theme = {
  key: 'dark-fantasy-arcane',
  name: 'Dark Fantasy Arcane',
  description: 'A deep, mystical theme with cyan and gold accents against a void-like background.',
  version: '1.0.0',
  tokens: {
    colors: {
      bg: '#06070a', // Deeper black/navy
      surface: '#0f1117', // Slate panels
      surfaceElevated: '#1a1d26',
      text: '#f8fafc', // Slate 50
      textMuted: '#94a3b8', // Slate 400
      border: '#1e293b', // Slate 800
      primary: '#06b6d4', // Arcane Cyan
      secondary: '#fbbf24', // Amber/Ember Gold (Vibrant)
      success: '#10b981', // Potion Green
      danger: '#f43f5e', // Blood Red
      warning: '#f59e0b',
      info: '#3b82f6',
    },
    glow: {
      primaryGlow: '0 0 30px rgba(6, 182, 212, 0.5)',
      secondaryGlow: '0 0 30px rgba(251, 191, 36, 0.4)',
    },
    typography: {
      headingFont: "'Cinzel', serif",
      bodyFont: "'Inter', sans-serif",
      monoFont: "'Fira Code', monospace",
      fontScaleBase: '16px',
      fontScaleRatio: '1.25',
    },
    radii: {
      sm: '8px',
      md: '16px',
      lg: '24px',
      xl: '32px',
    },
    shadows: {
      soft: '0 4px 20px -2px rgba(0, 0, 0, 0.5)',
      hover: '0 10px 25px -5px rgba(0, 0, 0, 0.6), 0 0 20px -5px rgba(6, 182, 212, 0.3)',
      pressed: 'inset 0 4px 6px 0 rgba(0, 0, 0, 0.4)',
    },
    motion: {
      fastMs: '200ms',
      baseMs: '350ms',
      slowMs: '600ms',
      enterEasing: 'cubic-bezier(0.16, 1, 0.3, 1)',
      loopEasing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
  assets: {
    textures: {
      noiseOverlay: 'https://www.transparenttextures.com/patterns/stardust.png',
      surfaceTexture: 'https://www.transparenttextures.com/patterns/dark-matter.png',
    }
  },
  effects: {
    particlesEnabled: true,
    vignettePulseEnabled: true,
  }
};

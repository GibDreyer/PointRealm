import { Theme } from '../types';

export const neonVoid: Theme = {
  key: 'neon-void',
  name: 'Neon Void',
  description: 'A starbound, neon theme with cyan and violet accents.',
  version: '1.0.0',
  tokens: {
    colors: {
      bg: '#05060f',
      surface: '#0b1020',
      surfaceElevated: '#141b2f',
      text: '#e2e8f0',
      textMuted: '#94a3b8',
      border: '#1f2a44',
      primary: '#38bdf8',
      secondary: '#a855f7',
      success: '#22c55e',
      danger: '#f43f5e',
      warning: '#f59e0b',
      info: '#60a5fa',
    },
    glow: {
      primaryGlow: '0 0 30px rgba(56, 189, 248, 0.45)',
      secondaryGlow: '0 0 26px rgba(168, 85, 247, 0.4)',
    },
    typography: {
      headingFont: "'Inter', sans-serif",
      bodyFont: "'Inter', sans-serif",
      monoFont: "'Fira Code', monospace",
      fontScaleBase: '16px',
      fontScaleRatio: '1.2',
    },
    radii: {
      sm: '6px',
      md: '12px',
      lg: '20px',
      xl: '28px',
    },
    shadows: {
      soft: '0 12px 40px -20px rgba(56, 189, 248, 0.3)',
      hover: '0 16px 45px -18px rgba(168, 85, 247, 0.35)',
      pressed: 'inset 0 4px 10px rgba(15, 23, 42, 0.6)',
    },
    motion: {
      fastMs: '180ms',
      baseMs: '320ms',
      slowMs: '520ms',
      enterEasing: 'cubic-bezier(0.16, 1, 0.3, 1)',
      loopEasing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
  assets: {
    textures: {
      noiseOverlay: 'https://www.transparenttextures.com/patterns/stardust.png',
      surfaceTexture: 'https://www.transparenttextures.com/patterns/black-orchid.png',
    }
  },
  effects: {
    particlesEnabled: true,
    vignettePulseEnabled: true,
    vibe: 'space',
    particleColor: '#38bdf8',
  }
};

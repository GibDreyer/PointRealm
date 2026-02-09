import { Theme } from '../types';

export const minimalSlate: Theme = {
  key: 'minimal-slate',
  name: 'Minimal Slate',
  description: 'A clean, professional light theme with subtle accents.',
  version: '1.0.0',
  tokens: {
    colors: {
      bg: '#f8fafc',
      surface: '#ffffff',
      surfaceElevated: '#f1f5f9',
      text: '#0f172a',
      textMuted: '#64748b',
      border: '#e2e8f0',
      primary: '#2563eb',
      secondary: '#0ea5e9',
      success: '#16a34a',
      danger: '#dc2626',
      warning: '#f59e0b',
      info: '#0284c7',
    },
    glow: {
      primaryGlow: '0 0 16px rgba(37, 99, 235, 0.2)',
      secondaryGlow: '0 0 14px rgba(14, 165, 233, 0.2)',
    },
    typography: {
      headingFont: "'Inter', sans-serif",
      bodyFont: "'Inter', sans-serif",
      monoFont: "'Fira Code', monospace",
      fontScaleBase: '16px',
      fontScaleRatio: '1.15',
    },
    radii: {
      sm: '6px',
      md: '10px',
      lg: '16px',
      xl: '22px',
    },
    shadows: {
      soft: '0 8px 20px -12px rgba(15, 23, 42, 0.25)',
      hover: '0 12px 28px -16px rgba(15, 23, 42, 0.25)',
      pressed: 'inset 0 2px 6px rgba(15, 23, 42, 0.2)',
    },
    motion: {
      fastMs: '160ms',
      baseMs: '260ms',
      slowMs: '420ms',
      enterEasing: 'cubic-bezier(0.16, 1, 0.3, 1)',
      loopEasing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
  effects: {
    particlesEnabled: false,
    vignettePulseEnabled: false,
  }
};

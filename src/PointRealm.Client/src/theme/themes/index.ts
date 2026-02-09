import { Theme } from '../types';
import { darkFantasyArcane } from './dark-fantasy-arcane';
import { neonVoid } from './neon-void';
import { minimalSlate } from './minimal-slate';

const themes: Record<string, Theme> = {
  [darkFantasyArcane.key]: darkFantasyArcane,
  [neonVoid.key]: neonVoid,
  [minimalSlate.key]: minimalSlate,
};

// Stubs for other themes
const createStubTheme = (key: string, name: string, primary: string, secondary: string, bg: string, vibe: 'space' | 'forest' | 'water' | 'fire' | 'arcane'): Theme => ({
  ...darkFantasyArcane,
  key,
  name,
  tokens: {
    ...darkFantasyArcane.tokens,
    colors: {
      ...darkFantasyArcane.tokens.colors,
      bg,
      surface: `color-mix(in srgb, ${bg}, white 5%)`,
      surfaceElevated: `color-mix(in srgb, ${bg}, white 10%)`,
      primary,
      secondary,
    }
  },
  effects: {
    ...darkFantasyArcane.effects,
    vibe,
    particleColor: primary,
  }
});

const celestialVoid = createStubTheme('celestial-void', 'Celestial Void', '#a855f7', '#6366f1', '#050510', 'space');
const emeraldGrove = createStubTheme('emerald-grove', 'Emerald Grove', '#10b981', '#fbbf24', '#041a10', 'forest');
const abyssalTide = createStubTheme('abyssal-tide', 'Abyssal Tide', '#0ea5e9', '#06b6d4', '#02101a', 'water');
const infernalKeep = createStubTheme('infernal-keep', 'Infernal Keep', '#ef4444', '#f59e0b', '#1a0505', 'fire');

themes[celestialVoid.key] = celestialVoid;
themes[emeraldGrove.key] = emeraldGrove;
themes[abyssalTide.key] = abyssalTide;
themes[infernalKeep.key] = infernalKeep;

export const themeRegistry = themes;

export const getTheme = (key: string | undefined | null): Theme => {
  if (!key || !themes[key]) {
    if (key) {
      console.warn(`[ThemeRegistry] Unknown theme key: "${key}". Falling back to default.`);
    }
    return darkFantasyArcane;
  }
  return themes[key];
};

export const listThemes = (): Theme[] => Object.values(themes);

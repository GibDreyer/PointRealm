import { Theme } from '../types';
import { darkFantasyArcane } from './dark-fantasy-arcane';

const themes: Record<string, Theme> = {
  [darkFantasyArcane.key]: darkFantasyArcane,
};

// Stubs for other themes (can be expanded later)
const createStubTheme = (key: string, name: string, primary: string, secondary: string): Theme => ({
  ...darkFantasyArcane,
  key,
  name,
  tokens: {
    ...darkFantasyArcane.tokens,
    colors: {
      ...darkFantasyArcane.tokens.colors,
      primary,
      secondary,
    }
  }
});

const frostRealm = createStubTheme('frost-realm', 'Frost Realm', '#38bdf8', '#a78bfa');
const emberRealm = createStubTheme('ember-realm', 'Ember Realm', '#f97316', '#ef4444');
const voidRealm = createStubTheme('void-realm', 'Void Realm', '#a855f7', '#6366f1');

themes[frostRealm.key] = frostRealm;
themes[emberRealm.key] = emberRealm;
themes[voidRealm.key] = voidRealm;

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

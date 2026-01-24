import { Theme } from './types';

export const applyTheme = (theme: Theme) => {
  const root = document.documentElement;

  // Helper to set variable
  const set = (name: string, value: string) => {
    root.style.setProperty(`--pr-${name}`, value);
  };

  // Colors
  Object.entries(theme.tokens.colors).forEach(([key, value]) => {
    // CamelCase to kebab-case (e.g. surfaceElevated -> surface-elevated)
    const kebabDate = key.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
    set(kebabDate, value);
  });

  // Glow
  Object.entries(theme.tokens.glow).forEach(([key, value]) => {
     const kebabDate = key.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
     set(kebabDate, value);
  });

   // Typography
   Object.entries(theme.tokens.typography).forEach(([key, value]) => {
    const kebabDate = key.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
    set(kebabDate, value);
  });

   // Radii
   Object.entries(theme.tokens.radii).forEach(([key, value]) => {
    set(`radius-${key}`, value);
  });

    // Shadows
    Object.entries(theme.tokens.shadows).forEach(([key, value]) => {
        set(`shadow-${key}`, value);
    });

    // Motion
    Object.entries(theme.tokens.motion).forEach(([key, value]) => {
        const kebabDate = key.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
        set(`motion-${kebabDate}`, value);
    });

    // Textures (optional)
    if (theme.assets?.textures) {
        Object.entries(theme.assets.textures).forEach(([key, value]) => {
            if (value) {
                const kebabDate = key.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
                set(`texture-${kebabDate}`, `url('${value}')`);
            }
        });
    }
};

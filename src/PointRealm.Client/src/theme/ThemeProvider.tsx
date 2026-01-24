import React, { createContext, useContext, useLayoutEffect, useState, useMemo, useEffect } from 'react';
import { Theme } from './types';
import { getTheme, listThemes } from './themes';
import { applyTheme } from './applyTheme';

interface ThemeContextValue {
  theme: Theme;
  setThemeKey: (key: string) => void;
  availableThemes: Theme[];
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
  initialThemeKey?: string;
}

// Simple font loader hook
const useFontLoader = (theme: Theme) => {
  useEffect(() => {
    // For now, we assume standard Google Fonts that we might want to preconnect
    // In a real scenario, this would dynamically construct the Google Fonts URL based on the theme families
    // However, since we are hardcoding Cinzel and Inter for now, we can ensure they are in index.html
    // or loaded here.
    
    // Example dynamic check:
    // const link = document.createElement('link');
    // link.href = ...
    // document.head.appendChild(link);
    
    // For this implementation, we will assume standard fonts are available or added via a global import in index.css/html
    // If specific per-theme fonts were needed not in the base set, we'd load them here.
  }, [theme.key]);
};

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children, initialThemeKey }) => {
  const [currentThemeKey, setCurrentThemeKey] = useState<string>(initialThemeKey || 'dark-fantasy-arcane');

  const theme = useMemo(() => getTheme(currentThemeKey), [currentThemeKey]);
  const availableThemes = useMemo(() => listThemes(), []);

  useLayoutEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useFontLoader(theme);

  const value = useMemo(() => ({
    theme,
    setThemeKey: setCurrentThemeKey,
    availableThemes
  }), [theme, availableThemes]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

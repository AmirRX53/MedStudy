import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { loadPreference, savePreference } from '../lib/storage';
import type { Theme, AccentColor } from '../types';

interface ThemeContextType {
  theme: Theme;
  accentColor: AccentColor;
  setTheme: (theme: Theme) => void;
  setAccentColor: (color: AccentColor) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const accentColorMap: Record<AccentColor, string> = {
  blue: '#3b82f6',
  green: '#10b981',
  purple: '#8b5cf6',
  red: '#ef4444',
  orange: '#f97316',
  teal: '#14b8a6',
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    return (loadPreference('medstudy-theme', 'light') as Theme) || 'light';
  });

  const [accentColor, setAccentColorState] = useState<AccentColor>(() => {
    return (loadPreference('medstudy-accent', 'blue') as AccentColor) || 'blue';
  });

  useEffect(() => {
    savePreference('medstudy-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    savePreference('medistudy-accent', accentColor);
    document.documentElement.style.setProperty('--accent', accentColorMap[accentColor]);
    // Generate lighter versions
    const hex = accentColorMap[accentColor];
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    document.documentElement.style.setProperty('--accent-bg', `rgba(${r}, ${g}, ${b}, 0.1)`);
    document.documentElement.style.setProperty('--accent-border', `rgba(${r}, ${g}, ${b}, 0.5)`);
    document.documentElement.style.setProperty('--accent-hover', `rgba(${r}, ${g}, ${b}, 0.85)`);
  }, [accentColor]);

  const setTheme = (t: Theme) => setThemeState(t);
  const setAccentColor = (c: AccentColor) => setAccentColorState(c);
  const toggleTheme = () => setThemeState(theme === 'light' ? 'dark' : 'light');

  return (
    <ThemeContext.Provider value={{ theme, accentColor, setTheme, setAccentColor, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

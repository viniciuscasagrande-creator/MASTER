import React, { createContext, useContext, useEffect, useState } from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  themeMode: ThemeMode;
  effectiveTheme: 'light' | 'dark';
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  themeMode: 'light',
  effectiveTheme: 'light',
  setThemeMode: () => {}
});

const THEME_STORAGE_KEY = 'disk_theme_mode';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        return stored;
      }
    } catch {}
    return 'light'; // Default is CLARO as requested
  });

  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('light');

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch {}
  };

  useEffect(() => {
    const updateTheme = () => {
      let resolved: 'light' | 'dark' = 'light';
      if (themeMode === 'system') {
        resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      } else {
        resolved = themeMode;
      }

      setEffectiveTheme(resolved);

      const root = document.documentElement;
      if (resolved === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    updateTheme();

    if (themeMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => updateTheme();
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [themeMode]);

  return (
    <ThemeContext.Provider value={{ themeMode, effectiveTheme, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

/**
 * Segmented Theme Switcher Component
 * Reproduces the exact [ Claro | Escuro | Sistema ] toggle from the reference image.
 */
export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { themeMode, setThemeMode } = useTheme();

  return (
    <div
      className={`inline-flex items-center rounded-full border border-slate-200/80 bg-slate-100/80 p-0.5 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300 ${className}`}
      role="group"
      aria-label="Seletor de Tema"
    >
      <button
        type="button"
        onClick={() => setThemeMode('light')}
        className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-all cursor-pointer ${
          themeMode === 'light'
            ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
            : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
        }`}
        title="Tema Claro"
      >
        <Sun className="h-3.5 w-3.5 text-amber-500" />
        <span className="hidden sm:inline">Claro</span>
      </button>

      <button
        type="button"
        onClick={() => setThemeMode('dark')}
        className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-all cursor-pointer ${
          themeMode === 'dark'
            ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
            : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
        }`}
        title="Tema Escuro"
      >
        <Moon className="h-3.5 w-3.5 text-indigo-400" />
        <span className="hidden sm:inline">Escuro</span>
      </button>

      <button
        type="button"
        onClick={() => setThemeMode('system')}
        className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-all cursor-pointer ${
          themeMode === 'system'
            ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
            : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
        }`}
        title="Tema do Sistema"
      >
        <Laptop className="h-3.5 w-3.5 text-slate-500" />
        <span className="hidden sm:inline">Sistema</span>
      </button>
    </div>
  );
};

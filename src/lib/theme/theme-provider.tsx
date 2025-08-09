'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { themes, Theme } from './themes';
import { getContrastColor } from './theme-utils';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (themeId: string) => void;
  availableThemes: Theme[];
  isLoading: boolean;
  customTheme?: any;
  setCustomTheme?: (theme: any) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  initialTheme?: string;
}

export function ThemeProvider({ children, initialTheme }: ThemeProviderProps) {
  // Start with a default theme to avoid context errors
  const [currentThemeId, setCurrentThemeId] = useState(initialTheme || 'standard');
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [customTheme, setCustomTheme] = useState<any>(null);

  // Load theme from localStorage and database on mount
  useEffect(() => {
    setMounted(true);
    
    // First check localStorage for immediate update
    const savedTheme = localStorage.getItem('agendaiq-theme');
    if (savedTheme) {
      if (savedTheme === 'custom') {
        // Load custom theme from localStorage first
        const savedCustom = localStorage.getItem('agendaiq-custom-theme');
        if (savedCustom) {
          try {
            setCustomTheme(JSON.parse(savedCustom));
          } catch (e) {
            console.error('Failed to parse custom theme from localStorage');
          }
        }
      } else if (themes.find(t => t.id === savedTheme)) {
        setCurrentThemeId(savedTheme);
      }
    }
    
    // Fetch theme from database (API will check if user is authenticated)
    Promise.all([
      fetch('/api/user/theme')
        .then(res => res.ok ? res.json() : null)
        .catch(() => null),
      fetch('/api/user/custom-theme')
        .then(res => res.ok ? res.json() : null)
        .catch(() => null)
    ]).then(([themeData, customThemeData]) => {
      if (customThemeData?.customTheme) {
        setCustomTheme(customThemeData.customTheme);
        localStorage.setItem('agendaiq-custom-theme', JSON.stringify(customThemeData.customTheme));
      }
      
      if (themeData?.theme) {
        if (themeData.theme === 'custom' && customThemeData?.customTheme) {
          setCurrentThemeId('custom');
        } else if (themes.find(t => t.id === themeData.theme)) {
          setCurrentThemeId(themeData.theme);
        }
        localStorage.setItem('agendaiq-theme', themeData.theme);
      }
    }).catch(err => {
      // Silently fail if user is not authenticated
      console.debug('Theme fetch skipped (user may not be authenticated)');
    });
  }, []);

  // Apply theme CSS variables with fallback support
  useEffect(() => {
    if (!mounted) {
      return;
    }

    let theme: Theme;
    
    // Use custom theme if selected
    if (currentThemeId === 'custom' && customTheme) {
      theme = {
        id: 'custom',
        name: customTheme.name || 'Custom Theme',
        description: 'Your personalized theme',
        ...customTheme
      } as Theme;
    } else {
      theme = themes.find(t => t.id === currentThemeId) || themes[1]; // Default to classic-light
    }
    
    // Ensure CSS variables are supported (cross-browser compatibility)
    if (!CSS || !CSS.supports || !CSS.supports('color', 'var(--test)')) {
      console.warn('CSS variables not fully supported in this browser');
    }

    // Helper to convert hex (#rrggbb) to H S L numbers string that Tailwind expects
    const hexToHslVar = (hex: string): string => {
      const h = hex.replace('#', '');
      const r = parseInt(h.substring(0, 2), 16) / 255;
      const g = parseInt(h.substring(2, 4), 16) / 255;
      const b = parseInt(h.substring(4, 6), 16) / 255;
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      let hDeg = 0; let s = 0; const l = (max + min) / 2;
      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: hDeg = (g - b) / d + (g < b ? 6 : 0); break;
          case g: hDeg = (b - r) / d + 2; break;
          case b: hDeg = (r - g) / d + 4; break;
        }
        hDeg /= 6;
      }
      const hNum = Math.round(hDeg * 360);
      const sNum = Math.round(s * 100);
      const lNum = Math.round(l * 100);
      return `${hNum} ${sNum}% ${lNum}%`;
    };

    // Map our theme tokens to Tailwind CSS variables (expects HSL components, not hex)
    const setVar = (name: string, valueHex: string) => {
      try {
        const hslValue = hexToHslVar(valueHex);
        document.documentElement.style.setProperty(`--${name}`, hslValue);
        
        // Also set as RGB for better cross-browser compatibility
        const hex = valueHex.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        document.documentElement.style.setProperty(`--${name}-rgb`, `${r}, ${g}, ${b}`);
      } catch (err) {
        console.error(`Failed to set CSS variable --${name}:`, err);
      }
    };

    setVar('background', theme.colors.background);
    setVar('foreground', theme.colors.text);
    setVar('card', theme.colors.card);
    setVar('card-foreground', theme.colors.text);
    setVar('popover', theme.colors.card);
    setVar('popover-foreground', theme.colors.text);
    setVar('primary', theme.colors.primary);
    setVar('primary-foreground', theme.colors.primaryForeground || getContrastColor(theme.colors.primary));
    setVar('secondary', theme.colors.secondary);
    setVar('secondary-foreground', theme.colors.secondaryForeground || getContrastColor(theme.colors.secondary));
    setVar('muted', theme.colors.backgroundSecondary);
    setVar('muted-foreground', theme.colors.textMuted);
    setVar('accent', theme.colors.secondaryLight || theme.colors.secondary);
    setVar('accent-foreground', theme.colors.secondaryForeground || getContrastColor(theme.colors.secondary));
    setVar('destructive', theme.colors.error);
    setVar('destructive-foreground', getContrastColor(theme.colors.error));
    setVar('border', theme.colors.border);
    setVar('input', theme.colors.inputBorder);
    setVar('ring', theme.colors.primary);

    // Border radius token used by Tailwind extensions
    document.documentElement.style.setProperty('--radius', theme.borderRadius.md);

    // Mark current theme on the root for scoped overrides
    document.documentElement.setAttribute('data-theme', currentThemeId);

    // Apply theme class for Tailwind dark mode support
    document.documentElement.classList.remove('light', 'dark');
    if (theme.id === 'dark-mode' || theme.id === 'modern-purple' || theme.id === 'high-contrast' || theme.id === 'tasarim' || theme.id === 'midnight-blue' || theme.id === 'classic-dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.add('light');
    }

    // Save to localStorage with error handling
    try {
      localStorage.setItem('agendaiq-theme', currentThemeId);
    } catch (err) {
      console.error('Failed to save theme to localStorage:', err);
    }
  }, [currentThemeId, mounted, customTheme]);

  const setTheme = async (themeId: string) => {
    const theme = themes.find(t => t.id === themeId);
    if (!theme) return;

    setIsLoading(true);
    setCurrentThemeId(themeId);
    
    // Save to localStorage immediately for instant feedback
    localStorage.setItem('agendaiq-theme', themeId);

    // Save to database (API will check if user is authenticated)
    try {
      const response = await fetch('/api/user/theme', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: themeId }),
      });
      
      if (!response.ok && response.status !== 401) {
        console.error('Failed to save theme to database');
      }
    } catch (err) {
      // Silently fail if user is not authenticated
      console.debug('Theme save skipped (user may not be authenticated)');
    }

    setIsLoading(false);
  };

  let currentTheme: Theme;
  if (currentThemeId === 'custom' && customTheme) {
    currentTheme = {
      id: 'custom',
      name: customTheme.name || 'Custom Theme',
      description: 'Your personalized theme',
      ...customTheme
    } as Theme;
  } else {
    currentTheme = themes.find(t => t.id === currentThemeId) || themes[1];
  }

  const value = {
    theme: currentTheme,
    setTheme,
    availableThemes: themes,
    isLoading,
    customTheme,
    setCustomTheme,
  };

  // Always provide the context to avoid useTheme errors
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

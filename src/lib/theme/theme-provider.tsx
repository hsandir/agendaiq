'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { themes, Theme } from './themes';
import { getContrastColor } from './theme-utils';
import { useSession } from 'next-auth/react';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (themeId: string) => void;
  availableThemes: Theme[];
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  initialTheme?: string;
}

export function ThemeProvider({ children, initialTheme }: ThemeProviderProps) {
  // Get initial theme from localStorage before first render to prevent flash
  const getInitialTheme = () => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('agendaiq-theme');
      if (savedTheme && themes.find(t => t.id === savedTheme)) {
        return savedTheme;
      }
    }
    return initialTheme || 'standard';
  };
  
  const [currentThemeId, setCurrentThemeId] = useState(getInitialTheme);
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { data: session } = useSession();

  // Load theme from database on mount if user is logged in
  useEffect(() => {
    setMounted(true);
    
    // If user is logged in, fetch theme from database
    if (session?.user) {
      fetch('/api/user/theme')
        .then(res => res.json())
        .then(data => {
          if (data.theme && themes.find(t => t.id === data.theme)) {
            setCurrentThemeId(data.theme);
            localStorage.setItem('agendaiq-theme', data.theme);
          }
        })
        .catch(err => console.error('Failed to fetch user theme:', err));
    }
  }, [session]);

  // Apply theme CSS variables
  useEffect(() => {
    if (!mounted) {
      return;
    }

    const theme = themes.find(t => t.id === currentThemeId) || themes[1]; // Default to classic-light

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
      document.documentElement.style.setProperty(`--${name}`, hexToHslVar(valueHex));
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

    // Save to localStorage
    localStorage.setItem('agendaiq-theme', currentThemeId);
  }, [currentThemeId, mounted]);

  const setTheme = async (themeId: string) => {
    const theme = themes.find(t => t.id === themeId);
    if (!theme) return;

    setIsLoading(true);
    setCurrentThemeId(themeId);

    // Save to database if user is logged in
    if (session?.user) {
      try {
        await fetch('/api/user/theme', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ theme: themeId }),
        });
      } catch (err) {
        console.error('Failed to save theme to database:', err);
      }
    }

    setIsLoading(false);
  };

  const currentTheme = themes.find(t => t.id === currentThemeId) || themes[1];

  const value = {
    theme: currentTheme,
    setTheme,
    availableThemes: themes,
    isLoading,
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return <>{children}</>;
  }

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

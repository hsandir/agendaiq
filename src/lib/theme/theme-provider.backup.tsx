'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { themes, Theme } from './themes';
import { getContrastColor } from './theme-utils';
import { logThemeDebug } from './theme-debug';
import { themeStore } from './theme-store';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (themeId: string) => void;
  availableThemes: Theme[];
  isLoading: boolean;
  customTheme?: Record<string, unknown>;
  setCustomTheme?: (theme: Record<string, unknown>) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  initialTheme?: string;
}

// Function to get initial theme from localStorage (client-side only)
function getInitialTheme(): string {
  if (typeof window === 'undefined') {
    return 'standard'; // Default for SSR
  }
  
  try {
    return localStorage.getItem('agendaiq-theme') ?? 'standard';
  } catch {
    return 'standard';
  }
}

export function ThemeProvider({ children, initialTheme }: ThemeProviderProps) {
  // Always start with 'standard' on server to prevent hydration mismatch
  const [currentThemeId, setCurrentThemeId] = useState('standard');
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [customTheme, setCustomTheme] = useState<any>(null);

  // Load theme from localStorage and database on mount
  useEffect(() => {
    setMounted(true);
    
    // Get theme from store or localStorage after mount
    const storeTheme = themeStore.getCurrentTheme();
    const savedTheme = localStorage.getItem('agendaiq-theme');
    const themeToUse = storeTheme ?? (savedTheme || initialTheme) ?? 'standard';
    
    // Use singleton store to prevent re-initialization on every navigation
    if (themeStore.isInitialized()) {
      logThemeDebug('Skipped re-initialization (store already initialized)');
      setCurrentThemeId(themeToUse);
      const savedCustom = themeStore.getCustomTheme();
      if (savedCustom) {
        setCustomTheme(savedCustom);
      }
      return;
    }
    
    themeStore.setInitialized(true);
    logThemeDebug('Theme provider initializing (first time)');
    if (savedTheme) {
      if (savedTheme === 'custom') {
        // Load custom theme from localStorage first
        const savedCustom = localStorage.getItem('agendaiq-custom-theme');
        if (savedCustom) {
          try {
            const parsedCustom = JSON.parse(savedCustom);
            setCustomTheme(parsedCustom);
            setCurrentThemeId('custom');
          } catch (e: unknown) {
            console.error('Failed to parse custom theme from localStorage')
          }
        }
      } else if (themes.find(t => t.id === savedTheme)) {
        setCurrentThemeId(savedTheme);
      }
    }
    
    // Only sync with database if needed (using singleton store)
    if (themeStore.needsSync()) {
      // Optimized database sync with reduced delay and better caching
      const dbSyncTimer = setTimeout(() => {
        // Use Promise.allSettled for better error handling
        Promise.allSettled([
          fetch('/api/user/theme', {
            headers: { 'Cache-Control': 'max-age=300' }
          }).then(res => res.ok ? res.json() : null),
          fetch('/api/user/custom-theme', {
            headers: { 'Cache-Control': 'max-age=300' }
          }).then(res => res.ok ? res.json() : null)
        ]).then(([themeResult, customThemeResult]) => {
          // Mark as synced in store
          themeStore.setLastSyncTime(Date.now());
          
          // Handle custom theme
          if (customThemeResult.status === 'fulfilled' && customThemeResult.value?.custom_theme) {
            const customThemeData = customThemeResult.value.custom_theme;
            setCustomTheme(customThemeData);
            localStorage.setItem('agendaiq-custom-theme', JSON.stringify(customThemeData));
          }
          
          // Handle theme preference
          if (themeResult.status === 'fulfilled' && themeResult.value?.theme) {
            const dbTheme = themeResult.value.theme;
            if (dbTheme !== savedTheme) {
              if (dbTheme === 'custom' && customThemeResult.status === 'fulfilled' && customThemeResult.value?.custom_theme) {
                setCurrentThemeId('custom');
                themeStore.setCurrentTheme('custom');
              } else if (themes.find(t => t.id === dbTheme)) {
                setCurrentThemeId(dbTheme);
                themeStore.setCurrentTheme(dbTheme);
              }
              localStorage.setItem('agendaiq-theme', dbTheme);
            }
          }
        }).catch(err => {
          // Silently fail if user is not authenticated
          console.debug('Theme fetch skipped (user may not be authenticated)');
        });
      }, 500); // Reduced delay for faster sync
      
      return () => clearTimeout(dbSyncTimer);
    }
  }, []); // Empty dependency array - only run once per mount

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
        ...(customTheme as Record<string, unknown>)
      } satisfies Theme;
    } else {
      theme = themes.find(t => t.id === currentThemeId) || themes.find(t => t.id === 'standard') || themes[0]; // Default to standard
    }
    
    // Ensure CSS variables are supported (cross-browser compatibility)
    if (!CSS?.supports?.('color', 'var(--test)')) {
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
      } catch (err: unknown) {
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
    setVar('primary-foreground', theme.colors.primaryForeground ?? getContrastColor(theme.colors.primary));
    setVar('secondary', theme.colors.secondary);
    setVar('secondary-foreground', theme.colors.secondaryForeground ?? getContrastColor(theme.colors.secondary));
    setVar('muted', theme.colors.backgroundSecondary);
    setVar('muted-foreground', theme.colors.textMuted);
    setVar('accent', theme.colors.secondaryLight ?? theme.colors.secondary);
    setVar('accent-foreground', theme.colors.secondaryForeground ?? getContrastColor(theme.colors.secondary));
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

    // Save to localStorage and store with error handling
    try {
      localStorage.setItem('agendaiq-theme', currentThemeId);
      themeStore.setCurrentTheme(currentThemeId);
      if (currentThemeId === 'custom' && customTheme) {
        themeStore.setCustomTheme(customTheme);
      }
    } catch (err: unknown) {
      console.error('Failed to save theme to localStorage:', err);
    }
  }, [currentThemeId, mounted, customTheme]);

  const setTheme = async (themeId: string) => {
    // Skip if already current theme
    if (currentThemeId === themeId) return;
    
    const theme = themes.find(t => t.id === themeId);
    if (!theme && themeId !== 'custom') return;

    setIsLoading(true);
    setCurrentThemeId(themeId);
    
    // Save to localStorage immediately for instant feedback
    try {
      localStorage.setItem('agendaiq-theme', themeId);
    } catch (err: unknown) {
      console.debug('localStorage not available')
    }

    // Save to database asynchronously (don't block UI)
    fetch('/api/user/theme', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme: themeId }),
    }).then(response => {
      if (!response.ok && response.status !== 401) {
        console.debug('Failed to save theme to database');
      }
    }).catch(err => {
      console.debug('Theme save skipped (user may not be authenticated)');
    });

    // Quick loading state reset
    setTimeout(() => setIsLoading(false), 100);
  };

  let currentTheme: Theme;
  if (currentThemeId === 'custom' && customTheme) {
    currentTheme = {
      id: 'custom',
      name: customTheme.name || 'Custom Theme',
      description: 'Your personalized theme',
      ...(customTheme as Record<string, unknown>)
    } satisfies Theme;
  } else {
    currentTheme = themes.find(t => t.id === currentThemeId) || themes.find(t => t.id === 'standard') || themes[0];
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

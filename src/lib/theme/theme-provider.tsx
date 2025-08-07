'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { themes, Theme } from './themes';
import { generateCSSVariables } from './theme-utils';
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

export function ThemeProvider({ children, initialTheme = 'classic-light' }: ThemeProviderProps) {
  const [currentThemeId, setCurrentThemeId] = useState(initialTheme);
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { data: session } = useSession();

  // Load theme from localStorage or database on mount
  useEffect(() => {
    setMounted(true);
    
    // First check localStorage
    const savedTheme = localStorage.getItem('agendaiq-theme');
    if (savedTheme && themes.find(t => t.id === savedTheme)) {
      setCurrentThemeId(savedTheme);
    }
    
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
      console.log('ThemeProvider: Not mounted yet, skipping theme application');
      return;
    }

    console.log('ThemeProvider: Applying theme with ID:', currentThemeId);
    const theme = themes.find(t => t.id === currentThemeId) || themes[1]; // Default to classic-light
    console.log('ThemeProvider: Found theme:', theme.id, theme.name);
    
    const cssVariables = generateCSSVariables(theme);
    console.log('ThemeProvider: Generated CSS variables count:', Object.keys(cssVariables).length);
    console.log('ThemeProvider: First 5 variables:', Object.entries(cssVariables).slice(0, 5));

    // Clear existing inline styles first
    console.log('ThemeProvider: Clearing existing styles...');
    
    // Apply CSS variables to document root
    let appliedCount = 0;
    Object.entries(cssVariables).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
      appliedCount++;
    });
    console.log(`ThemeProvider: Applied ${appliedCount} CSS variables`);

    // Verify a sample variable was applied
    const testVar = getComputedStyle(document.documentElement).getPropertyValue('--color-primary');
    console.log('ThemeProvider: Verification - --color-primary is now:', testVar);

    // Apply theme class to body for Tailwind dark mode support
    document.documentElement.classList.remove('light', 'dark');
    if (theme.id === 'dark-mode' || theme.id === 'modern-purple') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.add('light');
    }

    // Save to localStorage
    localStorage.setItem('agendaiq-theme', currentThemeId);
    console.log('ThemeProvider: Theme saved to localStorage:', currentThemeId);
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
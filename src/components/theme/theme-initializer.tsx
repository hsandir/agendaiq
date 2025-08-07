'use client';

import { useEffect } from 'react';
import { themes } from '@/lib/theme/themes';
import { generateCSSVariables } from '@/lib/theme/theme-utils';

export function ThemeInitializer() {
  useEffect(() => {
    // Get theme from localStorage or default
    const savedTheme = localStorage.getItem('agendaiq-theme') || 'classic-light';
    
    // Find theme
    const theme = themes.find(t => t.id === savedTheme) || themes[1];
    
    // Generate and apply CSS variables
    const cssVars = generateCSSVariables(theme);
    
    Object.entries(cssVars).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });
    
    // Also set Tailwind-compatible HSL variables
    // Convert hex to HSL for Tailwind compatibility
    const hexToHSL = (hex: string) => {
      // Simple conversion - in production use a proper library
      // For now, just use the hex values directly
      return hex;
    };
    
    // Set Tailwind variables (these expect HSL but we'll use hex for now)
    document.documentElement.style.setProperty('--primary', theme.colors.primary);
    document.documentElement.style.setProperty('--primary-foreground', theme.colors.primaryForeground);
    document.documentElement.style.setProperty('--secondary', theme.colors.secondary);
    document.documentElement.style.setProperty('--secondary-foreground', theme.colors.secondaryForeground);
    document.documentElement.style.setProperty('--background', theme.colors.background);
    document.documentElement.style.setProperty('--foreground', theme.colors.text);
    document.documentElement.style.setProperty('--card', theme.colors.card);
    document.documentElement.style.setProperty('--card-foreground', theme.colors.text);
    document.documentElement.style.setProperty('--border', theme.colors.border);
    document.documentElement.style.setProperty('--input', theme.colors.inputBorder);
    document.documentElement.style.setProperty('--ring', theme.colors.primary);
    
    // Apply dark/light class
    document.documentElement.classList.remove('light', 'dark');
    if (theme.id === 'dark-mode' || theme.id === 'modern-purple') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.add('light');
    }
    
    // Also apply basic styles to body as fallback
    document.body.style.backgroundColor = theme.colors.background;
    document.body.style.color = theme.colors.text;
    
    // Listen for theme changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'agendaiq-theme' && e.newValue) {
        window.location.reload(); // Simple reload for now
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  
  return null;
}
'use client';

import { useEffect } from 'react';
import { themes } from '@/lib/theme/themes';
import { getContrastColor } from '@/lib/theme/theme-utils';

export function ThemeInitializer() {
  useEffect(() => {
    // Get theme from localStorage or default
    const savedTheme = localStorage.getItem('agendaiq-theme') || 'classic-light';
    
    // Find theme
    const theme = themes.find(t => t.id === savedTheme) || themes[1];
    
    // Tailwind-compatible HSL variable setter
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
    document.documentElement.style.setProperty('--radius', theme.borderRadius.md);
    
    // Apply dark/light class
    document.documentElement.classList.remove('light', 'dark');
    if (theme.id === 'dark-mode' || theme.id === 'modern-purple' || theme.id === 'high-contrast' || theme.id === 'tasarim') {
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

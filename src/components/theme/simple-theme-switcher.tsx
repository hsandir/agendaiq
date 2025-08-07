'use client';

import { useState, useEffect } from 'react';
import { themes } from '@/lib/theme/themes';
import { generateCSSVariables } from '@/lib/theme/theme-utils';

export function SimpleThemeSwitcher() {
  const [currentTheme, setCurrentTheme] = useState('classic-light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('agendaiq-theme') || 'classic-light';
    setCurrentTheme(saved);
    applyTheme(saved);
  }, []);

  const applyTheme = (themeId: string) => {
    console.log('SimpleThemeSwitcher: Applying theme:', themeId);
    
    const theme = themes.find(t => t.id === themeId);
    if (!theme) {
      console.error('Theme not found:', themeId);
      return;
    }

    // Apply CSS variables
    const cssVars = generateCSSVariables(theme);
    Object.entries(cssVars).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });

    // Apply body styles directly
    document.body.style.backgroundColor = theme.colors.background;
    document.body.style.color = theme.colors.text;

    // Apply dark/light class
    document.documentElement.classList.remove('light', 'dark');
    if (theme.id === 'dark-mode' || theme.id === 'modern-purple') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.add('light');
    }

    console.log('SimpleThemeSwitcher: Theme applied!');
  };

  const changeTheme = async (themeId: string) => {
    console.log('SimpleThemeSwitcher: Changing theme to:', themeId);
    
    // Apply immediately
    setCurrentTheme(themeId);
    applyTheme(themeId);
    
    // Save to localStorage
    localStorage.setItem('agendaiq-theme', themeId);
    
    // Save to database
    try {
      const response = await fetch('/api/user/theme', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: themeId }),
      });
      
      if (response.ok) {
        console.log('SimpleThemeSwitcher: Theme saved to database');
      }
    } catch (err) {
      console.error('Failed to save theme:', err);
    }
  };

  if (!mounted) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white rounded-lg shadow-lg p-4 border">
      <p className="text-sm font-semibold mb-2">Quick Theme Switcher</p>
      <div className="flex flex-col gap-1">
        {themes.map(theme => (
          <button
            key={theme.id}
            onClick={() => changeTheme(theme.id)}
            className={`text-left px-3 py-1 rounded text-sm hover:bg-gray-100 ${
              currentTheme === theme.id ? 'bg-blue-100 text-blue-700' : ''
            }`}
          >
            {theme.name}
          </button>
        ))}
      </div>
    </div>
  );
}
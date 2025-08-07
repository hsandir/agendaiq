'use client';

import { useTheme } from '@/lib/theme/theme-provider';
import { themes } from '@/lib/theme/themes';
import { generateCSSVariables } from '@/lib/theme/theme-utils';
import { useEffect, useState } from 'react';

export default function ThemeDebugPage() {
  const { theme, setTheme, availableThemes } = useTheme();
  const [appliedVars, setAppliedVars] = useState<Record<string, string>>({});
  const [expectedVars, setExpectedVars] = useState<Record<string, string>>({});

  useEffect(() => {
    // Get currently applied CSS variables
    const computed = getComputedStyle(document.documentElement);
    const currentVars: Record<string, string> = {};
    
    // Check what's actually applied
    ['--color-primary', '--color-background', '--color-text', '--spacing-md'].forEach(varName => {
      const value = computed.getPropertyValue(varName).trim();
      currentVars[varName] = value || 'NOT SET';
    });
    
    setAppliedVars(currentVars);

    // Get expected variables
    if (theme) {
      const expected = generateCSSVariables(theme);
      setExpectedVars(expected);
    }
  }, [theme]);

  const applyThemeManually = (themeId: string) => {
    const selectedTheme = themes.find(t => t.id === themeId);
    if (selectedTheme) {
      console.log('Manually applying theme:', selectedTheme);
      const cssVars = generateCSSVariables(selectedTheme);
      
      // Apply each variable
      Object.entries(cssVars).forEach(([key, value]) => {
        document.documentElement.style.setProperty(key, value);
        console.log(`Set ${key} = ${value}`);
      });
      
      // Update state
      setTimeout(() => {
        const computed = getComputedStyle(document.documentElement);
        const newVars: Record<string, string> = {};
        Object.keys(cssVars).forEach(key => {
          newVars[key] = computed.getPropertyValue(key).trim() || 'NOT SET';
        });
        setAppliedVars(newVars);
      }, 100);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Theme Debug Page</h1>

      {/* Current State */}
      <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6">
        <h2 className="text-xl font-bold text-red-800 mb-2">Current State</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="font-semibold">Theme Object:</p>
            <pre className="text-xs bg-white p-2 rounded">
              {JSON.stringify({
                id: theme?.id,
                name: theme?.name,
                hasColors: !!theme?.colors,
                colorCount: theme?.colors ? Object.keys(theme.colors).length : 0
              }, null, 2)}
            </pre>
          </div>
          <div>
            <p className="font-semibold">Available Themes:</p>
            <pre className="text-xs bg-white p-2 rounded">
              {JSON.stringify(availableThemes?.map(t => ({ id: t.id, name: t.name })), null, 2)}
            </pre>
          </div>
        </div>
      </div>

      {/* Applied vs Expected */}
      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-6">
        <h2 className="text-xl font-bold text-yellow-800 mb-2">CSS Variables Check</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="font-semibold">Currently Applied:</p>
            <pre className="text-xs bg-white p-2 rounded overflow-auto max-h-64">
              {JSON.stringify(appliedVars, null, 2)}
            </pre>
          </div>
          <div>
            <p className="font-semibold">Expected (first 10):</p>
            <pre className="text-xs bg-white p-2 rounded overflow-auto max-h-64">
              {JSON.stringify(Object.fromEntries(Object.entries(expectedVars).slice(0, 10)), null, 2)}
            </pre>
          </div>
        </div>
      </div>

      {/* Manual Theme Application */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
        <h2 className="text-xl font-bold text-blue-800 mb-2">Manual Theme Application</h2>
        <p className="text-sm mb-4">Click to manually apply CSS variables:</p>
        <div className="flex flex-wrap gap-2">
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => applyThemeManually(t.id)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Apply {t.name} Manually
            </button>
          ))}
        </div>
      </div>

      {/* Test Theme via Context */}
      <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-6">
        <h2 className="text-xl font-bold text-green-800 mb-2">Test via ThemeProvider</h2>
        <div className="flex flex-wrap gap-2">
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                console.log('Setting theme via context:', t.id);
                setTheme(t.id);
              }}
              className={`px-4 py-2 rounded ${
                theme?.id === t.id 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>

      {/* Visual Test */}
      <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4 mb-6">
        <h2 className="text-xl font-bold text-purple-800 mb-2">Visual Test</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="font-semibold mb-2">Using CSS Var:</p>
            <div 
              className="p-4 rounded text-white"
              style={{ 
                backgroundColor: 'var(--color-primary, #ff0000)',
                color: 'var(--color-primary-foreground, #ffffff)'
              }}
            >
              Should be theme primary color
            </div>
          </div>
          <div>
            <p className="font-semibold mb-2">Direct from Theme:</p>
            <div 
              className="p-4 rounded text-white"
              style={{ 
                backgroundColor: theme?.colors?.primary || '#00ff00',
                color: theme?.colors?.primaryForeground || '#ffffff'
              }}
            >
              Direct: {theme?.colors?.primary || 'NO COLOR'}
            </div>
          </div>
          <div>
            <p className="font-semibold mb-2">Fallback Test:</p>
            <div 
              className="p-4 rounded"
              style={{ 
                backgroundColor: 'var(--color-does-not-exist, #0000ff)',
                color: 'white'
              }}
            >
              Should be blue (fallback)
            </div>
          </div>
        </div>
      </div>

      {/* Console Commands */}
      <div className="bg-gray-100 border-2 border-gray-300 rounded-lg p-4">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Console Commands</h2>
        <p className="text-sm mb-2">Run these in browser console:</p>
        <pre className="text-xs bg-white p-2 rounded">
{`// Check if CSS variable is set
getComputedStyle(document.documentElement).getPropertyValue('--color-primary')

// Set CSS variable manually  
document.documentElement.style.setProperty('--color-primary', '#ff0000')

// Check localStorage
localStorage.getItem('agendaiq-theme')

// Check all inline styles
document.documentElement.style.cssText`}
        </pre>
      </div>
    </div>
  );
}
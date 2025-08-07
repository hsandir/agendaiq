'use client';

import { useTheme } from '@/lib/theme/theme-provider';
import { useEffect, useState } from 'react';

export default function ThemeTestPage() {
  const { theme, setTheme, availableThemes } = useTheme();
  const [cssVars, setCssVars] = useState<Record<string, string>>({});
  const [storageValue, setStorageValue] = useState<string | null>(null);

  useEffect(() => {
    // Get all CSS variables from document
    const computedStyle = getComputedStyle(document.documentElement);
    const vars: Record<string, string> = {};
    
    // Check specific CSS variables
    const varNames = [
      '--color-primary',
      '--color-background',
      '--color-text',
      '--color-card',
      '--spacing-md',
      '--radius-md',
    ];
    
    varNames.forEach(varName => {
      const value = computedStyle.getPropertyValue(varName);
      if (value) {
        vars[varName] = value;
      }
    });
    
    setCssVars(vars);
    
    // Check localStorage
    const stored = localStorage.getItem('agendaiq-theme');
    setStorageValue(stored);
  }, [theme]);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Theme System Test Page</h1>
      
      <div className="space-y-6">
        {/* Current Theme Info */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h2 className="text-xl font-semibold mb-4">Current Theme</h2>
          <div className="space-y-2">
            <p><strong>ID:</strong> {theme?.id || 'None'}</p>
            <p><strong>Name:</strong> {theme?.name || 'None'}</p>
            <p><strong>Description:</strong> {theme?.description || 'None'}</p>
            <p><strong>LocalStorage:</strong> {storageValue || 'None'}</p>
          </div>
        </div>

        {/* CSS Variables */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h2 className="text-xl font-semibold mb-4">Applied CSS Variables</h2>
          {Object.keys(cssVars).length > 0 ? (
            <div className="space-y-1 font-mono text-sm">
              {Object.entries(cssVars).map(([key, value]) => (
                <div key={key} className="flex gap-2">
                  <span className="text-gray-600">{key}:</span>
                  <span className="text-blue-600">{value || '(empty)'}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-red-500">No CSS variables found!</p>
          )}
        </div>

        {/* Theme Switcher */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h2 className="text-xl font-semibold mb-4">Switch Theme</h2>
          <div className="flex flex-wrap gap-2">
            {availableThemes?.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  console.log('Switching to theme:', t.id);
                  setTheme(t.id);
                }}
                className={`px-4 py-2 rounded ${
                  theme?.id === t.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>

        {/* Visual Test Elements */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h2 className="text-xl font-semibold mb-4">Visual Test Elements</h2>
          
          <div className="space-y-4">
            {/* Using CSS variables directly */}
            <div>
              <h3 className="font-semibold mb-2">Using CSS Variables:</h3>
              <div 
                className="p-4 rounded"
                style={{
                  backgroundColor: 'var(--color-primary, blue)',
                  color: 'var(--color-primary-foreground, white)',
                }}
              >
                Primary Color Box (should change with theme)
              </div>
            </div>

            {/* Using theme colors directly */}
            <div>
              <h3 className="font-semibold mb-2">Using Theme Object:</h3>
              <div 
                className="p-4 rounded"
                style={{
                  backgroundColor: theme?.colors?.primary || '#3B82F6',
                  color: theme?.colors?.primaryForeground || '#FFFFFF',
                }}
              >
                Direct Theme Color Box (using theme.colors.primary)
              </div>
            </div>

            {/* Test different color variations */}
            <div className="grid grid-cols-3 gap-2">
              <div 
                className="p-2 rounded text-center"
                style={{ backgroundColor: 'var(--color-success, green)', color: 'white' }}
              >
                Success
              </div>
              <div 
                className="p-2 rounded text-center"
                style={{ backgroundColor: 'var(--color-warning, orange)', color: 'white' }}
              >
                Warning
              </div>
              <div 
                className="p-2 rounded text-center"
                style={{ backgroundColor: 'var(--color-error, red)', color: 'white' }}
              >
                Error
              </div>
            </div>
          </div>
        </div>

        {/* Debug Info */}
        <div className="bg-gray-100 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Debug Info</h2>
          <pre className="text-xs overflow-x-auto">
            {JSON.stringify(
              {
                themeId: theme?.id,
                availableThemesCount: availableThemes?.length,
                cssVarsCount: Object.keys(cssVars).length,
                localStorage: storageValue,
                documentClasses: document.documentElement.className,
              },
              null,
              2
            )}
          </pre>
        </div>
      </div>
    </div>
  );
}
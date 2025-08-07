'use client';

import { useTheme } from '@/lib/theme/theme-provider';

export default function ThemeDemoPage() {
  const { theme, setTheme, availableThemes } = useTheme();

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Theme Demo & Test Page</h1>
      
      {/* Theme Switcher */}
      <div className="mb-8 p-4 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Quick Theme Switcher</h2>
        <div className="flex flex-wrap gap-2">
          {availableThemes?.map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={`px-4 py-2 rounded transition-all ${
                theme?.id === t.id
                  ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>
        <p className="mt-4 text-sm text-gray-600">
          Current theme: <strong>{theme?.name}</strong> ({theme?.id})
        </p>
      </div>

      {/* Color Palette Demo */}
      <div className="mb-8 p-4 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Color Palette</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <ColorSwatch name="Primary" varName="--color-primary" />
          <ColorSwatch name="Secondary" varName="--color-secondary" />
          <ColorSwatch name="Success" varName="--color-success" />
          <ColorSwatch name="Warning" varName="--color-warning" />
          <ColorSwatch name="Error" varName="--color-error" />
          <ColorSwatch name="Info" varName="--color-info" />
          <ColorSwatch name="Background" varName="--color-background" />
          <ColorSwatch name="Text" varName="--color-text" />
        </div>
      </div>

      {/* Component Examples */}
      <div className="mb-8 p-4 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Component Examples</h2>
        
        {/* Buttons */}
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Buttons</h3>
          <div className="flex gap-2">
            <button 
              className="px-4 py-2 rounded"
              style={{
                backgroundColor: 'var(--color-primary)',
                color: 'var(--color-primary-foreground)'
              }}
            >
              Primary Button
            </button>
            <button 
              className="px-4 py-2 rounded"
              style={{
                backgroundColor: 'var(--color-secondary)',
                color: 'var(--color-secondary-foreground)'
              }}
            >
              Secondary Button
            </button>
            <button 
              className="px-4 py-2 rounded"
              style={{
                backgroundColor: 'var(--color-success)',
                color: 'white'
              }}
            >
              Success Button
            </button>
          </div>
        </div>

        {/* Cards */}
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Card</h3>
          <div 
            className="p-4 rounded"
            style={{
              backgroundColor: 'var(--color-card)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-md)'
            }}
          >
            <h4 style={{ color: 'var(--color-text)' }}>Card Title</h4>
            <p style={{ color: 'var(--color-text-secondary)' }}>
              This is a card using theme variables for styling.
            </p>
          </div>
        </div>

        {/* Input */}
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Input Fields</h3>
          <input 
            type="text"
            placeholder="Type something..."
            className="px-3 py-2 rounded"
            style={{
              backgroundColor: 'var(--color-input)',
              border: '1px solid var(--color-input-border)',
              color: 'var(--color-input-text)',
              borderRadius: 'var(--radius-md)',
              width: '100%',
              maxWidth: '300px'
            }}
          />
        </div>
      </div>

      {/* Spacing Demo */}
      <div className="mb-8 p-4 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Spacing System</h2>
        <div className="space-y-2">
          <SpacingDemo size="xs" />
          <SpacingDemo size="sm" />
          <SpacingDemo size="md" />
          <SpacingDemo size="lg" />
          <SpacingDemo size="xl" />
          <SpacingDemo size="xxl" />
        </div>
      </div>

      {/* Typography */}
      <div className="mb-8 p-4 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Typography</h2>
        <div className="space-y-4">
          <div style={{ fontFamily: 'var(--font-primary)' }}>
            <strong>Primary Font:</strong> The quick brown fox jumps over the lazy dog
          </div>
          <div style={{ fontFamily: 'var(--font-secondary)' }}>
            <strong>Secondary Font:</strong> The quick brown fox jumps over the lazy dog
          </div>
          <div style={{ fontFamily: 'var(--font-mono)' }}>
            <strong>Mono Font:</strong> const theme = useTheme();
          </div>
        </div>
      </div>
    </div>
  );
}

function ColorSwatch({ name, varName }: { name: string; varName: string }) {
  const color = typeof window !== 'undefined' 
    ? getComputedStyle(document.documentElement).getPropertyValue(varName) 
    : '';

  return (
    <div className="text-center">
      <div 
        className="w-full h-20 rounded mb-2"
        style={{ backgroundColor: `var(${varName})` }}
      />
      <p className="text-sm font-semibold">{name}</p>
      <p className="text-xs text-gray-500 font-mono">{color || 'not set'}</p>
    </div>
  );
}

function SpacingDemo({ size }: { size: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-mono w-12">{size}:</span>
      <div 
        className="bg-blue-500 h-4"
        style={{ width: `var(--spacing-${size})` }}
      />
      <span className="text-xs text-gray-500">
        var(--spacing-{size})
      </span>
    </div>
  );
}
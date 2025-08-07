'use client';

import React, { useState } from 'react';
import { useTheme } from '@/lib/theme/theme-provider';
import { themes } from '@/lib/theme/themes';
import { Check, Palette, Monitor, Moon, Sun, Eye, Leaf } from 'lucide-react';

interface ThemeSelectorProps {
  className?: string;
  showDescription?: boolean;
  variant?: 'grid' | 'list' | 'compact';
}

const ThemeIcons = {
  'modern-purple': Palette,
  'classic-light': Sun,
  'dark-mode': Moon,
  'high-contrast': Eye,
  'nature-green': Leaf,
} as const;

export function ThemeSelector({ 
  className = '', 
  showDescription = true, 
  variant = 'grid' 
}: ThemeSelectorProps) {
  const { theme: currentTheme, setTheme } = useTheme();
  const [isChanging, setIsChanging] = useState(false);

  const handleThemeChange = async (themeId: string) => {
    setIsChanging(true);
    
    // Add smooth transition
    document.documentElement.style.transition = 'all 0.3s ease-in-out';
    
    await new Promise(resolve => setTimeout(resolve, 50));
    setTheme(themeId);
    
    // Remove transition after change
    setTimeout(() => {
      document.documentElement.style.transition = '';
      setIsChanging(false);
    }, 300);
  };

  const ThemeCard = ({ theme }: { theme: typeof themes[0] }) => {
    const Icon = ThemeIcons[theme.id as keyof typeof ThemeIcons] || Palette;
    const isSelected = currentTheme.id === theme.id;
    
    const cardColors = {
      'modern-purple': 'bg-purple-50 border-purple-200 hover:border-purple-400',
      'classic-light': 'bg-gray-50 border-gray-200 hover:border-gray-400',
      'dark-mode': 'bg-gray-800 border-gray-700 hover:border-gray-500',
      'high-contrast': 'bg-white border-black hover:border-gray-600',
      'nature-green': 'bg-green-50 border-green-200 hover:border-green-400',
    };

    const iconColors = {
      'modern-purple': 'text-purple-600',
      'classic-light': 'text-yellow-500',
      'dark-mode': 'text-indigo-400',
      'high-contrast': 'text-black',
      'nature-green': 'text-green-600',
    };

    return (
      <button
        onClick={() => handleThemeChange(theme.id)}
        disabled={isChanging}
        className={`
          relative overflow-hidden rounded-lg border-2 p-4 text-left transition-all
          ${cardColors[theme.id as keyof typeof cardColors] || 'bg-gray-50 border-gray-200'}
          ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
          ${isChanging ? 'opacity-50 cursor-wait' : 'hover:scale-105 cursor-pointer'}
          ${variant === 'compact' ? 'flex items-center gap-3' : 'block'}
        `}
      >
        <div className={variant === 'compact' ? 'flex items-center gap-3' : ''}>
          <Icon className={`h-6 w-6 ${iconColors[theme.id as keyof typeof iconColors]}`} />
          <div className={variant === 'compact' ? '' : 'mt-3'}>
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              {theme.name}
              {isSelected && (
                <Check className="h-4 w-4 text-green-600" />
              )}
            </h3>
            {showDescription && variant !== 'compact' && (
              <p className="mt-1 text-sm text-gray-600">
                {theme.description}
              </p>
            )}
          </div>
        </div>
        
        {variant === 'grid' && (
          <div className="mt-4 space-y-2">
            {/* Preview elements */}
            <div className="flex gap-2">
              <div className={`h-2 w-16 rounded ${
                theme.id === 'dark-mode' ? 'bg-gray-600' : 
                theme.id === 'high-contrast' ? 'bg-black' :
                'bg-gray-300'
              }`} />
              <div className={`h-2 w-12 rounded ${
                theme.id === 'dark-mode' ? 'bg-gray-700' : 
                theme.id === 'high-contrast' ? 'bg-gray-800' :
                'bg-gray-200'
              }`} />
            </div>
            <div className="flex gap-2">
              <div className={`h-2 w-20 rounded ${
                theme.id === 'modern-purple' ? 'bg-purple-500' :
                theme.id === 'classic-light' ? 'bg-blue-500' :
                theme.id === 'dark-mode' ? 'bg-indigo-500' :
                theme.id === 'high-contrast' ? 'bg-black' :
                'bg-green-500'
              }`} />
              <div className={`h-2 w-8 rounded ${
                theme.id === 'dark-mode' ? 'bg-gray-700' : 
                theme.id === 'high-contrast' ? 'bg-gray-800' :
                'bg-gray-200'
              }`} />
            </div>
          </div>
        )}
      </button>
    );
  };

  const containerStyles = {
    grid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',
    list: 'flex flex-col gap-4',
    compact: 'flex flex-wrap gap-3',
  };

  return (
    <div className={`w-full ${className}`}>
      {showDescription && variant === 'grid' && (
        <p className="text-gray-600 mb-6">
          Choose a theme that suits your preference. Changes are applied immediately and saved automatically.
        </p>
      )}
      
      <div 
        className={`${containerStyles[variant]} ${isChanging ? 'pointer-events-none' : ''}`}
        role="group"
        aria-label="Theme selection"
      >
        {themes.map((theme) => (
          <ThemeCard key={theme.id} theme={theme} />
        ))}
      </div>
      
      {currentTheme && (
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-1">
            Current Theme: {currentTheme.name}
          </h4>
          <p className="text-sm text-gray-600">
            {currentTheme.description}
          </p>
        </div>
      )}
    </div>
  );
}
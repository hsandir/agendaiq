'use client';

import { ThemeSelector } from '@/components/theme/theme-selector';
import { useEffect, useState } from 'react';

export default function ThemeSettingsPage() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Theme Settings
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Personalize your AgendaIQ experience by choosing from our collection of professionally designed themes. 
          Each theme is optimized for both desktop and mobile devices.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <span>✨</span>
          Theme Features
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-3">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white text-2xl">
              📱
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Mobile Optimized
            </h3>
            <p className="text-sm text-gray-600">
              All themes are fully responsive and optimized for mobile devices with touch-friendly interfaces.
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center text-white text-2xl">
              🌐
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Cross-Browser Support
            </h3>
            <p className="text-sm text-gray-600">
              Perfect compatibility across all modern browsers including Chrome, Firefox, Safari, and Edge.
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center text-white text-2xl">
              ♿
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Accessibility First
            </h3>
            <p className="text-sm text-gray-600">
              Designed with accessibility in mind, including high contrast options and screen reader support.
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-2xl">
              💾
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Auto-Save Preferences
            </h3>
            <p className="text-sm text-gray-600">
              Your theme preference is automatically saved and will be remembered across all your devices.
            </p>
          </div>
        </div>
      </div>

      <div className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          Choose Your Theme
        </h2>
        <ThemeSelector 
          showDescription={true} 
          variant="grid" 
          className="w-full"
        />
      </div>

      <div className="bg-gray-50 rounded-lg border border-gray-200 p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <span>💡</span>
          Tips for Choosing a Theme
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <span>🌅</span>
              Working Hours
            </h3>
            <p className="text-sm text-gray-600">
              For long work sessions, consider the Dark Mode or Modern Purple themes to reduce eye strain.
            </p>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <span>👁️</span>
              Accessibility Needs
            </h3>
            <p className="text-sm text-gray-600">
              Users with visual impairments should consider the High Contrast theme for maximum readability.
            </p>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <span>🏢</span>
              Professional Settings
            </h3>
            <p className="text-sm text-gray-600">
              The Classic Light theme provides a professional appearance suitable for all business environments.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
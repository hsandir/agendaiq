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
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-foreground">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">
          Theme Settings
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Personalize your AgendaIQ experience by choosing from our collection of professionally designed themes. 
          Each theme is optimized for both desktop and mobile devices.
        </p>
      </div>

      <div className="bg-card text-card-foreground rounded-lg shadow-sm border border-border p-8 mb-12">
        <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
          <span aria-hidden>✨</span>
          Theme Features
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-3">
            <div className="w-12 h-12 bg-primary text-primary-foreground rounded-lg flex items-center justify-center text-2xl">
              📱
            </div>
            <h3 className="text-lg font-semibold">
              Mobile Optimized
            </h3>
            <p className="text-sm text-muted-foreground">
              All themes are fully responsive and optimized for mobile devices with touch-friendly interfaces.
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="w-12 h-12 bg-secondary text-secondary-foreground rounded-lg flex items-center justify-center text-2xl">
              🌐
            </div>
            <h3 className="text-lg font-semibold">
              Cross-Browser Support
            </h3>
            <p className="text-sm text-muted-foreground">
              Perfect compatibility across all modern browsers including Chrome, Firefox, Safari, and Edge.
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="w-12 h-12 bg-primary text-primary-foreground rounded-lg flex items-center justify-center text-2xl">
              ♿
            </div>
            <h3 className="text-lg font-semibold">
              Accessibility First
            </h3>
            <p className="text-sm text-muted-foreground">
              Designed with accessibility in mind, including high contrast options and screen reader support.
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="w-12 h-12 bg-secondary text-secondary-foreground rounded-lg flex items-center justify-center text-2xl">
              💾
            </div>
            <h3 className="text-lg font-semibold">
              Auto-Save Preferences
            </h3>
            <p className="text-sm text-muted-foreground">
              Your theme preference is automatically saved and will be remembered across all your devices.
            </p>
          </div>
        </div>
      </div>

      <div className="mb-12">
        <h2 className="text-2xl font-semibold mb-6">
          Choose Your Theme
        </h2>
        <ThemeSelector 
          showDescription={true} 
          variant="grid" 
          className="w-full"
        />
      </div>

      <div className="bg-muted rounded-lg border border-border p-8">
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <span>💡</span>
          Tips for Choosing a Theme
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              <span>🌅</span>
              Working Hours
            </h3>
            <p className="text-sm text-muted-foreground">
              For long work sessions, consider the Dark Mode or Modern Purple themes to reduce eye strain.
            </p>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              <span>👁️</span>
              Accessibility Needs
            </h3>
            <p className="text-sm text-muted-foreground">
              Users with visual impairments should consider the High Contrast theme for maximum readability.
            </p>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              <span>🏢</span>
              Professional Settings
            </h3>
            <p className="text-sm text-muted-foreground">
              The Classic Light theme provides a professional appearance suitable for all business environments.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
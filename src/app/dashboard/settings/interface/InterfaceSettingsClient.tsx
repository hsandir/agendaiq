'use client';

import React, { useState, useEffect } from 'react';
import { getLayoutPreference, layoutPreferences } from '@/lib/layout/layout-types';
import { Check, Layout, Sidebar, Grid, Monitor, Minimize2, Palette, Paintbrush, Wand2 } from 'lucide-react';
import { CustomThemeEditor } from '@/components/dashboard/CustomThemeEditor';

const LayoutIcons = {
  'classic': Sidebar,
  'modern': Grid,
  'compact': Minimize2,
  'executive': Monitor,
  'minimal': Layout,
} as const;

export function InterfaceSettingsClient() {
  const [currentLayoutId, setCurrentLayoutId] = useState('modern');
  const [currentThemeId, setCurrentThemeId] = useState('classic-light');
  const [isChanging, setIsChanging] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showCustomEditor, setShowCustomEditor] = useState(false);

  // Load preferences from database and localStorage
  useEffect(() => {
    setMounted(true);
    
    // First check localStorage
    const savedLayout = localStorage.getItem('agendaiq-layout');
    const savedTheme = localStorage.getItem('agendaiq-theme');
    
    if (savedLayout) {
      setCurrentLayoutId(savedLayout);
    }
    if (savedTheme) {
      setCurrentThemeId(savedTheme);
    }
    
    // Then fetch from database
    const fetchPreferences = async () => {
      try {
        // Fetch layout preference
        const layoutRes = await fetch('/api/user/layout');
        if (layoutRes.ok) {
          const layoutData = await layoutRes.json();
          if (layoutData.layout) {
            setCurrentLayoutId(layoutData.layout);
            localStorage.setItem('agendaiq-layout', layoutData.layout);
          }
        }
        
        // Fetch theme preference
        const themeRes = await fetch('/api/user/theme');
        if (themeRes.ok) {
          const themeData = await themeRes.json();
          if (themeData.theme) {
            setCurrentThemeId(themeData.theme);
            localStorage.setItem('agendaiq-theme', themeData.theme);
          }
        }
      } catch (error) {
        console.error('Error fetching preferences:', error);
      }
    };
    
    fetchPreferences();
  }, []);

  const handleLayoutChange = async (layoutId: string) => {
    setIsChanging(true);
    
    // Update local state
    setCurrentLayoutId(layoutId);
    
    // Save to localStorage
    localStorage.setItem('agendaiq-layout', layoutId);
    
    // Save layout preference to database
    try {
      await fetch('/api/user/layout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ layoutId }),
      });
    } catch (error) {
      console.error('Error saving layout:', error);
    }
    
    // Apply layout data attributes
    const layout = getLayoutPreference(layoutId);
    document.documentElement.setAttribute('data-layout', layoutId);
    document.documentElement.setAttribute('data-sidebar-position', layout.sidebarPosition);
    document.documentElement.setAttribute('data-header-style', layout.headerStyle);
    document.documentElement.setAttribute('data-navigation-style', layout.navigationStyle);
    document.documentElement.setAttribute('data-content-layout', layout.contentLayout);
    document.documentElement.setAttribute('data-spacing', layout.spacing);
    
    // Trigger a page reload to apply the layout changes
    setTimeout(() => {
      window.location.reload();
    }, 300);
  };

  const handleThemeChange = async (themeId: string) => {
    setIsChanging(true);
    setCurrentThemeId(themeId);
    
    // Save theme preference
    localStorage.setItem('agendaiq-theme', themeId);
    
    // Apply theme via API call
    try {
      await fetch('/api/user/theme', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ themeId }),
      });
      
      // Reload to apply theme
      setTimeout(() => {
        window.location.reload();
      }, 300);
    } catch (error) {
      console.error('Error saving theme:', error);
      setIsChanging(false);
    }
  };

  if (!mounted) {
    return (
      <div className="animate-pulse space-y-8">
        <div className="h-8 bg-muted rounded w-48 mb-4"></div>
        <div className="h-4 bg-muted rounded w-96 mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-32 bg-muted rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  const currentLayout = getLayoutPreference(currentLayoutId);
  
  // All available theme options
  const themeOptions = [
    { id: 'standard', name: 'Standard', description: 'Original standard theme' },
    { id: 'classic-light', name: 'Classic Light', description: 'Clean and professional light theme' },
    { id: 'classic-dark', name: 'Classic Dark', description: 'Easy on the eyes dark theme' },
    { id: 'midnight-blue', name: 'Midnight Blue', description: 'Deep blue theme for focus' },
    { id: 'forest-green', name: 'Forest Green', description: 'Natural green theme' },
    { id: 'warm-orange', name: 'Warm Orange', description: 'Energetic warm theme' },
    { id: 'tasarim', name: 'AgendaIQ', description: 'Official AgendaIQ dark theme with purple accents' },
    { id: 'modern-purple', name: 'Modern Purple', description: 'Modern dark theme with purple accents' },
    { id: 'dark-mode', name: 'Dark Mode', description: 'Modern dark theme for reduced eye strain' },
    { id: 'high-contrast', name: 'High Contrast', description: 'Maximum contrast for accessibility' },
    { id: 'nature-green', name: 'Nature Green', description: 'Calming green theme inspired by nature' },
    { id: 'custom', name: 'Custom Theme', description: 'Create your own personalized theme', special: true },
  ];

  return (
    <div className="space-y-12">
      {/* Layout Section */}
      <section>
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-foreground mb-2 flex items-center gap-3">
            <Monitor className="h-6 w-6 text-primary" />
            Layout Options
          </h2>
          <p className="text-muted-foreground">
            Choose how you want your navigation and content to be arranged. Each layout is optimized for different use cases.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {layoutPreferences.map((layout) => {
            const Icon = LayoutIcons[layout.id as keyof typeof LayoutIcons] || Layout;
            const isSelected = currentLayout.id === layout.id;

            return (
              <button
                key={layout.id}
                onClick={() => handleLayoutChange(layout.id)}
                disabled={isChanging}
                className={`
                  relative overflow-hidden rounded-lg border-2 p-4 text-left transition-all
                  bg-card border-border hover:border-primary
                  ${isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}
                  ${isChanging ? 'opacity-50 cursor-wait' : 'hover:scale-105 cursor-pointer'}
                `}
              >
                <div className="flex items-start gap-3">
                  <Icon className="h-6 w-6 text-primary flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      {layout.name}
                      {isSelected && (
                        <Check className="h-4 w-4 text-green-600" />
                      )}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {layout.description}
                    </p>
                  </div>
                </div>
                
                {/* Preview layout structure */}
                <div className="mt-4 space-y-2">
                  <div className="flex gap-1">
                    {layout.sidebarPosition !== 'hidden' && (
                      <div className="h-3 w-2 rounded-sm bg-primary/30" />
                    )}
                    <div className="h-3 flex-1 rounded-sm bg-muted" />
                    {layout.contentLayout === 'two-column' && (
                      <div className="h-3 w-8 rounded-sm bg-muted/60" />
                    )}
                    {layout.contentLayout === 'three-column' && (
                      <>
                        <div className="h-3 w-6 rounded-sm bg-muted/60" />
                        <div className="h-3 w-4 rounded-sm bg-muted/40" />
                      </>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        
        {currentLayout && (
          <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-lg">
            <h4 className="font-semibold text-foreground mb-1">
              Current Layout: {currentLayout.name}
            </h4>
            <p className="text-sm text-muted-foreground">
              {currentLayout.description}
            </p>
            <div className="mt-3 text-xs text-muted-foreground">
              Content: {currentLayout.contentLayout} • Navigation: {currentLayout.navigationStyle} • Spacing: {currentLayout.spacing}
            </div>
          </div>
        )}
      </section>

      {/* Theme Section */}
      <section className="pt-8 border-t border-border">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-foreground mb-2 flex items-center gap-3">
            <Palette className="h-6 w-6 text-primary" />
            Theme Selection
          </h2>
          <p className="text-muted-foreground">
            Pick a color scheme that's comfortable for your eyes and work environment.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {themeOptions.map((theme) => {
            const isSelected = currentThemeId === theme.id;
            const isCustom = theme.id === 'custom';

            return (
              <button
                key={theme.id}
                onClick={() => {
                  if (isCustom) {
                    setShowCustomEditor(true);
                  } else {
                    handleThemeChange(theme.id);
                  }
                }}
                disabled={isChanging && !isCustom}
                className={`
                  relative overflow-hidden rounded-lg border-2 p-4 text-left transition-all
                  ${isCustom ? 'bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/50 hover:border-purple-500' : 'bg-card border-border hover:border-primary'}
                  ${isSelected && !isCustom ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}
                  ${isChanging && !isCustom ? 'opacity-50 cursor-wait' : 'hover:scale-105 cursor-pointer'}
                `}
              >
                <div className="flex items-start gap-3">
                  {isCustom ? (
                    <Wand2 className="h-6 w-6 text-purple-500 flex-shrink-0" />
                  ) : (
                    <Paintbrush className="h-6 w-6 text-primary flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      {theme.name}
                      {isSelected && !isCustom && (
                        <Check className="h-4 w-4 text-green-600" />
                      )}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {theme.description}
                    </p>
                  </div>
                </div>
                
                {/* Theme color preview - fixed colors per theme */}
                <div className="mt-4">
                  <div className="flex gap-1">
                    {theme.id === 'standard' && (
                      <>
                        <div className="h-3 w-6 rounded-sm" style={{ backgroundColor: '#FFFFFF' }} />
                        <div className="h-3 w-6 rounded-sm" style={{ backgroundColor: '#5A82F7' }} />
                        <div className="h-3 w-6 rounded-sm" style={{ backgroundColor: '#E5E9F0' }} />
                      </>
                    )}
                    {theme.id === 'classic-light' && (
                      <>
                        <div className="h-3 w-6 rounded-sm" style={{ backgroundColor: '#FAFAFA' }} />
                        <div className="h-3 w-6 rounded-sm" style={{ backgroundColor: '#2563EB' }} />
                        <div className="h-3 w-6 rounded-sm" style={{ backgroundColor: '#7C3AED' }} />
                      </>
                    )}
                    {theme.id === 'classic-dark' && (
                      <>
                        <div className="h-3 w-6 rounded-sm" style={{ backgroundColor: '#1A1A1A' }} />
                        <div className="h-3 w-6 rounded-sm" style={{ backgroundColor: '#60A5FA' }} />
                        <div className="h-3 w-6 rounded-sm" style={{ backgroundColor: '#4A4A4A' }} />
                      </>
                    )}
                    {theme.id === 'midnight-blue' && (
                      <>
                        <div className="h-3 w-6 rounded-sm" style={{ backgroundColor: '#0E1321' }} />
                        <div className="h-3 w-6 rounded-sm" style={{ backgroundColor: '#4A64F0' }} />
                        <div className="h-3 w-6 rounded-sm" style={{ backgroundColor: '#3A4753' }} />
                      </>
                    )}
                    {theme.id === 'forest-green' && (
                      <>
                        <div className="h-3 w-6 rounded-sm" style={{ backgroundColor: '#F0FDF4' }} />
                        <div className="h-3 w-6 rounded-sm" style={{ backgroundColor: '#10B981' }} />
                        <div className="h-3 w-6 rounded-sm" style={{ backgroundColor: '#86EFAC' }} />
                      </>
                    )}
                    {theme.id === 'warm-orange' && (
                      <>
                        <div className="h-3 w-6 rounded-sm" style={{ backgroundColor: '#FFF7ED' }} />
                        <div className="h-3 w-6 rounded-sm" style={{ backgroundColor: '#FB923C' }} />
                        <div className="h-3 w-6 rounded-sm" style={{ backgroundColor: '#FED7AA' }} />
                      </>
                    )}
                    {theme.id === 'tasarim' && (
                      <>
                        <div className="h-3 w-6 rounded-sm" style={{ backgroundColor: '#0F172A' }} />
                        <div className="h-3 w-6 rounded-sm" style={{ backgroundColor: '#6366F1' }} />
                        <div className="h-3 w-6 rounded-sm" style={{ backgroundColor: '#8B5CF6' }} />
                      </>
                    )}
                    {theme.id === 'modern-purple' && (
                      <>
                        <div className="h-3 w-6 rounded-sm" style={{ backgroundColor: '#1A1B3A' }} />
                        <div className="h-3 w-6 rounded-sm" style={{ backgroundColor: '#A855F7' }} />
                        <div className="h-3 w-6 rounded-sm" style={{ backgroundColor: '#EC4899' }} />
                      </>
                    )}
                    {theme.id === 'dark-mode' && (
                      <>
                        <div className="h-3 w-6 rounded-sm" style={{ backgroundColor: '#18181B' }} />
                        <div className="h-3 w-6 rounded-sm" style={{ backgroundColor: '#818CF8' }} />
                        <div className="h-3 w-6 rounded-sm" style={{ backgroundColor: '#F472B6' }} />
                      </>
                    )}
                    {theme.id === 'high-contrast' && (
                      <>
                        <div className="h-3 w-6 rounded-sm" style={{ backgroundColor: '#FFFFFF' }} />
                        <div className="h-3 w-6 rounded-sm" style={{ backgroundColor: '#0066CC' }} />
                        <div className="h-3 w-6 rounded-sm" style={{ backgroundColor: '#000000' }} />
                      </>
                    )}
                    {theme.id === 'nature-green' && (
                      <>
                        <div className="h-3 w-6 rounded-sm" style={{ backgroundColor: '#F0FDF4' }} />
                        <div className="h-3 w-6 rounded-sm" style={{ backgroundColor: '#059669' }} />
                        <div className="h-3 w-6 rounded-sm" style={{ backgroundColor: '#84CC16' }} />
                      </>
                    )}
                    {theme.id === 'custom' && (
                      <>
                        <div className="h-3 w-6 rounded-sm bg-gradient-to-r from-purple-500 to-pink-500" />
                        <div className="h-3 w-6 rounded-sm bg-gradient-to-r from-blue-500 to-cyan-500" />
                        <div className="h-3 w-6 rounded-sm bg-gradient-to-r from-green-500 to-yellow-500" />
                      </>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        
        <div className="mt-6 p-4 bg-accent/10 border border-accent/20 rounded-lg">
          <h4 className="font-semibold text-foreground mb-1">
            Current Theme: {themeOptions.find(t => t.id === currentThemeId)?.name || 'Classic Light'}
          </h4>
          <p className="text-sm text-muted-foreground">
            {themeOptions.find(t => t.id === currentThemeId)?.description || 'Default light theme'}
          </p>
        </div>
      </section>

      {/* Preview Section */}
      <section className="pt-8 border-t border-border">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-foreground mb-2">Live Preview</h2>
          <p className="text-muted-foreground">
            Your changes are applied in real-time. Navigate to other pages to see your customization in action.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-4">
            <h3 className="font-semibold text-foreground mb-3">Sample Meeting Card</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-background/50 border border-border/50 rounded-lg">
                <div>
                  <h4 className="font-medium">Team Standup Meeting</h4>
                  <p className="text-sm text-muted-foreground">Today at 10:00 AM</p>
                </div>
                <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">Upcoming</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-background/50 border border-border/50 rounded-lg">
                <div>
                  <h4 className="font-medium">Project Review</h4>
                  <p className="text-sm text-muted-foreground">Tomorrow at 2:30 PM</p>
                </div>
                <span className="text-xs px-2 py-1 bg-secondary/10 text-secondary rounded-full">Scheduled</span>
              </div>
            </div>
          </div>
          
          <div className="card p-4">
            <h3 className="font-semibold text-foreground mb-3">Navigation Preview</h3>
            <nav className="space-y-2">
              <div className="flex items-center gap-3 p-2 bg-primary/5 text-primary rounded-lg">
                <div className="w-4 h-4 rounded bg-primary/20"></div>
                <span className="text-sm font-medium">Dashboard (Active)</span>
              </div>
              <div className="flex items-center gap-3 p-2 text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded-lg transition-colors">
                <div className="w-4 h-4 rounded bg-muted"></div>
                <span className="text-sm">Meetings</span>
              </div>
              <div className="flex items-center gap-3 p-2 text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded-lg transition-colors">
                <div className="w-4 h-4 rounded bg-muted"></div>
                <span className="text-sm">Meeting Intelligence</span>
              </div>
            </nav>
          </div>
        </div>
      </section>

      {/* Custom Theme Editor Modal */}
      {showCustomEditor && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Custom Theme Editor</h2>
              <button
                onClick={() => setShowCustomEditor(false)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <CustomThemeEditor />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
'use client';

import React, { useState, useEffect } from 'react';
import { getLayoutPreference, layoutPreferences } from '@/lib/layout/layout-types';
import { Check, Layout, Sidebar, Grid, Monitor, Minimize2 } from 'lucide-react';

const LayoutIcons = {
  'classic': Sidebar,
  'modern': Grid,
  'compact': Minimize2,
  'executive': Monitor,
  'minimal': Layout,
} as const;

export function LayoutSettingsClient() {
  const [currentLayoutId, setCurrentLayoutId] = useState('modern');
  const [isChanging, setIsChanging] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Load layout preference from localStorage
  useEffect(() => {
    setMounted(true);
    const savedLayout = localStorage.getItem('agendaiq-layout');
    if (savedLayout) {
      setCurrentLayoutId(savedLayout);
    }
  }, []);

  const handleLayoutChange = async (layoutId: string) => {
    setIsChanging(true);
    
    // Update local state
    setCurrentLayoutId(layoutId);
    
    // Save to localStorage
    localStorage.setItem('agendaiq-layout', layoutId);
    
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

  if (!mounted) {
    return (
      <div className="animate-pulse">
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Layout Settings</h1>
        <p className="text-muted-foreground">
          Choose how you want your navigation and content to be arranged. Each layout is optimized for different use cases.
        </p>
      </div>

      {/* Layout Preferences Section */}
      <section>
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-foreground mb-2">Available Layouts</h2>
          <p className="text-muted-foreground">
            Select a layout that matches your workflow. Changes are applied immediately and the page will reload automatically.
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
          <div className="mt-8 p-4 bg-primary/10 border border-primary/20 rounded-lg">
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

      {/* Theme Section Note */}
      <section className="pt-8 border-t border-border">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-foreground mb-2">Theme Settings</h2>
          <p className="text-muted-foreground">
            For theme customization, please visit the <a href="/dashboard/settings/theme" className="text-primary hover:underline font-medium">Theme Settings page</a>.
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
                <span className="text-sm">Notes</span>
              </div>
            </nav>
          </div>
        </div>
      </section>
    </div>
  );
}
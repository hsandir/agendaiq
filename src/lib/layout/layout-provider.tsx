'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { LayoutPreference, getLayoutPreference, layoutPreferences } from './layout-types';

interface LayoutContextType {
  layout: LayoutPreference;
  setLayout: (layoutId: string) => void;
  layoutOptions: LayoutPreference[];
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const [currentLayoutId, setCurrentLayoutId] = useState('modern');
  const [mounted, setMounted] = useState(false);

  // Load layout preference from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const savedLayout = localStorage.getItem('agendaiq-layout');
    if (savedLayout) {
      setCurrentLayoutId(savedLayout);
    }
  }, []);

  // Apply layout changes
  useEffect(() => {
    if (!mounted) return;

    const layout = getLayoutPreference(currentLayoutId);
    
    // Apply layout data attribute for CSS targeting
    document.documentElement.setAttribute('data-layout', currentLayoutId);
    document.documentElement.setAttribute('data-sidebar-position', layout.sidebarPosition);
    document.documentElement.setAttribute('data-header-style', layout.headerStyle);
    document.documentElement.setAttribute('data-navigation-style', layout.navigationStyle);
    document.documentElement.setAttribute('data-content-layout', layout.contentLayout);
    document.documentElement.setAttribute('data-spacing', layout.spacing);

    // Save to localStorage
    localStorage.setItem('agendaiq-layout', currentLayoutId);
  }, [currentLayoutId, mounted]);

  const setLayout = (layoutId: string) => {
    setCurrentLayoutId(layoutId);
  };

  if (!mounted) {
    // Return a minimal fallback during hydration
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  const layout = getLayoutPreference(currentLayoutId);

  return (
    <LayoutContext.Provider value={{ layout, setLayout, layoutOptions: layoutPreferences }}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
}
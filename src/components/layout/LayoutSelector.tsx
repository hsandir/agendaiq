'use client';

import React, { useState } from 'react';
import { useLayout } from '@/lib/layout/layout-provider';
import { Check, Layout, Sidebar, Grid, Monitor, Minimize2 } from 'lucide-react';

interface LayoutSelectorProps {
  className?: string;
  showDescription?: boolean;
  variant?: 'grid' | 'list' | 'compact';
}

const LayoutIcons = {
  'classic': Sidebar,
  'modern': Grid,
  'compact': Minimize2,
  'executive': Monitor,
  'minimal': Layout,
} as const;

export function LayoutSelector({ 
  className = '', 
  showDescription = true, 
  variant = 'grid' 
}: LayoutSelectorProps) {
  const { layout: currentLayout, setLayout, layoutOptions } = useLayout();
  const [isChanging, setIsChanging] = useState(false);

  const handleLayoutChange = async (layoutId: string) => {
    setIsChanging(true);
    
    // Add smooth transition
    document.documentElement.style.transition = 'all 0.3s ease-in-out';
    
    await new Promise(resolve => setTimeout(resolve, 50));
    setLayout(layoutId);
    
    // Remove transition after change
    setTimeout(() => {
      document.documentElement.style.transition = '';
      setIsChanging(false);
    }, 300);
  };

  const LayoutCard = ({ layout }: { layout: typeof layoutOptions[0] }) => {
    const Icon = LayoutIcons[layout.id as keyof typeof LayoutIcons] || Layout;
    const isSelected = currentLayout.id === layout.id;

    return (
      <button
        onClick={() => handleLayoutChange(layout.id)}
        disabled={isChanging}
        className={`
          relative overflow-hidden rounded-lg border-2 p-4 text-left transition-all
          bg-card border-border hover:border-primary
          ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}
          ${isChanging ? 'opacity-50 cursor-wait' : 'hover:scale-105 cursor-pointer'}
          ${variant === 'compact' ? 'flex items-center gap-3' : 'block'}
        `}
      >
        <div className={variant === 'compact' ? 'flex items-center gap-3' : ''}>
          <Icon className="h-6 w-6 text-primary" />
          <div className={variant === 'compact' ? '' : 'mt-3'}>
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              {layout.name}
              {isSelected && (
                <Check className="h-4 w-4 text-green-600" />
              )}
            </h3>
            {showDescription && variant !== 'compact' && (
              <p className="mt-1 text-sm text-muted-foreground">
                {layout.description}
              </p>
            )}
          </div>
        </div>
        
        {variant === 'grid' && (
          <div className="mt-4 space-y-2">
            {/* Preview layout structure */}
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
        <p className="text-muted-foreground mb-6">
          Choose a layout that matches your workflow. Changes are applied immediately and saved automatically.
        </p>
      )}
      
      <div 
        className={`${containerStyles[variant]} ${isChanging ? 'pointer-events-none' : ''}`}
        role="group"
        aria-label="Layout selection"
      >
        {layoutOptions.map((layout) => (
          <LayoutCard key={layout.id} layout={layout} />
        ))}
      </div>
      
      {currentLayout && (
        <div className="mt-8 p-4 bg-primary border border-primary-dark rounded-lg">
          <h4 className="font-semibold text-primary-foreground mb-1">
            Current Layout: {currentLayout.name}
          </h4>
          <p className="text-sm text-primary-foreground/80">
            {currentLayout.description}
          </p>
          <div className="mt-3 text-xs text-primary-foreground/70">
            Content: {currentLayout.contentLayout} • Navigation: {currentLayout.navigationStyle} • Spacing: {currentLayout.spacing}
          </div>
        </div>
      )}
    </div>
  );
}
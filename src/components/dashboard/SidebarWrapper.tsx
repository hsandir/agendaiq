'use client';

import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { HiddenSidebar } from './HiddenSidebar';

interface SidebarWrapperProps {
  isAdmin: boolean;
  className?: string;
}

export function SidebarWrapper({ isAdmin, className }: SidebarWrapperProps) {
  const [isHiddenSidebarOpen, setIsHiddenSidebarOpen] = useState(false);
  const [filter, setFilter] = useState("");

  const handleSettingsClick = () => {
    setIsHiddenSidebarOpen(true);
  };

  const handleHiddenSidebarToggle = () => {
    setIsHiddenSidebarOpen(!isHiddenSidebarOpen);
  };

  return (
    <section
      role="region"
      aria-label="Sidebar region"
      className={className}
    >
      {/* Hidden Settings Sidebar */}
      <HiddenSidebar 
        isAdmin={isAdmin} 
        isOpen={isHiddenSidebarOpen}
        onToggle={handleHiddenSidebarToggle}
      />
      
      {/* Modern Sticky Sidebar */}
      <aside 
        className="w-full h-full bg-card/80 backdrop-blur-sm overflow-y-auto"
        aria-label="Main navigation"
        role="navigation"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'hsl(var(--muted)) transparent' }}
      >
        {/* Brand Header */}
        <div className="px-6 py-7 border-b border-border/50">
          <h1 className="text-xl font-bold text-primary tracking-wide">AgendaIQ</h1>
        </div>
        
        {/* Enhanced Filter */}
        <div className="px-4 py-4">
          <label htmlFor="sidebar-filter" className="sr-only">Filter navigation</label>
          <div className="relative">
            <svg 
              width="16" 
              height="16" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              viewBox="0 0 24 24" 
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              <circle cx="11" cy="11" r="7"></circle>
              <path d="M21 21l-4.35-4.35"></path>
            </svg>
            <input
              id="sidebar-filter"
              aria-label="Filter navigation"
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-background/50 border border-border/60 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-muted-foreground"
              placeholder="Search navigation..."
            />
          </div>
        </div>
        
        {/* Navigation */}
        <div className="px-2 pb-6">
          <Sidebar onSettingsClick={handleSettingsClick} />
        </div>
      </aside>
    </section>
  );
}

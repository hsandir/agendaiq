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
        
        {/* Navigation */}
        <div className="px-2 pb-6">
          <Sidebar onSettingsClick={handleSettingsClick} />
        </div>
      </aside>
    </section>
  );
}

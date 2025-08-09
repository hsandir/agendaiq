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
        {/* Navigation */}
        <div className="px-2 py-6">
          <Sidebar onSettingsClick={handleSettingsClick} />
        </div>
      </aside>
    </section>
  );
}

'use client';

import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { HiddenSidebar } from './HiddenSidebar';

interface SidebarWrapperProps {
  isAdmin: boolean;
}

export function SidebarWrapper({ isAdmin }: SidebarWrapperProps) {
  const [isHiddenSidebarOpen, setIsHiddenSidebarOpen] = useState(false);

  const handleSettingsClick = () => {
    setIsHiddenSidebarOpen(true);
  };

  const handleHiddenSidebarToggle = () => {
    setIsHiddenSidebarOpen(!isHiddenSidebarOpen);
  };

  return (
    <>
      {/* Hidden Settings Sidebar */}
      <HiddenSidebar 
        isAdmin={isAdmin} 
        isOpen={isHiddenSidebarOpen}
        onToggle={handleHiddenSidebarToggle}
      />
      
      {/* Main Sidebar */}
      <aside className="w-64 bg-white border-r h-full">
        <Sidebar onSettingsClick={handleSettingsClick} />
      </aside>
    </>
  );
}

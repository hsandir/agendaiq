'use client';

import React from 'react';
import { useLayout } from '@/lib/layout/layout-provider';
import { layoutClasses } from '@/lib/layout/layout-types';
import { SidebarWrapper } from '@/components/dashboard/SidebarWrapper';
import { RoleSwitch } from '@/components/dashboard/RoleSwitch';

interface DynamicLayoutWrapperProps {
  children: React.ReactNode;
  isAdmin: boolean;
  user: any;
  currentRole: any;
  userWithStaff: any;
}

export function DynamicLayoutWrapper({ 
  children, 
  isAdmin, 
  user, 
  currentRole, 
  userWithStaff 
}: DynamicLayoutWrapperProps) {
  const { layout } = useLayout();

  // Get appropriate classes based on current layout
  const gridSystemClass = layoutClasses.gridSystem[layout.gridSystem];
  const sidebarClass = layoutClasses.sidebar[layout.sidebarPosition];
  const headerClass = layoutClasses.header[layout.headerStyle];
  const spacingClass = layoutClasses.spacing[layout.spacing];

  // Classic Layout (Original)
  if (layout.id === 'classic') {
    return (
      <div className="flex min-h-screen bg-background text-foreground">
        {/* Classic Top Navigation */}
        <nav className="bg-card text-card-foreground shadow border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <Link
                  href="/dashboard"
                  className="flex items-center px-2 py-2 hover:text-foreground/80"
                >
                  Dashboard
                </Link>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">
                    {user.email}
                  </span>
                  <span className="text-xs px-2 py-1 bg-muted text-foreground rounded-full">
                    {currentRole?.title || 'No Role'}
                  </span>
                  <RoleSwitch staff={userWithStaff?.Staff?.[0] || null} />
                </div>
              </div>
            </div>
          </div>
        </nav>

        <div className="flex min-h-screen">
          <SidebarWrapper isAdmin={isAdmin} />
          <div className="flex-1 flex flex-col">
            <Header />
            <main className="flex-1 bg-background">
              <div className="container mx-auto px-4 py-8">
                {children}
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }

  // Modern Layout (Grid-based)
  if (layout.id === 'modern' || layout.id === 'executive') {
    const colWidth = layout.id === 'executive' ? '280px' : '260px';
    
    return (
      <div className={`grid min-h-screen bg-background text-foreground`} 
           style={{ gridTemplateColumns: layout.sidebarPosition !== 'hidden' ? `${colWidth} 1fr` : '1fr' }}
           data-layout={layout.id}>
        
        {layout.sidebarPosition !== 'hidden' && (
          <SidebarWrapper 
            isAdmin={isAdmin} 
            className="sticky top-0 h-screen bg-card shadow-lg border-r border-border" 
          />
        )}

        <main className="flex flex-col min-h-screen">
          <header className={`flex items-center justify-between ${spacingClass} bg-background/95 backdrop-blur border-b border-border ${headerClass}`}>
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Dashboard</h1>
              
              {layout.sidebarPosition === 'hidden' && (
                <button 
                  className="p-2 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Open navigation menu"
                >
                  <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 12h18m-9 6H3m18-12H3"/>
                  </svg>
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              {/* Enhanced Search */}
              <div className="hidden sm:flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2 min-w-[280px] focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent transition-all">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-muted-foreground">
                  <circle cx="11" cy="11" r="7"></circle>
                  <path d="M21 21l-4.35-4.35"></path>
                </svg>
                <input 
                  placeholder="Search meetings, notes, tasks..."
                  className="w-full bg-transparent border-0 outline-0 text-sm text-foreground placeholder:text-muted-foreground"
                />
              </div>
              
              {/* User Info */}
              <div className="flex items-center gap-3">
                <div className="hidden md:flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{user.email}</span>
                  <span className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded-full font-medium">
                    {currentRole?.title || 'No Role'}
                  </span>
                </div>
                <RoleSwitch staff={userWithStaff?.Staff?.[0] || null} />
              </div>
            </div>
          </header>

          <div className={`flex-1 ${spacingClass}`}>
            {children}
          </div>
        </main>
      </div>
    );
  }

  // Compact Layout
  if (layout.id === 'compact') {
    return (
      <div className="flex min-h-screen bg-background text-foreground" data-layout="compact">
        <SidebarWrapper 
          isAdmin={isAdmin} 
          className="w-56 sticky top-0 h-screen bg-card border-r border-border" 
        />
        
        <main className="flex-1 flex flex-col">
          <header className="flex items-center justify-between px-4 py-3 bg-card border-b border-border">
            <h1 className="text-lg font-semibold text-foreground">Dashboard</h1>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded font-medium">
                {currentRole?.title || 'No Role'}
              </span>
              <RoleSwitch staff={userWithStaff?.Staff?.[0] || null} />
            </div>
          </header>
          
          <div className="flex-1 px-4 py-4">
            {children}
          </div>
        </main>
      </div>
    );
  }

  // Minimal Layout
  if (layout.id === 'minimal') {
    return (
      <div className="min-h-screen bg-background text-foreground" data-layout="minimal">
        <header className="flex items-center justify-between px-6 py-4 border-b border-border/30">
          <h1 className="text-xl font-bold text-foreground">AgendaIQ</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{user.email}</span>
            <RoleSwitch staff={userWithStaff?.Staff?.[0] || null} />
          </div>
        </header>
        
        <main className="px-6 py-8">
          {children}
        </main>
      </div>
    );
  }

  // Fallback to modern layout
  return (
    <div className="grid grid-cols-[260px_1fr] min-h-screen bg-background text-foreground">
      <SidebarWrapper isAdmin={isAdmin} className="sticky top-0 h-screen bg-card shadow-lg border-r border-border" />
      <main className="flex flex-col min-h-screen">
        <div className="flex-1 px-6 lg:px-12 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
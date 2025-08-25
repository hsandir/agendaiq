'use client';

import React, { useState, useEffect } from 'react';
import Link from "next/link";
import type { Route } from 'next';
import { Header } from "@/components/dashboard/Header";
import { SidebarWrapper } from "@/components/dashboard/SidebarWrapper";
import { getLayoutPreference } from '@/lib/layout/layout-types';
import { Monitor, UserCheck, Shield, Settings, MoreHorizontal, ChevronRight, Search, BarChart, CheckSquare, GitBranch, Brain, UserCog, LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { MobileMenu } from '@/components/dashboard/MobileMenu';
// Performance monitoring is handled through the hook now
import { layoutStore } from '@/lib/layout/layout-store';

interface DashboardLayoutClientProps {
  children: React.ReactNode;
  isAdmin: boolean;
  user: { email: string; name?: string; staff_id?: number | null; [key: string]: any };
  userWithstaff: any;
}

export function DashboardLayoutClient({ 
  children, 
  isAdmin, 
  user, 
 
  userWithstaff 
}: DashboardLayoutClientProps) {
  // Start with a default layout to avoid hydration mismatch
  const [layoutId, setLayoutId] = useState(() => {
    // First check if we have a layout in the store (persists across navigation)
    const storeLayout = layoutStore.getCurrentLayout();
    if (storeLayout) {
      return storeLayout;
    }
    // Check localStorage on client side only
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('agendaiq-layout');
      if (saved) {
        layoutStore.setCurrentLayout(saved); // Update store
        return saved;
      }
    }
    return 'modern';
  });
  const [mounted, setMounted] = useState(false);

  // Load layout preference from localStorage and optionally sync with database
  useEffect(() => {
    setMounted(true);
    
    // If already initialized for this session, skip everything
    if (layoutStore.isInitialized()) {
      return;
    }
    
    layoutStore.setInitialized(true);
    
    // localStorage is our primary source of truth
    const savedLayout = localStorage.getItem('agendaiq-layout');
    if (savedLayout && savedLayout !== layoutId) {
      setLayoutId(savedLayout);
      layoutStore.setCurrentLayout(savedLayout);
    }
    
    // Only sync with database ONCE per session (not per navigation)
    // Check if user has a session before making API call
    const hasSession = document.cookie.includes('next-auth.session-token') || 
                      document.cookie.includes('__Secure-next-auth.session-token');
    
    if (hasSession && layoutStore.needsSync()) {
      // Mark as synced immediately to prevent multiple calls
      layoutStore.setLastSyncTime(Date.now());
      
      // Database sync in background - fire and forget
      // This won't block the UI and only happens once per session
      const dbSyncTimer = setTimeout(() => {
        fetch('/api/user/layout')
          .then(res => res.ok ? res.json() : null)
          .then(data => {
            if (data?.layout && data.layout !== savedLayout) {
              // Only update if different from localStorage
              setLayoutId(data.layout);
              layoutStore.setCurrentLayout(data.layout);
              localStorage.setItem('agendaiq-layout', data.layout);
            }
          })
          .catch(() => {
            // Silently ignore - not critical
          });
      }, 2000); // 2 second delay to not interfere with page load
      
      return () => clearTimeout(dbSyncTimer);
    }
  }, []); // Empty dependency array - only run once per mount

  const layout = getLayoutPreference(layoutId);

  // Modern layouts with grid system
  if (layout.id === 'modern' || layout.id === 'executive') {
    const colWidth = layout.id === 'executive' ? '280px' : '260px';
    
    return (
      <div className="md:grid min-h-screen bg-background text-foreground" 
           style={{ gridTemplateColumns: layout.sidebarPosition !== 'hidden' ? `${colWidth} 1fr` : '1fr' }}
           data-layout={layout.id}>
        
        {layout.sidebarPosition !== 'hidden' && (
          <SidebarWrapper 
            isAdmin={isAdmin} 
            className="hidden md:block sticky top-0 h-screen bg-card shadow-lg border-r border-border" 
          />
        )}

        <main className="flex flex-col min-h-screen">
          <header className="flex items-center justify-between px-4 sm:px-6 lg:px-12 py-4 sm:py-7 bg-background/95 backdrop-blur border-b border-border sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <MobileMenu user={user} isAdmin={isAdmin} />
              <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                Dashboard - Meeting Intelligence Platform
              </h1>
              
              {layout.sidebarPosition === 'hidden' && (
                <button 
                  className="hidden md:block p-2 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Open navigation menu"
                >
                  <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 12h18m-9 6H3m18-12H3"/>
                  </svg>
                </button>
              )}
            </div>
            
            {/* User Info */}
            <div className="hidden md:flex items-center gap-3">
              <div className="hidden lg:flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{user.email}</span>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </header>

          <div className="flex-1 px-4 sm:px-6 lg:px-12 py-4 sm:py-8">
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
          className="hidden md:block w-56 sticky top-0 h-screen bg-card border-r border-border" 
        />
        
        <main className="flex-1 flex flex-col">
          <header className="flex items-center justify-between px-4 py-3 bg-card border-b border-border">
            <div className="flex items-center gap-3">
              <MobileMenu user={user} isAdmin={isAdmin} />
              <h1 className="text-lg font-semibold text-foreground">Dashboard - Meeting Intelligence Platform</h1>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
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
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 sm:px-6 py-4 border-b border-border/30">
          <div className="flex items-center gap-4 sm:gap-6">
            <MobileMenu user={user} isAdmin={isAdmin} />
            <h1 className="text-lg sm:text-xl font-bold text-foreground">AgendaIQ</h1>
            
            {/* Minimal Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              <Link
                href="/dashboard"
                className="px-3 py-1 text-sm font-medium text-foreground hover:text-primary transition-colors rounded-md"
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard/meetings"
                className="px-3 py-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md"
              >
                Meetings
              </Link>
              <Link
                href="/dashboard/meeting-intelligence"
                className="px-3 py-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md"
              >
                Intelligence
              </Link>
              
              {/* Settings Dropdown for Admin */}
              <div className="relative group">
                <Link
                  href="/dashboard/settings"
                  className="px-3 py-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md"
                >
                  Settings
                </Link>
                
                <div className="absolute left-0 top-full mt-2 w-56 bg-card border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <div className="p-2">
                    <div className="space-y-1">
                      <Link href="/dashboard/settings/interface" className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">
                        <Monitor className="h-4 w-4" />
                        Interface
                      </Link>
                      {isAdmin && (
                        <>
                          <Link href={"/dashboard/settings/roles" as Route} className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">
                            <Shield className="h-4 w-4" />
                            Roles
                          </Link>
                          <Link href="/dashboard/settings/system" className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">
                            <Settings className="h-4 w-4" />
                            System
                          </Link>
                          <div className="border-t border-border my-2"></div>
                          <Link href="/dashboard/development" className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">
                            <Settings className="h-4 w-4" />
                            Development
                          </Link>
                          <Link href="/dashboard/monitoring" className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">
                            <Monitor className="h-4 w-4" />
                            Monitoring
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </nav>
          </div>
          
          <div className="hidden md:flex items-center gap-3 mt-3 sm:mt-0">
            <span className="text-sm text-muted-foreground">{user.email}</span>
            <button
              onClick={() => signOut({ callbackUrl: '/auth/signin' })}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </header>
        
        <main className="px-4 sm:px-6 py-4 sm:py-8">
          {children}
        </main>
      </div>
    );
  }

  // Classic Layout (Default fallback) - Top navigation only, no sidebar
  return (
    <div className="min-h-screen bg-background text-foreground" data-layout="classic">
      {/* Classic Top Navigation */}
      <nav className="bg-card text-card-foreground shadow border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3 sm:gap-6">
              <MobileMenu user={user} isAdmin={isAdmin} />
              <Link
                href="/dashboard"
                className="flex items-center px-3 py-2 font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                AgendaIQ
              </Link>
              
              <div className="hidden md:flex items-center space-x-1">
                <Link
                  href="/dashboard"
                  className="px-3 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors rounded-md"
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/meetings"
                  className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md"
                >
                  Meetings
                </Link>
                <div className="relative group">
                  <Link
                    href="/dashboard/meeting-intelligence"
                    className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md"
                  >
                    Meeting Intelligence
                  </Link>
                  
                  <div className="absolute left-0 top-full mt-2 w-56 bg-card border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    <div className="p-2">
                      <div className="space-y-1">
                        <Link href="/dashboard/meeting-intelligence" className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">
                          <Brain className="h-4 w-4" />
                          Overview
                        </Link>
                        <Link href="/dashboard/meeting-intelligence/search" className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">
                          <Search className="h-4 w-4" />
                          Search
                        </Link>
                        <Link href="/dashboard/meeting-intelligence/analytics" className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">
                          <BarChart className="h-4 w-4" />
                          Analytics
                        </Link>
                        <Link href="/dashboard/meeting-intelligence/action-items" className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">
                          <CheckSquare className="h-4 w-4" />
                          Action Items
                        </Link>
                        <Link href="/dashboard/meeting-intelligence/continuity" className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">
                          <GitBranch className="h-4 w-4" />
                          Meeting Chains
                        </Link>
                        <Link href="/dashboard/meeting-intelligence/role-tasks" className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">
                          <UserCog className="h-4 w-4" />
                          Role Tasks
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="relative group">
                  <Link
                    href="/dashboard/settings"
                    className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md"
                  >
                    Settings
                  </Link>
                  
                  {/* Settings Dropdown with nested menus */}
                  <div className="absolute left-0 top-full mt-2 w-64 bg-card border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    <div className="p-2">
                      <div className="space-y-1">
                        {/* Account Section */}
                        <div className="relative group/account">
                          <div className="flex items-center justify-between px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer">
                            <span className="font-medium">Account</span>
                            <ChevronRight className="w-3 h-3 opacity-40" />
                          </div>
                          <div className="absolute left-full top-0 ml-2 w-56 bg-card border border-border rounded-lg shadow-lg opacity-0 invisible group-hover/account:opacity-100 group-hover/account:visible transition-all">
                            <div className="p-2 space-y-1">
                              <Link href="/dashboard/settings/profile" className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">
                                Profile
                              </Link>
                              <Link href="/dashboard/settings/interface" className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">
                                Interface & Theme
                              </Link>
                              <Link href="/dashboard/settings/security" className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">
                                Security
                              </Link>
                              <Link href="/dashboard/settings/notifications" className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">
                                Notifications
                              </Link>
                            </div>
                          </div>
                        </div>

                        {isAdmin && (
                          <>
                            {/* Administration Section */}
                            <div className="relative group/admin">
                              <div className="flex items-center justify-between px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer">
                                <span className="font-medium">Administration</span>
                                <ChevronRight className="w-3 h-3 opacity-40" />
                              </div>
                              <div className="absolute left-full top-0 ml-2 w-56 bg-card border border-border rounded-lg shadow-lg opacity-0 invisible group-hover/admin:opacity-100 group-hover/admin:visible transition-all">
                                <div className="p-2 space-y-1">
                                  <Link href="/dashboard/settings/role-hierarchy" className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">
                                    Role Hierarchy
                                  </Link>
                                  <Link href="/dashboard/settings/audit-logs" className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">
                                    Database Audit Logs
                                  </Link>
                                  <Link href="/dashboard/settings/school" className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">
                                    School Management
                                  </Link>
                                  <Link href="/dashboard/settings/permissions" className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">
                                    Permissions
                                  </Link>
                                  <Link href="/dashboard/settings/backup" className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">
                                    Backup & Restore
                                  </Link>
                                </div>
                              </div>
                            </div>

                            {/* Production Monitoring Section */}
                            <div className="relative group/prod">
                              <div className="flex items-center justify-between px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer">
                                <span className="font-medium">Production Monitoring</span>
                                <ChevronRight className="w-3 h-3 opacity-40" />
                              </div>
                              <div className="absolute left-full top-0 ml-2 w-56 bg-card border border-border rounded-lg shadow-lg opacity-0 invisible group-hover/prod:opacity-100 group-hover/prod:visible transition-all">
                                <div className="p-2 space-y-1">
                                  <Link href="/dashboard/system" className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">
                                    System Overview
                                  </Link>
                                  <Link href="/dashboard/system/health" className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">
                                    System Health
                                  </Link>
                                  <Link href="/dashboard/system/server" className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">
                                    Server Metrics
                                  </Link>
                                  <Link href="/dashboard/system/alerts" className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">
                                    Alert Configuration
                                  </Link>
                                  <Link href={"/dashboard/system/logs" as Route} className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">
                                    System Logs
                                  </Link>
                                  <Link href="/dashboard/system/backup" className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">
                                    Backup Management
                                  </Link>
                                </div>
                              </div>
                            </div>

                            {/* Development Tools Section */}
                            <div className="relative group/dev">
                              <div className="flex items-center justify-between px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer">
                                <span className="font-medium">Development Tools</span>
                                <ChevronRight className="w-3 h-3 opacity-40" />
                              </div>
                              <div className="absolute left-full top-0 ml-2 w-56 bg-card border border-border rounded-lg shadow-lg opacity-0 invisible group-hover/dev:opacity-100 group-hover/dev:visible transition-all">
                                <div className="p-2 space-y-1">
                                  <Link href="/dashboard/development" className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">
                                    Development Tools
                                  </Link>
                                  <Link href="/dashboard/monitoring" className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">
                                    Live Monitoring
                                  </Link>
                                  <Link href="/dashboard/system/dependencies" className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">
                                    Dependencies Management
                                  </Link>
                                  <Link href="/dashboard/system/updates" className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">
                                    Package Updates
                                  </Link>
                                  <Link href="/dashboard/system/database" className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">
                                    Database Management
                                  </Link>
                                  <Link href="/dashboard/system/migration" className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">
                                    Auth Migration & Diagnostics
                                  </Link>
                                  <Link href="/dashboard/development/permissions-check" className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">
                                    Permissions Check
                                  </Link>
                                </div>
                              </div>
                            </div>
                          </>
                        )}

                        {/* Meetings & Zoom Section */}
                        <div className="relative group/meetings">
                          <div className="flex items-center justify-between px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer">
                            <span className="font-medium">Meetings & Zoom</span>
                            <ChevronRight className="w-3 h-3 opacity-40" />
                          </div>
                          <div className="absolute left-full top-0 ml-2 w-56 bg-card border border-border rounded-lg shadow-lg opacity-0 invisible group-hover/meetings:opacity-100 group-hover/meetings:visible transition-all">
                            <div className="p-2 space-y-1">
                              <Link href="/dashboard/settings/zoom-integration" className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">
                                Zoom Integration
                              </Link>
                              {isAdmin && (
                                <Link href="/dashboard/settings/meeting-templates" className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">
                                  Meeting Templates
                                </Link>
                              )}
                              <Link href="/dashboard/settings/zoom-user-preferences" className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">
                                Zoom User Preferences
                              </Link>
                              {isAdmin && (
                                <>
                                  <Link href="/dashboard/settings/meeting-management" className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">
                                    Meeting Management
                                  </Link>
                                  <Link href="/dashboard/settings/meeting-permissions" className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">
                                    Meeting Permissions
                                  </Link>
                                </>
                              )}
                              <Link href="/dashboard/settings/meeting-audit" className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">
                                Meeting Audit & Logs
                              </Link>
                              <Link href="/dashboard/settings/meeting-help" className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">
                                Meeting Help
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <span className="text-sm text-muted-foreground">
                  {user.email}
                </span>
                <button
                  onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
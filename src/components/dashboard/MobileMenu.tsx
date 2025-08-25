'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Menu,
  X,
  Home,
  Calendar,
  Brain,
  Settings,
  LogOut,
  ChevronRight,
  Users,
  Shield,
  Monitor,
  User,
  Lock,
  Bell,
  Search,
  BarChart,
  CheckSquare,
  GitBranch,
  UserCog
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';

interface MobileMenuProps {
  user: Record<string, any>;
  isAdmin: boolean;
}

export function MobileMenu({ user, isAdmin }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const pathname = usePathname();

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const closeMenu = () => {
    setIsOpen(false);
    setExpandedSection(null);
  };

  const isActive = (href: string) => pathname === href;

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden p-2 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Toggle mobile menu"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={closeMenu}
        />
      )}

      {/* Mobile Menu Drawer */}
      <div className={cn(
        "md:hidden fixed top-0 left-0 h-full w-80 bg-card shadow-xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-foreground">AgendaIQ</h2>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <button
              onClick={closeMenu}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              aria-label="Close menu"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {/* Main Navigation */}
          <div className="space-y-1">
            <Link
              href="/dashboard"
              onClick={closeMenu}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                isActive("/dashboard");
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Home className="h-5 w-5" />
              Dashboard
            </Link>

            <Link
              href="/dashboard/meetings"
              onClick={closeMenu}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                isActive("/dashboard/meetings");
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Calendar className="h-5 w-5" />
              Meetings
            </Link>

            <Link
              href="/dashboard/teams"
              onClick={closeMenu}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                isActive("/dashboard/teams");
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Users className="h-5 w-5" />
              Teams
            </Link>

            {/* Meeting Intelligence Section */}
            <div>
              <button
                onClick={() => toggleSection('intelligence')}
                className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Brain className="h-5 w-5" />
                  Meeting Intelligence
                </div>
                <ChevronRight className={cn(
                  "h-4 w-4 transition-transform",
                  expandedSection === 'intelligence' && "rotate-90"
                )} />
              </button>
              
              {expandedSection === 'intelligence' && (
                <div className="ml-8 mt-1 space-y-1">
                  <Link
                    href="/dashboard/meeting-intelligence"
                    onClick={closeMenu}
                    className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
                  >
                    Overview
                  </Link>
                  <Link
                    href="/dashboard/meeting-intelligence/search"
                    onClick={closeMenu}
                    className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
                  >
                    <Search className="h-4 w-4 inline mr-2" />
                    Search
                  </Link>
                  <Link
                    href="/dashboard/meeting-intelligence/analytics"
                    onClick={closeMenu}
                    className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
                  >
                    <BarChart className="h-4 w-4 inline mr-2" />
                    Analytics
                  </Link>
                  <Link
                    href="/dashboard/meeting-intelligence/action-items"
                    onClick={closeMenu}
                    className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
                  >
                    <CheckSquare className="h-4 w-4 inline mr-2" />
                    Action Items
                  </Link>
                  <Link
                    href="/dashboard/meeting-intelligence/continuity"
                    onClick={closeMenu}
                    className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
                  >
                    <GitBranch className="h-4 w-4 inline mr-2" />
                    Meeting Chains
                  </Link>
                  <Link
                    href="/dashboard/meeting-intelligence/role-tasks"
                    onClick={closeMenu}
                    className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
                  >
                    <UserCog className="h-4 w-4 inline mr-2" />
                    Role Tasks
                  </Link>
                </div>
              )}
            </div>

            {/* Settings Section */}
            <div>
              <button
                onClick={() => toggleSection('settings')}
                className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Settings className="h-5 w-5" />
                  Settings
                </div>
                <ChevronRight className={cn(
                  "h-4 w-4 transition-transform",
                  expandedSection === 'settings' && "rotate-90"
                )} />
              </button>
              
              {expandedSection === 'settings' && (
                <div className="ml-8 mt-1 space-y-1">
                  <Link
                    href="/dashboard/settings/profile"
                    onClick={closeMenu}
                    className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
                  >
                    <User className="h-4 w-4 inline mr-2" />
                    Profile
                  </Link>
                  <Link
                    href="/dashboard/settings/interface"
                    onClick={closeMenu}
                    className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
                  >
                    <Monitor className="h-4 w-4 inline mr-2" />
                    Interface & Theme
                  </Link>
                  <Link
                    href="/dashboard/settings/security"
                    onClick={closeMenu}
                    className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
                  >
                    <Lock className="h-4 w-4 inline mr-2" />
                    Security
                  </Link>
                  <Link
                    href="/dashboard/settings/notifications"
                    onClick={closeMenu}
                    className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
                  >
                    <Bell className="h-4 w-4 inline mr-2" />
                    Notifications
                  </Link>
                  
                  {isAdmin && (
                    <>
                      <div className="border-t border-border my-2" />
                      <Link
                        href="/dashboard/settings/role-hierarchy"
                        onClick={closeMenu}
                        className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
                      >
                        <Shield className="h-4 w-4 inline mr-2" />
                        Role Hierarchy
                      </Link>
                      <Link
                        href="/dashboard/settings/system"
                        onClick={closeMenu}
                        className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
                      >
                        <Settings className="h-4 w-4 inline mr-2" />
                        System Settings
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sign Out */}
          <div className="border-t border-border pt-4 mt-4">
            <button
              onClick={async () => {
                closeMenu();
                try {
                  await signOut({ 
                    callbackUrl: '/auth/signin',
                    redirect: true 
                  });
                } catch (error: unknown) {
                  // Fallback to direct navigation if signOut fails
                  window.location.href = '/auth/signin';
                }
              }}
              className="flex items-center gap-3 w-full px-3 py-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
            >
              <LogOut className="h-5 w-5" />
              Sign Out
            </button>
          </div>
        </nav>
      </div>
    </>
  );
}
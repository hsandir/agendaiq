'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  User as FiUser, 
  Lock as FiLock, 
  Bell as FiBell, 
  Settings as FiSettings, 
  Home as FiHome, 
  Upload as FiUpload, 
  TrendingUp as FiTrendingUp, 
  Key as FiKey, 
  Activity as FiActivity, 
  HardDrive as FiHardDrive,
  Database as FiDatabase,
  Server as FiServer,
  Menu as FiMenu,
  X as FiX,
  HelpCircle as FiHelpCircle,
  FileText as FiFileText,
  Users as FiUsers,
  Shield as FiShield,
  Monitor as FiMonitor,
  Package as FiPackage,
  Download as FiDownload,
  Archive as FiArchive,
  AlertTriangle as FiAlertTriangle,
  Search as FiSearch
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
  adminOnly?: boolean;
}

// Environment check
const isDevelopment = process.env.NODE_ENV === 'development';

const navigation: NavSection[] = [
  {
    title: "Account",
    items: [
      { href: "/dashboard/settings/profile", label: "Profile", icon: FiUser },
      { href: "/dashboard/settings/interface", label: "Interface & Theme", icon: FiMonitor },
      { href: "/dashboard/settings/security", label: "Security", icon: FiLock },
      { href: "/dashboard/settings/notifications", label: "Notifications", icon: FiBell },
    ],
  },
  {
    title: "Administration",
    adminOnly: true,
    items: [
      { href: "/dashboard/settings/role-hierarchy", label: "Role Hierarchy", icon: FiTrendingUp },
      { href: "/dashboard/settings/audit-logs", label: "Database Audit Logs", icon: FiFileText },
      { href: "/dashboard/settings/school", label: "School Management", icon: FiHome },
      { href: "/dashboard/settings/permissions", label: "Permissions", icon: FiKey },
      { href: "/dashboard/settings/backup", label: "Backup & Restore", icon: FiHardDrive, adminOnly: true },
    ],
  },
  {
    title: "Production Monitoring",
    adminOnly: true,
    items: [
      { href: "/dashboard/system", label: "System Overview", icon: FiMonitor },
      { href: "/dashboard/system/health", label: "System Health", icon: FiActivity },
      { href: "/dashboard/system/server", label: "Server Metrics", icon: FiServer },
      { href: "/dashboard/system/alerts", label: "Alert Configuration", icon: FiAlertTriangle },
      { href: "/dashboard/system/logs", label: "System Logs", icon: FiFileText },
      { href: "/dashboard/system/backup", label: "Backup Management", icon: FiArchive },
    ],
  },
  ...(isDevelopment ? [{
    title: "Development Tools",
    adminOnly: true,
    items: [
      { href: "/dashboard/development", label: "Development Tools", icon: FiPackage },
      { href: "/dashboard/monitoring", label: "Live Monitoring", icon: FiActivity },
      { href: "/dashboard/system/dependencies", label: "Dependencies Management", icon: FiPackage },
      { href: "/dashboard/system/updates", label: "Package Updates", icon: FiDownload },
      { href: "/dashboard/system/database", label: "Database Management", icon: FiDatabase },
      { href: "/dashboard/system/migration", label: "Auth Migration & Diagnostics", icon: FiTrendingUp },
      { href: "/dashboard/development/permissions-check", label: "Permissions Check", icon: FiShield },
    ],
  }] : []),
  {
    title: "Meetings & Zoom",
    items: [
      { label: "Zoom Integration", href: "/dashboard/settings/zoom-integration", icon: FiSettings },
      { label: "Meeting Templates", href: "/dashboard/settings/meeting-templates", icon: FiSettings, adminOnly: true },
      { label: "Zoom User Preferences", href: "/dashboard/settings/zoom-user-preferences", icon: FiUser },
      { label: "Meeting Management", href: "/dashboard/settings/meeting-management", icon: FiSettings, adminOnly: true },
      { label: "Meeting Permissions", href: "/dashboard/settings/meeting-permissions", icon: FiKey, adminOnly: true },
      { label: "Meeting Audit & Logs", href: "/dashboard/settings/meeting-audit", icon: FiActivity },
      { label: "Meeting Help", href: "/dashboard/settings/meeting-help", icon: FiHelpCircle },
    ],
  },
];

interface HiddenSidebarProps {
  isAdmin: boolean;
  isOpen?: boolean;
  onToggle?: () => void;
}

export function HiddenSidebar({ isAdmin, isOpen: externalIsOpen, onToggle }: HiddenSidebarProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const pathname = usePathname();

  // Use external control if provided, otherwise use internal state
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = onToggle ?? setInternalIsOpen;

  const isActive = (href: string) => pathname === href;

  const toggleSidebar = () => setIsOpen(!isOpen);

  // ESC key to close sidebar
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen]);

  // Filter out any invalid sections
  const validNavigation = navigation.filter(section => 
    section && 
    typeof section === 'object' && 
    Array.isArray(section.items) && 
    section.items.length > 0
  );

  return (
    <>
      {/* Logo Trigger Button */}
      <div className="fixed top-4 left-4 z-[100]">
        <button
          onClick={toggleSidebar}
          onMouseEnter={() => setIsOpen(true)}
          className="flex items-center justify-center w-12 h-12 bg-card rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 border border-border hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          aria-label={isOpen ? "Close settings menu" : "Open settings menu"}
          aria-expanded={isOpen}
          aria-controls="settings-sidebar"
        >
          {isOpen ? (
            <FiX className="w-6 h-6 text-muted-foreground" aria-hidden="true" />
          ) : (
            <FiMenu className="w-6 h-6 text-muted-foreground" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-[90] transition-opacity duration-200"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Hidden Sidebar */}
      <aside 
        id="settings-sidebar"
        className={cn(
          "fixed top-0 left-0 h-screen w-80 bg-card shadow-2xl z-[95] transform transition-transform duration-300 ease-in-out flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        aria-label="Settings and system navigation"
        aria-hidden={!isOpen}
        role="navigation"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border flex-shrink-0">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mr-3">
              <span className="text-foreground font-bold text-sm">AQ</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">AgendaIQ</h2>
              <p className="text-xs text-muted-foreground">Settings & System</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-muted rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            aria-label="Close settings menu"
          >
            <FiX className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
          </button>
        </div>

        {/* Navigation Content - Scrollable */}
        <div 
          className="flex-1 overflow-y-auto py-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100" 
          onMouseLeave={() => setIsOpen(false)}
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <nav className="px-6 space-y-8" aria-label="Settings navigation">
            {validNavigation.map((section) => {
              if (!section || (section.adminOnly && !isAdmin)) return null;

              return (
                <div key={section.title}>
                  <h3 
                    className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3"
                    id={`settings-section-${section.title.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {section.title}
                  </h3>
                  <ul 
                    className="space-y-1"
                    role="list"
                    aria-labelledby={`settings-section-${section.title.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {section.items.map((item) => {
                      if (!item || (item.adminOnly && !isAdmin)) return null;

                      return (
                        <li key={item.href} role="none">
                          <Link
                            href={item.href as Record<string, unknown>}
                            onClick={() => setIsOpen(false)}
                            className={cn(
                              "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors group focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                              isActive(item.href)
                                ? "bg-primary text-primary-foreground border-r-2 border-primary-dark"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                            aria-current={isActive(item.href) ? "page" : undefined}
                            aria-label={item.label}
                          >
                            <item.icon
                              className={cn("mr-3 h-5 w-5 transition-colors", {
                                "text-primary": isActive(item.href),
                                "text-muted-foreground group-hover:text-muted-foreground": !isActive(item.href),
                              })}
                              aria-hidden="true"
                            />
                            {item.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className="border-t border-border p-4 flex-shrink-0">
          <div className="text-xs text-muted-foreground text-center">
            <p>Press ESC to close</p>
          </div>
        </div>
      </aside>
    </>
  );
} 
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  FiUser, 
  FiLock, 
  FiBell, 
  FiSettings, 
  FiHome, 
  FiUpload, 
  FiTrendingUp, 
  FiKey, 
  FiActivity, 
  FiHardDrive,
  FiDatabase,
  FiServer,
  FiMenu,
  FiX,
  FiHelpCircle,
  FiFileText,
  FiUsers,
  FiShield,
  FiMonitor,
  FiPackage,
  FiDownload,
  FiArchive,
  FiAlertTriangle,
  FiSearch
} from 'react-icons/fi';
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
      { href: "/dashboard/settings/security", label: "Security", icon: FiLock },
      { href: "/dashboard/settings/notifications", label: "Notifications", icon: FiBell },
    ],
  },
  {
    title: "Administration",
    adminOnly: true,
    items: [
      { href: "/dashboard/settings/users", label: "User Management", icon: FiUsers },
      { href: "/dashboard/settings/roles", label: "Role Management", icon: FiShield },
      { href: "/dashboard/settings/role-hierarchy", label: "Role Hierarchy", icon: FiTrendingUp },
      { href: "/dashboard/settings/staff-upload", label: "Staff Upload", icon: FiUpload },
      { href: "/dashboard/settings/audit-logs", label: "Database Audit Logs", icon: FiFileText },
      { href: "/dashboard/settings/admin", label: "Admin Settings", icon: FiSettings },
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
      { href: "/dashboard/system/dependencies", label: "Dependencies Management", icon: FiPackage },
      { href: "/dashboard/system/updates", label: "Package Updates", icon: FiDownload },
      { href: "/dashboard/system/database", label: "Database Management", icon: FiDatabase },
      { href: "/dashboard/system/migration", label: "Auth Migration & Diagnostics", icon: FiTrendingUp },
      { href: "/dashboard/system/mock-data-tracker", label: "Mock Data Tracker", icon: FiSearch },
      { href: "/dashboard/system/lint", label: "Code Quality Tools", icon: FiSearch },
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
  const setIsOpen = onToggle || setInternalIsOpen;

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
      <div className="fixed top-4 left-4 z-50">
        <button
          onClick={toggleSidebar}
          onMouseEnter={() => setIsOpen(true)}
          className="flex items-center justify-center w-12 h-12 bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200 hover:border-blue-300"
        >
          {isOpen ? (
            <FiX className="w-6 h-6 text-gray-600" />
          ) : (
            <FiMenu className="w-6 h-6 text-gray-600" />
          )}
        </button>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-200"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Hidden Sidebar */}
      <div 
        className={cn(
          "fixed top-0 left-0 h-screen w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
              <span className="text-white font-bold text-sm">AQ</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">AgendaIQ</h2>
              <p className="text-xs text-gray-500">Settings & System</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FiX className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Navigation Content - Scrollable */}
        <div 
          className="flex-1 overflow-y-auto py-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100" 
          onMouseLeave={() => setIsOpen(false)}
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <nav className="px-6 space-y-8">
            {validNavigation.map((section) => {
              if (!section || section.adminOnly && !isAdmin) return null;

              return (
                <div key={section.title}>
                  <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    {section.title}
                  </h3>
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      if (!item || (item.adminOnly && !isAdmin)) return null;

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsOpen(false)}
                          className={cn(
                            "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors group",
                            isActive(item.href)
                              ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                          )}
                        >
                          <item.icon
                            className={cn("mr-3 h-5 w-5 transition-colors", {
                              "text-blue-600": isActive(item.href),
                              "text-gray-400 group-hover:text-gray-600": !isActive(item.href),
                            })}
                          />
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 flex-shrink-0">
          <div className="text-xs text-gray-500 text-center">
            <p>Press ESC to close</p>
          </div>
        </div>
      </div>
    </>
  );
} 
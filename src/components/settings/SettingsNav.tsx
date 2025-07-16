"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  FiUser,
  FiLock,
  FiUsers,
  FiUserCheck,
  FiSettings,
  FiBell,
  FiKey,
  FiDatabase,
  FiActivity,
  FiServer,
  FiHardDrive,
  FiUpload,
  FiHome,
  FiAlertTriangle,
  FiTool,
  FiHelpCircle,
  FiTrendingUp,
} from "react-icons/fi";

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
      { href: "/dashboard/settings/setup", label: "District Setup", icon: FiSettings },
      { href: "/dashboard/settings/school", label: "School Settings", icon: FiHome },
      { href: "/dashboard/settings/users", label: "User Management", icon: FiUsers },
      { href: "/dashboard/settings/staff-upload", label: "Staff Upload", icon: FiUpload },
      { href: "/dashboard/settings/roles", label: "Role Management", icon: FiUserCheck },
      { href: "/dashboard/settings/role-hierarchy", label: "Role Hierarchy", icon: FiTrendingUp },
      { href: "/dashboard/settings/permissions", label: "Permissions", icon: FiKey },
      { href: "/dashboard/settings/system", label: "System Settings", icon: FiSettings },
      { href: "/dashboard/settings/audit", label: "Audit Log", icon: FiActivity },
      { href: "/dashboard/settings/backup", label: "Backup & Restore", icon: FiHardDrive },
      { href: "/dashboard/settings/admin", label: "Admin Tools", icon: FiTool },
    ],
  },
  {
    title: "Meetings & Zoom",
    items: [
      { label: "Zoom Integration", href: "/dashboard/settings/zoom-integration", icon: FiSettings },
      { label: "Meeting Templates", href: "/dashboard/settings/meeting-templates", icon: FiSettings, adminOnly: true },
      { label: "Zoom User Preferences", href: "/dashboard/settings/zoom-user-preferences", icon: FiUser },
      { label: "Meeting Management", href: "/dashboard/settings/meeting-management", icon: FiUsers, adminOnly: true },
      { label: "Meeting Permissions", href: "/dashboard/settings/meeting-permissions", icon: FiKey, adminOnly: true },
      { label: "Meeting Audit & Logs", href: "/dashboard/settings/meeting-audit", icon: FiActivity },
      { label: "Meeting Help", href: "/dashboard/settings/meeting-help", icon: FiHelpCircle },
    ],
  },
];

interface SettingsNavProps {
  isAdmin: boolean;
}

export function SettingsNav({ isAdmin }: SettingsNavProps) {
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href;

  // Filter out any invalid sections
  const validNavigation = navigation.filter(section => 
    section && 
    typeof section === 'object' && 
    Array.isArray(section.items) && 
    section.items.length > 0
  );

  return (
    <nav className="space-y-8">
      {validNavigation.map((section) => {
        if (!section || section.adminOnly && !isAdmin) return null;

        return (
          <div key={section.title}>
            <h3 className="px-3 text-sm font-medium text-gray-500 uppercase tracking-wider">
              {section.title}
            </h3>
            <div className="mt-3 space-y-1">
              {section.items.map((item) => {
                if (!item || (item.adminOnly && !isAdmin)) return null;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      isActive(item.href)
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <item.icon
                      className={cn("mr-3 h-5 w-5", {
                        "text-gray-500": isActive(item.href),
                        "text-gray-400": !isActive(item.href),
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
  );
} 
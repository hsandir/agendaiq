'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Eye as FiEye, Edit3 as FiEdit3, TrendingUp as FiTrendingUp, UserCheck as FiUserCheck } from 'lucide-react';

const submenuItems = [
  {
    href: '/dashboard/settings/role-hierarchy',
    label: 'Overview',
    icon: FiTrendingUp,
  },
  {
    href: '/dashboard/settings/role-hierarchy/visualization',
    label: 'Visualization',
    icon: FiEye,
  },
  {
    href: '/dashboard/settings/role-hierarchy/management',
    label: 'Management',
    icon: FiEdit3,
  },
  {
    href: '/dashboard/settings/role-hierarchy/user-assignment',
    label: 'User Assignment',
    icon: FiUserCheck,
  },
];

export default function RoleHierarchyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      {/* Submenu Navigation */}
      <div className="mb-6">
        <nav className="flex space-x-8">
          {submenuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href as any}
                className={cn(
                  'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  isActive
                    ? 'bg-primary text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Page Content */}
      {children}
    </div>
  );
} 
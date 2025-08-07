"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Calendar, Users, FileText, Settings, Wrench, FlaskConical, Palette } from "lucide-react";
import clsx from "clsx";

interface SidebarProps {
  onSettingsClick?: () => void;
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Meetings", href: "/dashboard/meetings", icon: Calendar },
  { name: "Team", href: "/dashboard/team", icon: Users },
  { name: "Notes", href: "/dashboard/notes", icon: FileText },
  { name: "Development", href: "/dashboard/development", icon: FlaskConical },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
  { name: "Theme", href: "/dashboard/settings/theme", icon: Palette },
];

export function Sidebar({ onSettingsClick }: SidebarProps = {}) {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-6">
        <h2 className="text-2xl font-bold text-foreground">AgendaIQ</h2>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navigation.map((item) => {
          return (
            <Link
              key={item.name}
              href={item.href as any}
              className={clsx(
                "flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors",
                {
                  "bg-muted text-foreground": isActive(item.href),
                  "text-muted-foreground hover:bg-muted hover:text-foreground": !isActive(item.href),
                }
              )}
            >
              <item.icon
                className={clsx("mr-3 h-5 w-5", {
                  "text-muted-foreground": isActive(item.href),
                  "text-muted-foreground": !isActive(item.href),
                })}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
} 
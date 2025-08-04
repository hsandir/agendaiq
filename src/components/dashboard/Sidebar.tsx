"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Calendar, Users, FileText, Settings, Wrench } from "lucide-react";
import clsx from "clsx";

interface SidebarProps {
  onSettingsClick?: () => void;
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Meetings", href: "/dashboard/meetings", icon: Calendar },
  { name: "Team", href: "/dashboard/team", icon: Users },
  { name: "Notes", href: "/dashboard/notes", icon: FileText },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar({ onSettingsClick }: SidebarProps = {}) {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-6">
        <h2 className="text-2xl font-bold text-gray-800">AgendaIQ</h2>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navigation.map((item) => {
          if (item.name === "Settings") {
            return (
              <button
                key={item.name}
                onClick={onSettingsClick}
                className={clsx(
                  "w-full flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors text-left",
                  {
                    "bg-gray-100 text-gray-900": isActive(item.href),
                    "text-gray-600 hover:bg-gray-50 hover:text-gray-900": !isActive(item.href),
                  }
                )}
              >
                <item.icon
                  className={clsx("mr-3 h-5 w-5", {
                    "text-gray-500": isActive(item.href),
                    "text-gray-400": !isActive(item.href),
                  })}
                />
                {item.name}
              </button>
            );
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                "flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors",
                {
                  "bg-gray-100 text-gray-900": isActive(item.href),
                  "text-gray-600 hover:bg-gray-50 hover:text-gray-900": !isActive(item.href),
                }
              )}
            >
              <item.icon
                className={clsx("mr-3 h-5 w-5", {
                  "text-gray-500": isActive(item.href),
                  "text-gray-400": !isActive(item.href),
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
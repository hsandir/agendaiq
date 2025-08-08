"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import clsx from "clsx";
import { sidebarItems } from "@/components/layout/SidebarItems";

interface SidebarProps {
  onSettingsClick?: () => void;
}

export function Sidebar({ onSettingsClick }: SidebarProps = {}) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path + "/");
  };

  const toggleExpanded = (href: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(href)) {
      newExpanded.delete(href);
    } else {
      newExpanded.add(href);
    }
    setExpandedItems(newExpanded);
  };

  const renderNavItem = (item: any, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.href);
    const isItemActive = isActive(item.href);

    return (
      <div key={item.href}>
        <div className="flex items-center">
          <Link
            href={item.href}
            className={clsx(
              "flex-1 flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors",
              {
                "bg-muted text-foreground": isItemActive,
                "text-muted-foreground hover:bg-muted hover:text-foreground": !isItemActive,
              },
              depth > 0 && "ml-4"
            )}
          >
            <item.icon
              className={clsx("mr-3 h-5 w-5 text-muted-foreground")}
            />
            {item.label}
          </Link>
          {hasChildren && (
            <button
              onClick={() => toggleExpanded(item.href)}
              className="p-1 mr-2 text-muted-foreground hover:text-foreground"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
        {hasChildren && isExpanded && (
          <div className="mt-1">
            {item.children.map((child: any) => renderNavItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-6">
        <h2 className="text-2xl font-bold text-foreground">AgendaIQ</h2>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {sidebarItems.map((section) => (
          <div key={section.title} className="mb-6">
            <h3 className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              {section.title}
            </h3>
            <div className="space-y-1">
              {section.items.map((item) => renderNavItem(item))}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );
} 
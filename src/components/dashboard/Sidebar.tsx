"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import clsx from "clsx";
import { sidebarItems } from "@/components/layout/SidebarItems";
import { signOut } from "next-auth/react";

interface SidebarProps {
  onSettingsClick?: () => void;
}

const EXPANDED_ITEMS_KEY = 'sidebar-expanded-items';

export function Sidebar({ onSettingsClick }: SidebarProps = {}) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [isInitialized, setIsInitialized] = useState(false);

  // Load expanded items from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(EXPANDED_ITEMS_KEY);
        if (stored) {
          const items = JSON.parse(stored);
          // Validate that items is an array
          if (Array.isArray(items)) {
            setExpandedItems(new Set(items));
          } else {
            // Reset if invalid data
            localStorage.removeItem(EXPANDED_ITEMS_KEY);
            setExpandedItems(new Set());
          }
        } else {
          // Initialize with empty set
          setExpandedItems(new Set());
        }
      } catch (error) {
        console.error('Failed to load expanded items from localStorage:', error);
        // Reset on error
        localStorage.removeItem(EXPANDED_ITEMS_KEY);
        setExpandedItems(new Set());
      }
      setIsInitialized(true);
    }
  }, []);

  // Auto-expand parent items based on current path
  useEffect(() => {
    if (pathname && isInitialized) {
      const pathSegments = pathname.split('/').filter(Boolean);
      const newExpanded = new Set(expandedItems);
      let hasChanges = false;
      
      // Check each section for active children
      sidebarItems.forEach(section => {
        section.items.forEach(item => {
          // Only auto-expand if the current path is a child of this item
          if (item.children && item.children.length > 0) {
            const isChildActive = item.children.some(child => 
              pathname === child.href || pathname.startsWith(child.href + '/');
            );
            
            if (isChildActive && !newExpanded.has(item.href)) {
              newExpanded.add(item.href);
              hasChanges = true;
              
              // Check for nested children
              item.children.forEach(child => {
                if (child.children && child.children.length > 0) {
                  const isNestedChildActive = child.children.some(nested => 
                    pathname === nested.href || pathname.startsWith(nested.href + '/');
                  );
                  if (isNestedChildActive && !newExpanded.has(child.href)) {
                    newExpanded.add(child.href);
                    hasChanges = true;
                  }
                }
              });
            }
          }
        });
      });
      
      if (hasChanges) {
        setExpandedItems(newExpanded);
        // Save to localStorage
        try {
          localStorage.setItem(EXPANDED_ITEMS_KEY, JSON.stringify(Array.from(newExpanded)));
        } catch (error) {
          console.error('Failed to save expanded items:', error);
        }
      }
    }
  }, [pathname, isInitialized, expandedItems]);

  const isActive = (path: string) => {
    return pathname === path ?? pathname?.startsWith(path + "/")
  };

  const toggleExpanded = (href: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(href)) {
      newExpanded.delete(href);
    } else {
      newExpanded.add(href);
    }
    setExpandedItems(newExpanded);
    // Save to localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(EXPANDED_ITEMS_KEY, JSON.stringify(Array.from(newExpanded)));
      } catch (error) {
        console.error('Failed to save expanded items:', error);
      }
    }
  };

  const renderNavItem = (item: any, depth = 0) => {
    const hasChildren = item.children && Array.isArray(item.children) && item.children.length > 0;
    const isExpanded = expandedItems.has(item.href);
    const isItemActive = isActive(item.href);
    const isSignOut = item.label === "Sign Out";

    if (isSignOut) {
      return (
        <div key={item.href}>
          <button
            onClick={async () => {
              try {
                await signOut({ 
                  callbackUrl: '/auth/signin',
                  redirect: true 
                });
              } catch (error: unknown) {
                // Fallback to direct navigation if signOut fails
                window.location.href = '/auth/signin'
              }
            }}
            className="w-full flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label={item.label}
          >
            {item.icon && <item.icon className="mr-3 h-5 w-5 text-muted-foreground" />}
            {item.label}
          </button>
        </div>
      );
    }

    return (
      <div key={item.href}>
        <div className="flex items-center">
          <Link
            href={item.href}
            className={clsx(
              "flex-1 flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
              {
                "bg-muted text-foreground": isItemActive,
                "text-muted-foreground hover:bg-muted hover:text-foreground": !isItemActive,
              },
              depth > 0 && "ml-4"
            )}
            aria-current={isItemActive ? "page" : undefined}
            aria-label={item.label}
          >
            {item.icon && (
              <item.icon
                className={clsx("mr-3 h-5 w-5 text-muted-foreground")}
              />
            )}
            {item.label}
          </Link>
          {hasChildren && (
            <button
              onClick={() => toggleExpanded(item.href)}
              className="p-1 mr-2 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
              aria-expanded={isExpanded}
              aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${item.label} submenu`}
              aria-controls={`submenu-${item.href.replace(/\//g, '-')}`}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" aria-hidden="true" />
              ) : (
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          )}
        </div>
        {hasChildren && isExpanded && (
          <div 
            className="mt-1"
            id={`submenu-${item.href.replace(/\//g, '-')}`}
            role="group"
            aria-label={`${item.label} submenu`}
          >
            {item.children.map((child: Record<string, unknown>) => renderNavItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // Don't render until initialized to prevent hydration mismatch
  if (!isInitialized) {
    return (
      <div className="flex flex-col h-full" role="navigation" aria-label="Main sidebar">
        <div className="px-4 py-6 ml-12">
          <h2 className="text-2xl font-bold text-foreground" role="banner">AgendaIQ</h2>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto" role="navigation" aria-label="Main navigation">
          {/* Show actual menu structure immediately, just without expand state */}
          {sidebarItems.map((section) => (
            <div key={section.title} className="mb-6">
              <h3 className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {section.title}
              </h3>
              <ul className="space-y-1" role="list">
                {section.items.map((item) => (
                  <li key={item.href} role="none">
                    <div className="opacity-50">
                      <Link
                        href={item.href}
                        className="flex items-center px-4 py-2 text-sm font-medium rounded-md text-muted-foreground"
                      >
                        {item.icon && <item.icon className="mr-3 h-5 w-5" />}
                        {item.label}
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" role="navigation" aria-label="Main sidebar">
      <div className="px-4 py-6 ml-12">
        <h2 className="text-2xl font-bold text-foreground" role="banner">AgendaIQ</h2>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto" role="navigation" aria-label="Main navigation">
        {sidebarItems.map((section) => (
          <div key={section.title} className="mb-6">
            <h3 
              className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2"
              id={`section-${section.title.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {section.title}
            </h3>
            <ul 
              className="space-y-1"
              role="list"
              aria-labelledby={`section-${section.title.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {section.items.map((item) => (
                <li key={item.href} role="none">
                  {renderNavItem(item)}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  );
} 
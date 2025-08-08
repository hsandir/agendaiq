"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, X, ChevronRight } from "lucide-react";
import { sidebarItems } from "./SidebarItems";

export function MobileSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close sidebar on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 p-2 bg-card rounded-lg shadow-lg md:hidden"
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-muted border-r border-border z-40 transform transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <Link href={"/dashboard" as any} className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-foreground font-bold text-sm">AQ</span>
              </div>
              <span className="text-xl font-bold text-foreground">AgendaIQ</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            {sidebarItems.map((section) => (
              <div key={section.title} className="mb-6">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {section.title}
                </h3>
                <ul className="space-y-1">
                  {section.items.map((item) => {
                    const isActive = pathname === item.href || 
                                   (item.children?.some(child => pathname === child.href));
                    const Icon = item.icon;

                    return (
                      <li key={item.href}>
                        {item.children ? (
                          <details className="group">
                            <summary
                              className={`flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-md cursor-pointer transition-colors ${
                                isActive
                                  ? 'bg-primary text-primary'
                                  : 'text-foreground hover:bg-muted'
                              }`}
                            >
                              <div className="flex items-center">
                                <Icon className="h-5 w-5 mr-3 flex-shrink-0" />
                                {item.label}
                              </div>
                              <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" />
                            </summary>
                            <ul className="mt-1 ml-8 space-y-1">
                              {item.children.map((child) => (
                                <li key={child.href}>
                                  <Link
                                    href={child.href as any}
                                    className={`block px-3 py-2 text-sm rounded-md transition-colors ${
                                      pathname === child.href
                                        ? 'bg-primary text-primary font-medium'
                                        : 'text-muted-foreground hover:bg-muted'
                                    }`}
                                  >
                                    {child.label}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </details>
                        ) : (
                          <Link
                            href={item.href as any}
                            className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                              isActive
                                ? 'bg-primary text-primary'
                                : 'text-foreground hover:bg-muted'
                            }`}
                          >
                            <Icon className="h-5 w-5 mr-3 flex-shrink-0" />
                            {item.label}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
}
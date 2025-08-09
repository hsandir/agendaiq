import { getServerSession } from "next-auth";
import { requireAuth, getCurrentUser, AuthPresets } from '@/lib/auth/auth-utils';
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/dashboard/Header";
import { RoleSwitch } from "@/components/dashboard/RoleSwitch";
import { SidebarWrapper } from "@/components/dashboard/SidebarWrapper";
import { isUserAdmin } from "@/lib/auth/admin-check";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth(AuthPresets.requireAuth);

  // Get user with staff and role information
  const userWithStaff = await prisma.user.findUnique({
    where: { email: user.email! },
    include: {
      Staff: {
        include: {
          Role: true,
          Department: true,
          School: true
        }
      }
    },
  });

  const currentRole = userWithStaff?.Staff?.[0]?.Role;
  const isAdmin = isUserAdmin(userWithStaff);

  return (
    <div className="grid grid-cols-[260px_1fr] min-h-screen bg-background text-foreground" data-theme="modern-layout">
      {/* Enhanced Settings Sidebar - Hidden by default, opens on demand */}
      <SidebarWrapper isAdmin={isAdmin} className="sticky top-0 h-screen bg-card shadow-lg border-r border-border" />

      {/* Main Content Area */}
      <main className="flex flex-col min-h-screen">
        {/* Top Header Bar */}
        <header className="flex items-center justify-between px-6 lg:px-12 py-7 bg-background/95 backdrop-blur border-b border-border sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Dashboard</h1>
            {/* Mobile Menu Toggle - Hidden on desktop */}
            <button 
              className="lg:hidden p-2 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Toggle sidebar"
            >
              <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 12h18m-9 6H3m18-12H3"/>
              </svg>
            </button>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Enhanced Search */}
            <div className="hidden sm:flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2 min-w-[280px] focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent transition-all">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-muted-foreground">
                <circle cx="11" cy="11" r="7"></circle>
                <path d="M21 21l-4.35-4.35"></path>
              </svg>
              <input 
                placeholder="Search meetings, notes, tasks..."
                className="w-full bg-transparent border-0 outline-0 text-sm text-foreground placeholder:text-muted-foreground"
              />
            </div>
            
            {/* User Info */}
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{user.email}</span>
                <span className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded-full font-medium">
                  {currentRole?.title || 'No Role'}
                </span>
              </div>
              <RoleSwitch staff={userWithStaff?.Staff?.[0] || null} />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 px-6 lg:px-12 py-8">
          {children}
        </div>
      </main>
    </div>
  );
} 
import { getServerSession } from "next-auth";
import { requireAuth, getCurrentUser, AuthPresets } from '@/lib/auth/auth-utils';
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/dashboard/Header";
import { SidebarWrapper } from "@/components/dashboard/SidebarWrapper";
import { isUserAdmin } from "@/lib/auth/admin-check";
import { DashboardLayoutClient } from "./DashboardLayoutClient";

// Preload critical resources for better performance
function PreloadResources() {
  return (
    <>
      <link rel="preload" href="/api/user/theme" as="fetch" crossOrigin="anonymous" />
      <link rel="preload" href="/api/user/layout" as="fetch" crossOrigin="anonymous" />
      <link rel="preload" href="/api/user/custom-theme" as="fetch" crossOrigin="anonymous" />
      <link rel="prefetch" href="/dashboard/meetings" />
      <link rel="prefetch" href="/dashboard/meeting-intelligence" />
    </>
  );
}

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

  const currentRole = userWithStaff?.Staff?.[0]?.Role ?? null;
  const isAdmin = isUserAdmin(userWithStaff);

  return (
    <>
      <PreloadResources />
      <DashboardLayoutClient
        isAdmin={isAdmin}
        user={{
          email: user.email,
          name: user.name ?? undefined,
          staff_id: userWithStaff?.Staff?.[0]?.id ?? null,
        }}
        currentRole={currentRole}
        userWithStaff={userWithStaff}
      >
        {children}
      </DashboardLayoutClient>
    </>
  );
} 
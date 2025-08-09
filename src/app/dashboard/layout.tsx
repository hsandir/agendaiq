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
import { DynamicLayoutWrapper } from "@/components/layout/DynamicLayoutWrapper";

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
    <DynamicLayoutWrapper
      isAdmin={isAdmin}
      user={user}
      currentRole={currentRole}
      userWithStaff={userWithStaff}
    >
      {children}
    </DynamicLayoutWrapper>
  );
} 
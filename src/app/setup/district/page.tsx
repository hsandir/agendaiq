import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DistrictSetup } from "@/components/setup/DistrictSetup";
import { requireAuth } from '@/lib/auth/auth-utils';
import { isrole, RoleKey } from '@/lib/auth/policy';

export default async function DistrictSetupPage() {
  const user = await requireAuth({ requireAuth: true });
  if (!isRole(user as any, RoleKey.OPS_ADMIN) && !isRole(user as any, RoleKey.DEV_ADMIN)) {
    redirect("/dashboard");
  }

  // Check if district already exists
  const districtCount = await prisma.district.count();
  if (districtCount > 0) {
    redirect("/dashboard");
  }

  return <DistrictSetup />;
} 
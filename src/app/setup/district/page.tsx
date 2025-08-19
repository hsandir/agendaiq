import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import type { UserWithStaff, SessionUser } from '@/types/auth';
import { prisma } from "@/lib/prisma";
import { DistrictSetup } from "@/components/setup/DistrictSetup";

export default async function DistrictSetupPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  const user = session.user as SessionUser;
  if (!user.staff?.Role || user.staff.Role.title !== "Administrator") {
    redirect("/dashboard");
  }

  // Check if district already exists
  const districtCount = await prisma.district.count();
  if (districtCount > 0) {
    redirect("/dashboard");
  }

  return <DistrictSetup />;
} 
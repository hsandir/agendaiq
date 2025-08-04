import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/prisma";
import { DistrictSetup } from "@/components/setup/DistrictSetup";

export default async function DistrictSetupPage() {
  const user = await requireAuth(AuthPresets.requireAuth);

  if (user.staff?.role?.title !== "Administrator") {
    redirect("/dashboard");
  }

  // Check if district already exists
  const districtCount = await prisma.district.count();
  if (districtCount > 0) {
    redirect("/dashboard");
  }

  return <DistrictSetup />;
} 
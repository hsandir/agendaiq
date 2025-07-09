import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SettingsNav } from "@/components/settings/SettingsNav";

async function getUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/auth/signin");
  }

  // Get user with staff and role information
  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
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

  return { session: session.user, user };
}

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, user } = await getUser();
  const isAdmin = user?.Staff?.[0]?.Role?.title === "Administrator";

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Settings Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 py-6">
        <div className="px-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Settings</h2>
          <p className="text-sm text-gray-500 mt-1">Manage your account and preferences</p>
        </div>
        <SettingsNav isAdmin={isAdmin} />
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </div>
    </div>
  );
} 
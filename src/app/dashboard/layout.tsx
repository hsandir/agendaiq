import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { RoleSwitch } from "@/components/dashboard/RoleSwitch";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
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

  const currentRole = user?.Staff?.[0]?.Role;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link
                href="/dashboard"
                className="flex items-center px-2 py-2 text-gray-900 hover:text-gray-600"
              >
                Dashboard
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">
                  {session.user.email}
                </span>
                <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                  {currentRole?.title || 'No Role'}
                </span>
                <RoleSwitch staff={user?.staff?.[0] || null} />
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r">
          <Sidebar />
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 bg-gray-50">
            <div className="container mx-auto px-4 py-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
} 
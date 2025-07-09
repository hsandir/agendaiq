import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

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

  const staff = user?.Staff?.[0];
  const isAdmin = staff?.Role?.title === "Administrator";

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-gray-500">Manage your account settings and preferences.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Profile Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium mb-4">Profile Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <div className="mt-1">
                <input
                  type="text"
                  readOnly
                  value={user?.name || ''}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <div className="mt-1">
                <input
                  type="email"
                  readOnly
                  value={user?.email || ''}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50"
                />
              </div>
            </div>
                          <div>
                <label className="block text-sm font-medium text-gray-700">Current Role</label>
                <div className="mt-1">
                  <input
                    type="text"
                    readOnly
                    value={staff?.Role?.title || 'No Role Assigned'}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50"
                  />
                </div>
              </div>
              {staff?.Department && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Department</label>
                  <div className="mt-1">
                    <input
                      type="text"
                      readOnly
                      value={staff.Department.name}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50"
                    />
                  </div>
                </div>
              )}
            {user?.staff_id && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Staff ID</label>
                <div className="mt-1">
                  <input
                    type="text"
                    readOnly
                    value={user.staff_id}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50"
                  />
                </div>
              </div>
            )}
            <div className="pt-4">
              <Link
                href="/dashboard/settings/profile"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Edit Profile
              </Link>
            </div>
          </div>
        </div>

        {/* School Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium mb-4">School Information</h3>
          {staff?.School ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">School Name</label>
                <div className="mt-1">
                  <input
                    type="text"
                    readOnly
                    value={staff.School.name}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50"
                  />
                </div>
              </div>
              {staff.School.address && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <div className="mt-1">
                    <input
                      type="text"
                      readOnly
                      value={staff.School.address}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50"
                    />
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500">No school information available</p>
              {isAdmin && (
                <div className="mt-4">
                  <Link
                    href="/dashboard/settings/school"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Set Up School
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Admin Actions */}
        {isAdmin && (
          <>
            <div className="bg-white shadow rounded-lg p-6 md:col-span-2">
              <h3 className="text-lg font-medium mb-4">Administrative Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <Link
                  href="/dashboard/settings/users"
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Manage Users
                </Link>
                <Link
                  href="/dashboard/settings/staff-upload"
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Upload Staff Data
                </Link>
                <Link
                  href="/dashboard/settings/roles"
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Manage Roles
                </Link>
                <Link
                  href="/dashboard/settings/school"
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  School Settings
                </Link>
                <Link
                  href="/dashboard/settings/permissions"
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Permissions
                </Link>
                <Link
                  href="/dashboard/settings/security"
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Security
                </Link>
                <Link
                  href="/dashboard/settings/notifications"
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Notifications
                </Link>
                <Link
                  href="/dashboard/settings/backup"
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Backup
                </Link>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6 md:col-span-2">
              <h3 className="text-lg font-medium mb-4">System Administration</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <Link
                  href="/dashboard/settings/system"
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  System Settings
                </Link>
                <Link
                  href="/dashboard/settings/database"
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Database
                </Link>
                <Link
                  href="/dashboard/settings/server"
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Server Status
                </Link>
                <Link
                  href="/dashboard/settings/audit"
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Audit Logs
                </Link>
                <Link
                  href="/dashboard/settings/errors"
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Error Tracking
                </Link>
                <Link
                  href="/dashboard/settings/setup"
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Initial Setup
                </Link>
                <Link
                  href="/dashboard/settings/admin"
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Admin Tools
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 
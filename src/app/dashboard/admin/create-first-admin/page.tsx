import { requireAuth, AuthPresets } from '@/lib/auth/auth-utils';
import { CreateFirstAdminForm } from '@/components/admin/CreateFirstAdminForm';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Shield } from 'lucide-react';

export default async function CreateFirstAdminPage() {
  // This page requires system admin or dev admin role
  const user = await requireAuth({
    requireAuth: true,
    requireAdminRole: true,
    allowedRoles: ['DEV_ADMIN', 'OPS_ADMIN']
  });

  // Check if there are already users in the system
  const userCount = await prisma.user.count();
  const districtCount = await prisma.district.count();
  const schoolCount = await prisma.school.count();

  // If system is already initialized, show warning
  if (userCount > 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <Shield className="h-6 w-6 text-yellow-600 dark:text-yellow-400 mr-2" />
              <h1 className="text-2xl font-bold text-yellow-800 dark:text-yellow-200">
                System Already Initialized
              </h1>
            </div>
            <p className="text-yellow-700 dark:text-yellow-300 mb-4">
              The system already has {userCount} user(s), {districtCount} district(s), and {schoolCount} school(s).
            </p>
            <p className="text-yellow-700 dark:text-yellow-300 mb-6">
              This page is only for initial system setup when no users exist.
            </p>
            <div className="flex gap-4">
              <Link 
                href="/dashboard/settings/district-setup"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Go to District Setup
              </Link>
              <Link 
                href="/dashboard"
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Get pre-created admin users from database
  const adminUsers = await prisma.user.findMany({
    where: {
      OR: [
        { is_admin: true },
        { is_system_admin: true },
        { Staff: { role: { key: { in: ['DEV_ADMIN', 'OPS_ADMIN'] } } } }
      ]
    },
    select: {
      id: true,
      email: true,
      name: true,
      hasPassword: true,
      Staff: {
        select: {
          role: {
            select: {
              title: true,
              key: true
            }
          }
        }
      }
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Initial System Setup
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Create the first administrator account to initialize the system.
            </p>
          </div>

          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h2 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
              Setup Instructions:
            </h2>
            <ol className="list-decimal list-inside text-blue-700 dark:text-blue-300 space-y-1">
              <li>Select an admin user from the pre-created accounts</li>
              <li>Set a secure password for the account</li>
              <li>Complete the setup to enable system access</li>
            </ol>
          </div>

          <CreateFirstAdminForm adminUsers={adminUsers} />

          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              This page is only accessible to system administrators during initial setup.
              Once the first admin is created, use the District Setup page for further configuration.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
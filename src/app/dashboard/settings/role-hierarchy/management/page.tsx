'use client';

import Link from 'next/link';
import { RoleHierarchyManagement } from '@/components/settings/RoleHierarchyManagement';

export default function RoleHierarchyManagementPage() {
  return (
    <>
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Role Hierarchy Management
          </h2>
          <p className="mt-1 text-gray-500">
            Define and manage custom roles and their hierarchies
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mt-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <Link
            href="/dashboard/settings/role-hierarchy"
            className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm"
          >
            Overview
          </Link>
          <Link
            href="/dashboard/settings/role-hierarchy/visualization"
            className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm"
          >
            Visualization
          </Link>
          <Link
            href="/dashboard/settings/role-hierarchy/management"
            className="border-blue-500 text-blue-600 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm"
          >
            Management
          </Link>
          <Link
            href="/dashboard/settings/role-hierarchy/user-assignment"
            className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm"
          >
            User Assignment
          </Link>
        </nav>
      </div>

      <div className="mt-8">
        <RoleHierarchyManagement />
      </div>
    </>
  );
} 
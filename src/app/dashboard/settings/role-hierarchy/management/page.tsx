'use client';

import Link from 'next/link';
import { FiArrowLeft } from 'react-icons/fi';
import { RoleHierarchyManagement } from '@/components/settings/RoleHierarchyManagement';

export default function RoleHierarchyManagementPage() {
  return (
    <>
      {/* Back to Overview Link */}
      <div className="mb-4">
        <Link
          href="/dashboard/settings/role-hierarchy"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <FiArrowLeft className="w-4 h-4 mr-2" />
          Back to Overview
        </Link>
      </div>

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

      <div className="mt-8">
        <RoleHierarchyManagement />
      </div>
    </>
  );
} 
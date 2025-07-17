'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { FiEye, FiEdit3, FiUsers } from 'react-icons/fi';

export default function RoleHierarchyPage() {
  const [stats, setStats] = useState({
    totalRoles: 0,
    leadershipRoles: 0,
    totalStaff: 0,
    departments: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [rolesRes, hierarchyRes] = await Promise.all([
        fetch('/api/admin/roles'),
        fetch('/api/roles/hierarchy')
      ]);

      if (rolesRes.ok && hierarchyRes.ok) {
        const [rolesData] = await Promise.all([
          rolesRes.json(),
          hierarchyRes.json()
        ]);

        const totalRoles = rolesData.length || 0;
        const leadershipRoles = rolesData.filter((role: { is_leadership?: boolean }) => role.is_leadership).length || 0;
        const totalStaff = rolesData.reduce((acc: number, role: { Staff?: Array<unknown> }) => acc + (role.Staff?.length || 0), 0);
        const departments = new Set(rolesData.map((role: { Department?: { id: string } }) => role.Department?.id).filter(Boolean)).size;

        setStats({
          totalRoles,
          leadershipRoles,
          totalStaff,
          departments
        });
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Role Hierarchy
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage and visualize your organization&apos;s role structure
          </p>
          {/* Statistics inline with header */}
          <div className="mt-3 flex space-x-6 text-sm text-gray-600">
            <div className="flex items-center">
              <span className="font-medium">{loading ? '...' : stats.totalRoles}</span>
              <span className="ml-1">Total Roles</span>
            </div>
            <div className="flex items-center">
              <span className="font-medium">{loading ? '...' : stats.leadershipRoles}</span>
              <span className="ml-1">Leadership Roles</span>
            </div>
            <div className="flex items-center">
              <span className="font-medium">{loading ? '...' : stats.totalStaff}</span>
              <span className="ml-1">Total Staff</span>
            </div>
            <div className="flex items-center">
              <span className="font-medium">{loading ? '...' : stats.departments}</span>
              <span className="ml-1">Departments</span>
            </div>
          </div>
        </div>
      </div>



      <div className="mt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Visualization Card */}
          <Link 
            href="/dashboard/settings/role-hierarchy/visualization"
            className="block group"
          >
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <FiEye className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                    Hierarchy Visualization
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Visualize and explore the organizational role hierarchy with interactive tree view
                  </p>
                </div>
              </div>
            </div>
          </Link>

          {/* Management Card */}
          <Link 
            href="/dashboard/settings/role-hierarchy/management"
            className="block group"
          >
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                    <FiEdit3 className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900 group-hover:text-green-600 transition-colors">
                    Hierarchy Management
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Create, edit, and manage roles and their hierarchical relationships
                  </p>
                </div>
              </div>
            </div>
          </Link>

          {/* User Role Assignment */}
          <Link 
            href="/dashboard/settings/role-hierarchy/user-assignment"
            className="block group"
          >
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                    <FiUsers className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900 group-hover:text-purple-600 transition-colors">
                    User Role Assignment
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Assign roles and departments to users based on the defined role hierarchy
                  </p>
                </div>
              </div>
            </div>
          </Link>


        </div>
      </div>
    </>
  );
} 
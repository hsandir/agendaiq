'use client';

import React, { useState, useEffect } from 'react';
import { FiChevronDown, FiChevronRight, FiUsers, FiUser, FiUserCheck } from 'react-icons/fi';

interface Role {
  id: string;
  title: string;
  level: number;
  is_leadership: boolean;
  category: string;
  Department?: {
    id: string;
    name: string;
  };
  Children?: Role[];
  Staff?: Array<{
    id: string;
    User: {
      name: string;
      email: string;
    };
  }>;
}

interface RoleHierarchyVisualizationProps {
  onRoleSelect?: (role: Role) => void;
}

export default function RoleHierarchyVisualization({ onRoleSelect }: RoleHierarchyVisualizationProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [expandedRoles, setExpandedRoles] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRoleHierarchy();
  }, []);

  const fetchRoleHierarchy = async () => {
    try {
      const response = await fetch('/api/roles/hierarchy');
      if (!response.ok) {
        throw new Error('Failed to fetch role hierarchy');
      }
      const data = await response.json();
      setRoles(data.roles || []);
      
      // Auto-expand top level roles
      const topLevelIds = data.roles?.filter((r: Role) => r.level <= 1).map((r: Role) => r.id) || [];
      setExpandedRoles(new Set(topLevelIds));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load hierarchy');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (roleId: string) => {
    const newExpanded = new Set(expandedRoles);
    if (newExpanded.has(roleId)) {
      newExpanded.delete(roleId);
    } else {
      newExpanded.add(roleId);
    }
    setExpandedRoles(newExpanded);
  };

  const renderRole = (role: Role, depth = 0) => {
    const hasChildren = role.Children && role.Children.length > 0;
    const hasStaff = role.Staff && role.Staff.length > 0;
    const isExpanded = expandedRoles.has(role.id);
    const staffCount = role.Staff?.length || 0;
    
    return (
      <div key={role.id} className="role-item">
        <div 
          className={`flex items-center py-3 px-4 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ${
            role.is_leadership ? 'bg-blue-50 border-l-4 border-blue-400' : 'bg-white border-l-4 border-gray-200'
          }`}
          style={{ marginLeft: `${depth * 20}px` }}
          onClick={() => onRoleSelect?.(role)}
        >
          <div className="flex items-center flex-1">
            {(hasChildren || hasStaff) ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpanded(role.id);
                }}
                className="mr-2 p-1 hover:bg-gray-200 rounded"
              >
                {isExpanded ? (
                  <FiChevronDown className="h-4 w-4" />
                ) : (
                  <FiChevronRight className="h-4 w-4" />
                )}
              </button>
            ) : (
              <div className="w-6 mr-2" />
            )}
            
            <div className="flex items-center flex-1">
              {role.is_leadership ? (
                <FiUsers className="h-4 w-4 mr-2 text-blue-600" />
              ) : (
                <FiUser className="h-4 w-4 mr-2 text-gray-600" />
              )}
              
              <div className="flex-1">
                <div className="flex items-center">
                  <span className="font-medium text-gray-900">{role.title}</span>
                  {/* Show staff count as badge */}
                  {staffCount > 0 && (
                    <span className="ml-2 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                      {staffCount} staff
                    </span>
                  )}
                </div>
                
                {/* Show staff names in blue boxes for leadership roles */}
                {role.is_leadership && hasStaff && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {role.Staff!.map((staffMember) => (
                      <span 
                        key={staffMember.id}
                        className="inline-flex items-center px-2 py-1 rounded bg-blue-100 text-blue-800 text-xs font-medium"
                      >
                        <FiUser className="h-3 w-3 mr-1" />
                        {staffMember.User.name || 'No Name'}
                      </span>
                    ))}
                  </div>
                )}
                
                <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                  <span>{role.Department?.name || 'No Department'}</span>
                  <span>•</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    role.is_leadership 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {role.category}
                  </span>
                  <span>•</span>
                  <span className="text-xs">Level {role.level}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Show children roles when expanded */}
        {hasChildren && isExpanded && (
          <div className="mt-1">
            {role.Children!.map(childRole => renderRole(childRole, depth + 1))}
          </div>
        )}
        
        {/* Show staff list when expanded and no children (bottom level) and NOT leadership */}
        {hasStaff && isExpanded && !hasChildren && !role.is_leadership && (
          <div className="mt-2 ml-8 space-y-1" style={{ marginLeft: `${(depth + 1) * 20 + 40}px` }}>
            <div className="text-xs font-medium text-gray-700 uppercase tracking-wider mb-2">
              Staff Members ({staffCount})
            </div>
            {role.Staff!.map((staffMember) => (
              <div key={staffMember.id} className="flex items-center text-sm text-gray-600 py-1 px-3 bg-gray-50 rounded">
                <FiUserCheck className="h-3 w-3 mr-2 text-green-500" />
                <span className="font-medium">{staffMember.User.name || 'No Name'}</span>
                <span className="text-gray-400 ml-2">({staffMember.User.email})</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-lg">
        <div className="text-red-800">{error}</div>
        <button 
          onClick={fetchRoleHierarchy}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Organization Hierarchy
      </h3>
      
      <div className="space-y-2">
        {roles.map(role => renderRole(role))}
      </div>
      
      {roles.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No roles found. Please set up the organization hierarchy first.
        </div>
      )}
      
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Legend:</h4>
        <div className="flex flex-wrap gap-4 text-xs text-gray-600">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-100 border-l-2 border-blue-400 mr-2"></div>
            Leadership Roles
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-white border-l-2 border-gray-200 mr-2"></div>
            Staff Roles
          </div>
          <div className="flex items-center">
            <FiUserCheck className="h-3 w-3 mr-1 text-green-500" />
            Active Staff Member
          </div>
        </div>
      </div>
    </div>
  );
} 
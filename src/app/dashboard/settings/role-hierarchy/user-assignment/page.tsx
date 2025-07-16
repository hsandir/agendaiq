'use client';

import { useState, useEffect } from 'react';
import { FiUsers, FiUser, FiShield, FiHome } from 'react-icons/fi';

interface User {
  id: string;
  name: string;
  email: string;
  Staff?: Array<{
    id: string;
    Role?: {
      id: number;
      title: string;
    };
    Department?: {
      id: number;
      name: string;
    };
  }>;
}

interface Role {
  id: number;
  title: string;
  Department?: {
    id: number;
    name: string;
  };
}

interface Department {
  id: number;
  name: string;
}

export default function UserRoleAssignmentPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  
  // Selection states
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  
  // Filter states
  const [filterByDepartment, setFilterByDepartment] = useState<string>('');
  const [filterByRole, setFilterByRole] = useState<string>('');
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, rolesRes, departmentsRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/roles'),
        fetch('/api/departments')
      ]);

      if (usersRes.ok && rolesRes.ok && departmentsRes.ok) {
        const [usersData, rolesData, departmentsData] = await Promise.all([
          usersRes.json(),
          rolesRes.json(),
          departmentsRes.json()
        ]);

        const usersArray = Array.isArray(usersData) ? usersData : [];
        const rolesArray = Array.isArray(rolesData) ? rolesData : (rolesData?.roles && Array.isArray(rolesData.roles) ? rolesData.roles : []);
        const departmentsArray = Array.isArray(departmentsData) ? departmentsData : [];
        
        setUsers(usersArray);
        setRoles(rolesArray);
        setDepartments(departmentsArray);
        setFilteredUsers(usersArray); // Initialize filtered users with all users
      } else {
        // Set empty arrays if any request fails
        setUsers([]);
        setRoles([]);
        setDepartments([]);
        setMessage({ type: 'error', text: 'Failed to load some data' });
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setMessage({ type: 'error', text: 'Failed to load data' });
    } finally {
      setLoading(false);
    }
  };

  // Filter users based on department and role selections
  useEffect(() => {
    let filtered = users;
    
    if (filterByDepartment) {
      filtered = filtered.filter(user => 
        user.Staff?.some(staff => staff.Department?.id.toString() === filterByDepartment)
      );
    }
    
    if (filterByRole) {
      filtered = filtered.filter(user => 
        user.Staff?.some(staff => staff.Role?.id.toString() === filterByRole)
      );
    }
    
    setFilteredUsers(filtered);
  }, [users, filterByDepartment, filterByRole]);

  // Handle department filter change
  const handleDepartmentFilterChange = (deptId: string) => {
    setFilterByDepartment(deptId);
    setFilterByRole(''); // Reset role filter when department changes
    setSelectedUser(''); // Reset user selection
    setSelectedRole('');
    setSelectedDepartment('');
    setHasChanges(false);
  };

  // Handle role filter change
  const handleRoleFilterChange = (roleId: string) => {
    setFilterByRole(roleId);
    setFilterByDepartment(''); // Reset department filter when role changes
    setSelectedUser(''); // Reset user selection
    setSelectedRole('');
    setSelectedDepartment('');
    setHasChanges(false);
  };

  const handleUserChange = (userId: string) => {
    setSelectedUser(userId);
    setSelectedRole('');
    setSelectedDepartment('');
    setHasChanges(false);
    
    if (userId) {
      const user = users.find(u => u.id === userId);
      if (user?.Staff?.[0]) {
        const currentRole = user.Staff[0].Role?.id.toString() || '';
        const currentDepartment = user.Staff[0].Department?.id.toString() || '';
        setSelectedRole(currentRole);
        setSelectedDepartment(currentDepartment);
      }
    }
  };

  // Handle role or department assignment changes
  const handleAssignmentChange = () => {
    if (!selectedUser) return;
    
    const user = users.find(u => u.id === selectedUser);
    if (!user?.Staff?.[0]) return;
    
    const currentRole = user.Staff[0].Role?.id.toString() || '';
    const currentDepartment = user.Staff[0].Department?.id.toString() || '';
    
    const roleChanged = selectedRole !== currentRole;
    const departmentChanged = selectedDepartment !== currentDepartment;
    
    setHasChanges(roleChanged || departmentChanged);
  };

  // Update hasChanges when selections change
  useEffect(() => {
    handleAssignmentChange();
  }, [selectedRole, selectedDepartment, selectedUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser || !selectedRole) {
      setMessage({ type: 'error', text: 'Please select a user and role' });
      return;
    }

    try {
      setUpdating(true);
      setMessage(null);

      const response = await fetch(`/api/users/${selectedUser}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roleId: parseInt(selectedRole),
          departmentId: selectedDepartment ? parseInt(selectedDepartment) : null,
        }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'User role updated successfully' });
        setHasChanges(false);
        // Refresh data
        fetchData();
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.error || 'Failed to update user role' });
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      setMessage({ type: 'error', text: 'Failed to update user role' });
    } finally {
      setUpdating(false);
    }
  };

  // Removed unused getCurrentUserInfo function

  const getCurrentAssignment = () => {
    if (!selectedUser) return null;
    const user = users.find(u => u.id === selectedUser);
    if (!user?.Staff?.[0]) return null;
    
    return {
      user,
      staff: user.Staff[0],
      currentRole: user.Staff[0].Role,
      currentDepartment: user.Staff[0].Department
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            User Role Assignment
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Assign roles and departments to users based on the defined role hierarchy
          </p>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`rounded-md p-4 ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex">
            <div className="flex-shrink-0">
              <div className={`w-5 h-5 ${
                message.type === 'success' ? 'text-green-400' : 'text-red-400'
              }`}>
                {message.type === 'success' ? '✓' : '✕'}
              </div>
            </div>
            <div className="ml-3">
              <p className={`text-sm font-medium ${
                message.type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {message.text}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Assignment Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Assign Role & Department
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* User Selection Methods */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-700">Select User by:</h4>
                
                {/* Method 1: Filter by Department */}
                <div>
                  <label htmlFor="deptFilter" className="block text-sm font-medium text-gray-700 mb-2">
                    <FiHome className="inline w-4 h-4 mr-1" />
                    Filter by Department
                  </label>
                  <select
                    id="deptFilter"
                    value={filterByDepartment}
                    onChange={(e) => handleDepartmentFilterChange(e.target.value)}
                    className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="">All Departments</option>
                    {Array.isArray(departments) && departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Method 2: Filter by Role */}
                <div>
                  <label htmlFor="roleFilter" className="block text-sm font-medium text-gray-700 mb-2">
                    <FiShield className="inline w-4 h-4 mr-1" />
                    Filter by Role
                  </label>
                  <select
                    id="roleFilter"
                    value={filterByRole}
                    onChange={(e) => handleRoleFilterChange(e.target.value)}
                    className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="">All Roles</option>
                    {Array.isArray(roles) && roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.title}
                        {role.Department && ` (${role.Department.name})`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Method 3: Direct User Selection */}
                <div>
                  <label htmlFor="userSelect" className="block text-sm font-medium text-gray-700 mb-2">
                    <FiUser className="inline w-4 h-4 mr-1" />
                    Select User
                  </label>
                  <select
                    id="userSelect"
                    value={selectedUser}
                    onChange={(e) => handleUserChange(e.target.value)}
                    className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                    required
                  >
                    <option value="">Choose a user to assign roles...</option>
                    {Array.isArray(filteredUsers) && filteredUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email})
                        {user.Staff?.[0]?.Role && ` - ${user.Staff[0].Role.title}`}
                        {user.Staff?.[0]?.Department && ` (${user.Staff[0].Department.name})`}
                      </option>
                    ))}
                  </select>
                  {filterByDepartment && (
                    <p className="mt-1 text-xs text-gray-500">
                      Showing users from {departments.find(d => d.id.toString() === filterByDepartment)?.name}
                    </p>
                  )}
                  {filterByRole && (
                    <p className="mt-1 text-xs text-gray-500">
                      Showing users with role: {roles.find(r => r.id.toString() === filterByRole)?.title}
                    </p>
                  )}
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label htmlFor="roleSelect" className="block text-sm font-medium text-gray-700 mb-2">
                  <FiShield className="inline w-4 h-4 mr-1" />
                  Assign Role
                </label>
                <select
                  id="roleSelect"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                  required
                >
                  <option value="">Choose a role...</option>
                  {Array.isArray(roles) && roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.title}
                      {role.Department && ` (${role.Department.name})`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Department Selection */}
              <div>
                <label htmlFor="departmentSelect" className="block text-sm font-medium text-gray-700 mb-2">
                  <FiHome className="inline w-4 h-4 mr-1" />
                  Assign Department (Optional)
                </label>
                <select
                  id="departmentSelect"
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">Choose a department (optional)...</option>
                  {Array.isArray(departments) && departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Leave empty to use the department from the selected role
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={updating || !selectedUser || !selectedRole || !hasChanges}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating ? 'Updating...' : hasChanges ? 'Update User Assignment' : 'No Changes to Save'}
              </button>
            </form>
          </div>
        </div>

        {/* Current User Info */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Current Assignment
            </h3>
            
            {selectedUser ? (
              <div className="space-y-4">
                {(() => {
                  const assignment = getCurrentAssignment();
                  if (!assignment) {
                    return (
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-500">No assignment data available</p>
                      </div>
                    );
                  }
                  
                  const { user, currentRole, currentDepartment } = assignment;
                  
                  return (
                    <>
                      <div>
                        <h4 className="font-medium text-gray-900">{user.name}</h4>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                      
                      <div className="border-t pt-4">
                        <div className="space-y-3">
                          <div>
                            <span className="text-sm font-medium text-gray-700">Current Role:</span>
                            <p className="text-sm text-gray-900">
                              {currentRole?.title || 'No role assigned'}
                            </p>
                          </div>
                          
                          <div>
                            <span className="text-sm font-medium text-gray-700">Current Department:</span>
                            <p className="text-sm text-gray-900">
                              {currentDepartment?.name || 'No department assigned'}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {hasChanges && (
                        <div className="border-t pt-4">
                          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                            <h5 className="text-sm font-medium text-blue-800 mb-2">Pending Changes:</h5>
                            <div className="space-y-2 text-sm">
                              {selectedRole !== currentRole?.id.toString() && (
                                <div className="flex justify-between">
                                  <span className="text-blue-700">Role:</span>
                                  <span className="text-blue-900">
                                    {currentRole?.title || 'None'} → {roles.find(r => r.id.toString() === selectedRole)?.title || 'None'}
                                  </span>
                                </div>
                              )}
                              {selectedDepartment !== currentDepartment?.id.toString() && (
                                <div className="flex justify-between">
                                  <span className="text-blue-700">Department:</span>
                                  <span className="text-blue-900">
                                    {currentDepartment?.name || 'None'} → {departments.find(d => d.id.toString() === selectedDepartment)?.name || 'None'}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            ) : (
              <div className="text-center py-8">
                <FiUsers className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">
                  Select a user to view their current assignment
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 
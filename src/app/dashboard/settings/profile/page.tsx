'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { User as FiUser, Mail as FiMail, Check as FiCheck, AlertCircle as FiAlertCircle } from 'lucide-react';

interface School {
  id: string;
  name: string;
  address?: string;
}

export default function ProfilePage() {
  const { data: __session  } = useSession();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
    role: '',
    schoolId: '',
  });
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/user/profile');
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message);
        }

        setFormData({
          name: data.name || '',
          email: data.email || '',
          department: data.department || '',
          role: data.role || '',
          schoolId: data.school?.id || '',
        });
      } catch (error: unknown) {
        setError('Failed to load profile');
      }
    };

    const fetchSchools = async () => {
      try {
        const response = await fetch('/api/school');
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch schools');
        }

        // Handle both array and single school responses
        const schoolsList = Array.isArray(data) ? data : (data.schools || [data]);
        setSchools(schoolsList);
      } catch (error: unknown) {
        console.error('Failed to load schools:', error);
      }
    };

    fetchProfile();
    fetchSchools();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setIsLoading(true);

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      setSuccess(true);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="mx-auto max-w-3xl py-6 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-lg bg-card shadow">
        <div className="px-4 py-5 sm:p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground">Profile Settings</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Update your personal information and school assignment.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-foreground">
                Name
              </label>
              <div className="mt-1">
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  className="block w-full rounded-md border-border shadow-sm focus:border-indigo-500 focus:ring-ring sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground">
                Email
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  readOnly
                  className="block w-full rounded-md border-border bg-muted shadow-sm focus:border-indigo-500 focus:ring-ring sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="department" className="block text-sm font-medium text-foreground">
                Department
              </label>
              <div className="mt-1">
                <input
                  id="department"
                  name="department"
                  type="text"
                  value={formData.department}
                  readOnly
                  className="block w-full rounded-md border-border bg-muted shadow-sm focus:border-indigo-500 focus:ring-ring sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-foreground">
                Role
              </label>
              <div className="mt-1">
                <input
                  id="role"
                  name="role"
                  type="text"
                  value={formData.role}
                  readOnly
                  className="block w-full rounded-md border-border bg-muted shadow-sm focus:border-indigo-500 focus:ring-ring sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="schoolId" className="block text-sm font-medium text-foreground">
                School Assignment
              </label>
              <div className="mt-1">
                <select
                  id="schoolId"
                  name="schoolId"
                  value={formData.schoolId}
                  onChange={handleChange}
                  className="block w-full rounded-md border-border shadow-sm focus:border-indigo-500 focus:ring-ring sm:text-sm"
                >
                  <option value="">Select a school</option>
                  {schools.map((school) => (
                    <option key={school.id} value={school.id}>
                      {school.name}
                      {school.address && ` - ${school.address}`}
                    </option>
                  ))}
                </select>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Select the school you are assigned to. This helps organize meetings and staff assignments.
              </p>
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <FiAlertCircle className="h-5 w-5 text-destructive" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-destructive">{error}</h3>
                  </div>
                </div>
              </div>
            )}

            {success && (
              <div className="rounded-md bg-green-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <FiCheck className="h-5 w-5 text-green-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">Profile updated successfully</h3>
                  </div>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 
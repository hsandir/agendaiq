'use client';

import { useState } from 'react';
import type { UserWithAuth } from '@/types/auth';

import { useRouter } from 'next/navigation';
import { Lock, Mail, User, AlertCircle, CheckCircle } from 'lucide-react';

interface AdminUser {
  id: number;
  email: string;
  name: string | null;
  hashedPassword: string | null;
  staff: {
    role: {
      title: string;
      key: string | null;
    } | null;
  }[] | null;
}

interface CreateFirstAdminFormProps {
  adminUsers: AdminUser[];
}

export function CreateFirstAdminForm({ adminUsers }: CreateFirstAdminFormProps) {
  const router = useRouter();
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedUserId) {
      setError('Please select an admin user');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/create-first-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: parseInt(selectedUserId),
          password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create admin account');
      }

      setSuccess('Admin account created successfully! Redirecting to login...');
      
      setTimeout(() => {
        router.push('/auth/signin');
      }, 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter out users that already have passwords
  const availableUsers = adminUsers.filter(user => !user.hashedPassword);

  if (availableUsers.length === 0) {
    return (
      <div className="p-6 bg-green-50 dark:bg-green-900/20 rounded-lg">
        <div className="flex items-center">
          <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400 mr-2" />
          <div>
            <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
              All Admin Accounts Configured
            </h3>
            <p className="text-green-700 dark:text-green-300 mt-1">
              All administrator accounts already have passwords set. 
              You can proceed to sign in.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="admin-user" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Select Admin User
        </label>
        <select
          id="admin-user"
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        >
          <option value="">-- Select an admin user --</option>
          {availableUsers.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name || 'No Name'} ({user.email}) - {user.staff?.[0]?.role?.title ?? 'Admin'}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter a secure password"
            required
            minLength={8}
          />
        </div>
      </div>

      <div>
        <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Confirm Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Confirm your password"
            required
            minLength={8}
          />
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
            <p className="text-green-700 dark:text-green-300">{success}</p>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center"
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            Creating Account...
          </>
        ) : (
          'Create Admin Account'
        )}
      </button>
    </form>
  );
}
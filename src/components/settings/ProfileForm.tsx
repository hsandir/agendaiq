'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
}

interface ProfileFormProps {
  user: User;
}

export function ProfileForm({ user }: ProfileFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to update profile');
      }

      setSuccess('Profile updated successfully');
      router.refresh();
    } catch (error: unknown) {
      setError('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return 
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-foreground">
          Profile Picture
        </label>
        <div className="mt-2 flex items-center space-x-4">
          <div className="relative h-12 w-12 rounded-full overflow-hidden">
            {(user as Record<string, unknown>.image ? 
              <Image
                src={(user as Record<string, unknown>.image}
                alt={user.name || 'Profile picture'}
                fill
                className="object-cover"
              />
            ) : (
              <div className="h-full w-full bg-muted flex items-center justify-center">
                <span className="text-muted-foreground text-xl">
                  {user.name?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
            )}
          </div>
          <button
            type="button"
            className="px-3 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-md hover:bg-muted"
          >
            Change
          </button>
        </div>
      </div>

      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-foreground"
        >
          Name
        </label>
        <input
          type="text"
          name="name"
          id="name"
          defaultValue={user.name || ''}
          className="mt-1 block w-full rounded-md border border-border py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-ring sm:text-sm"
        />
      </div>

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-foreground"
        >
          Email
        </label>
        <input
          type="email"
          name="email"
          id="email"
          value={user.email || ''}
          disabled
          className="mt-1 block w-full rounded-md border border-border bg-muted py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-ring sm:text-sm"
        />
      </div>

      <div>
        <label
          htmlFor="role"
          className="block text-sm font-medium text-foreground"
        >
          Role
        </label>
        <input
          type="text"
          name="role"
          id="role"
          value={user.role || 'USER'}
          disabled
          className="mt-1 block w-full rounded-md border border-border bg-muted py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-ring sm:text-sm"
        />
      </div>

      {error && (
        <div className="text-sm text-destructive">{error}</div>
      )}

      {success && (
        <div className="text-sm text-green-600">{success}</div>
      )}

      <div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-foreground bg-primary hover:bg-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
} 
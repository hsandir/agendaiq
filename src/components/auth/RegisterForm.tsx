'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User as FiUser, Mail as FiMail, Lock as FiLock, AlertCircle as FiAlertCircle } from 'lucide-react';
import Link from 'next/link';

export function RegisterForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      // Redirect to sign in page after successful registration
      router.push('/auth/signin' as any);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="rounded-lg bg-card p-6 shadow-lg">
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
              autoComplete="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="block w-full rounded-md border-border shadow-sm focus:border-indigo-500 focus:ring-ring sm:text-sm"
              placeholder="Enter your name"
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-foreground">
            Email address
          </label>
          <div className="mt-1">
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="block w-full rounded-md border-border shadow-sm focus:border-indigo-500 focus:ring-ring sm:text-sm"
              placeholder="Enter your email"
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-foreground">
            Password
          </label>
          <div className="mt-1">
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={formData.password}
              onChange={handleChange}
              className="block w-full rounded-md border-border shadow-sm focus:border-indigo-500 focus:ring-ring sm:text-sm"
              placeholder="Create a password"
            />
          </div>
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

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
          >
            {isLoading ? 'Creating account...' : 'Create account'}
          </button>
        </div>

        <div className="text-center">
          <Link
            href="/auth/signin"
            className="text-sm font-medium text-primary hover:text-primary"
          >
            Already have an account? Sign in
          </Link>
        </div>
      </form>
    </div>
  );
} 
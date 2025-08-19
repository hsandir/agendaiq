'use client';

import { useState } from 'react';
import { Mail as FiMail, AlertCircle as FiAlertCircle } from 'lucide-react';
import Link from 'next/link';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response?.ok) {
        throw new Error(data?.message || 'Something went wrong');
      }

      setSuccess(true);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-lg bg-card p-6 shadow-lg">
        <div className="text-center">
          <FiMail className="mx-auto h-12 w-12 text-green-500" />
          <h3 className="mt-2 text-lg font-medium text-foreground">Check your email</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            If an account exists with this email, you will receive a password reset link.
          </p>
          <div className="mt-6">
            <Link
              href="/auth/signin"
              className="text-sm font-medium text-primary hover:text-primary"
            >
              Return to sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-card p-6 shadow-lg">
      <form onSubmit={handleSubmit} className="space-y-6">
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
              value={email}
              onChange={(e) => setEmail(e.target?.value)}
              className="block w-full rounded-md border-border shadow-sm focus:border-indigo-500 focus:ring-ring sm:text-sm"
              placeholder="Enter your email"
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
            {isLoading ? 'Sending...' : 'Send reset link'}
          </button>
        </div>

        <div className="text-center">
          <Link
            href="/auth/signin"
            className="text-sm font-medium text-primary hover:text-primary"
          >
            Back to sign in
          </Link>
        </div>
      </form>
    </div>
  );
} 
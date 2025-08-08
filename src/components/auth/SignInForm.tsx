'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Lock as FiLock, Shield as FiShield } from 'lucide-react';
import Link from 'next/link';

interface SignInFormProps {
  isFirstTimeSetup?: boolean;
}

interface AdminUser {
  email: string;
  name: string;
}

export function SignInForm({ isFirstTimeSetup = false }: SignInFormProps) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [trustDevice, setTrustDevice] = useState(false);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [selectedAdminEmail, setSelectedAdminEmail] = useState('');

  // Fetch admin users from database
  useEffect(() => {
    const fetchAdminUsers = async () => {
      try {
        const response = await fetch('/api/auth/admin-users');
        if (response.ok) {
          const data = await response.json();
          setAdminUsers(data.adminUsers);
          if (data.adminUsers.length > 0) {
            setSelectedAdminEmail(data.adminUsers[0].email);
          }
        }
      } catch (error) {
        console.error('Error fetching admin users:', error);
      }
    };

    if (isFirstTimeSetup) {
      fetchAdminUsers();
    }
  }, [isFirstTimeSetup]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      // If first user, create admin account
      if (isFirstTimeSetup && selectedAdminEmail && email === selectedAdminEmail) {
        await fetch("/api/auth/create-admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
      }

      const result = await signIn('credentials', {
        email,
        password,
        rememberMe: rememberMe.toString(),
        trustDevice: trustDevice.toString(),
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else {
        router.push('/dashboard' as any);
      }
    } catch (error) {
      setError('An error occurred during sign in');
      console.error('Sign in error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-8 rounded-lg bg-card p-6 shadow-lg">
      <div>
        <h2 className="text-center text-3xl font-bold tracking-tight text-foreground">
          {isFirstTimeSetup ? 'Create Admin Account' : 'Sign in to your account'}
        </h2>
        {isFirstTimeSetup && (
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Select an admin user to create account
          </p>
        )}
      </div>
      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        {isFirstTimeSetup && adminUsers.length > 0 && (
          <div>
            <label htmlFor="admin-select" className="block text-sm font-medium text-foreground mb-2">
              Select Admin User
            </label>
            <select
              id="admin-select"
              value={selectedAdminEmail}
              onChange={(e) => setSelectedAdminEmail(e.target.value)}
              className="relative block w-full rounded-md border-0 py-1.5 text-foreground ring-1 ring-inset ring-gray-300 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-ring sm:text-sm sm:leading-6"
            >
              {adminUsers.map((admin) => (
                <option key={admin.email} value={admin.email}>
                  {admin.name} ({admin.email})
                </option>
              ))}
            </select>
          </div>
        )}
        
        <div className="-space-y-px rounded-md shadow-sm">
          <div>
            <label htmlFor="email" className="sr-only">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              defaultValue={isFirstTimeSetup && selectedAdminEmail ? selectedAdminEmail : ''}
              className="relative block w-full rounded-t-md border-0 py-1.5 text-foreground ring-1 ring-inset ring-gray-300 placeholder:text-muted-foreground focus:z-10 focus:ring-2 focus:ring-inset focus:ring-ring sm:text-sm sm:leading-6"
              placeholder="Email address"
            />
          </div>
          <div>
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete={isFirstTimeSetup ? 'new-password' : 'current-password'}
              required
              className="relative block w-full rounded-b-md border-0 py-1.5 text-foreground ring-1 ring-inset ring-gray-300 placeholder:text-muted-foreground focus:z-10 focus:ring-2 focus:ring-inset focus:ring-ring sm:text-sm sm:leading-6"
              placeholder={isFirstTimeSetup ? 'Create password' : 'Password'}
            />
          </div>
        </div>

        {!isFirstTimeSetup && (
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-foreground">
                Remember me
              </label>
            </div>

            <div className="flex items-center">
              <input
                id="trust-device"
                name="trust-device"
                type="checkbox"
                checked={trustDevice}
                onChange={(e) => setTrustDevice(e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
              />
              <label htmlFor="trust-device" className="ml-2 block text-sm text-foreground">
                Trust this device for 30 days
              </label>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-md bg-destructive/10 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <FiShield className="h-5 w-5 text-destructive" aria-hidden="true" />
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
            className="group relative flex w-full justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-foreground hover:bg-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
          >
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <FiLock className="h-5 w-5 text-primary group-hover:text-primary" aria-hidden="true" />
            </span>
            {isLoading ? 'Signing in...' : (isFirstTimeSetup ? 'Create Account' : 'Sign in')}
          </button>
        </div>

        {!isFirstTimeSetup && (
          <div className="text-center">
            <Link
              href="/auth/forgot-password"
              className="text-sm font-medium text-primary hover:text-primary"
            >
              Forgot your password?
            </Link>
          </div>
        )}
      </form>
    </div>
  );
} 
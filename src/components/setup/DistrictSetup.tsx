'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function DistrictSetup() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      address: formData.get('address') as string,
      city: formData.get('city') as string,
      state: formData.get('state') as string,
      zipCode: formData.get('zipCode') as string,
    };

    try {
      const response = await fetch('/api/district/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create district');
      }

      router.push('/dashboard');
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
            Set Up Your District
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Please provide your district information to get started
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="name" className="sr-only">District Name</label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-border placeholder-gray-500 text-foreground rounded-t-md focus:outline-none focus:ring-ring focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="District Name"
              />
            </div>
            <div>
              <label htmlFor="address" className="sr-only">Address</label>
              <input
                id="address"
                name="address"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-border placeholder-gray-500 text-foreground focus:outline-none focus:ring-ring focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Address"
              />
            </div>
            <div>
              <label htmlFor="city" className="sr-only">City</label>
              <input
                id="city"
                name="city"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-border placeholder-gray-500 text-foreground focus:outline-none focus:ring-ring focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="City"
              />
            </div>
            <div>
              <label htmlFor="state" className="sr-only">State</label>
              <input
                id="state"
                name="state"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-border placeholder-gray-500 text-foreground focus:outline-none focus:ring-ring focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="State"
              />
            </div>
            <div>
              <label htmlFor="zipCode" className="sr-only">ZIP Code</label>
              <input
                id="zipCode"
                name="zipCode"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-border placeholder-gray-500 text-foreground rounded-b-md focus:outline-none focus:ring-ring focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="ZIP Code"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 p-4">
              <div className="flex">
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
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-foreground bg-primary hover:bg-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50"
            >
              {isLoading ? 'Setting up...' : 'Set Up District'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 
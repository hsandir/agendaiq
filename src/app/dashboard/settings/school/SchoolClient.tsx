'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface School {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  phone: string | null;
  website: string | null;
}

interface SchoolClientProps {
  initialschool: School | null;
}

export default function SchoolClient({ initialSchool }: SchoolClientProps) {
  const router = useRouter();
  const [school, setSchool] = useState<School | null>(initialSchool);
  const [isLoading, setIsLoading] = useState(!initialSchool);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchSchool = async () => {
      if (initialSchool) return; // Already have data
      
      try {
        const response = await fetch('/api/school');
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch school data');
        }

        setSchool(data);
      } catch (error: unknown) {
        setError(error instanceof Error ? error.message : 'Failed to load school data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchool();
  }, [initialSchool]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData(e.currentTarget);
      const schoolData = {
        name: formData.get('name'),
        address: formData.get('address'),
        city: formData.get('city'),
        state: formData.get('state'),
        zipCode: formData.get('zipCode'),
        phone: formData.get('phone'),
        website: formData.get('website'),
      };

      const response = await fetch('/api/school', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(schoolData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update school information');
      }

      setSchool(data);
      setSuccess('School information updated successfully');
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Failed to update school information');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-foreground sm:truncate sm:text-3xl sm:tracking-tight">
            School Settings
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Update your school's information
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div className="bg-card shadow rounded-lg p-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="name" className="block text-sm font-medium text-foreground">
                School Name
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="name"
                  id="name"
                  defaultValue={school?.name ?? ''}
                  required
                  className="block w-full rounded-md border-border shadow-sm focus:border-indigo-500 focus:ring-ring sm:text-sm"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="address" className="block text-sm font-medium text-foreground">
                Street Address
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="address"
                  id="address"
                  defaultValue={school?.address ?? ''}
                  className="block w-full rounded-md border-border shadow-sm focus:border-indigo-500 focus:ring-ring sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="city" className="block text-sm font-medium text-foreground">
                City
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="city"
                  id="city"
                  defaultValue={school?.city ?? ''}
                  className="block w-full rounded-md border-border shadow-sm focus:border-indigo-500 focus:ring-ring sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="state" className="block text-sm font-medium text-foreground">
                State
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="state"
                  id="state"
                  defaultValue={school?.state ?? ''}
                  className="block w-full rounded-md border-border shadow-sm focus:border-indigo-500 focus:ring-ring sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="zipCode" className="block text-sm font-medium text-foreground">
                ZIP Code
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="zipCode"
                  id="zipCode"
                  defaultValue={school?.zipCode ?? ''}
                  className="block w-full rounded-md border-border shadow-sm focus:border-indigo-500 focus:ring-ring sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-foreground">
                Phone Number
              </label>
              <div className="mt-1">
                <input
                  type="tel"
                  name="phone"
                  id="phone"
                  defaultValue={school?.phone ?? ''}
                  className="block w-full rounded-md border-border shadow-sm focus:border-indigo-500 focus:ring-ring sm:text-sm"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="website" className="block text-sm font-medium text-foreground">
                Website
              </label>
              <div className="mt-1">
                <input
                  type="url"
                  name="website"
                  id="website"
                  defaultValue={school?.website ?? ''}
                  className="block w-full rounded-md border-border shadow-sm focus:border-indigo-500 focus:ring-ring sm:text-sm"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-md bg-destructive/10 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-destructive">{error}</h3>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="mt-4 rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">{success}</h3>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6">
            <button
              type="submit"
              disabled={isSaving}
              className="flex w-full justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-foreground shadow-sm hover:bg-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
} 
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function PAGE_NAME() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // REQUIRED: Auth check for client components
  useEffect(() => {
    if (session === null) {
      router.push('/auth/signin');
      return;
    }
    
    // OPTIONAL: Admin check if needed
    // if (session && session.user?.staff?.role?.title !== 'Administrator') {
    //   router.push('/dashboard');
    //   return;
    // }
    
    setLoading(false);
  }, [session, router]);

  // REQUIRED: Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // REQUIRED: Your page JSX here
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">PAGE_TITLE</h1>
        <p className="text-muted-foreground">PAGE_DESCRIPTION</p>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-800">{error}</div>
        </div>
      )}

      {/* Your page content here */}
      <div className="space-y-6">
        {/* Content components */}
      </div>
    </div>
  );
} 
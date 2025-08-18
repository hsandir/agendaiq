'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import { AlertCircle, Home, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const errorMessages: Record<string, { title: string; description: string }> = {
  Configuration: {
    title: 'Server Configuration Error',
    description: 'There is a problem with the server configuration. Please contact your administrator.'
  },
  AccessDenied: {
    title: 'Access Denied',
    description: 'You do not have permission to sign in. Please contact your administrator.'
  },
  Verification: {
    title: 'Verification Error',
    description: 'The verification link may have expired or has already been used.'
  },
  OAuthSignIn: {
    title: 'OAuth Sign In Error',
    description: 'There was an error during OAuth authentication. Please try again.'
  },
  OAuthCallback: {
    title: 'OAuth Callback Error',
    description: 'There was an error processing the OAuth callback. Please try again.'
  },
  OAuthCreateAccount: {
    title: 'Account Creation Error',
    description: 'Could not create your account. You may already have an account with this email.'
  },
  EmailCreateAccount: {
    title: 'Email Account Error',
    description: 'Could not create an account with this email address.'
  },
  Callback: {
    title: 'Callback Error',
    description: 'There was an error during the authentication callback.'
  },
  OAuthAccountNotLinked: {
    title: 'Account Not Linked',
    description: 'This email is already associated with another account. Please sign in with your original method.'
  },
  SessionRequired: {
    title: 'Session Required',
    description: 'You must be signed in to access this page.'
  },
  Default: {
    title: 'Authentication Error',
    description: 'An error occurred during authentication. Please try again.'
  }
};

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams?.get('error') || null;
  
  const errorInfo = errorMessages[error || 'Default'] || errorMessages.Default;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            {errorInfo.title}
          </CardTitle>
          <CardDescription className="mt-2 text-gray-600">
            {errorInfo.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-gray-100 rounded-lg p-3">
              <p className="text-xs text-gray-500">Error Code: {error}</p>
            </div>
          )}
          
          <div className="flex flex-col gap-3">
            <Link href="/auth/signin">
              <Button className="w-full" variant="default">
                <LogIn className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </Link>
            
            <Link href="/">
              <Button className="w-full" variant="outline">
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Button>
            </Link>
          </div>
          
          <div className="text-center pt-4 border-t">
            <p className="text-sm text-gray-500">
              If this problem persists, please contact{' '}
              <a href="mailto:support@agendaiq.com" className="text-blue-600 hover:underline">
                support
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  );
}
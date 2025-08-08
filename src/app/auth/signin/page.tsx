"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SignInButton } from "@/components/auth/SignInButton";
import { SignInForm } from "@/components/auth/SignInForm";
import Link from "next/link";

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isFirstTimeSetup, setIsFirstTimeSetup] = useState(false);
  const [securityWarning, setSecurityWarning] = useState(false);

  // Check for security issue: credentials in URL
  useEffect(() => {
    if (searchParams && (searchParams.get('password') || searchParams.get('email'))) {
      setSecurityWarning(true);
      // Clear the URL to remove credentials
      window.history.replaceState({}, document.title, '/auth/signin');
    }
  }, [searchParams]);

  // Check if this is the first user setup
  const checkFirstTimeSetup = async () => {
    try {
      const isFirstUser = await fetch("/api/auth/check-first-user").then(res => res.json());
      setIsFirstTimeSetup(isFirstUser);
    } catch (error) {
      console.error("Error checking first time setup:", error);
    }
  };

  // Call this when component mounts
  useEffect(() => {
    checkFirstTimeSetup();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h1 className="text-center text-4xl font-bold tracking-tight text-foreground">
            Welcome to AgendaIQ
          </h1>
          {isFirstTimeSetup && (
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Complete the initial setup by creating an admin account
            </p>
          )}
        </div>

        {securityWarning && (
          <div className="rounded-md bg-destructive/10 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-destructive" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-destructive">Security Warning</h3>
                <div className="mt-2 text-sm text-destructive">
                  <p>
                    Credentials were detected in the URL. For security reasons:
                  </p>
                  <ul className="list-disc list-inside mt-1">
                    <li>Clear your browser history</li>
                    <li>Change your password immediately</li>
                    <li>Never put passwords in URLs</li>
                    <li>Use the form below to sign in safely</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Google Sign In */}
          <SignInButton />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-muted px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          {/* Email/Password Sign In Form */}
          <SignInForm isFirstTimeSetup={isFirstTimeSetup} />

          {/* Sign Up Link */}
          {!isFirstTimeSetup && (
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/auth/signup" className="font-medium text-primary hover:text-primary">
                Sign up
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <SignInContent />
    </Suspense>
  );
} 
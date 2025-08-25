'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

// PostHog is already initialized in instrumentation-client.ts
// This provider just wraps the app with PostHog context

function PostHogPageViewContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname && posthog && posthog.__loaded) {
      try {
        let url = window.origin + pathname;
        if (searchParams && searchParams.toString()) {
          url = url + '?' + searchParams.toString();
        }
        posthog.capture('$pageview', {
          $current_url: url,
        });
      } catch (error) {
        // Silently ignore PostHog errors in development
        if (process.env.NODE_ENV === "development") {
          console.debug("PostHog pageview capture failed:", error);
        }
      }
    }
  }, [pathname, searchParams]);

  return null;
}

export function PostHogPageView() {
  return (
    <Suspense fallback={null}>
      <PostHogPageViewContent />
    </Suspense>
  );
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return (
    <PHProvider client={posthog}>
      {children}
    </PHProvider>
  );
}
"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { useEffect } from "react";
import { setSentryUser, clearSentryUser } from "@/lib/sentry/sentry-utils";

function SentryUserSync() {
  const { data: session, status } = useSession();
  
  useEffect(() => {
    if (status === "loading") return;
    
    if (session?.user) {
      // Set user context in Sentry when user logs in
      setSentryUser({
        id: session.user.id as string,
        email: session.user.email || undefined,
        name: session.user.name || undefined,
        staff: session.user.staff ? {
          id: session.user.staff.id,
          role: { title: session.user.staff.role.title }
        } : undefined,
      });
    } else {
      // Clear user context when user logs out
      clearSentryUser();
    }
  }, [session, status]);
  
  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider 
      refetchInterval={0}
      refetchOnWindowFocus={false}
      basePath="/api/auth"
    >
      <SentryUserSync />
      {children}
    </SessionProvider>
  );
} 
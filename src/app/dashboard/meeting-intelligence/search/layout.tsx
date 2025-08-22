import { ReactNode } from 'react';
import { requireAuth } from '@/lib/auth/auth-utils';
import { Capability } from '@/lib/auth/policy';

export default async function Layout({ children }: { children: ReactNode }) {
  await requireAuth({ requireAuth: true, requireCapability: Capability.MEETING_VIEW });
  return <>{children}</>;
}



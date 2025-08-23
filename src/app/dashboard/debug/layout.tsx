import ServerAuthWrapper from '@/components/auth/ServerAuthWrapper';
import type { ReactNode } from 'react';
import { Capability } from '@/lib/auth/policy';

export default async function Layout({ children }: { children: ReactNode }) {
  return (
    <ServerAuthWrapper requirements={{ requireAuth: true, requireCapability: Capability.DEV_DEBUG }}>
      {children}
    </ServerAuthWrapper>
  );
}



import ServerAuthWrapper from '@/components/auth/ServerAuthWrapper';
import type { ReactNode } from 'react';
import { Capability } from '@/lib/auth/policy';

export default async function Layout({ children }: { children: ReactNode }) {
  return (
    <ServerAuthWrapper requirements={{ requireAuth: true, requireCapability: Capability.OPS_HEALTH }}>
      {children}
    </ServerAuthWrapper>
  );
}

import { ReactNode } from 'react';
import { requireAuth } from '@/lib/auth/auth-utils';
import { Capability } from '@/lib/auth/policy';

export default async function Layout({ children }: { children: ReactNode }) {
  await requireAuth({ requireAuth: true, requireCapability: Capability.OPS_HEALTH });
  return <>{children}</>;
}



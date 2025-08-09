import { requireAuth, AuthPresets } from '@/lib/auth/auth-utils';
import { LayoutSettingsClient } from './LayoutSettingsClient';

export default async function LayoutSettingsPage() {
  await requireAuth(AuthPresets.requireAuth);

  return <LayoutSettingsClient />;
}
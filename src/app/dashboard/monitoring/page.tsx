import { requireAuth, AuthPresets } from '@/lib/auth/auth-utils';
import MonitoringClient from './monitoring-client';

export default async function MonitoringPage() {
  // Admin privileges required
  const user = await requireAuth(AuthPresets.requireAdmin);

  return <MonitoringClient />;
}
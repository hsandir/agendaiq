import { requireAuth, AuthPresets } from '@/lib/auth/auth-utils';
import MonitoringClient from './monitoring-client';

export default async function MonitoringPage() {
  // Operations monitoring capability required
  const user = await requireAuth(AuthPresets.requireMonitoring);

  return <MonitoringClient />;
}
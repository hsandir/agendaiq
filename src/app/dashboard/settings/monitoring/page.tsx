import { Metadata } from 'next';
import { requireAuth, AuthPresets } from '@/lib/auth/auth-utils';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Monitoring Settings | AgendaIQ',
  description: 'System monitoring and error tracking settings',
};

export default async function MonitoringSettingsPage() {
  const user = await requireAuth(AuthPresets.requireAdmin);
  
  // Redirect to main monitoring page
  redirect('/dashboard/monitoring');
}
import { requireAuth, AuthPresets } from '@/lib/auth/auth-utils';
import { isTeamV2Enabled } from '@/lib/features';
import { redirect } from 'next/navigation';
import TeamsPageClient from './TeamsPageClient';

export default async function TeamsV2Page() {
  // Check if V2 is enabled
  if (!isTeamV2Enabled()) {
    redirect('/dashboard');
  }

  // Require authentication
  const user = await requireAuth(AuthPresets.requireAuth);
  if (!user) {
    redirect('/auth/login');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Teams (Beta)</h1>
        <p className="text-gray-600 mt-2">
          Manage your teams, projects, and committees
        </p>
      </div>

      <TeamsPageClient userId={user.id} />
    </div>
  );
}
import { Metadata } from 'next';
import { TeamList } from '@/components/teams/TeamList';
import { FEATURES } from '@/lib/features/feature-flags';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Teams | AgendaIQ',
  description: 'Manage and collaborate with your teams',
};

export default function TeamsPage() {
  // Check feature flag
  if (!FEATURES.TEAMS.enabled) {
    redirect('/dashboard');
  }

  return (
    <div className="container mx-auto py-6">
      <TeamList />
    </div>
  );
}
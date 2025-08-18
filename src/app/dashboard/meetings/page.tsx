import { requireAuth, AuthPresets } from '@/lib/auth/auth-utils';
import { redirect } from 'next/navigation';
import MeetingsPageClient from './MeetingsPageClient';

export default async function MeetingsPage() {
  try {
    const user = await requireAuth(AuthPresets.requireAuth);
    return <MeetingsPageClient />;
  } catch (error: unknown) {
    console.error('Authentication error:', error);
    redirect('/dashboard?error=auth_required');
  }
}
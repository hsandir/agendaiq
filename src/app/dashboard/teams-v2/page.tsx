import { requireAuth, AuthPresets } from '@/lib/auth/auth-utils';
import { isTeamV2Enabled } from '@/lib/features';
import { redirect } from 'next/navigation';
import TeamsPageClient from './TeamsPageClient';
import { prismaV2 } from '@/lib/prisma-v2';

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

  // Get user's school ID - first try from Staff relation, then from v2 database
  let schoolId = 1; // Default school ID
  
  if (user.staff?.school_id) {
    schoolId = user.staff.school_id;
  } else {
    // Try to find a school from existing teams
    const memberWithSchool = await prismaV2.teamMember.findFirst({
      where: { user_id: user.id },
      include: {
        team: {
          select: { school_id: true }
        }
      }
    });
    
    if (memberWithSchool?.team.school_id) {
      schoolId = memberWithSchool.team.school_id;
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Teams (Beta)</h1>
        <p className="text-gray-600 mt-2">
          Manage your teams, projects, and committees
        </p>
      </div>

      <TeamsPageClient userId={user.id} schoolId={schoolId} />
    </div>
  );
}
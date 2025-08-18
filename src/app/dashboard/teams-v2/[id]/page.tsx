import { requireAuth, AuthPresets } from '@/lib/auth/auth-utils';
import { isTeamV2Enabled } from '@/lib/features';
import { redirect } from 'next/navigation';
import { prismaV2 } from '@/lib/prisma-v2';
import TeamDetailClient from './TeamDetailClient';

export default async function TeamDetailPage({
  params,
}: {
  params: { id: string };
}) {
  // Check if V2 is enabled
  if (!isTeamV2Enabled()) {
    redirect('/dashboard');
  }

  // Require authentication
  const user = await requireAuth(AuthPresets.requireAuth);
  if (!user) {
    redirect('/auth/login');
  }

  // Check if user is team member
  const member = await prismaV2.teamMember.findFirst({
    where: {
      team_id: params.id,
      user_id: user.id,
    },
  });

  if (!member) {
    redirect('/dashboard/teams-v2');
  }

  // Fetch team data
  const team = await prismaV2.team.findUnique({
    where: { id: params.id },
    include: {
      school: true,
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
        orderBy: [
          { role: 'asc' },
          { joined_at: 'asc' },
        ],
      },
      notes: {
        include: {
          creator: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
      },
      meetings: {
        orderBy: { start_time: 'desc' },
        take: 10,
      },
      _count: {
        select: {
          meetings: true,
          notes: true,
          members: true,
        },
      },
    },
  });

  if (!team) {
    redirect('/dashboard/teams-v2');
  }

  return (
    <TeamDetailClient
      team={team}
      currentUserId={user.id}
      isLead={member.role === 'LEAD'}
    />
  );
}
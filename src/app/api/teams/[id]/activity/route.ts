import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-auth';
import { Capability } from '@/lib/auth/policy';
import { FEATURES } from '@/lib/features/feature-flags';
import { prisma } from '@/lib/prisma';

interface Props {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, props: Props) {
  const params = await props.params;
  
  try {
    // Check feature flag
    if (!FEATURES.TEAMS.enabled) {
      return NextResponse.json(
        { error: 'Teams feature is not enabled' },
        { status: 404 }
      );
    }
    const authResult = await withAuth(request, {
      requireAuth: true,
      requireCapability: Capability.MEETINGS_VIEW
    });
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.statusCode }
      );
    }

    const teamId = params.id;

    // Get team activity from multiple sources
    const [
      teamMembers,
      teamKnowledge,
      recentUpdates
    ] = await Promise.all([
      // Recent team member joins
      prisma.team_members.findMany({
        where: { team_id: teamId },
        include: {
          staff: {
            include: {
              users: {
                select: { id: true, name: true, email: true, image: true }
              },
              role: {
                select: { title: true }
              }
            }
          }
        },
        orderBy: { joined_at: 'desc' },
        take: 20
      }),
      
      // Recent knowledge additions
      prisma.team_knowledge.findMany({
        where: { team_id: teamId },
        include: {
          staff: {
            include: {
              users: {
                select: { id: true, name: true, email: true, image: true }
              }
            }
          }
        },
        orderBy: { created_at: 'desc' },
        take: 20
      }),
      
      // Team updates (when metadata changes etc.)
      prisma.teams.findUnique({
        where: { id: teamId },
        select: {
          updated_at: true,
          created_at: true,
          name: true
        }
      })
    ]);

    // Combine all activities and sort by date
    const activities = [
      // Member joins
      ...teamMembers.map(member => ({
        id: `member-${member.id}`,
        type: 'member_joined',
        timestamp: member.joined_at,
        user: {
          id: member.staff.users.id,
          name: member.staff.users.name,
          email: member.staff.users.email,
          image: member.staff.users.image
        },
        data: {
          role: member.role,
          staff_role: member.staff.role.title
        }
      })),
      
      // Knowledge additions
      ...teamKnowledge.map(knowledge => ({
        id: `knowledge-${knowledge.id}`,
        type: 'knowledge_added',
        timestamp: knowledge.created_at,
        user: {
          id: knowledge.created_by_staff?.users.id,
          name: knowledge.created_by_staff?.users.name,
          email: knowledge.created_by_staff?.users.email,
          image: knowledge.created_by_staff?.users.image
        },
        data: {
          title: knowledge.title,
          type: knowledge.type,
          id: knowledge.id
        }
      })),
      
      // Team creation
      ...(recentUpdates ? [{
        id: `team-created`,
        type: 'team_created',
        timestamp: recentUpdates.created_at,
        user: null, // System event
        data: {
          team_name: recentUpdates.name
        }
      }] : [])
    ];

    // Sort by timestamp (newest first) and take last 50
    const sortedActivities = activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 50);

    return NextResponse.json({
      activities: sortedActivities,
      total: sortedActivities.length
    });

  } catch (error: unknown) {
    console.error('Error fetching team activity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team activity' },
      { status: 500 }
    );
  }
}
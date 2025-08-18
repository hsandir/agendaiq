/**
 * Single Team V2 API - GET, PUT, DELETE
 */

import { NextRequest, NextResponse } from 'next/server';
import { prismaV2 } from '@/lib/prisma-v2';
import { requireAuth, AuthPresets } from '@/lib/auth/auth-utils';
import { isTeamV2Enabled } from '@/lib/features';
import { z } from 'zod';

// Check if V2 is enabled
if (!isTeamV2Enabled()) {
  export async function GET() {
    return NextResponse.json({ error: 'Feature not enabled' }, { status: 404 });
  }
  export async function PUT() {
    return NextResponse.json({ error: 'Feature not enabled' }, { status: 404 });
  }
  export async function DELETE() {
    return NextResponse.json({ error: 'Feature not enabled' }, { status: 404 });
  }
} else {
  // Helper to check if user is team member
  async function isTeamMember(teamId: string, userId: number) {
    const member = await prismaV2.teamMember.findFirst({
      where: {
        team_id: teamId,
        user_id: userId
      }
    });
    return member;
  }

  // GET /api/teams-v2/[id] - Get single team
  export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
  ) {
    try {
      const user = await requireAuth(AuthPresets.requireAuth);
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Check if user is team member
      const member = await isTeamMember(params.id, user.id);
      if (!member) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }

      // Fetch team
      const team = await prismaV2.team.findUnique({
        where: { id: params.id },
        include: {
          school: true,
          creator: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          },
          notes: {
            orderBy: { created_at: 'desc' },
            take: 10
          },
          meetings: {
            orderBy: { start_time: 'desc' },
            take: 5
          },
          _count: {
            select: {
              meetings: true,
              notes: true,
              members: true
            }
          }
        }
      });

      if (!team) {
        return NextResponse.json({ error: 'Team not found' }, { status: 404 });
      }

      return NextResponse.json(team);
    } catch (error) {
      console.error('Error fetching team:', error);
      return NextResponse.json(
        { error: 'Failed to fetch team' },
        { status: 500 }
      );
    }
  }

  // PUT /api/teams-v2/[id] - Update team
  export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
  ) {
    try {
      const user = await requireAuth(AuthPresets.requireAuth);
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Check if user is team LEAD
      const member = await isTeamMember(params.id, user.id);
      if (!member || member.role !== 'LEAD') {
        return NextResponse.json(
          { error: 'Only team lead can update team' },
          { status: 403 }
        );
      }

      // Validate input
      const updateTeamSchema = z.object({
        name: z.string().min(1).max(100).optional(),
        purpose: z.string().min(1).optional(),
        status: z.enum(['ACTIVE', 'ARCHIVED']).optional(),
        end_date: z.string().datetime().optional()
      });

      const body = await request.json();
      const validation = updateTeamSchema.safeParse(body);

      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid input', details: validation.error.errors },
          { status: 400 }
        );
      }

      const data = validation.data;

      // Update team
      const team = await prismaV2.team.update({
        where: { id: params.id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.purpose && { purpose: data.purpose }),
          ...(data.status && { status: data.status }),
          ...(data.end_date && { end_date: new Date(data.end_date) })
        },
        include: {
          school: true,
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      });

      return NextResponse.json(team);
    } catch (error) {
      console.error('Error updating team:', error);
      return NextResponse.json(
        { error: 'Failed to update team' },
        { status: 500 }
      );
    }
  }

  // DELETE /api/teams-v2/[id] - Archive team (soft delete)
  export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
  ) {
    try {
      const user = await requireAuth(AuthPresets.requireAuth);
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Check if user is team LEAD
      const member = await isTeamMember(params.id, user.id);
      if (!member || member.role !== 'LEAD') {
        return NextResponse.json(
          { error: 'Only team lead can archive team' },
          { status: 403 }
        );
      }

      // Archive team (soft delete)
      await prismaV2.team.update({
        where: { id: params.id },
        data: {
          status: 'ARCHIVED',
          end_date: new Date()
        }
      });

      return NextResponse.json({ message: 'Team archived successfully' });
    } catch (error) {
      console.error('Error archiving team:', error);
      return NextResponse.json(
        { error: 'Failed to archive team' },
        { status: 500 }
      );
    }
  }
}
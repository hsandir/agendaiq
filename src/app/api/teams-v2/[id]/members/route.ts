/**
 * Team Members V2 API - Add/Remove members
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
  export async function POST() {
    return NextResponse.json({ error: 'Feature not enabled' }, { status: 404 });
  }
  export async function DELETE() {
    return NextResponse.json({ error: 'Feature not enabled' }, { status: 404 });
  }
} else {
  // Helper to check if user is team LEAD
  async function isTeamLead(teamId: string, userId: number) {
    const member = await prismaV2.teamMember.findFirst({
      where: {
        team_id: teamId,
        user_id: userId,
        role: 'LEAD'
      }
    });
    return !!member;
  }

  // GET /api/teams-v2/[id]/members - List team members
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
      const isMember = await prismaV2.teamMember.findFirst({
        where: {
          team_id: params.id,
          user_id: user.id
        }
      });

      if (!isMember) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }

      // Fetch members
      const members = await prismaV2.teamMember.findMany({
        where: { team_id: params.id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              Staff: {
                select: {
                  id: true,
                  Role: {
                    select: {
                      title: true
                    }
                  },
                  Department: {
                    select: {
                      name: true
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: [
          { role: 'asc' },
          { joined_at: 'asc' }
        ]
      });

      return NextResponse.json(members);
    } catch (error) {
      console.error('Error fetching members:', error);
      return NextResponse.json(
        { error: 'Failed to fetch members' },
        { status: 500 }
      );
    }
  }

  // POST /api/teams-v2/[id]/members - Add member
  export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
  ) {
    try {
      const user = await requireAuth(AuthPresets.requireAuth);
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Check if user is team LEAD
      const isLead = await isTeamLead(params.id, user.id);
      if (!isLead) {
        return NextResponse.json(
          { error: 'Only team lead can add members' },
          { status: 403 }
        );
      }

      // Validate input
      const addMemberSchema = z.object({
        user_id: z.number().positive(),
        role: z.enum(['LEAD', 'MEMBER']).default('MEMBER')
      });

      const body = await request.json();
      const validation = addMemberSchema.safeParse(body);

      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid input', details: validation.error.errors },
          { status: 400 }
        );
      }

      const data = validation.data;

      // Check if user exists
      const userExists = await prismaV2.user.findUnique({
        where: { id: data.user_id }
      });

      if (!userExists) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      // Check if already member
      const existingMember = await prismaV2.teamMember.findFirst({
        where: {
          team_id: params.id,
          user_id: data.user_id
        }
      });

      if (existingMember) {
        return NextResponse.json(
          { error: 'User is already a team member' },
          { status: 400 }
        );
      }

      // Add member
      const member = await prismaV2.teamMember.create({
        data: {
          team_id: params.id,
          user_id: data.user_id,
          role: data.role
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      return NextResponse.json(member, { status: 201 });
    } catch (error) {
      console.error('Error adding member:', error);
      return NextResponse.json(
        { error: 'Failed to add member' },
        { status: 500 }
      );
    }
  }

  // DELETE /api/teams-v2/[id]/members - Remove member
  export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
  ) {
    try {
      const user = await requireAuth(AuthPresets.requireAuth);
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Get member ID to remove from query
      const searchParams = request.nextUrl.searchParams;
      const memberUserId = searchParams.get('userId');

      if (!memberUserId) {
        return NextResponse.json(
          { error: 'User ID required' },
          { status: 400 }
        );
      }

      const userIdToRemove = parseInt(memberUserId);

      // Check if user is team LEAD or removing themselves
      const isLead = await isTeamLead(params.id, user.id);
      const isSelf = userIdToRemove === user.id;

      if (!isLead && !isSelf) {
        return NextResponse.json(
          { error: 'Only team lead can remove members' },
          { status: 403 }
        );
      }

      // Check if member exists
      const member = await prismaV2.teamMember.findFirst({
        where: {
          team_id: params.id,
          user_id: userIdToRemove
        }
      });

      if (!member) {
        return NextResponse.json(
          { error: 'Member not found' },
          { status: 404 }
        );
      }

      // Prevent removing last LEAD
      if (member.role === 'LEAD') {
        const leadCount = await prismaV2.teamMember.count({
          where: {
            team_id: params.id,
            role: 'LEAD'
          }
        });

        if (leadCount <= 1) {
          return NextResponse.json(
            { error: 'Cannot remove last team lead' },
            { status: 400 }
          );
        }
      }

      // Remove member
      await prismaV2.teamMember.delete({
        where: { id: member.id }
      });

      return NextResponse.json({ message: 'Member removed successfully' });
    } catch (error) {
      console.error('Error removing member:', error);
      return NextResponse.json(
        { error: 'Failed to remove member' },
        { status: 500 }
      );
    }
  }
}
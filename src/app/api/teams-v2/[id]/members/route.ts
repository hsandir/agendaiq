/**
 * Team Members API - V2
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
  // GET /api/teams-v2/[id]/members - List team members
  export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
  ) {
    try {
      // Require authentication
      const user = await requireAuth(AuthPresets.requireAuth);
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Check if user is a member of the team
      const member = await prismaV2.teamMember.findFirst({
        where: {
          team_id: params.id,
          user_id: user.id
        }
      });

      if (!member) {
        return NextResponse.json({ error: 'Not a team member' }, { status: 403 });
      }

      // Fetch all team members
      const members = await prismaV2.teamMember.findMany({
        where: { team_id: params.id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true
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
      console.error('Error fetching team members:', error);
      return NextResponse.json(
        { error: 'Failed to fetch team members' },
        { status: 500 }
      );
    }
  }

  // POST /api/teams-v2/[id]/members - Add team member
  export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
  ) {
    try {
      // Require authentication
      const user = await requireAuth(AuthPresets.requireAuth);
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Check if user is a LEAD of the team
      const currentMember = await prismaV2.teamMember.findFirst({
        where: {
          team_id: params.id,
          user_id: user.id,
          role: 'LEAD'
        }
      });

      if (!currentMember) {
        return NextResponse.json({ error: 'Only team leads can add members' }, { status: 403 });
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

      // Check if user is already a member
      const existingMember = await prismaV2.teamMember.findFirst({
        where: {
          team_id: params.id,
          user_id: data.user_id
        }
      });

      if (existingMember) {
        return NextResponse.json({ error: 'User is already a team member' }, { status: 400 });
      }

      // Add new member
      const newMember = await prismaV2.teamMember.create({
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

      return NextResponse.json(newMember, { status: 201 });
    } catch (error) {
      console.error('Error adding team member:', error);
      return NextResponse.json(
        { error: 'Failed to add team member' },
        { status: 500 }
      );
    }
  }

  // DELETE /api/teams-v2/[id]/members - Remove team member
  export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
  ) {
    try {
      // Require authentication
      const user = await requireAuth(AuthPresets.requireAuth);
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Get user_id from query params
      const searchParams = request.nextUrl.searchParams;
      const userIdToRemove = searchParams.get('user_id');

      if (!userIdToRemove) {
        return NextResponse.json({ error: 'User ID required' }, { status: 400 });
      }

      // Check if current user is a LEAD of the team
      const currentMember = await prismaV2.teamMember.findFirst({
        where: {
          team_id: params.id,
          user_id: user.id,
          role: 'LEAD'
        }
      });

      // Users can remove themselves, or leads can remove anyone
      const isSelfRemoval = user.id === parseInt(userIdToRemove);
      if (!currentMember && !isSelfRemoval) {
        return NextResponse.json({ error: 'Only team leads can remove members' }, { status: 403 });
      }

      // Remove member
      await prismaV2.teamMember.delete({
        where: {
          team_id_user_id: {
            team_id: params.id,
            user_id: parseInt(userIdToRemove)
          }
        }
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error removing team member:', error);
      return NextResponse.json(
        { error: 'Failed to remove team member' },
        { status: 500 }
      );
    }
  }
}
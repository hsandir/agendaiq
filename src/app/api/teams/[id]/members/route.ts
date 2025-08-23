import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth/api-auth';
import { Capability } from '@/lib/auth/policy';
import { z } from 'zod';
import { FEATURES } from '@/lib/features/feature-flags';

// Member addition schema
const addMemberSchema = z.object({
  staff_id: z.number(),
  role: z.enum(['MEMBER', 'LEAD']).default('MEMBER'),
});

// Member update schema
const updateMemberSchema = z.object({
  role: z.enum(['MEMBER', 'LEAD']),
});

/**
 * GET /api/teams/[id]/members
 * Get all members of a specific team
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check feature flag
    if (!FEATURES.TEAMS.enabled) {
      return NextResponse.json(
        { error: 'Teams feature is not enabled' },
        { status: 404 }
      );
    }

    const auth = await withAuth(request, { 
      requireAuth: true,
      requireCapability: Capability.MEETINGS_VIEW 
    });
    
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.statusCode });
    }

    const { user } = auth;
    const teamId = params.id;

    // Check if team exists
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        team_members: {
          include: {
            staff: {
              include: {
                users: true,
                role: true,
                department: true,
                school: true
              }
            }
          }
        }
      }
    });

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    // Get user's staff record
    const staff = await prisma.staff.findFirst({
      where: { user_id: user.id }
    });

    if (!staff) {
      return NextResponse.json(
        { error: 'Staff record not found' },
        { status: 404 }
      );
    }

    // Check if user has access to view team members
    const isMember = team.team_members.some(member => member.staff_id === staff.id);
    const isAdmin = user.is_system_admin || user.is_school_admin;

    if (!isMember && !isAdmin) {
      return NextResponse.json(
        { error: 'You do not have permission to view this team\'s members' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      members: team.team_members,
      total: team.team_members.length
    });

  } catch (error) {
    console.error('Error fetching team members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team members' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/teams/[id]/members
 * Add a new member to a team
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check feature flag
    if (!FEATURES.TEAMS.enabled) {
      return NextResponse.json(
        { error: 'Teams feature is not enabled' },
        { status: 404 }
      );
    }

    const auth = await withAuth(request, { 
      requireAuth: true,
      requireCapability: Capability.MEETINGS_UPDATE 
    });
    
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.statusCode });
    }

    const { user } = auth;
    const teamId = params.id;

    // Parse and validate request body
    const body = await request.json();
    const validatedData = addMemberSchema.parse(body);

    // Get user's staff record
    const staff = await prisma.staff.findFirst({
      where: { user_id: user.id }
    });

    if (!staff) {
      return NextResponse.json(
        { error: 'Staff record not found' },
        { status: 404 }
      );
    }

    // Check if team exists
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        team_members: true
      }
    });

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    // Check if user is team lead or admin
    const isTeamLead = team.team_members.some(
      member => member.staff_id === staff.id && member.role === 'LEAD'
    );

    if (!isTeamLead && !user.is_system_admin && !user.is_school_admin) {
      return NextResponse.json(
        { error: 'You do not have permission to add members to this team' },
        { status: 403 }
      );
    }

    // Check if staff to be added exists
    const staffToAdd = await prisma.staff.findUnique({
      where: { id: validatedData.staff_id }
    });

    if (!staffToAdd) {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      );
    }

    // Check if member already exists
    const existingMember = team.team_members.find(
      member => member.staff_id === validatedData.staff_id
    );

    if (existingMember) {
      return NextResponse.json(
        { error: 'Staff member is already in the team' },
        { status: 409 }
      );
    }

    // Add the member
    const newMember = await prisma.teamMember.create({
      data: {
        team_id: teamId,
        staff_id: validatedData.staff_id,
        role: validatedData.role,
        joined_at: new Date()
      },
      include: {
        staff: {
          include: {
            users: true,
            role: true,
            department: true,
            school: true
          }
        }
      }
    });

    return NextResponse.json({
      member: newMember,
      message: 'Member added successfully'
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error adding team member:', error);
    return NextResponse.json(
      { error: 'Failed to add team member' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/teams/[id]/members
 * Update a team member's role
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check feature flag
    if (!FEATURES.TEAMS.enabled) {
      return NextResponse.json(
        { error: 'Teams feature is not enabled' },
        { status: 404 }
      );
    }

    const auth = await withAuth(request, { 
      requireAuth: true,
      requireCapability: Capability.MEETINGS_UPDATE 
    });
    
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.statusCode });
    }

    const { user } = auth;
    const teamId = params.id;

    // Get member ID from query params
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('member_id');

    if (!memberId) {
      return NextResponse.json(
        { error: 'Member ID is required' },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateMemberSchema.parse(body);

    // Get user's staff record
    const staff = await prisma.staff.findFirst({
      where: { user_id: user.id }
    });

    if (!staff) {
      return NextResponse.json(
        { error: 'Staff record not found' },
        { status: 404 }
      );
    }

    // Check if team and member exist
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        team_id: teamId,
        id: parseInt(memberId)
      },
      include: {
        team: {
          include: {
            team_members: true
          }
        }
      }
    });

    if (!teamMember) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      );
    }

    // Check if user is team lead or admin
    const isTeamLead = teamMember.team.team_members.some(
      member => member.staff_id === staff.id && member.role === 'LEAD'
    );

    if (!isTeamLead && !user.is_system_admin && !user.is_school_admin) {
      return NextResponse.json(
        { error: 'You do not have permission to update team members' },
        { status: 403 }
      );
    }

    // Prevent removing the last lead
    if (teamMember.role === 'LEAD' && validatedData.role === 'MEMBER') {
      const leadCount = teamMember.team.team_members.filter(m => m.role === 'LEAD').length;
      if (leadCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot remove the last team lead' },
          { status: 400 }
        );
      }
    }

    // Update the member
    const updatedMember = await prisma.teamMember.update({
      where: { id: parseInt(memberId) },
      data: {
        role: validatedData.role
      },
      include: {
        staff: {
          include: {
            users: true,
            role: true,
            department: true,
            school: true
          }
        }
      }
    });

    return NextResponse.json({
      member: updatedMember,
      message: 'Member updated successfully'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating team member:', error);
    return NextResponse.json(
      { error: 'Failed to update team member' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/teams/[id]/members
 * Remove a member from a team
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check feature flag
    if (!FEATURES.TEAMS.enabled) {
      return NextResponse.json(
        { error: 'Teams feature is not enabled' },
        { status: 404 }
      );
    }

    const auth = await withAuth(request, { 
      requireAuth: true,
      requireCapability: Capability.MEETINGS_UPDATE 
    });
    
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.statusCode });
    }

    const { user } = auth;
    const teamId = params.id;

    // Get member ID from query params
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('member_id');

    if (!memberId) {
      return NextResponse.json(
        { error: 'Member ID is required' },
        { status: 400 }
      );
    }

    // Get user's staff record
    const staff = await prisma.staff.findFirst({
      where: { user_id: user.id }
    });

    if (!staff) {
      return NextResponse.json(
        { error: 'Staff record not found' },
        { status: 404 }
      );
    }

    // Check if team and member exist
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        team_id: teamId,
        id: parseInt(memberId)
      },
      include: {
        team: {
          include: {
            team_members: true
          }
        }
      }
    });

    if (!teamMember) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      );
    }

    // Check if user is team lead or admin (or removing themselves)
    const isTeamLead = teamMember.team.team_members.some(
      member => member.staff_id === staff.id && member.role === 'LEAD'
    );
    const isRemovingSelf = teamMember.staff_id === staff.id;

    if (!isTeamLead && !isRemovingSelf && !user.is_system_admin && !user.is_school_admin) {
      return NextResponse.json(
        { error: 'You do not have permission to remove team members' },
        { status: 403 }
      );
    }

    // Prevent removing the last lead
    if (teamMember.role === 'LEAD') {
      const leadCount = teamMember.team.team_members.filter(m => m.role === 'LEAD').length;
      if (leadCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot remove the last team lead' },
          { status: 400 }
        );
      }
    }

    // Remove the member
    await prisma.teamMember.delete({
      where: { id: parseInt(memberId) }
    });

    return NextResponse.json({
      message: 'Member removed successfully'
    });

  } catch (error) {
    console.error('Error removing team member:', error);
    return NextResponse.json(
      { error: 'Failed to remove team member' },
      { status: 500 }
    );
  }
}
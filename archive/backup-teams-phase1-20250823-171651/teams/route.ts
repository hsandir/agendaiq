import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth/api-auth';
import { Capability } from '@/lib/auth/policy';
import { z } from 'zod';
import { FEATURES } from '@/lib/features/feature-flags';

// Team creation schema
const createTeamSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  type: z.enum(['DEPARTMENT', 'PROJECT', 'COMMITTEE', 'SUBJECT', 'GRADE_LEVEL', 'SPECIAL']),
  metadata: z.record(z.unknown()).optional(),
});

// Team update schema
const updateTeamSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  is_active: z.boolean().optional(),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * GET /api/teams
 * Get all teams for the current user's organization
 */
export async function GET(request: NextRequest) {
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

    // Get user's organization context
    const staff = await prisma.staff.findFirst({
      where: { user_id: user.id },
      include: {
        school: true,
        district: true,
      }
    });

    if (!staff) {
      return NextResponse.json(
        { error: 'Staff record not found' },
        { status: 404 }
      );
    }

    // Fetch teams based on user's organization level
    const teams = await prisma.team.findMany({
      where: {
        OR: [
          { school_id: staff.school_id },
          { district_id: staff.district_id }
        ],
        is_active: true
      },
      include: {
        team_members: {
          include: {
            staff: {
              include: {
                users: true,
                role: true
              }
            }
          }
        },
        _count: {
          select: {
            team_members: true,
            team_knowledge: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    // Filter teams where user is a member or has view permissions
    const userTeams = teams.filter(team => {
      // Check if user is a team member
      const isMember = team.team_members.some(member => member.staff_id === staff.id);
      
      // Admins can see all teams
      const isAdmin = user.is_system_admin || user.is_school_admin;
      
      return isMember || isAdmin;
    });

    return NextResponse.json({
      teams: userTeams,
      total: userTeams.length
    });

  } catch (error) {
    console.error('Error fetching teams:', error);
    return NextResponse.json(
      { error: 'Failed to fetch teams' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/teams
 * Create a new team
 */
export async function POST(request: NextRequest) {
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
      requireCapability: Capability.MEETINGS_CREATE 
    });
    
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.statusCode });
    }

    const { user } = auth;

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createTeamSchema.parse(body);

    // Get user's organization context
    const staff = await prisma.staff.findFirst({
      where: { user_id: user.id },
      include: {
        school: true,
        district: true,
        role: true
      }
    });

    if (!staff) {
      return NextResponse.json(
        { error: 'Staff record not found' },
        { status: 404 }
      );
    }

    // Only leadership or admins can create teams
    if (!staff.role.is_leadership && !user.is_system_admin && !user.is_school_admin) {
      return NextResponse.json(
        { error: 'You do not have permission to create teams' },
        { status: 403 }
      );
    }

    // Create the team with a transaction
    const team = await prisma.$transaction(async (tx) => {
      // Create the team
      const newTeam = await tx.team.create({
        data: {
          name: validatedData.name,
          description: validatedData.description,
          type: validatedData.type,
          school_id: staff.school_id,
          district_id: staff.district_id,
          created_by: user.id,
          metadata: validatedData.metadata || {},
          is_active: true
        }
      });

      // Add the creator as a team lead
      await tx.teamMember.create({
        data: {
          team_id: newTeam.id,
          staff_id: staff.id,
          role: 'LEAD',
          joined_at: new Date()
        }
      });

      return newTeam;
    });

    // Fetch the complete team with relations
    const completeTeam = await prisma.team.findUnique({
      where: { id: team.id },
      include: {
        team_members: {
          include: {
            staff: {
              include: {
                users: true,
                role: true
              }
            }
          }
        },
        _count: {
          select: {
            team_members: true,
            team_knowledge: true
          }
        }
      }
    });

    return NextResponse.json({
      team: completeTeam,
      message: 'Team created successfully'
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating team:', error);
    return NextResponse.json(
      { error: 'Failed to create team' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/teams
 * Update a team
 */
export async function PUT(request: NextRequest) {
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

    // Get team ID from query params
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('id');

    if (!teamId) {
      return NextResponse.json(
        { error: 'Team ID is required' },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateTeamSchema.parse(body);

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

    // Check if team exists and user has permission
    const team = await prisma.team.findUnique({
      where: { id: parseInt(teamId) },
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
        { error: 'You do not have permission to update this team' },
        { status: 403 }
      );
    }

    // Update the team
    const updatedTeam = await prisma.team.update({
      where: { id: parseInt(teamId) },
      data: {
        ...(validatedData.name && { name: validatedData.name }),
        ...(validatedData.description !== undefined && { description: validatedData.description }),
        ...(validatedData.is_active !== undefined && { is_active: validatedData.is_active }),
        ...(validatedData.metadata && { metadata: validatedData.metadata }),
        updated_at: new Date()
      },
      include: {
        team_members: {
          include: {
            staff: {
              include: {
                users: true,
                role: true
              }
            }
          }
        },
        _count: {
          select: {
            team_members: true,
            team_knowledge: true
          }
        }
      }
    });

    return NextResponse.json({
      team: updatedTeam,
      message: 'Team updated successfully'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating team:', error);
    return NextResponse.json(
      { error: 'Failed to update team' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/teams
 * Delete (soft delete) a team
 */
export async function DELETE(request: NextRequest) {
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
      requireCapability: Capability.MEETINGS_DELETE 
    });
    
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.statusCode });
    }

    const { user } = auth;

    // Get team ID from query params
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('id');

    if (!teamId) {
      return NextResponse.json(
        { error: 'Team ID is required' },
        { status: 400 }
      );
    }

    // Only admins can delete teams
    if (!user.is_system_admin && !user.is_school_admin) {
      return NextResponse.json(
        { error: 'You do not have permission to delete teams' },
        { status: 403 }
      );
    }

    // Check if team exists
    const team = await prisma.team.findUnique({
      where: { id: parseInt(teamId) }
    });

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    // Soft delete the team
    await prisma.team.update({
      where: { id: parseInt(teamId) },
      data: {
        is_active: false,
        updated_at: new Date()
      }
    });

    return NextResponse.json({
      message: 'Team deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting team:', error);
    return NextResponse.json(
      { error: 'Failed to delete team' },
      { status: 500 }
    );
  }
}
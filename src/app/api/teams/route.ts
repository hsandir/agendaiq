import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, type APIAuthResult } from '@/lib/auth/api-auth';
import { Capability } from '@/lib/auth/policy';
import { z } from 'zod';
import { FEATURES } from '@/lib/features/feature-flags';
import { randomBytes } from 'crypto';

// Team creation schema
const createTeamSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  type: z.enum(['DEPARTMENT', 'PROJECT', 'COMMITTEE', 'SUBJECT', 'GRADE_LEVEL', 'SPECIAL']),
  purpose: z.string().min(1).max(500),
  initial_members: z.array(z.number()).optional(),
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

     
    const auth: APIAuthResult = await withAuth(request, { 
      requireAuth: true,
      requireCapability: Capability.MEETING_VIEW 
    });
    
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.statusCode });
    }

    const { user } = auth;

    // Get user's organization context
    const staff = await prisma.staff.findFirst({
      where: { user_id: user?.id ?? 0 },
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
    const teams = await prisma.teams.findMany({
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
      const isAdmin = user?.is_system_admin ?? (user as unknown as Record<string, unknown>)?.is_school_admin;
      
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

     
    const auth: APIAuthResult = await withAuth(request, { 
      requireAuth: true,
      requireCapability: Capability.MEETING_CREATE 
    });
    
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.statusCode });
    }

    const { user } = auth;

    // Parse and validate request body
    const body = await request.json() as Record<string, unknown>;
    const validatedData = createTeamSchema.parse(body);

    // Get user's organization context
    const staff = await prisma.staff.findFirst({
      where: { user_id: user?.id ?? 0 },
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
    if (!staff.role.is_leadership && !user?.is_system_admin && !(user as unknown as Record<string, unknown>)?.is_school_admin) {
      return NextResponse.json(
        { error: 'You do not have permission to create teams' },
        { status: 403 }
      );
    }

    // Create the team with a transaction
    const team = await prisma.$transaction(async (tx) => {
      // Generate unique ID and code for the team
      const teamId = randomBytes(16).toString('hex');
      const teamCode = `TEAM_${Date.now()}_${randomBytes(4).toString('hex').toUpperCase()}`;

      // Create the team
      const newTeam = await tx.teams.create({
        data: {
          id: teamId,
          name: validatedData.name,
          code: teamCode,
          description: validatedData.description,
          type: validatedData.type,
          purpose: validatedData.purpose,
          school_id: staff.school_id,
          district_id: staff.district_id,
          created_by: user?.id ?? 0,
          metadata: (validatedData.metadata ?? {}) as any,
          is_active: true,
          updated_at: new Date()
        } as any
      });

      // Add the creator as a team lead
      await tx.team_members.create({
        data: {
          id: randomBytes(16).toString('hex'),
          team_id: newTeam.id,
          user_id: user?.id ?? 0,
          staff_id: staff.id,
          role: 'LEAD',
          joined_at: new Date()
        }
      });

      // Add initial members if provided
      if (validatedData.initial_members && validatedData.initial_members.length > 0) {
        // Get staff records for the provided staff IDs
        const staffRecords = await tx.staff.findMany({
          where: {
            id: { in: validatedData.initial_members },
            // Ensure they're from the same organization
            OR: [
              { school_id: staff.school_id },
              { district_id: staff.district_id }
            ]
          },
          include: {
            users: true
          }
        });

        // Create team memberships for initial members
        const membershipPromises = staffRecords.map(async (memberStaff) => {
          // Skip if this staff member is already the creator/lead
          if (memberStaff.id === staff.id) return;

          return tx.team_members.create({
            data: {
              id: randomBytes(16).toString('hex'),
              team_id: newTeam.id,
              user_id: memberStaff.users.id,
              staff_id: memberStaff.id,
              role: 'MEMBER',
              joined_at: new Date()
            }
          });
        });

        await Promise.all(membershipPromises.filter(Boolean));
      }

      return newTeam;
    });

    // Fetch the complete team with relations
    const completeTeam = await prisma.teams.findUnique({
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

     
    const auth: APIAuthResult = await withAuth(request, { 
      requireAuth: true,
      requireCapability: Capability.MEETING_EDIT 
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
    const body = await request.json() as Record<string, unknown>;
    const validatedData = updateTeamSchema.parse(body);

    // Get user's staff record
    const staff = await prisma.staff.findFirst({
      where: { user_id: user?.id ?? 0 }
    });

    if (!staff) {
      return NextResponse.json(
        { error: 'Staff record not found' },
        { status: 404 }
      );
    }

    // Check if team exists and user has permission
    const team = await prisma.teams.findUnique({
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

    if (!isTeamLead && !user?.is_system_admin && !((user as unknown as Record<string, unknown>)?.is_school_admin)) {
      return NextResponse.json(
        { error: 'You do not have permission to update this team' },
        { status: 403 }
      );
    }

    // Update the team
    const updatedTeam = await prisma.teams.update({
      where: { id: teamId },
      data: {
        ...(validatedData.name && { name: validatedData.name }),
        ...(validatedData.description !== undefined && { description: validatedData.description }),
        ...(validatedData.is_active !== undefined && { is_active: validatedData.is_active }),
        ...(validatedData.metadata && { metadata: validatedData.metadata as any }),
        updated_at: new Date()
      } as any,
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

     
    const auth: APIAuthResult = await withAuth(request, { 
      requireAuth: true,
      requireCapability: Capability.MEETING_DELETE 
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
    if (!user?.is_system_admin && !((user as unknown as Record<string, unknown>)?.is_school_admin)) {
      return NextResponse.json(
        { error: 'You do not have permission to delete teams' },
        { status: 403 }
      );
    }

    // Check if team exists
    const team = await prisma.teams.findUnique({
      where: { id: teamId }
    });

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    // Soft delete the team
    await prisma.teams.update({
      where: { id: teamId },
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
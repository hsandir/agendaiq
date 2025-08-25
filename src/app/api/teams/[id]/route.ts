import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth/api-auth';
import { Capability } from '@/lib/auth/policy';
import { z } from 'zod';
import { FEATURES } from '@/lib/features/feature-flags';

/**
 * GET /api/teams/[id]
 * Get a specific team by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { _user } = auth;
    const resolvedParams = await params;
    const teamId = resolvedParams.id;

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

    // Fetch team with all relations
    const team = await prisma.teams.findUnique({
      where: { id: teamId },
      include: {
        team_members: {
          include: {
            staff: {
              include: {
                users: true,
                role: true,
                department: true
              }
            }
          }
        },
        team_knowledge: {
          include: {
            users: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true
              }
            }
          },
          orderBy: {
            created_at: 'desc'
          }
        },
        _count: {
          select: {
            team_members: true,
            team_knowledge: true
          }
        },
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        school: true,
        district: true,
        department: true
      }
    });

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this team
    const isMember = team.team_members.some(member => member.staff_id === staff.id);
    const isAdmin = user.is_system_admin || (user as Record<string, unknown>).is_school_admin;

    if (!isMember && !isAdmin) {
      return NextResponse.json(
        { error: 'You do not have permission to view this team' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      team
    });

  } catch (error) {
    console.error('Error fetching team:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/teams/[id]
 * Update a specific team
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { _user } = auth;
    const resolvedParams = await params;
    const teamId = resolvedParams.id;

    // Parse request body
    const body = await request.json() as Record<string, unknown>;
    
    const updateSchema = z.object({
      name: z.string().min(1).max(100).optional(),
      description: z.string().max(500).optional(),
      is_active: z.boolean().optional(),
      metadata: z.record(z.unknown()).optional(),
    });

    const validatedData = updateSchema.parse(body);

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

    if (!isTeamLead && !user.is_system_admin && !(user as Record<string, unknown>).is_school_admin) {
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
        ...(validatedData.metadata && { metadata: validatedData.metadata }),
        updated_at: new Date();
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
 * DELETE /api/teams/[id]
 * Delete (soft delete) a specific team
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
      requireCapability: Capability.MEETINGS_DELETE 
    });
    
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.statusCode });
    }

    const { _user } = auth;
    const resolvedParams = await params;
    const teamId = resolvedParams.id;

    // Only admins can delete teams
    if (!user.is_system_admin && !(user as Record<string, unknown>).is_school_admin) {
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
        updated_at: new Date();
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
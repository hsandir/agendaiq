/**
 * Teams V2 API - Isolated Development
 * Only works when NEXT_PUBLIC_ENABLE_TEAM_V2=true
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
} else {
  // GET /api/teams-v2 - List user's teams
  export async function GET(request: NextRequest) {
    try {
      // Require authentication
      const user = await requireAuth(AuthPresets.requireAuth);
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Get query params
      const searchParams = request.nextUrl.searchParams;
      const status = searchParams.get('status') || 'ACTIVE';
      const schoolId = searchParams.get('schoolId');

      // Build where clause
      const where: any = {
        members: {
          some: {
            user_id: user.id
          }
        },
        status
      };

      if (schoolId) {
        where.school_id = parseInt(schoolId);
      }

      // Fetch teams
      const teams = await prismaV2.team.findMany({
        where,
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
          },
          _count: {
            select: {
              meetings: true,
              notes: true,
              members: true
            }
          }
        },
        orderBy: {
          created_at: 'desc'
        }
      });

      return NextResponse.json(teams);
    } catch (error) {
      console.error('Error fetching teams:', error);
      return NextResponse.json(
        { error: 'Failed to fetch teams' },
        { status: 500 }
      );
    }
  }

  // POST /api/teams-v2 - Create new team
  export async function POST(request: NextRequest) {
    try {
      // Require authentication
      const user = await requireAuth(AuthPresets.requireAuth);
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Validate input
      const createTeamSchema = z.object({
        name: z.string().min(1).max(100),
        type: z.enum(['EVENT', 'PROJECT', 'COMMITTEE']),
        purpose: z.string().min(1),
        school_id: z.number().positive(),
        start_date: z.string().datetime(),
        end_date: z.string().datetime().optional()
      });

      const body = await request.json();
      const validation = createTeamSchema.safeParse(body);

      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid input', details: validation.error.errors },
          { status: 400 }
        );
      }

      const data = validation.data;

      // Generate unique code
      const code = `${data.type}_${data.name.toUpperCase().replace(/\s/g, '_')}_${Date.now()}`;

      // Create team with creator as LEAD
      const team = await prismaV2.team.create({
        data: {
          name: data.name,
          code,
          type: data.type,
          purpose: data.purpose,
          school_id: data.school_id,
          start_date: new Date(data.start_date),
          end_date: data.end_date ? new Date(data.end_date) : undefined,
          created_by: user.id,
          members: {
            create: {
              user_id: user.id,
              role: 'LEAD'
            }
          }
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

      return NextResponse.json(team, { status: 201 });
    } catch (error) {
      console.error('Error creating team:', error);
      return NextResponse.json(
        { error: 'Failed to create team' },
        { status: 500 }
      );
    }
  }
}
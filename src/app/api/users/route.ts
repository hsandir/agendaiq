import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth/auth-options";
import { withAuth } from "@/lib/auth/api-auth";
import { can, Capability } from '@/lib/auth/policy';
import { createSuccessNextResponse, createErrorNextResponse } from '@/lib/api/response-types';
import { Logger } from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
  try {
    const authResult = await withAuth(request);
    if (!authResult.success) {
      return createErrorNextResponse(authResult.error || 'Authentication failed', authResult.statusCode || 401);
    }

    const user = authResult.user!;

    // Check user management capability
    if (!can(user, Capability.USER_MANAGE)) {
      return createErrorNextResponse("User management access required", 403);
    }

    const users = await prisma.(user as Record<string, unknown>).findMany({
      include: {
        Staff: {
          include: {
            Role: true,
            Department: true,
            School: true
          }
        }
      },
      orderBy: {
        name: 'asc',
      },
    });

    Logger.info('All users retrieved successfully', { 
      userCount: users.length,
      adminUserId: user.id 
    }, 'api-users');

    return createSuccessNextResponse(users, 'Users retrieved successfully');
  } catch (error: unknown) {
    Logger.error("Error in GET /api/users", { error: String(error) }, 'api-users');
    return createErrorNextResponse("Internal server error", 500);
  }
} 
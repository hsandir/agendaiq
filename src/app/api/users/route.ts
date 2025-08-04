import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth/auth-options";
import { withAuth } from "@/lib/auth/api-auth";
import { createSuccessNextResponse, createErrorNextResponse } from '@/lib/api/response-types';
import { Logger } from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
  try {
    const authResult = await withAuth(request, { requireStaff: true });
    if (!authResult.success) {
      return createErrorNextResponse(authResult.error || 'Authentication failed', authResult.statusCode || 401);
    }

    const user = authResult.user!;

    const userWithStaff = await prisma.user.findUnique({
      where: { email: user.email },
      include: { 
        Staff: {
          include: {
            Role: true
          }
        }
      }
    });

    if (!userWithStaff) {
      return createErrorNextResponse("User not found", 404);
    }

    // Check if user has admin privileges
    const isAdmin = userWithStaff.Staff?.[0]?.Role?.title === 'Administrator';

    if (!isAdmin) {
      return createErrorNextResponse("Only administrators can view all users", 403);
    }

    const users = await prisma.user.findMany({
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
  } catch (error) {
    Logger.error("Error in GET /api/users", { error: String(error) }, 'api-users');
    return createErrorNextResponse("Internal server error", 500);
  }
} 
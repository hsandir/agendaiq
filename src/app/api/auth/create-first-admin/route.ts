import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { withAuth } from '@/lib/auth/api-auth';
import { z } from 'zod';

const createAdminSchema = z.object({
  userId: z.number().positive(),
  password: z.string().min(8)
});

export async function POST(request: NextRequest) {
  try {
    // Check if there are any users in the system first
    const userCount = await prisma.user.count();
    
    // If users exist, require authentication
    if (userCount > 0) {
      const authResult = await withAuth(request, {
        requireAdminRole: true
      });

      if (!authResult.success) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
    }

    const body = await request.json();
    const validation = createAdminSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { userId, password } = validation.data;

    // Check if user exists and doesn't have a password
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        hashedPassword: true,
        Staff: {
          select: {
            Role: {
              select: {
                key: true,
                is_leadership: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (user.hashedPassword) {
      return NextResponse.json(
        { error: 'User already has a password set' },
        { status: 400 }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update the user with the password
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        hashedPassword: hashedPassword,
        is_admin: true, // Ensure admin flag is set
        updated_at: new Date()
      },
      select: {
        id: true,
        email: true,
        name: true
      }
    });

    // Log the admin creation
    console.log(`First admin account created for: ${updatedUser.email}`);

    return NextResponse.json({
      success: true,
      message: 'Admin account created successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name
      }
    });

  } catch (error: unknown) {
    console.error('Error creating first admin:', error);
    return NextResponse.json(
      { error: 'Failed to create admin account' },
      { status: 500 }
    );
  }
}
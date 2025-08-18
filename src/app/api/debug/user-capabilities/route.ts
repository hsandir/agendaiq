import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/auth-utils';
import { getUserCapabilities } from '@/lib/auth/policy';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get capabilities from database
    const capabilities = await getUserCapabilities(user.id);
    
    // Get user's role permissions
    const userWithRole = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        Staff: {
          include: {
            Role: {
              include: {
                Permissions: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      userId: user.id,
      email: user.email,
      is_system_admin: user.is_system_admin,
      is_school_admin: (user as Record<string, unknown>).is_school_admin,
      
      // From getUserCapabilities
      capabilities: capabilities,
      capabilityCount: capabilities.length,
      
      // Direct from database
      role: userWithRole?.Staff?.[0]?.Role?.title,
      roleKey: userWithRole?.Staff?.[0]?.Role?.key,
      permissions: userWithRole?.Staff?.[0]?.Role?.Permissions || [],
      
      // Check specific capabilities
      hasOpsBackup: capabilities.includes('ops:backup'),
      hasOpsLogs: capabilities.includes('ops:logs'),
      hasOpsHealth: capabilities.includes('ops:health'),
      hasOpsAlerts: capabilities.includes('ops:alerts'),
      
      // Debug info
      debugInfo: {
        sessionCapabilities: (user as Record<string, unknown>).capabilities || [],
        computedCapabilities: capabilities,
        match: JSON.stringify(user as Record<string, unknown>.capabilities) === JSON.stringify(capabilities)
      }
    }, { status: 200 });
  } catch (error: unknown) {
    console.error('Error checking capabilities:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
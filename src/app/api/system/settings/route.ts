import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const authResult = await withAuth(request, { requireAuth: true, requireStaff: true, requireOpsAdmin: true });
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
  }
  
  const user = authResult.user!;

  try {
    const settings = await prisma.systemSetting.findMany({
      orderBy: {
        key: 'asc'
      }
    });

    // Convert to a more usable format
    const settingsObject = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, any>);

    return NextResponse.json({
      success: true,
      settings: settingsObject,
      count: settings.length
    });

  } catch (error) {
    console.error('Error fetching system settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch system settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const authResult = await withAuth(request, { requireAuth: true, requireStaff: true, requireOpsAdmin: true });
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
  }
  
  const user = authResult.user!;

  try {
    const body = await request.json();
    const { settings } = body;

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { error: 'Invalid settings data provided' },
        { status: 400 }
      );
    }

    const updatedSettings = [];
    const errors = [];

    // Update each setting
    for (const [key, value] of Object.entries(settings)) {
      try {
        const updatedSetting = await prisma.systemSetting.upsert({
          where: { key },
          update: { value: value as any },
          create: { key, value: value as any }
        });
        updatedSettings.push(updatedSetting);
      } catch (error) {
        console.error(`Error updating setting ${key}:`, error);
        errors.push(`Failed to update ${key}`);
      }
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { 
          error: 'Some settings failed to update',
          details: errors,
          updatedSettings: updatedSettings.length
        },
        { status: 207 } // Multi-status
      );
    }

    return NextResponse.json({
      success: true,
      message: 'System settings updated successfully',
      updatedCount: updatedSettings.length
    });

  } catch (error) {
    console.error('Error updating system settings:', error);
    return NextResponse.json(
      { error: 'Failed to update system settings' },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-auth';
import { can, Capability } from '@/lib/auth/policy';

export async function GET(request: NextRequest) {
  // CRITICAL SECURITY FIX: Add authentication for sensitive database info
  const authResult = await withAuth(request);
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
  }

  const user = authResult.user!;

  // Check database read capability
  if (!can(user, Capability.OPS_DB_READ)) {
    return NextResponse.json({ error: 'Database read access required' }, { status: 403 });
  }
  try {
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      return NextResponse.json({ 
        error: 'Database URL not configured',
        message: 'DATABASE_URL environment variable is not set'
      }, { status: 500 });
    }

    // Parse the database URL safely without exposing sensitive info
    const url = new URL(databaseUrl);
    
    const databaseInfo = {
      type: 'PostgreSQL',
      host: url.hostname,
      port: url.port || '5432',
      database: url.pathname.substring(1), // Remove leading slash
      username: url.username,
      // Don't expose password for security
      ssl: url.searchParams.get('sslmode') || 'prefer',
      connection_string_template: `postgresql://[username]:[password]@${url.hostname}:${url.port || '5432'}/${url.pathname.substring(1)}`,
      prisma_schema: 'Located at: prisma/schema.prisma',
      tables: [
        'User', 'District', 'School', 'Department', 'Role', 'Staff',
        'Meeting', 'MeetingAttendee', 'MeetingNote', 'SystemSetting',
        'UserSetting', 'ZoomIntegration', 'MeetingAuditLog', 'Account',
        'Session', 'VerificationToken', 'Device', 'LoginHistory'
      ]
    };

    return NextResponse.json({
      success: true,
      database: databaseInfo,
      note: 'Password is hidden for security reasons'
    });

  } catch (error: unknown) {
    return NextResponse.json(
      { 
        error: 'Failed to parse database configuration',
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
} 
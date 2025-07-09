import { NextResponse } from 'next/server';

export async function GET() {
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

  } catch (error: any) {
    return NextResponse.json(
      { 
        error: 'Failed to parse database configuration',
        details: error.message 
      },
      { status: 500 }
    );
  }
} 
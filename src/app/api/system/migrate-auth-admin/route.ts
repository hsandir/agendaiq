import { NextRequest, NextResponse } from 'next/server';
import { AuthMigrationSystem } from '@/lib/migration/auth-migration-system';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, dryRun = false } = body;

    const migrationSystem = new AuthMigrationSystem();

    switch (action) {
      case 'preview':
        const preview = await migrationSystem.scanFiles();
        return NextResponse.json({
          success: true,
          preview,
          totalFiles: preview.length
        });

      case 'migrate':
        const result = await migrationSystem.migrateAuthSystem(dryRun);
        return NextResponse.json({
          success: true,
          result
        });

      case 'status':
        const status = await migrationSystem.getStatus();
        return NextResponse.json({
          success: true,
          status
        });

      default:
        return NextResponse.json({
          error: 'Invalid action. Use: preview, migrate, or status'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Migration API error:', error);
    return NextResponse.json({
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { AuthMigrationEngine, AuthMigrationCLI } from '@/lib/migration/auth-migration-system';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, dryRun = false } = body;

    const migrationEngine = new AuthMigrationEngine();
    const migrationCLI = new AuthMigrationCLI();

    switch (action) {
      case 'preview':
        const preview = await migrationEngine.previewChanges();
        return NextResponse.json({
          success: true,
          preview,
          totalChanges: preview.length
        });

      case 'migrate':
        const result = await migrationEngine.runMigration();
        return NextResponse.json({
          success: true,
          result
        });

      case 'status':
        // Use CLI for status check
        await migrationCLI.checkStatus();
        return NextResponse.json({
          success: true,
          message: 'Status check completed - see console logs'
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
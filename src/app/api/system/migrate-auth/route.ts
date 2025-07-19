import { NextRequest, NextResponse } from "next/server";
import { APIAuthPatterns } from '@/lib/auth/api-auth';
import { AuthenticatedUser } from '@/lib/auth/auth-utils';

// POST /api/system/migrate-auth - Run auth system migration
export const POST = APIAuthPatterns.adminOnly(async (request: NextRequest, user: AuthenticatedUser) => {
  try {
    const { action, dryRun } = await request.json();

    // Import migration system dynamically
    const { AuthMigrationEngine } = await import('@/lib/migration/auth-migration-system');
    const migrationEngine = new AuthMigrationEngine();

    switch (action) {
      case 'preview':
        const previewChanges = await migrationEngine.previewChanges();
        return NextResponse.json({
          success: true,
          action: 'preview',
          changes: previewChanges,
          timestamp: new Date().toISOString()
        });

      case 'migrate':
        if (dryRun) {
          const previewChanges = await migrationEngine.previewChanges();
          return NextResponse.json({
            success: true,
            action: 'dry-run',
            changes: previewChanges,
            message: 'Dry run completed - no changes applied',
            timestamp: new Date().toISOString()
          });
        } else {
          const migrationReport = await migrationEngine.runMigration();
          const detailedReport = await migrationEngine.generateDetailedReport();
          
          return NextResponse.json({
            success: true,
            action: 'migrate',
            report: migrationReport,
            detailedReportPath: 'MIGRATION_REPORT.md',
            timestamp: new Date().toISOString()
          });
        }

      case 'status':
        // Check which files need migration
        const { glob } = await import('glob');
        const files = await glob('src/**/*.{ts,tsx}');
        const status = await migrationEngine.getFileStatus(files);
        
        const needsMigration = Object.entries(status).filter(([_, s]) => s === 'needs_migration');
        const upToDate = Object.entries(status).filter(([_, s]) => s === 'up_to_date');
        
        return NextResponse.json({
          success: true,
          action: 'status',
          status: {
            totalFiles: files.length,
            needsMigration: needsMigration.length,
            upToDate: upToDate.length,
            files: {
              needsMigration: needsMigration.map(([path]) => path),
              upToDate: upToDate.map(([path]) => path)
            }
          },
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { 
            error: 'Invalid action. Use: preview, migrate, status',
            availableActions: ['preview', 'migrate', 'status'],
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Auth migration error:', error);
    return NextResponse.json(
      { 
        error: 'Migration failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}); 
import { NextRequest, NextResponse } from "next/server";
import { APIAuthPatterns } from '@/lib/auth/api-auth';
import { AuthenticatedUser } from '@/lib/auth/auth-utils';

// GET /api/system/diagnostic - Run system diagnosis
export const GET = APIAuthPatterns.adminOnly(async (request: NextRequest, user: AuthenticatedUser) => {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action') || 'full';

    // Import diagnostic system dynamically
    const { ErrorDiagnosticEngine } = await import('@/lib/migration/error-diagnostic-system');
    const diagnosticEngine = new ErrorDiagnosticEngine();

    switch (action) {
      case 'full':
        const fullReport = await diagnosticEngine.runDiagnosis();
        const detailedReport = await diagnosticEngine.generateReport(fullReport);
        
        return NextResponse.json({
          success: true,
          action: 'full-diagnosis',
          report: fullReport,
          detailedReportPath: 'DIAGNOSTIC_REPORT.md',
          timestamp: new Date().toISOString()
        });

      case 'quick':
        // Quick health check without full analysis
        const quickErrors = await diagnosticEngine.runDiagnosis();
        const healthStatus = quickErrors.systemHealth;
        
        return NextResponse.json({
          success: true,
          action: 'quick-check',
          health: healthStatus,
          errorCount: quickErrors.totalErrors,
          criticalErrors: quickErrors.errorsBySeverity.critical || 0,
          highErrors: quickErrors.errorsBySeverity.high || 0,
          recommendations: quickErrors.recommendations.slice(0, 3),
          timestamp: new Date().toISOString()
        });

      case 'errors-only':
        const errorsReport = await diagnosticEngine.runDiagnosis();
        
        return NextResponse.json({
          success: true,
          action: 'errors-only',
          errors: errorsReport.errors,
          errorsByType: errorsReport.errorsByType,
          errorsBySeverity: errorsReport.errorsBySeverity,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { 
            error: 'Invalid action. Use: full, quick, errors-only',
            availableActions: ['full', 'quick', 'errors-only'],
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('System diagnostic error:', error);
    return NextResponse.json(
      { 
        error: 'Diagnostic failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
});

// POST /api/system/diagnostic - Apply auto-fixes
export const POST = APIAuthPatterns.adminOnly(async (request: NextRequest, user: AuthenticatedUser) => {
  try {
    const { fixId, fixIds } = await request.json();

    // Import diagnostic system dynamically
    const { ErrorDiagnosticEngine } = await import('@/lib/migration/error-diagnostic-system');
    const diagnosticEngine = new ErrorDiagnosticEngine();

    if (fixId) {
      // Apply single fix
      const success = await diagnosticEngine.applyAutoFix(fixId);
      
      return NextResponse.json({
        success,
        fixId,
        message: success ? 'Fix applied successfully' : 'Fix application failed',
        timestamp: new Date().toISOString()
      });
    }

    if (fixIds && Array.isArray(fixIds)) {
      // Apply multiple fixes
      const results = [];
      
      for (const id of fixIds) {
        const success = await diagnosticEngine.applyAutoFix(id);
        results.push({ fixId: id, success });
      }
      
      const successCount = results.filter(r => r.success).length;
      
      return NextResponse.json({
        success: successCount === fixIds.length,
        results,
        message: `Applied ${successCount}/${fixIds.length} fixes successfully`,
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json(
      { 
        error: 'Please provide fixId or fixIds parameter',
        timestamp: new Date().toISOString()
      },
      { status: 400 }
    );

  } catch (error) {
    console.error('Auto-fix error:', error);
    return NextResponse.json(
      { 
        error: 'Auto-fix failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}); 
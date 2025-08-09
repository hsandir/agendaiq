import { NextRequest, NextResponse } from 'next/server';

// Public endpoint to check production site real status without authentication
export async function GET(request: NextRequest) {
  try {
    const checks = {
      mainSite: { status: 'unknown', responseTime: 0, error: null as string | null },
      authPages: { status: 'unknown', responseTime: 0, error: null as string | null },
      healthAPI: { status: 'unknown', responseTime: 0, error: null as string | null },
      errorCapture: { status: 'unknown', responseTime: 0, error: null as string | null }
    };

    // Test main site
    try {
      const startTime = Date.now();
      const mainResponse = await fetch('https://agendaiq.vercel.app/', {
        method: 'GET',
        headers: { 'User-Agent': 'AgendaIQ-Monitor/1.0' },
        redirect: 'follow'
      });
      checks.mainSite.responseTime = Date.now() - startTime;
      checks.mainSite.status = mainResponse.ok ? 'healthy' : 'error';
      if (!mainResponse.ok) {
        checks.mainSite.error = `${mainResponse.status} ${mainResponse.statusText}`;
      }
    } catch (error) {
      checks.mainSite.status = 'error';
      checks.mainSite.error = error instanceof Error ? error.message : String(error);
    }

    // Test auth signin page
    try {
      const startTime = Date.now();
      const authResponse = await fetch('https://agendaiq.vercel.app/auth/signin', {
        method: 'GET',
        headers: { 'User-Agent': 'AgendaIQ-Monitor/1.0' }
      });
      checks.authPages.responseTime = Date.now() - startTime;
      checks.authPages.status = authResponse.ok ? 'healthy' : 'error';
      if (!authResponse.ok) {
        checks.authPages.error = `${authResponse.status} ${authResponse.statusText}`;
      }
    } catch (error) {
      checks.authPages.status = 'error';
      checks.authPages.error = error instanceof Error ? error.message : String(error);
    }

    // Test health API
    try {
      const startTime = Date.now();
      const healthResponse = await fetch('https://agendaiq.vercel.app/api/health', {
        method: 'GET',
        headers: { 'User-Agent': 'AgendaIQ-Monitor/1.0' }
      });
      checks.healthAPI.responseTime = Date.now() - startTime;
      checks.healthAPI.status = healthResponse.ok ? 'healthy' : 'error';
      if (!healthResponse.ok) {
        checks.healthAPI.error = `${healthResponse.status} ${healthResponse.statusText}`;
      } else {
        const healthData = await healthResponse.json();
        if (healthData.status !== 'healthy') {
          checks.healthAPI.status = 'degraded';
          checks.healthAPI.error = `Health status: ${healthData.status}`;
        }
      }
    } catch (error) {
      checks.healthAPI.status = 'error';
      checks.healthAPI.error = error instanceof Error ? error.message : String(error);
    }

    // Test error capture endpoint
    try {
      const startTime = Date.now();
      const errorResponse = await fetch('https://agendaiq.vercel.app/api/error-capture', {
        method: 'GET',
        headers: { 'User-Agent': 'AgendaIQ-Monitor/1.0' }
      });
      checks.errorCapture.responseTime = Date.now() - startTime;
      checks.errorCapture.status = errorResponse.ok ? 'healthy' : 'error';
      if (!errorResponse.ok) {
        checks.errorCapture.error = `${errorResponse.status} ${errorResponse.statusText}`;
      } else {
        const errorData = await errorResponse.json();
        if (errorData.totalErrors > 0) {
          checks.errorCapture.error = `${errorData.totalErrors} errors captured`;
        }
      }
    } catch (error) {
      checks.errorCapture.status = 'error';
      checks.errorCapture.error = error instanceof Error ? error.message : String(error);
    }

    // Determine overall status
    const hasError = Object.values(checks).some(check => check.status === 'error');
    const hasDegraded = Object.values(checks).some(check => check.status === 'degraded');
    
    const overallStatus = hasError ? 'error' : hasDegraded ? 'degraded' : 'healthy';

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      overallStatus,
      checks,
      summary: {
        totalChecks: Object.keys(checks).length,
        healthy: Object.values(checks).filter(c => c.status === 'healthy').length,
        degraded: Object.values(checks).filter(c => c.status === 'degraded').length,
        error: Object.values(checks).filter(c => c.status === 'error').length
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to check production status',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
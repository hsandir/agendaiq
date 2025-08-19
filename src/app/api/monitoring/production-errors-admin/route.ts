import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-auth';
import { Capability } from '@/lib/auth/policy';

interface ProductionError {
  id: string;
  timestamp: string;
  message: string;
  stack?: string;
  url: string;
  userAgent: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface DebugCheckData {
  status: 'ok' | 'error' | 'degraded';
  error?: string;
  responseTime?: number;
}

interface DebugData {
  overallStatus: 'ok' | 'degraded' | 'error';
  summary: {
    ok: number;
    error: number;
    degraded: number;
  };
  checks: Record<string, DebugCheckData>;
}

// Admin-only production error monitoring with proper authentication
export async function GET(request: NextRequest) {
  // Require operations admin authentication
  const authResult = await withAuth(request, { requireAuth: true, requireCapability: Capability.OPS_MONITORING });
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
  }

  try {
    const errors: ProductionError[] = [];

    // Test production site accessibility and deployment status with admin credentials
    try {
      // Use admin token for secure production monitoring
      const adminToken = request.headers.get('authorization');
      
      // Test main site
      const mainSiteResponse = await fetch('https://agendaiq.vercel.app/', {
        method: 'HEAD',
        headers: {
          'Cache-Control': 'no-cache',
          'User-Agent': 'AgendaIQ-AdminMonitor/1.0'
        },
        redirect: 'follow'
      });

      // Test API health  
      const healthResponse = await fetch('https://agendaiq.vercel.app/api/health', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'User-Agent': 'AgendaIQ-AdminMonitor/1.0'
        }
      });

      // Check if main site is returning error page
      if (!mainSiteResponse.ok) {
        errors.push({
          id: `site-error-${Date.now()}`,
          timestamp: new Date().toISOString(),
          message: `Production site returning ${mainSiteResponse.status}: ${mainSiteResponse.statusText}`,
          url: 'https://agendaiq.vercel.app',
          userAgent: 'Admin Monitoring System',
          severity: 'critical'
        });
      }

      // Check API health
      if (!healthResponse.ok) {
        errors.push({
          id: `api-error-${Date.now()}`,
          timestamp: new Date().toISOString(),
          message: `Production API returning ${healthResponse.status}: ${healthResponse.statusText}`,
          url: 'https://agendaiq.vercel.app/api/health',
          userAgent: 'Admin Monitoring System',
          severity: 'critical'
        });
      } else {
        // Check if health API returns degraded status
        const healthData = await healthResponse.json();
        if (healthData.status !== 'healthy') {
          errors.push({
            id: `health-${Date.now()}`,
            timestamp: new Date().toISOString(),
            message: `Production health status: ${healthData.status}`,
            url: 'https://agendaiq.vercel.app/api/health',
            userAgent: 'Admin Monitoring System',
            severity: healthData.status === 'degraded' ? 'high' : 'critical'
          });
        }
      }

      // For admin users, we can also check Vercel deployment status if needed
      // This would require Vercel API integration with proper credentials
      
    } catch (err: unknown) {
      // If production is completely inaccessible, record this as critical
      errors.push({
        id: `conn-error-${Date.now()}`,
        timestamp: new Date().toISOString(),
        message: `Production site is completely inaccessible: ${err}`,
        url: 'https://agendaiq.vercel.app',
        userAgent: 'Admin Monitoring System',
        severity: 'critical'
      });
    }

    // Get detailed production status from debug endpoint (admin access only)
    try {
      const debugResponse = await fetch('http://localhost:3000/api/debug/production-status');
      if (debugResponse.ok) {
        const debugData = await debugResponse.json() as DebugData;
        
        if (debugData.overallStatus === 'error') {
          errors.push({
            id: `debug-error-${Date.now()}`,
            timestamp: new Date().toISOString(),
            message: `Production site issues detected: ${debugData.summary.error} errors, ${debugData.summary.degraded} degraded`,
            url: 'https://agendaiq.vercel.app',
            userAgent: 'Admin Monitoring System',
            severity: 'high'
          });
        }

        // Add specific check errors with admin context
        Object.entries(debugData.checks).forEach(([checkName, checkData]) => {
          if (checkData.status === 'error') {
            errors.push({
              id: `admin-check-error-${checkName}-${Date.now()}`,
              timestamp: new Date().toISOString(),
              message: `Production ${checkName} check failed: ${checkData.error} (Admin monitoring)`,
              url: 'https://agendaiq.vercel.app',
              userAgent: 'Admin Monitoring System', 
              severity: checkName === 'mainSite' ? 'critical' : 'medium'
            });
          }
        });
      }
    } catch (debugErr: unknown) {
      console.log('Admin debug endpoint error:', debugErr);
    }

    // For admin monitoring, provide more detailed client-side error detection
    if (errors.filter(e => e.severity === 'critical').length === 0) {
      errors.push({
        id: `admin-client-error-warning-${Date.now()}`,
        timestamp: new Date().toISOString(),
        message: 'Admin Alert: Production site appears healthy from server perspective but client-side errors may be occurring. Consider enabling client-side error tracking or checking browser console logs.',
        url: 'https://agendaiq.vercel.app',
        userAgent: 'Admin Monitoring System',
        severity: 'medium'
      });
    }

    return NextResponse.json({
      success: true,
      errors: errors.slice(0, 50), // More errors for admin users
      timestamp: new Date().toISOString(),
      adminUser: authResult.user?.email ?? 'Unknown',
      monitoring: {
        level: 'admin',
        authenticated: true,
        totalChecks: 4
      }
    });

  } catch (error: unknown) {
    console.error('Admin production error monitoring failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch production errors',
      errors: [],
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
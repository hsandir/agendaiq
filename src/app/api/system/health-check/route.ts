import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-auth';
import { Capability } from '@/lib/auth/policy';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Define common pages to test
const PAGES_TO_TEST = [
  { path: '/', name: 'Home Page' },
  { path: '/auth/signin', name: 'Sign In' },
  { path: '/auth/register', name: 'Register' },
  { path: '/dashboard', name: 'Dashboard' },
  { path: '/dashboard/system', name: 'System Management' },
  { path: '/dashboard/meetings', name: 'Meetings' },
  { path: '/dashboard/settings', name: 'Settings' },
  { path: '/dashboard/settings/users', name: 'User Management' },
  { path: '/dashboard/settings/admin', name: 'Admin Settings' },
  { path: '/api/system/status', name: 'System Status API' },
  { path: '/api/auth/session', name: 'Auth Session API' },
  { path: '/api/meetings', name: 'Meetings API' },
  { path: '/api/users', name: 'Users API' }
];

export async function GET(request: NextRequest) {
  try {
    const auth = await withAuth(request, { requireAuth: true, requireCapability: Capability.OPS_HEALTH });
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.statusCode });
    }
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    if (action === 'quick') {
      return await quickHealthCheck();
    } else if (action === 'full') {
      return await fullHealthCheck();
    } else if (action === 'api-only') {
      return await apiHealthCheck();
    }

    return NextResponse.json({ error: 'Invalid action. Use: quick, full, or api-only' }, { status: 400 });
  } catch (error: unknown) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      { error: 'Failed to perform health check', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { pages, type } = (await request.json()) as Record<string, unknown>;

    if (type === 'custom' && pages) {
      return await customHealthCheck(Array.isArray(pages) ? pages as string[] : []);
    }

    return NextResponse.json({ error: 'Invalid request. Use type: "custom" with pages array' }, { status: 400 });
  } catch (error: unknown) {
    console.error('Custom health check failed:', error);
    return NextResponse.json(
      { error: 'Failed to perform custom health check', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

async function quickHealthCheck() {
  try {
    const baseUrl = 'http://localhost:3000';
    const criticalPages = PAGES_TO_TEST.filter(page => 
      page.path === '/' || 
      page.path === '/dashboard' || 
      page.path === '/api/system/status'
    );

    const results = (await Promise.all(
      criticalPages.map(page => checkPage(baseUrl + page.path, page.name))
    ));

    const summary = {
      total: results.length,
      passed: results.filter(r => r.status === 'success').length,
      failed: results.filter(r => r.status === 'error').length,
      warnings: results.filter(r => r.status === 'warning').length
    };

    return NextResponse.json({
      success: true,
      type: 'quick',
      summary,
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error: unknown) {
    return NextResponse.json(
      { error: 'Quick health check failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

async function fullHealthCheck() {
  try {
    const baseUrl = 'http://localhost:3000';
    const results = [];

    // Test all pages sequentially to avoid overwhelming the server
    for (const page of PAGES_TO_TEST) {
      const result = await checkPage(baseUrl + page.path, page.name);
      results.push(result);
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Additional system checks
    const systemChecks = await performSystemChecks();
    
    const summary = {
      total: results.length,
      passed: results.filter(r => r.status === 'success').length,
      failed: results.filter(r => r.status === 'error').length,
      warnings: results.filter(r => r.status === 'warning').length,
      systemChecks
    };

    return NextResponse.json({
      success: true,
      type: 'full',
      summary,
      results,
      systemChecks,
      timestamp: new Date().toISOString()
    });

  } catch (error: unknown) {
    return NextResponse.json(
      { error: 'Full health check failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

async function apiHealthCheck() {
  try {
    const baseUrl = 'http://localhost:3000';
    const apiPages = PAGES_TO_TEST.filter(page => page.path.startsWith('/api'));

    const results = (await Promise.all(
      apiPages.map(page => checkPage(baseUrl + page.path, page.name))
    ));

    const summary = {
      total: results.length,
      passed: results.filter(r => r.status === 'success').length,
      failed: results.filter(r => r.status === 'error').length,
      warnings: results.filter(r => r.status === 'warning').length
    };

    return NextResponse.json({
      success: true,
      type: 'api-only',
      summary,
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error: unknown) {
    return NextResponse.json(
      { error: 'API health check failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

async function customHealthCheck(customPages: string[]) {
  try {
    const baseUrl = 'http://localhost:3000';
    const results = [];

    for (const pagePath of customPages) {
      const result = await checkPage(baseUrl + pagePath, `Custom: ${pagePath}`);
      results.push(result);
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const summary = {
      total: results.length,
      passed: results.filter(r => r.status === 'success').length,
      failed: results.filter(r => r.status === 'error').length,
      warnings: results.filter(r => r.status === 'warning').length
    };

    return NextResponse.json({
      success: true,
      type: 'custom',
      summary,
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error: unknown) {
    return NextResponse.json(
      { error: 'Custom health check failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

async function checkPage(url: string, name: string) {
  try {
    const startTime = Date.now();
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'AgendaIQ-HealthChecker/1.0'
      },
      signal: AbortSignal.timeout(30000) // 30 second timeout for slow APIs
    });

    const responseTime = Date.now() - startTime;
    const contentType = response.headers.get('content-type') ?? '';
    
    // Determine status based on response
    let status: 'success' | 'warning' | 'error' = 'success';
    let message = 'Page loaded successfully';
    const details: Record<string, unknown> = {};

    if (!response.ok) {
      status = 'error';
      message = `HTTP ${response.status}: ${response.statusText}`;
    } else if (responseTime > 5000) {
      status = 'warning';
      message = 'Page loaded but response time is slow';
    } else if (responseTime > 2000) {
      status = 'warning';
      message = 'Page loaded with acceptable response time';
    }

    // For HTML pages, do basic content checks
    if (contentType.includes('text/html')) {
      try {
        const text = await response.text();
        
        // More specific error detection - avoid false positives from Next.js dev components
        const hasRealError = 
          text.includes('500 - Internal Server Error') ||
          text.includes('This application has no explicit mapping for') ||
          text.includes('Whitelabel Error Page') ||
          (text.includes('Error:') && !text.includes('next_error')) ||
          (text.includes('Exception:') && !text.includes('NotFound'));

        // Check for actual 404 pages (not Next.js dev components)
        const isReal404 = response.status === 404 || 
          (text.includes('404') && text.includes('This page could not be found') && !text.includes('AgendaIQ'));

        if (hasRealError ?? isReal404) {
          status = 'error';
          message = isReal404 ? 'Page not found (404)' : 'Page contains error indicators';
        } else if (text.length < 100) {
          status = 'warning';
          message = 'Page content seems too short';
        }

        details.contentLength = text.length;
        details.hasTitle = text.includes('<title>');
        details.hasBody = text.includes('<body');
        details.hasNextDevError = text.includes('next_error') || text.includes('NotFound');
      } catch {
        // If we can't read the text, that's ok for status check
      }
    }

    // For API endpoints, check JSON validity
    if (contentType.includes('application/json')) {
      try {
        const json = await response.json();
        details.jsonValid = true;
        details.hasError = json.error ? true : false;
        
        if (json.error) {
          // 401 Unauthorized is expected for protected endpoints without auth
          if (response.status === 401 || json.error === 'Unauthorized') {
            status = 'warning';
            message = `API returned expected auth error: ${json.error}`;
          } else {
            status = 'error';
            message = `API returned error: ${json.error}`;
          }
        }
      } catch {
        status = 'error';
        message = 'Invalid JSON response';
        details.jsonValid = false;
      }
    }

    return {
      name,
      url,
      status,
      message,
      statusCode: response.status,
      responseTime,
      contentType,
      details,
      timestamp: new Date().toISOString()
    };

  } catch (error: unknown) {
    return {
      name,
      url,
      status: 'error' as const,
      message: `Failed to load: ${error instanceof Error ? error.message : String(error)}`,
      statusCode: 0,
      responseTime: 0,
      contentType: 'unknown',
      details: { error: error instanceof Error ? error.message : String(error) },
      timestamp: new Date().toISOString()
    };
  }
}

async function performSystemChecks() {
  const checks = [];

  // Check server responsiveness
  try {
    const startTime = Date.now();
    await fetch('http://localhost:3000/api/system/status', { signal: AbortSignal.timeout(5000) });
    const responseTime = Date.now() - startTime;
    
    checks.push({
      name: 'Server Responsiveness',
      status: responseTime < 3000 ? 'success' : 'warning',
      message: `System API responded in ${responseTime}ms`,
      value: `${responseTime}ms`
    });
  } catch (error: unknown) {
    checks.push({
      name: 'Server Responsiveness',
      status: 'error',
      message: 'System API not responding',
      value: 'Failed'
    });
  }

  // Check disk space
  try {
    const { stdout } = await execAsync('df -h .', { cwd: process.cwd() });
    const usage = stdout.split('\n')[1].split(/\s+/)[4]; // Get usage percentage
    
    checks.push({
      name: 'Disk Space',
      status: parseInt(usage) > 90 ? 'error' : parseInt(usage) > 75 ? 'warning' : 'success',
      message: `Disk usage: ${usage}`,
      value: usage
    });
  } catch {
    checks.push({
      name: 'Disk Space',
      status: 'warning',
      message: 'Could not check disk space',
      value: 'Unknown'
    });
  }

  // Check memory usage
  try {
    const usage = process.memoryUsage();
    const usedMB = Math.round(usage.heapUsed / 1024 / 1024);
    const totalMB = Math.round(usage.heapTotal / 1024 / 1024);
    
    checks.push({
      name: 'Memory Usage',
      status: usedMB > totalMB * 0.9 ? 'warning' : 'success',
      message: `Using ${usedMB}MB of ${totalMB}MB`,
      value: `${usedMB}/${totalMB}MB`
    });
  } catch {
    checks.push({
      name: 'Memory Usage',
      status: 'warning',
      message: 'Could not check memory usage',
      value: 'Unknown'
    });
  }

  // Check Git status
  try {
    const { stdout } = await execAsync('git status --porcelain', { cwd: process.cwd() });
    const changes = stdout.split('\n').filter(line => String(line).trim()).length;
    
    checks.push({
      name: 'Git Status',
      status: changes > 10 ? 'warning' : 'success',
      message: changes > 0 ? `${changes} uncommitted changes` : 'Working tree clean',
      value: `${changes} changes`
    });
  } catch {
    checks.push({
      name: 'Git Status',
      status: 'warning',
      message: 'Could not check git status',
      value: 'Unknown'
    });
  }

  return checks;
} 
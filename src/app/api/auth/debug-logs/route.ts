import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getToken } from 'next-auth/jwt';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/prisma';
import { headers, cookies } from 'next/headers';
import bcrypt from 'bcrypt';

interface DebugLog {
  id: string;
  timestamp: string;
  type?: string;
  level?: string;
  message?: string;
  details?: Record<string, unknown>;
  email?: string;
  ip?: string;
  userAgent?: string;
  sessionId?: string;
  errorStack?: string;
  allHeaders?: number;
  [key: string]: unknown;
}

interface AuthFlowStep {
  id: string;
  timestamp: string;
  step: string;
  details: Record<string, unknown>;
}

// In-memory log storage (survives between requests in same process)
let debugLogs: DebugLog[] = [];
const MAX_LOGS = 500;

// Track auth flow steps
let authFlowSteps: AuthFlowStep[] = [];
const MAX_FLOW_STEPS = 100;

// Helper to add log
function addLog(log: Partial<DebugLog>) {
  debugLogs.unshift({
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    ...log
  });
  
  // Keep only last MAX_LOGS entries
  if (debugLogs.length > MAX_LOGS) {
    debugLogs = debugLogs.slice(0, MAX_LOGS);
  }
}

// Helper to track auth flow
function addAuthFlow(step: string, details: Record<string, unknown>) {
  authFlowSteps.unshift({
    id: `flow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    step,
    details
  });
  
  if (authFlowSteps.length > MAX_FLOW_STEPS) {
    authFlowSteps = authFlowSteps.slice(0, MAX_FLOW_STEPS);
  }
}

// THIS IS A PUBLIC ENDPOINT - NO AUTH REQUIRED FOR DEBUGGING
export async function GET(request: NextRequest) {
  try {
    // Get all possible auth information
    const session = await getServerSession(authOptions).catch(() => null);
    const token = await getToken({ req: request }).catch(() => null);
    
    // Get headers and cookies (await them in Next.js 15)
    const headersList = await headers();
    const cookieStore = await cookies();
    
    // Extract ALL headers for debugging - absolutely everything
    const allHeaders: Record<string, string> = {};
    headersList.forEach((value, key) => {
      allHeaders[key] = value;
    });
    
    // Extract ALL cookies - no masking in development
    const allCookies: Record<string, string> = {};
    cookieStore.getAll().forEach(cookie => {
      // Show full cookie values for debugging
      allCookies[cookie.name] = cookie.value || '[EMPTY]';
    });
    
    // Test database connection
    let databaseStatus = { connected: false, message: 'Not tested', details: undefined as Record<string, unknown> | undefined };
    try {
      const userCount = await prisma.user.count();
      const dbUrl = process.env.DATABASE_URL ?? '';
      const urlParts = dbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:\/]+):?(\d+)?\/(.+)/);
      
      // Get more database info
      const [roleCount, districtCount, schoolCount] = await Promise.all([
        prisma.role.count(),
        prisma.district.count(),
        prisma.school.count()
      ]);
      
      databaseStatus = {
        connected: true,
        message: `Connected to database with ${userCount} users`,
        details: {
          host: urlParts?.[3] || 'unknown',
          port: urlParts?.[4] || '5432',
          database: urlParts?.[5]?.split('?')[0] || 'unknown',
          pooling: dbUrl.includes('pgbouncer') ? 'pgbouncer' : 'direct',
          userCount,
          roleCount,
          districtCount,
          schoolCount,
          fullUrl: dbUrl, // Show full database URL for debugging
          directUrl: process.env.DIRECT_URL || 'not set',
          urlParams: dbUrl.split('?')[1] || 'no params'
        }
      };
      
      // Add database connection log
      addLog({
        type: 'database',
        level: 'info',
        message: `Database connected: ${userCount} users found`,
        details: databaseStatus.details
      });
    } catch (dbError: unknown) {
      databaseStatus = {
        connected: false,
        message: dbError instanceof Error ? dbError.message : 'Database connection failed',
        details: {
          error: dbError instanceof Error ? dbError.message : "Unknown error",
          code: (dbError as { code?: string })?.code,
          stack: process.env.NODE_ENV === 'development' && dbError instanceof Error ? dbError.stack : undefined
        }
      };
      
      // Add database error log
      addLog({
        type: 'database',
        level: 'error',
        message: 'Database connection failed',
        details: databaseStatus.details,
        errorStack: dbError instanceof Error ? dbError.stack : undefined
      });
    }
    
    // Check NextAuth configuration
    const nextAuthStatus = {
      configured: false,
      message: 'Checking configuration...',
      details: null as Record<string, unknown> | null
    };
    
    try {
      const hasSecret = !!process.env.NEXTAUTH_SECRET;
      const hasUrl = !!process.env.NEXTAUTH_URL;
      const url = process.env.NEXTAUTH_URL ?? '';
      const secret = process.env.NEXTAUTH_SECRET ?? '';
      
      // Get all NextAuth-related environment variables
      const nextAuthEnv = {
        NEXTAUTH_URL: process.env.NEXTAUTH_URL || '[NOT SET]',
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || '[NOT SET]',
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '[NOT SET]',
        GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '[NOT SET]',
        VERCEL_URL: process.env.VERCEL_URL || '[NOT SET]',
        VERCEL_ENV: process.env.VERCEL_ENV || '[NOT SET]',
        NODE_ENV: process.env.NODE_ENV || '[NOT SET]'
      };
      
      nextAuthStatus.configured = hasSecret && hasUrl;
      nextAuthStatus.message = nextAuthStatus.configured ? 'NextAuth configured' : 'Missing configuration';
      nextAuthStatus.details = {
        NEXTAUTH_SECRET: hasSecret ? secret : '[MISSING]',
        NEXTAUTH_URL: hasUrl ? url : '[MISSING]',
        NODE_ENV: process.env.NODE_ENV,
        providers: ['credentials', 'google'],
        sessionStrategy: 'jwt',
        allEnvVars: nextAuthEnv,
        currentSession: session ? { 
          user: session.user?.email,
          expires: session.expires,
          raw: session
        } : null,
        currentToken: token ? {
          email: token.email,
          id: token.id,
          exp: token.exp ? new Date(Number(token.exp) * 1000).toISOString() : null,
          iat: token.iat ? new Date(Number(token.iat) * 1000).toISOString() : null,
          raw: token
        } : null
      };
      
      // Add NextAuth status log
      addLog({
        type: 'env_check',
        level: nextAuthStatus.configured ? 'info' : 'warning',
        message: `NextAuth ${nextAuthStatus.configured ? 'properly configured' : 'missing configuration'}`,
        details: nextAuthStatus.details
      });
    } catch (authError: unknown) {
      nextAuthStatus.configured = false;
      nextAuthStatus.message = 'Failed to check NextAuth configuration';
      nextAuthStatus.details = { error: authError instanceof Error ? authError.message : "Unknown error" };
    }
    
    // Check environment variables
    const envStatus = {
      variables: {
        DATABASE_URL: !!process.env.DATABASE_URL,
        NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
        NEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
        GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
        NODE_ENV: !!process.env.NODE_ENV
      },
      message: 'Environment variables status'
    };
    
    // Session status
    const sessionStatus = {
      active: !!session,
      user: session?.user ?? null,
      token: token ? {
        email: token.email,
        id: token.id,
        exp: token.exp,
        iat: token.iat,
        staff: token.staff ?? null,
        capabilities: token.capabilities ?? [],
        is_system_admin: token.is_system_admin,
        is_school_admin: token.is_school_admin,
        raw: token // Full token for debugging
      } : null
    };
    
    // System status
    const systemStatus = {
      database: databaseStatus,
      nextAuth: nextAuthStatus,
      environment: envStatus,
      session: sessionStatus,
      cookies: allCookies,
      headers: allHeaders
    };
    
    // Add current status check log
    addLog({
      type: 'session_check',
      level: 'debug',
      message: `Session check: ${session ? 'Active' : 'No session'}`,
      details: {
        session: sessionStatus,
        ip: allHeaders['x-forwarded-for'] || allHeaders['x-real-ip'] || 'unknown',
        userAgent: allHeaders['user-agent'],
        allHeaders: Object.keys(allHeaders).length
      }
    });
    
    // Add process information
    const processInfo = {
      pid: process.pid,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      cwd: process.cwd(),
      env: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL,
        VERCEL_ENV: process.env.VERCEL_ENV,
        VERCEL_URL: process.env.VERCEL_URL,
        VERCEL_REGION: process.env.VERCEL_REGION
      }
    };
    
    return NextResponse.json({
      logs: debugLogs,
      authFlow: authFlowSteps,
      systemStatus,
      processInfo,
      timestamp: new Date().toISOString()
    });
  } catch (error: unknown) {
    // Even if everything fails, return whatever we can
    addLog({
      type: 'error',
      level: 'critical',
      message: 'Debug endpoint critical error',
      details: { error: error instanceof Error ? error.message : "Unknown error" },
      errorStack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json({
      logs: debugLogs,
      systemStatus: null,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

// THIS IS A PUBLIC ENDPOINT - NO AUTH REQUIRED FOR DEBUGGING
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Get request metadata (await headers in Next.js 15)
    const headersList = await headers();
    const ip = (headersList.get('x-forwarded-for') || headersList.get('x-real-ip')) ?? 'unknown';
    const userAgent = headersList.get('user-agent') ?? 'unknown';
    
    // Enhanced logging for sign-in attempts
    if (body.type === 'signin_attempt' && body.details?.email && body.details?.password) {
      try {
        // Try to validate credentials directly
        const user = await prisma.user.findUnique({
          where: { email: body.details.email },
          include: {
            Staff: {
              include: {
                Role: true,
                Department: true,
                School: true,
                District: true
              }
            }
          }
        });
        
        if (!user) {
          addLog({
            type: 'signin_attempt',
            level: 'error',
            message: `Sign-in failed: User not found`,
            email: body.details.email,
            details: { 
              error: 'USER_NOT_FOUND',
              email: body.details.email,
              timestamp: new Date().toISOString()
            },
            ip,
            userAgent
          });
        } else if (!user.hashedPassword) {
          addLog({
            type: 'signin_attempt',
            level: 'error',
            message: `Sign-in failed: No password set`,
            email: body.details.email,
            details: { 
              error: 'NO_PASSWORD',
              userId: user.id,
              email: user.email
            },
            ip,
            userAgent
          });
        } else {
          // Test password
          const isValidPassword = await bcrypt.compare(body.details.password as string, user.hashedPassword as string);
          
          addLog({
            type: 'signin_attempt',
            level: isValidPassword ? 'info' : 'error',
            message: isValidPassword ? 
              `Password validation successful for ${user.email}` : 
              `Password validation failed for ${user.email}`,
            email: user.email,
            details: {
              userId: user.id,
              email: user.email,
              passwordValid: isValidPassword,
              hasStaff: !!user.Staff?.length,
              staffRole: user.Staff?.[0]?.Role?.title,
              timestamp: new Date().toISOString()
            },
            ip,
            userAgent
          });
          
          // If password is valid, check NextAuth flow
          if (isValidPassword) {
            // Log what NextAuth should receive
            addLog({
              type: 'callback',
              level: 'info',
              message: 'NextAuth should receive valid user object',
              email: user.email,
              details: {
                userData: {
                  id: String(user.id),
                  email: user.email,
                  name: user.name,
                  hasStaff: !!user.Staff?.length,
                  staffData: user.Staff?.[0] || null
                }
              }
            });
            
            // Track auth flow
            addAuthFlow('credentials_validated', {
              email: user.email,
              userId: user.id,
              hasStaff: !!user.Staff?.length,
              role: user.Staff?.[0]?.Role?.title
            });
          }
        }
      } catch (dbError: unknown) {
        addLog({
          type: 'error',
          level: 'error',
          message: 'Database error during sign-in validation',
          email: body.details?.email,
          details: { 
            error: dbError instanceof Error ? dbError.message : "Unknown error",
            code: (dbError as { code?: string })?.code 
          },
          errorStack: dbError instanceof Error ? dbError.stack : undefined,
          ip,
          userAgent
        });
      }
    } else {
      // Regular log entry
      addLog({
        ...body,
        ip,
        userAgent,
        sessionId: request.cookies.get('next-auth.session-token')?.value?.substring(0, 10) || null
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      logId: debugLogs[0]?.id,
      totalLogs: debugLogs.length 
    });
  } catch (error: unknown) {
    // Log the error but still return success
    addLog({
      type: 'error',
      level: 'error',
      message: 'Failed to process log entry',
      details: { error: error instanceof Error ? error.message : "Unknown error" },
      errorStack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    });
  }
}

// Clear logs
export async function DELETE() {
  debugLogs = [];
  authFlowSteps = [];
  return NextResponse.json({ success: true, message: 'Logs and auth flow cleared' });
}
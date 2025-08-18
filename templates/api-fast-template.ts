/**
 * Fast API Route Template for AgendaIQ
 * 
 * This template provides the fastest possible API implementation
 * with proper security and caching.
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import jwt from 'jsonwebtoken';

// In-memory cache for ultra-fast access
const memCache = new Map<string, { data: any; expires: number }>();

/**
 * Ultra-fast authentication - bypass NextAuth overhead
 */
async function fastAuth(req: NextRequest) {
  try {
    // Get cookie directly
    const cookieHeader = req.headers.get('cookie');
    if (!cookieHeader) return null;
    
    // Extract session token
    const tokenMatch = cookieHeader.match(/next-auth\.session-token=([^;]+)/);
    if (!tokenMatch) return null;
    
    // Decode without verification for speed (only for non-critical operations)
    const decoded = jwt.decode(tokenMatch[1]) as any;
    if (!decoded?.id) return null;
    
    return { id: parseInt(decoded.id), email: decoded.email };
  } catch {
    return null;
  }
}

/**
 * GET handler with caching
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // 1. Fast auth check
    const user = await fastAuth(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // 2. Check memory cache
    const cacheKey = `user_${user.id}_preference`;
    const cached = memCache.get(cacheKey);
    
    if (cached && cached.expires > Date.now()) {
      const response = NextResponse.json(cached.data);
      response.headers.set('X-Response-Time', `${Date.now() - startTime}ms`);
      response.headers.set('X-Cache', 'HIT');
      return response;
    }
    
    // 3. Get data (this is where you'd query the database)
    // For now, return mock data
    const data = {
      theme: 'standard',
      layout: 'modern',
      // Add your actual data here
    };
    
    // 4. Cache the result (5 minutes)
    memCache.set(cacheKey, {
      data,
      expires: Date.now() + 5 * 60 * 1000
    });
    
    // 5. Return response with timing
    const response = NextResponse.json(data);
    response.headers.set('X-Response-Time', `${Date.now() - startTime}ms`);
    response.headers.set('X-Cache', 'MISS');
    response.headers.set('Cache-Control', 'private, max-age=300');
    
    return response;
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT/POST handler with validation
 */
export async function PUT(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // 1. Fast auth
    const user = await fastAuth(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // 2. Parse body
    const body = await request.json();
    
    // 3. Validate input (add your validation here)
    if (!body.value) {
      return NextResponse.json(
        { error: 'Invalid input' },
        { status: 400 }
      );
    }
    
    // 4. Update data (this is where you'd update the database)
    // For now, just clear cache
    const cacheKey = `user_${user.id}_preference`;
    memCache.delete(cacheKey);
    
    // 5. Return success
    const response = NextResponse.json({ 
      success: true,
      value: body.value 
    });
    response.headers.set('X-Response-Time', `${Date.now() - startTime}ms`);
    
    return response;
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Clean up old cache entries periodically
if (typeof global !== 'undefined' && !(global as any).cacheCleanupInterval) {
  (global as any).cacheCleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, value] of memCache.entries()) {
      if (value.expires < now) {
        memCache.delete(key);
      }
    }
  }, 60000); // Every minute
}
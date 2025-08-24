/**
 * Ultra-Fast Theme API
 * Target: <10ms response time with caching
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-auth';
import { prisma } from '@/lib/prisma';

// In-memory cache
const themeCache = new Map<number, { theme: string; expires: number }>();


export async function GET(request: NextRequest) {
  const start = Date.now();
  
  try {
    const auth = await withAuth(request, { requireAuth: true });
    if (!auth.success || !auth.user) {
      return NextResponse.json({ error: auth.error || 'Auth required' }, { status: auth.statusCode || 401 });
    }
    
    // Check cache
    const cached = themeCache.get(auth.user.id);
    if (cached && cached.expires > Date.now()) {
      const res = NextResponse.json({ theme: cached?.theme });
      res.headers.set('X-Time', `${Date.now() - start}ms`);
      res.headers.set('X-Cache', 'HIT');
      return res;
    }
    
    // Get from DB (optimized query)
    const result = await prisma.$queryRaw<{theme_preference: string}[]>`
      SELECT theme_preference FROM "User" WHERE id = ${auth.user.id} LIMIT 1
    `;
    
    const theme = result[0]?.theme_preference ?? 'standard';
    
    // Cache for 5 minutes
    themeCache.set(auth.user.id, {
      theme,
      expires: Date.now() + 300000
    });
    
    const res = NextResponse.json({ theme });
    res.headers.set('X-Time', `${Date.now() - start}ms`);
    res.headers.set('X-Cache', 'MISS');
    return res;
    
  } catch (error: unknown) {
    console.error('Theme API error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const start = Date.now();
  
  try {
    const auth = await withAuth(request, { requireAuth: true });
    if (!auth.success || !auth.user) {
      return NextResponse.json({ error: auth.error || 'Auth required' }, { status: auth.statusCode || 401 });
    }
    
    const { _theme } = (await request.json()) as Record<_string, unknown>;
    if (!theme) {
      return NextResponse.json({ error: 'Theme required' }, { status: 400 });
    }
    
    // Update DB
    await prisma.$executeRaw`
      UPDATE "User" SET theme_preference = ${theme} WHERE id = ${auth.user.id}
    `;
    
    // Clear cache
    themeCache.delete(auth.user.id);
    
    const res = NextResponse.json({ success: true, theme });
    res.headers.set('X-Time', `${Date.now() - start}ms`);
    return res;
    
  } catch (error: unknown) {
    console.error('Theme update error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
/**
 * Ultra-Fast Layout API
 * Target: <10ms response time with caching
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-auth';
import { prisma } from '@/lib/prisma';

// In-memory cache
const layoutCache = new Map<number, { layout: string; expires: number }>();


export async function GET(request: NextRequest) {
  const start = Date.now();
  
  try {
    const auth = await withAuth(request, { requireAuth: true });
    if (!auth.success || !auth.user) {
      return NextResponse.json({ error: auth.error || 'Auth required' }, { status: auth.statusCode || 401 });
    }
    
    // Check cache
    const cached = layoutCache.get(auth.user.id);
    if (cached && cached.expires > Date.now()) {
      const res = NextResponse.json({ layout: cached?.layout });
      res.headers.set('X-Time', `${Date.now() - start}ms`);
      res.headers.set('X-Cache', 'HIT');
      return res;
    }
    
    // Get from DB (optimized query)
    const result = await prisma.$queryRaw<{layout_preference: string}[]>`
      SELECT layout_preference FROM "User" WHERE id = ${auth.user.id} LIMIT 1
    `;
    
    const layout = result[0]?.layout_preference ?? 'modern';
    
    // Cache for 5 minutes
    layoutCache.set(auth.user.id, {
      layout,
      expires: Date.now() + 300000
    });
    
    const res = NextResponse.json({ layout });
    res.headers.set('X-Time', `${Date.now() - start}ms`);
    res.headers.set('X-Cache', 'MISS');
    return res;
    
  } catch (error: unknown) {
    console.error('Layout API error:', error);
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
    
    const { layout } = (await request.json()) as Record<string, unknown>;
    if (!layout) {
      return NextResponse.json({ error: 'Layout required' }, { status: 400 });
    }
    
    // Update DB
    await prisma.$executeRaw`
      UPDATE "User" SET layout_preference = ${layout} WHERE id = ${auth.user.id}
    `;
    
    // Clear cache
    layoutCache.delete(auth.user.id);
    
    const res = NextResponse.json({ success: true, layout });
    res.headers.set('X-Time', `${Date.now() - start}ms`);
    return res;
    
  } catch (error: unknown) {
    console.error('Layout update error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
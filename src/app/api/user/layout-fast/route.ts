/**
 * Ultra-Fast Layout API
 * Target: <10ms response time with caching
 */

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

// In-memory cache
const layoutCache = new Map<number, { layout: string; expires: number }>();

// Fast auth without NextAuth overhead
async function getFastUser(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get('cookie');
    if (!cookieHeader) return null;
    
    // Try both development and production cookie names
    const tokenMatch = cookieHeader.match(/next-auth\.session-token=([^;]+)/) ||
                      cookieHeader.match(/__Secure-next-auth\.session-token=([^;]+)/);
    if (!tokenMatch) return null;
    
    const decoded = jwt.decode(tokenMatch[1]) as Record<string, unknown>;
    
    // NextAuth stores user data differently - check various fields
    const userId = decoded?.id ?? decoded?.sub ?? decoded?.userId;
    const userEmail = decoded?.email ?? decoded?.userEmail;
    
    if (!userId) return null;
    
    return { 
      id: typeof userId === 'string' ? parseInt(userId) : userId, 
      email: userEmail ?? 'unknown'
    };
  } catch (error: unknown) {
    console.error('Fast auth error:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  const start = Date.now();
  
  try {
    // Fast auth
    const user = await getFastUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Auth required' }, { status: 401 });
    }
    
    // Check cache
    const cached = layoutCache.get(user?.id);
    if (cached && cached.expires > Date.now()) {
      const res = NextResponse.json({ layout: cached?.layout });
      res.headers.set('X-Time', `${Date.now() - start}ms`);
      res.headers.set('X-Cache', 'HIT');
      return res;
    }
    
    // Get from DB (optimized query)
    const result = await prisma.$queryRaw<{layout_preference: string}[]>`
      SELECT layout_preference FROM "User" WHERE id = ${user?.id} LIMIT 1
    `;
    
    const layout = result[0]?.layout_preference ?? 'modern';
    
    // Cache for 5 minutes
    layoutCache.set(user?.id, {
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
    const user = await getFastUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Auth required' }, { status: 401 });
    }
    
    const { layout } = (await request.json()) as Record<string, unknown>;
    if (!layout) {
      return NextResponse.json({ error: 'Layout required' }, { status: 400 });
    }
    
    // Update DB
    await prisma.$executeRaw`
      UPDATE "User" SET layout_preference = ${layout} WHERE id = ${user?.id}
    `;
    
    // Clear cache
    layoutCache.delete(user?.id);
    
    const res = NextResponse.json({ success: true, layout });
    res.headers.set('X-Time', `${Date.now() - start}ms`);
    return res;
    
  } catch (error: unknown) {
    console.error('Layout update error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
/**
 * Ultra-Fast Theme API
 * Target: <10ms response time with caching
 */

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

// In-memory cache
const themeCache = new Map<number, { theme: string; expires: number }>();

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
    const cached = themeCache.get(user?.id);
    if (cached && cached.expires > Date.now()) {
      const res = NextResponse.json({ theme: cached?.theme });
      res.headers.set('X-Time', `${Date.now() - start}ms`);
      res.headers.set('X-Cache', 'HIT');
      return res;
    }
    
    // Get from DB (optimized query)
    const result = await prisma.$queryRaw<{theme_preference: string}[]>`
      SELECT theme_preference FROM "User" WHERE id = ${user?.id} LIMIT 1
    `;
    
    const theme = result[0]?.theme_preference ?? 'standard';
    
    // Cache for 5 minutes
    themeCache.set(user?.id, {
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
    const user = await getFastUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Auth required' }, { status: 401 });
    }
    
    const { theme } = (await request.json()) as Record<string, unknown>;
    if (!theme) {
      return NextResponse.json({ error: 'Theme required' }, { status: 400 });
    }
    
    // Update DB
    await prisma.$executeRaw`
      UPDATE "User" SET theme_preference = ${theme} WHERE id = ${user?.id}
    `;
    
    // Clear cache
    themeCache.delete(user?.id);
    
    const res = NextResponse.json({ success: true, theme });
    res.headers.set('X-Time', `${Date.now() - start}ms`);
    return res;
    
  } catch (error: unknown) {
    console.error('Theme update error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
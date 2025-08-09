import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    status: 'ok',
    environment: process.env.NODE_ENV,
    vercel: !!process.env.VERCEL,
    message: 'Simple endpoint working'
  });
}
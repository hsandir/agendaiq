import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/api-auth'
import { Capability } from '@/lib/auth/policy'
import fs from 'fs/promises'
import path from 'path'

const CONFIG_FILE = path.join(process.cwd(), 'page-config.json')

export async function GET(request: NextRequest) {
  const authResult = await withAuth(request, { requireAuth: true, requireCapability: Capability.OPS_HEALTH })
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode })
  }
  try {
    try {
      const configData = await fs.readFile(CONFIG_FILE, 'utf-8')
      const config = JSON.parse(configData)
      return NextResponse.json(config)
    } catch (error) {
      return NextResponse.json({ 
        configs: [],
        environment: 'production' 
      })
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to load configuration' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const authResult = await withAuth(request, { requireAuth: true, requireCapability: Capability.OPS_HEALTH })
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode })
  }
  try {
    const data = await request.json() as Record<string, unknown>;
    await fs.writeFile(
      CONFIG_FILE,
      JSON.stringify(data, null, 2),
      'utf-8'
    )
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to save configuration' },
      { status: 500 }
    )
  }
}
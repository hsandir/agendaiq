import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const CONFIG_FILE = path.join(process.cwd(), 'page-config.json')

export async function GET() {
  try {
    // Try to read existing configuration
    try {
      const configData = await fs.readFile(CONFIG_FILE, 'utf-8')
      const config = JSON.parse(configData)
      return NextResponse.json(config)
    } catch (error) {
      // Return default if no config exists
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
  try {
    const data = await request.json()
    
    // Save configuration to file
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
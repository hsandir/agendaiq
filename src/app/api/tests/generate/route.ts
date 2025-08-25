import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/api-auth'
import { Capability } from '@/lib/auth/policy';
import { TestGenerator } from '@/lib/testing/test-generator'
import fs from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
  const authResult = await withAuth(request, { requireAuth: true, requireCapability: Capability.USER_MANAGE });
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
  }

  try {
    const { filePath } = await request.json();
    if (!filePath) {
      return NextResponse.json(
        { error: 'File path is required' },
        { status: 400 }
      );
    }

    // Check if file exists
    const fullPath = path.join(process.cwd(), filePath)
    try {
      await fs.access(fullPath);
    } catch {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Generate test
    const { testPath, content } = await TestGenerator.generateTestForFile(fullPath);
    const fullTestPath = path.join(process.cwd(), testPath)

    // Create directory if it doesn't exist
    await fs.mkdir(path.dirname(fullTestPath), { recursive: true })

    // Check if test already exists
    let exists = false
    try {
      await fs.access(fullTestPath);
      exists = true
    } catch {
      // File doesn't exist, which is what we want
    }

    if (exists) {
      return NextResponse.json({
        success: false,
        message: 'Test file already exists',
        testPath,
        exists: true
      });
    }

    // Write test file
    await fs.writeFile(fullTestPath, content, 'utf-8');
    return NextResponse.json({
      success: true,
      message: 'Test generated successfully',
      testPath,
      content
    });
  } catch (error: unknown) {
    console.error('Failed to generate test:', error);
    return NextResponse.json(
      { error: 'Failed to generate test' },
      { status: 500 }
    );
  }
}

// List files without tests
export async function GET(request: NextRequest) {
  const authResult = await withAuth(request, { requireAuth: true, requireCapability: Capability.USER_MANAGE });
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
  }

  try {
    const { glob } = await import('glob');
    // Find all component and API files
    const componentFiles = await glob('src/components/**/*.{tsx,jsx}', {
      cwd: process.cwd(),
      ignore: ['**/node_modules/**', '**/*.test.*', '**/*.spec.*']
    })
    
    const apiFiles = await glob('src/app/api/**/route.{ts,js}', {
      cwd: process.cwd(),
      ignore: ['**/node_modules/**', '**/*.test.*', '**/*.spec.*']
    })

    // Find existing tests
    const testFiles = await glob('src/tests__/**/*.test.{ts,tsx,js,jsx}', {
      cwd: process.cwd()
    })

    // Create a map of tested files
    const testedFiles = new Set(
      testFiles.map(testFile => {
        const baseName = path.basename(testFile).replace(/\.test\.(tsx?|jsx?)$/, '')
        return baseName
      })
    )

    // Filter untested files
    const untestedComponents = componentFiles.filter(file => {
      const baseName = path.basename(file).replace(/\.(tsx?|jsx?)$/, '')
      return !testedFiles.has(baseName);
    })

    const untestedApis = apiFiles.filter(file => {
      const dirName = path.dirname(file).split('/').pop() ?? ''
      return !testedFiles.has(dirName) && !testedFiles.has('route');
    })

    return NextResponse.json({
      untested: {
        components: untestedComponents,
        apis: untestedApis,
        total: untestedComponents.length + untestedApis.length
      },
      tested: {
        total: testFiles.length
      }
    });
  } catch (error: unknown) {
    console.error('Failed to list untested files:', error);
    return NextResponse.json(
      { error: 'Failed to list untested files' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/api-auth";

// GET /api/project-management/rules - SAFE: Status and template info only
export async function GET(request: NextRequest) {
  try {
    // REQUIRED: Auth check - only admins can access project management
    const authResult = await withAuth(request, { requireAdminRole: true });
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
    }

    // SAFE: Return status and template information only
    return NextResponse.json({
      status: 'safe_mode',
      message: 'Project management in safe mode - templates available',
      workflow: {
        enabled: false,
        reason: 'Disabled for file corruption prevention'
      },
      migration: {
        enabled: false,
        reason: 'Disabled for safety - use templates instead'
      },
      templates: {
        location: 'templates/cursor-templates/',
        available: [
          'server-page-template.tsx',
          'client-page-template.tsx', 
          'api-route-template.ts',
          'README.md'
        ],
        usage: 'Copy template content and modify placeholders'
      },
      rules: {
        authStructure: 'enforced',
        variableNaming: 'enforced',
        templateUsage: 'required'
      }
    });

  } catch (error) {
    console.error('Project Management API Error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// POST /api/project-management/rules - DISABLED for safety
export async function POST(request: NextRequest) {
  return NextResponse.json({
    error: 'Project management modifications disabled for safety',
    message: 'Use templates in templates/cursor-templates/ directory',
    templates: {
      server: 'server-page-template.tsx',
      client: 'client-page-template.tsx', 
      api: 'api-route-template.ts'
    }
  }, { status: 405 });
}

// PUT /api/project-management/rules - DISABLED for safety
export async function PUT(request: NextRequest) {
  return NextResponse.json({
    error: 'Project management modifications disabled for safety',
    message: 'Use templates in templates/cursor-templates/ directory'
  }, { status: 405 });
} 
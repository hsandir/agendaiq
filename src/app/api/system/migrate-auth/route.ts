import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/api-auth";

// GET /api/system/migrate-auth - SAFE migration status (report only)
export async function GET(request: NextRequest) {
  try {
    // REQUIRED: Auth check - only admins can access migration info
    const authResult = await withAuth(request, { requireAdminRole: true });
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'status';

    switch (action) {
      case 'status':
        return NextResponse.json({
          migration: {
            status: 'disabled',
            message: 'Auto-migration disabled for safety',
            recommendation: 'Use templates for new files'
          },
          templates: {
            available: true,
            location: 'templates/cursor-templates/',
            usage: 'Copy template content and modify placeholders'
          },
          authSystem: {
            status: 'active',
            patterns: {
              serverComponents: 'requireAuth(AuthPresets.*)',
              clientComponents: 'useSession() + useRouter()',
              apiRoutes: 'withAuth(request, {...})'
            }
          }
        });

      case 'preview':
        return NextResponse.json({
          message: 'Migration preview disabled for safety',
          alternative: 'Use templates in templates/cursor-templates/ directory',
          files: [
            'server-page-template.tsx - For dashboard/settings pages',
            'client-page-template.tsx - For interactive pages',
            'api-route-template.ts - For API endpoints'
          ]
        });

      default:
        return NextResponse.json({
          error: 'Invalid action. Available: status, preview'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Migration API Error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// POST /api/system/migrate-auth - DISABLED for safety
export async function POST(request: NextRequest) {
  return NextResponse.json({
    error: 'Migration operations disabled for safety',
    message: 'Use templates in templates/cursor-templates/ directory instead',
    templates: {
      server: 'server-page-template.tsx',
      client: 'client-page-template.tsx', 
      api: 'api-route-template.ts'
    }
  }, { status: 405 });
} 
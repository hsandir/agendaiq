import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/api-auth";

// GET Method - System diagnostic (simplified)
export async function GET(request: NextRequest) {
  try {
    // REQUIRED: Auth check - Admin only for diagnostics
    const authResult = await withAuth(request, { requireAuth: true, requireStaff: true, requireAdminRole: true });
    
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error }, 
        { status: authResult.statusCode }
      );
    }

    // Simplified diagnostic response
    const diagnostics = {
      status: 'simplified',
      message: 'Diagnostic system simplified - workflow and migration removed',
      system: {
        workflow: 'disabled',
        migration: 'disabled',
        templates: 'active'
      },
      recommendations: [
        'Use templates in templates/cursor-templates/',
        'Follow auth patterns in .cursorrules',
        'Check system status via /api/system/status'
      ],
      timestamp: new Date().toISOString()
    };

    return NextResponse.json({ 
      data: diagnostics,
      message: "Diagnostic completed" 
    });

  } catch (error) {
    console.error('System Diagnostic API Error:', error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    );
  }
}

// POST Method - Simplified diagnostic actions
export async function POST(request: NextRequest) {
  try {
    // REQUIRED: Auth check - Admin only
    const authResult = await withAuth(request, { requireAuth: true, requireStaff: true, requireAdminRole: true });
    
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error }, 
        { status: authResult.statusCode }
      );
    }

    return NextResponse.json({ 
      message: "Diagnostic actions simplified - use templates instead",
      templates: 'templates/cursor-templates/'
    });

  } catch (error) {
    console.error('System Diagnostic API Error:', error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    );
  }
} 
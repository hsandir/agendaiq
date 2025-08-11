import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-auth';
import { Capability } from '@/lib/auth/policy';
import { prisma } from '@/lib/prisma';
import { AuditLogger } from '@/lib/audit/audit-logger';

export async function POST(request: NextRequest) {
  // Seed operation requires DEV_ADMIN (system admin) capabilities
  const authResult = await withAuth(request, { requireAuth: true, requireCapability: Capability.DEV_DEBUG });
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
  }

  try {
    // Create some audit logs for testing
    const auditLogs = [];
    
    // Create various types of logs
    const operations = ['CREATE', 'UPDATE', 'DELETE', 'READ', 'ERROR'];
    const tables = ['user', 'meeting', 'staff', 'school', 'district'];
    const levels = ['info', 'warn', 'error', 'debug'];
    
    for (let i = 0; i < 50; i++) {
      const operation = operations[Math.floor(Math.random() * operations.length)];
      const tableName = tables[Math.floor(Math.random() * tables.length)];
      
      auditLogs.push({
        table_name: tableName,
        record_id: `${i + 1}`,
        operation,
        source: 'SYSTEM',
        user_id: authResult.user!.id,
        staff_id: authResult.user!.staff?.id,
        field_changes: {
          before: { field: 'old_value' },
          after: { field: 'new_value' }
        },
        ip_address: request.headers.get('x-forwarded-for') || '127.0.0.1',
        user_agent: request.headers.get('user-agent') || 'Development Seeder',
        description: `${operation} operation on ${tableName}`,
        created_at: new Date(Date.now() - Math.random() * 86400000 * 7) // Random time in last 7 days
      });
    }
    
    // Create logs in batches
    await prisma.auditLog.createMany({
      data: auditLogs
    });
    
    // Create some test run logs for test history
    const testRuns = [];
    for (let i = 0; i < 10; i++) {
      const passed = Math.floor(Math.random() * 200) + 100;
      const failed = Math.floor(Math.random() * 10);
      const coverage = Math.floor(Math.random() * 30) + 60;
      const duration = Math.floor(Math.random() * 300) + 60;
      
      testRuns.push({
        table_name: 'test_run',
        record_id: `test-${Date.now()}-${i}`,
        operation: 'CREATE',
        source: 'SYSTEM',
        user_id: authResult.user!.id,
        staff_id: authResult.user!.staff?.id,
        field_changes: {
          passed,
          failed,
          coverage,
          duration
        },
        ip_address: request.headers.get('x-forwarded-for') || '127.0.0.1',
        user_agent: request.headers.get('user-agent') || 'Test Runner',
        description: `Test run completed: ${passed} passed, ${failed} failed`,
        created_at: new Date(Date.now() - i * 86400000) // One per day going back
      });
    }
    
    await prisma.auditLog.createMany({
      data: testRuns
    });
    
    // Log this operation
    await AuditLogger.logFromRequest(request, {
      tableName: 'system',
      recordId: 'seed-dev',
      operation: 'CREATE',
      userId: authResult.user!.id,
      staffId: authResult.user!.staff?.id,
      source: 'SYSTEM',
      description: 'Development data seeded'
    });
    
    // Get counts
    const logCount = await prisma.auditLog.count();
    const userCount = await prisma.user.count();
    const staffCount = await prisma.staff.count();
    
    return NextResponse.json({
      success: true,
      message: 'Development data seeded successfully',
      counts: {
        auditLogs: logCount,
        users: userCount,
        staff: staffCount,
        newLogs: auditLogs.length + testRuns.length
      }
    });
  } catch (error) {
    console.error('Failed to seed development data:', error);
    return NextResponse.json(
      { error: 'Failed to seed development data' },
      { status: 500 }
    );
  }
}
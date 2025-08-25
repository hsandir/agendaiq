const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testAuditLog() {
  try {
    // Direct Prisma ile test audit log oluştur
    const auditLog = await prisma.auditLog.create({
      data: {
        table_name: 'users',
        record_id: '1',
        operation: 'CREATE',
        new_values: { email: 'test@example.com', name: 'Test User' },
        user_id: null,
        source: 'WEB_UI',
        description: 'Test audit log entry created via script',
        ip_address: '127.0.0.1',
        user_agent: 'test-script'
      }
    });
    
    console.log('✅ Test audit log created:', auditLog.id);
    
    // Audit log'ları fetch et
    const logs = await prisma.auditLog.findMany({
      take: 5,
      orderBy: { created_at: 'desc' },
      include: {
        User: {
          select: { id: true, email: true, name: true }
        }
      }
    });
    
    console.log(`📊 Found ${logs.length} audit logs:`);
    logs.forEach(log => {
      console.log(`  - ${log.created_at.toISOString()}: ${log.operation} on ${log.table_name} (${log.description})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testAuditLog(); 
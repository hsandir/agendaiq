/**
 * Simple test for logging system using CommonJS 
 */
const path = require('path');
const { execSync } = require('child_process');

// Add src to module path
process.env.NODE_PATH = path.join(__dirname, '..', 'src');
require('module').Module._initPaths();

async function testLogging() {
  console.log('🧪 Simple Logging System Test...\n');
  
  try {
    // Import database client to test connection
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    console.log('📊 Testing database connection...');
    const userCount = await prisma.user.count();
    console.log(`✅ Database connected. Found ${userCount} users`);

    // Test creating a DevLog entry directly
    console.log('\n📝 Testing DevLog creation...');
    const devLogEntry = await prisma.devLog.create({
      data: {
        id: `dev-test-${Date.now()}`,
        timestamp: new Date(),
        level: 'INFO',
        message: 'Direct database logging test',
        category: 'system',
        environment: 'development',
        userId: 1,
        context: JSON.stringify({ 
          test: true,
          timestamp: new Date().toISOString()
        }),
        metadata: JSON.stringify({
          testType: 'direct_db',
          version: '1.0.0'
        })
      }
    });
    console.log(`✅ Created DevLog: ${devLogEntry.id}`);

    // Test creating a SecurityLog entry directly
    console.log('\n🔒 Testing SecurityLog creation...');
    const securityLogEntry = await prisma.securityLog.create({
      data: {
        id: `audit-test-${Date.now()}`,
        timestamp: new Date(),
        level: 'INFO',
        message: 'Direct security log test',
        category: 'user_action',
        action: 'test_audit_system',
        result: 'success',
        riskLevel: 'low',
        actor: JSON.stringify({
          userId: '1',
          email: 'test@example.com',
          role: 'Administrator'
        }),
        userId: 1,
        context: JSON.stringify({
          test: true,
          ip: '127.0.0.1'
        })
      }
    });
    console.log(`✅ Created SecurityLog: ${securityLogEntry.id}`);

    // Test querying logs
    console.log('\n🔍 Testing log queries...');
    const recentDevLogs = await prisma.devLog.findMany({
      take: 5,
      orderBy: { timestamp: 'desc' }
    });
    console.log(`📋 Found ${recentDevLogs.length} recent dev logs`);
    
    const recentSecurityLogs = await prisma.securityLog.findMany({
      take: 5,
      orderBy: { timestamp: 'desc' }
    });
    console.log(`🔍 Found ${recentSecurityLogs.length} recent security logs`);

    // Test statistics
    console.log('\n📊 Testing log statistics...');
    const [devCount, securityCount] = await Promise.all([
      prisma.devLog.count(),
      prisma.securityLog.count()
    ]);
    
    console.log(`📈 Development logs: ${devCount}`);
    console.log(`🛡️ Security logs: ${securityCount}`);

    await prisma.$disconnect();

    console.log('\n🎉 All direct database tests completed successfully!');
    console.log('\n📝 Summary:');
    console.log('✅ Database connection and schema working');
    console.log('✅ DevLog table creation and querying');
    console.log('✅ SecurityLog table creation and querying');
    console.log('✅ Log statistics and counting');
    console.log('✅ Professional dual-layer logging database is operational!');

  } catch (error) {
    console.error('❌ Logging test failed:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 5).join('\n')
    });
    process.exit(1);
  }
}

// Run the test
testLogging();
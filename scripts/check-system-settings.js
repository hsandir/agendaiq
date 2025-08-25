const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkSystemSettings() {
  try {
    console.log('Checking current system settings...\n');
    
    const settings = await prisma.systemSetting.findMany();
    
    if (settings.length === 0) {
      console.log('No system settings found in database.');
      console.log('Creating default system settings...\n');
      
      const defaultSettings = [
        {
          key: 'school_name',
          value: 'CJCP Somerset'
        },
        {
          key: 'academic_year',
          value: '2024-2025'
        },
        {
          key: 'timezone',
          value: 'UTC'
        },
        {
          key: 'two_factor_required',
          value: true
        },
        {
          key: 'password_policy_enabled',
          value: true
        },
        {
          key: 'session_timeout_minutes',
          value: 30
        },
        {
          key: 'smtp_server',
          value: 'smtp.example.com'
        },
        {
          key: 'smtp_port',
          value: 587
        },
        {
          key: 'sender_email',
          value: 'noreply@cjcp.edu'
        },
        {
          key: 'automatic_backups_enabled',
          value: true
        },
        {
          key: 'backup_frequency',
          value: 'daily'
        },
        {
          key: 'backup_retention_days',
          value: 30
        }
      ];
      
      for (const setting of defaultSettings) {
        await prisma.systemSetting.upsert({
          where: { key: setting.key },
          update: setting,
          create: setting
        });
        console.log(`✓ Created/Updated: ${setting.key} = ${JSON.stringify(setting.value)}`);
      }
      
      console.log('\nDefault system settings created successfully!');
    } else {
      console.log('Current system settings:');
      settings.forEach(setting => {
        console.log(`- ${setting.key}: ${JSON.stringify(setting.value)}`);
      });
    }
    
  } catch (error) {
    console.error('Error checking system settings:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSystemSettings(); 
#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Property mapping from PascalCase to snake_case
const propertyMappings = {
  // User model properties
  'hashedPassword': 'hashed_password',
  'emailVerified': 'email_verified',
  'isSystemAdmin': 'is_system_admin',
  'isSchoolAdmin': 'is_school_admin',
  'isAdmin': 'is_admin',
  'twoFactorEnabled': 'two_factor_enabled',
  'twoFactorSecret': 'two_factor_secret',
  'backupCodes': 'backup_codes',
  'createdAt': 'created_at',
  'updatedAt': 'updated_at',
  'loginNotificationsEnabled': 'login_notifications_enabled',
  'suspiciousAlertsEnabled': 'suspicious_alerts_enabled',
  'rememberDevicesEnabled': 'remember_devices_enabled',
  'themePreference': 'theme_preference',
  'layoutPreference': 'layout_preference',
  'customTheme': 'custom_theme',
  
  // Staff model properties
  'userId': 'user_id',
  'roleId': 'role_id',
  'departmentId': 'department_id',
  'schoolId': 'school_id',
  'districtId': 'district_id',
  'managerId': 'manager_id',
  'hireDate': 'hire_date',
  'isActive': 'is_active',
  
  // Meeting properties
  'meetingId': 'meeting_id',
  'staffId': 'staff_id',
  'presenterId': 'presenter_id',
  'teamId': 'team_id',
  'templateId': 'template_id',
  
  // Other common properties
  'providerAccountId': 'provider_account_id',
  'refreshToken': 'refresh_token',
  'accessToken': 'access_token',
  'expiresAt': 'expires_at',
  'tokenType': 'token_type',
  'idToken': 'id_token',
  'sessionState': 'session_state'
};

// Patterns to find and replace
const patterns = [
  // Direct property access
  { pattern: /\.hashedPassword/g, replacement: '.hashed_password' },
  { pattern: /\.emailVerified/g, replacement: '.email_verified' },
  { pattern: /\.isSystemAdmin/g, replacement: '.is_system_admin' },
  { pattern: /\.isSchoolAdmin/g, replacement: '.is_school_admin' },
  { pattern: /\.isAdmin(?!\w)/g, replacement: '.is_admin' },
  { pattern: /\.twoFactorEnabled/g, replacement: '.two_factor_enabled' },
  { pattern: /\.twoFactorSecret/g, replacement: '.two_factor_secret' },
  { pattern: /\.backupCodes/g, replacement: '.backup_codes' },
  { pattern: /\.createdAt/g, replacement: '.created_at' },
  { pattern: /\.updatedAt/g, replacement: '.updated_at' },
  { pattern: /\.loginNotificationsEnabled/g, replacement: '.login_notifications_enabled' },
  { pattern: /\.suspiciousAlertsEnabled/g, replacement: '.suspicious_alerts_enabled' },
  { pattern: /\.rememberDevicesEnabled/g, replacement: '.remember_devices_enabled' },
  { pattern: /\.themePreference/g, replacement: '.theme_preference' },
  { pattern: /\.layoutPreference/g, replacement: '.layout_preference' },
  { pattern: /\.customTheme/g, replacement: '.custom_theme' },
  
  // Destructuring and object properties
  { pattern: /\bhashedPassword:/g, replacement: 'hashed_password:' },
  { pattern: /\bemailVerified:/g, replacement: 'email_verified:' },
  { pattern: /\bisSystemAdmin:/g, replacement: 'is_system_admin:' },
  { pattern: /\bisSchoolAdmin:/g, replacement: 'is_school_admin:' },
  { pattern: /\btwoFactorEnabled:/g, replacement: 'two_factor_enabled:' },
  { pattern: /\btwoFactorSecret:/g, replacement: 'two_factor_secret:' },
  { pattern: /\bbackupCodes:/g, replacement: 'backup_codes:' },
  { pattern: /\bcreatedAt:/g, replacement: 'created_at:' },
  { pattern: /\bupdatedAt:/g, replacement: 'updated_at:' },
  
  // Optional chaining
  { pattern: /\?\.hashedPassword/g, replacement: '?.hashed_password' },
  { pattern: /\?\.emailVerified/g, replacement: '?.email_verified' },
  { pattern: /\?\.isSystemAdmin/g, replacement: '?.is_system_admin' },
  { pattern: /\?\.isSchoolAdmin/g, replacement: '?.is_school_admin' },
  { pattern: /\?\.twoFactorEnabled/g, replacement: '?.two_factor_enabled' },
  { pattern: /\?\.twoFactorSecret/g, replacement: '?.two_factor_secret' },
  { pattern: /\?\.backupCodes/g, replacement: '?.backup_codes' },
  { pattern: /\?\.createdAt/g, replacement: '?.created_at' },
  { pattern: /\?\.updatedAt/g, replacement: '?.updated_at' },
  
  // Bracket notation
  { pattern: /\['hashedPassword'\]/g, replacement: "['hashed_password']" },
  { pattern: /\["hashedPassword"\]/g, replacement: '["hashed_password"]' },
  { pattern: /\['emailVerified'\]/g, replacement: "['email_verified']" },
  { pattern: /\["emailVerified"\]/g, replacement: '["email_verified"]' },
  { pattern: /\['isSystemAdmin'\]/g, replacement: "['is_system_admin']" },
  { pattern: /\["isSystemAdmin"\]/g, replacement: '["is_system_admin"]' },
  { pattern: /\['isSchoolAdmin'\]/g, replacement: "['is_school_admin']" },
  { pattern: /\["isSchoolAdmin"\]/g, replacement: '["is_school_admin"]' },
];

// Files to process
const filesToProcess = [
  'src/**/*.ts',
  'src/**/*.tsx',
  '!src/**/*.test.ts',
  '!src/**/*.test.tsx',
  '!node_modules/**',
  '!.next/**',
  '!dist/**'
];

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    const originalContent = content;

    // Apply all patterns
    patterns.forEach(({ pattern, replacement }) => {
      const newContent = content.replace(pattern, replacement);
      if (newContent !== content) {
        content = newContent;
        modified = true;
      }
    });

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed: ${filePath}`);
      return 1;
    }
    return 0;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return 0;
  }
}

async function main() {
  console.log('🔍 Finding files to process...');
  
  const files = [];
  filesToProcess.forEach(pattern => {
    if (pattern.startsWith('!')) {
      // Ignore pattern
      return;
    }
    const matches = glob.sync(pattern, {
      ignore: ['**/node_modules/**', '**/.next/**', '**/dist/**']
    });
    files.push(...matches);
  });

  const uniqueFiles = [...new Set(files)];
  console.log(`📁 Found ${uniqueFiles.length} files to check`);

  let fixedCount = 0;
  uniqueFiles.forEach(file => {
    fixedCount += processFile(file);
  });

  console.log(`\n✨ Done! Fixed ${fixedCount} files`);
}

main().catch(console.error);
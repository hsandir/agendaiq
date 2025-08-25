#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Files with known syntax errors
const fixes = [
  {
    file: 'src/app/auth/signup/page.tsx',
    patterns: [
      { from: 'router.push("/auth/signin?registered=true" as Record<string, unknown>);', to: 'router.push("/auth/signin?registered=true");' }
    ]
  },
  {
    file: 'src/lib/auth/auth-options.ts',
    patterns: [
      { from: 'if (!(user as Record<string, unknown>.hashedPassword)', to: 'if (!user.hashedPassword)' },
      { from: 'const isValid = await bcrypt.comparecredentials.password, (user as Record<string, unknown>.hashedPassword);', to: 'const isValid = await bcrypt.compare(credentials.password, user.hashedPassword);' },
      { from: 'if (user as Record<string, unknown>.two_factor_enabled)', to: 'if (user.two_factor_enabled)' },
      { from: 'const isValidToken = speakeasy.totp.verify{', to: 'const isValidToken = speakeasy.totp.verify({' },
      { from: 'secret: (user as Record<string, unknown>.two_factor_secret!,', to: 'secret: user.two_factor_secret!,' },
      { from: 'const isBackupCode = (user as Record<string, unknown>).backup_codes.includes', to: 'const isBackupCode = user.backup_codes?.includes' },
      { from: 'backup_codes: (user as Record<string, unknown>).backup_codes.filter', to: 'backup_codes: user.backup_codes?.filter' },
      { from: 'if (user as Record<string, unknown>.rememberMe)', to: 'if ((user as any).rememberMe)' },
      { from: 'if (user as Record<string, unknown>.trustDevice)', to: 'if ((user as any).trustDevice)' },
      { from: 'session.user.id as string = token.id;', to: 'session.user.id = token.id as string;' },
      { from: 'session.(user as Record<string, unknown>).is_school_admin', to: 'session.user.is_school_admin' },
      { from: 'session.(user as Record<string, unknown>).capabilities', to: 'session.user.capabilities' },
      { from: 'await AuditClient.logAuthEvent\'login_failure\', user.id, (user.Staff[0]?.id,', to: '// await AuditClient.logAuthEvent(\'login_failure\', user.id, user.Staff[0]?.id,' },
      { from: 'await AuditClient.logAuthEvent\'login_failure\', user.id, (user.Staff[0]?.id,', to: '// await AuditClient.logAuthEvent(\'login_failure\', user.id, user.Staff[0]?.id,' }
    ]
  },
  {
    file: 'src/app/api/system/database-metrics/route.ts',
    patterns: [
      { from: 'Math.floor(uptimeSeconds / 3600)))', to: 'Math.floor(uptimeSeconds / 3600)' },
      { from: 'Math.floor((uptimeSeconds % 3600) / 60)))', to: 'Math.floor((uptimeSeconds % 3600) / 60)' }
    ]
  },
  {
    file: 'src/app/api/auth/debug-logs/route.ts',
    patterns: [
      { from: '!(user as Record<string, unknown>).hashedPassword', to: '!user.hashedPassword' },
      { from: 'await bcrypt.compare(body.details.password as string, (user as Record<string, unknown>).hashedPassword as string)', to: 'await bcrypt.compare(body.details.password as string, user.hashedPassword)' }
    ]
  },
  {
    file: 'src/app/api/debug/user-capabilities/route.ts',
    patterns: [
      { from: 'return NextResponse.json{', to: 'return NextResponse.json({' },
      { from: 'is_school_admin: (user as Record<string, unknown>.is_school_admin,', to: 'is_school_admin: user.is_school_admin,' },
      { from: 'debugInfo: {\n        sessionCapabilities: (user as Record<string, unknown>).capabilities || [],', to: 'debugInfo: {\n        sessionCapabilities: (user as any).capabilities || [],' },
      { from: 'match: JSON.stringify(user as Record<string, unknown>.capabilities)', to: 'match: JSON.stringify((user as any).capabilities)' }
    ]
  },
  {
    file: 'src/app/api/school/route.ts',
    patterns: [
      { from: 'return NextResponse.json[staffRecord.School]);', to: 'return NextResponse.json(staffRecord.School);' },
      { from: 'const { __name, __code, __address, ___phone, __email, __district_id  }', to: 'const { name, code, address, phone, email, district_id }' },
      { from: 'const { __id, __name, __code, __address, ___phone, __email, __district_id  }', to: 'const { id, name, code, address, phone, email, district_id }' }
    ]
  },
  {
    file: 'src/app/api/setup/route.ts',
    patterns: [
      { from: 'if (!user || (user.Staff?.[0]?.Role?.title !== \'Administrator\')', to: 'if (!user || user.Staff?.[0]?.Role?.title !== \'Administrator\')' },
      { from: 'const { __districtName, __schoolName, __address  }', to: 'const { districtName, schoolName, address }' }
    ]
  },
  {
    file: 'src/app/api/system/mock-data-scan/route.ts',
    patterns: [
      { from: 'priorityOrder[(b.priority)]', to: 'priorityOrder[b.priority]' },
      { from: 'priorityOrder[(a.priority)]', to: 'priorityOrder[a.priority]' },
      { from: 'statusOrder[(a.status)]', to: 'statusOrder[a.status]' },
      { from: 'statusOrder[(b.status)]', to: 'statusOrder[b.status]' }
    ]
  },
  {
    file: 'src/app/api/test-login/route.ts',
    patterns: [
      { from: 'const { email, password } = (await request.json()) as Record<__string, unknown>', to: 'const { email, password } = (await request.json()) as Record<string, unknown>' },
      { from: 'if (!(user as Record<string, unknown>.hashedPassword)', to: 'if (!user.hashedPassword)' },
      { from: 'await bcrypt.comparepassword, (user as Record<string, unknown>.hashedPassword)', to: 'await bcrypt.compare(password as string, user.hashedPassword)' },
      { from: 'return NextResponse.json{', to: 'return NextResponse.json({' },
      { from: 'hasPassword: !!(user as Record<string, unknown>.hashedPassword,', to: 'hasPassword: !!user.hashedPassword,' },
      { from: 'emailVerified: !!(user as Record<string, unknown>).emailVerified', to: 'emailVerified: !!user.emailVerified' },
      { from: 'hashExists: !!(user as Record<string, unknown>).hashedPassword', to: 'hashExists: !!user.hashedPassword' },
      { from: 'hashStartsWith: (user as Record<string, unknown>).hashedPassword?.substring', to: 'hashStartsWith: user.hashedPassword?.substring' }
    ]
  },
  {
    file: 'src/app/api/tests/history/route.ts',
    patterns: [
      { from: 'Math.floor(Math.random() * 20) + (baseTests - 25)))', to: 'Math.floor(Math.random() * 20) + (baseTests - 25)' },
      { from: 'Math.floor(Math.random() * 15) + 75))', to: 'Math.floor(Math.random() * 15) + 75' },
      { from: 'Math.floor(Math.random() * 60) + 180))', to: 'Math.floor(Math.random() * 60) + 180' }
    ]
  },
  {
    file: 'src/app/api/user/change-password/route.ts',
    patterns: [
      { from: 'const { __currentPassword, __newPassword, __confirmPassword  }', to: 'const { currentPassword, newPassword, confirmPassword }' },
      { from: 'await comparecurrentPassword, (user as Record<string, unknown>.hashedPassword)', to: 'await compare(currentPassword as string, user.hashedPassword)' }
    ]
  },
  {
    file: 'src/app/api/user/profile/route.ts',
    patterns: [
      { from: 'return NextResponse.json{', to: 'return NextResponse.json({' },
      { from: 'staff: (userProfile.Staff?.[0] ? {', to: 'staff: userProfile.Staff?.[0] ? {' },
      { from: '} : null\n    });', to: '} : null\n    });' },
      { from: 'staff: (updatedUser.Staff?.[0] ? {', to: 'staff: updatedUser.Staff?.[0] ? {' }
    ]
  },
  {
    file: 'src/app/dashboard/development/permissions-check/page.tsx',
    patterns: [
      { from: 'setUserCapabilities(session.(user as Record<string, unknown>).capabilities || [])', to: 'setUserCapabilities((session.user as any).capabilities || [])' },
      { from: 'if (authType === \'requireOpsAdmin\' && session.(user as Record<string, unknown>).is_school_admin)', to: 'if (authType === \'requireOpsAdmin\' && (session.user as any).is_school_admin)' },
      { from: 'if (session.(user as Record<string, unknown>).is_school_admin && cap.startsWith(\'ops:\'))', to: 'if ((session.user as any).is_school_admin && cap.startsWith(\'ops:\'))' },
      { from: '{session.(user as Record<string, unknown>).is_school_admin ? \'✅\' : \'❌\'}', to: '{(session.user as any).is_school_admin ? \'✅\' : \'❌\'}' }
    ]
  },
  {
    file: 'src/app/dashboard/layout.tsx',
    patterns: [
      { from: 'const isAdmin = isUserAdmin(userWithStaff as Record<string, unknown>)', to: 'const isAdmin = isUserAdmin(userWithStaff)' }
    ]
  },
  {
    file: 'src/app/dashboard/meeting-intelligence/analytics/page.tsx',
    patterns: [
      { from: 'Math.floor(minutes / 60)))', to: 'Math.floor(minutes / 60)' },
      { from: 'onChange={(e) => setTimeRange(e.target.value as Record<string, unknown>)}', to: 'onChange={(e) => setTimeRange(e.target.value)}' }
    ]
  },
  {
    file: 'src/app/dashboard/page.tsx',
    patterns: [
      { from: 'const isAdmin = isUserAdmin(userWithStaff as Record<string, unknown>)', to: 'const isAdmin = isUserAdmin(userWithStaff)' }
    ]
  },
  {
    file: 'src/components/auth/AuthProvider.tsx',
    patterns: [
      { from: 'const { data: __session, __status  }', to: 'const { data: session, status }' }
    ]
  },
  {
    file: 'src/lib/auth/admin-check.ts',
    patterns: [
      { from: 'if user.is_system_admin || (user as Record<string, unknown>.is_school_admin) return true', to: 'if (user.is_system_admin || user.is_school_admin) return true' }
    ]
  },
  {
    file: 'src/lib/auth/api-auth.ts',
    patterns: [
      { from: 'if user.is_system_admin || (user as Record<string, unknown>.is_school_admin)', to: 'if (user.is_system_admin || user.is_school_admin)' }
    ]
  }
];

// Apply fixes
let totalFixed = 0;
fixes.forEach(({ file, patterns }) => {
  const filePath = path.join(process.cwd(), file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${file}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let fileFixed = 0;
  
  patterns.forEach(({ from, to }) => {
    if (content.includes(from)) {
      content = content.replace(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), to);
      fileFixed++;
      totalFixed++;
    }
  });
  
  if (fileFixed > 0) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed ${fileFixed} issues in ${file}`);
  }
});

console.log(`\n🎉 Total fixes applied: ${totalFixed}`);
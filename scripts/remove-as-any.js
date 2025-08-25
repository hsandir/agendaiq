#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Files with 'as any' that need proper typing
const replacements = [
  // Auth-options - These need special handling for additional properties
  {
    file: 'src/lib/auth/auth-options.ts',
    changes: [
      {
        from: 'if ((user as any).rememberMe)',
        to: `if ('rememberMe' in user && user.rememberMe)`,
        addImport: false
      },
      {
        from: 'if ((user as any).trustDevice)',
        to: `if ('trustDevice' in user && user.trustDevice)`,
        addImport: false
      }
    ]
  },
  
  // Permissions check page
  {
    file: 'src/app/dashboard/development/permissions-check/page.tsx',
    changes: [
      {
        from: '(session.user as any).is_school_admin',
        to: 'session.user?.is_school_admin',
        addImport: false
      }
    ]
  },
  
  // Dashboard layout
  {
    file: 'src/app/dashboard/layout.tsx',
    changes: [
      {
        from: 'staff_id: (user as any).staff?.id || null',
        to: 'staff_id: userWithStaff?.Staff?.[0]?.id || null',
        addImport: false
      }
    ]
  },
  
  // Meeting edit form
  {
    file: 'src/app/dashboard/meetings/[id]/edit/MeetingEditForm.tsx',
    changes: [
      {
        from: 'role: (user as any).role',
        to: 'role: user.Staff?.[0]?.Role?.title',
        addImport: true
      },
      {
        from: '{user.name} ({(user as any).role})',
        to: '{user.name} ({user.Staff?.[0]?.Role?.title || "No role"})',
        addImport: false
      }
    ]
  },
  
  // Meeting pages
  {
    file: 'src/app/dashboard/meetings/[id]/edit/page.tsx',
    changes: [
      {
        from: 'meeting.organizer_id === (user as any).staff?.id',
        to: 'meeting.organizer_id === userWithStaff?.Staff?.[0]?.id',
        addImport: true
      }
    ]
  },
  {
    file: 'src/app/dashboard/meetings/[id]/live/page.tsx',
    changes: [
      {
        from: 'staff_id: (user as any).staff?.id || -1',
        to: 'staff_id: userWithStaff?.Staff?.[0]?.id || -1',
        addImport: true
      },
      {
        from: 'meeting.organizer_id === (user as any).staff?.id',
        to: 'meeting.organizer_id === userWithStaff?.Staff?.[0]?.id',
        addImport: false
      }
    ]
  },
  
  // Audit logs
  {
    file: 'src/app/dashboard/settings/audit-logs/AuditLogsClient.tsx',
    changes: [
      {
        from: '(user as any).staff?.role.key === RoleKey.OPS_ADMIN',
        to: 'user.staff?.Role?.key === RoleKey.OPS_ADMIN',
        addImport: true
      },
      {
        from: '(user as any).staff?.role.is_leadership',
        to: 'user.staff?.Role?.is_leadership',
        addImport: false
      },
      {
        from: 'log.staff_id === (user as any).staff?.id',
        to: 'log.staff_id === user.staff?.id',
        addImport: false
      },
      {
        from: 'log.Staff?.id === (user as any).staff?.id',
        to: 'log.Staff?.id === user.staff?.id',
        addImport: false
      }
    ]
  },
  
  // Setup district page
  {
    file: 'src/app/setup/district/page.tsx',
    changes: [
      {
        from: 'if (session.(user as any).staff?.role?.title !== "Administrator")',
        to: 'if (!userWithStaff?.Staff?.[0]?.Role || userWithStaff.Staff[0].Role.title !== "Administrator")',
        addImport: true
      }
    ]
  },
  
  // Meeting intelligence page
  {
    file: 'src/app/dashboard/meeting-intelligence/page.tsx',
    changes: [
      {
        from: 'staffId: (user as any).staff?.id',
        to: 'staffId: userWithStaff?.Staff?.[0]?.id',
        addImport: true
      }
    ]
  }
];

let totalFixed = 0;
let filesFixed = 0;

console.log('🔧 Removing "as any" and adding proper types...\n');

// Process each file
replacements.forEach(({ file, changes }) => {
  const filePath = path.join(process.cwd(), file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${file}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  let needsImport = false;
  
  // Apply changes
  changes.forEach(({ from, to, addImport }) => {
    if (content.includes(from)) {
      content = content.replace(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), to);
      totalFixed++;
      if (addImport) needsImport = true;
    }
  });
  
  // Add import if needed
  if (needsImport && !content.includes("from '@/types/auth'")) {
    // Find a good place to add the import
    const importRegex = /import .* from ['"]@\/.*['"];?\n/;
    const match = content.match(importRegex);
    
    if (match) {
      const lastImport = match[match.length - 1];
      content = content.replace(
        lastImport,
        lastImport + "import type { UserWithStaff, SessionUser } from '@/types/auth';\n"
      );
    }
  }
  
  // Write file if changed
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    filesFixed++;
    console.log(`✅ Fixed ${file}`);
  }
});

// Fix permissions-check page extra parentheses
const permissionsFile = path.join(process.cwd(), 'src/app/dashboard/development/permissions-check/page.tsx');
if (fs.existsSync(permissionsFile)) {
  let content = fs.readFileSync(permissionsFile, 'utf8');
  
  // Fix extra parentheses from return statements
  content = content.replace(/return \(/g, 'return ');
  content = content.replace(/return \(\(/g, 'return (');
  content = content.replace(/\)\);$/gm, ');');
  
  fs.writeFileSync(permissionsFile, content, 'utf8');
  console.log('✅ Fixed extra parentheses in permissions-check page');
}

console.log(`\n🎉 Removed ${totalFixed} "as any" usages from ${filesFixed} files`);
console.log('\n📝 Note: Some complex type assertions may need manual review');
console.log('   Run "npm run validate:agent" to check for remaining issues');
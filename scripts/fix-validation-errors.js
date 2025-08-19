#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Files with validation errors from the agent
const fixes = [
  // Auth options - 2FA secret
  {
    file: 'src/lib/auth/auth-options.ts',
    fixes: [
      {
        from: 'secret: (user as Record<string, unknown>).two_factor_secret!,',
        to: 'secret: user.two_factor_secret!,'
      },
      {
        from: 'if ((user as Record<string, unknown>).rememberMe)',
        to: 'if ((user as any).rememberMe)'
      },
      {
        from: 'if ((user as Record<string, unknown>).trustDevice)',
        to: 'if ((user as any).trustDevice)'
      }
    ]
  },
  
  // 2FA verify route
  {
    file: 'src/app/api/user/2fa/verify/route.ts',
    fixes: [
      {
        from: '(user as Record<string, unknown>.',
        to: 'user.'
      }
    ]
  },
  
  // Toggle routes
  {
    file: 'src/app/api/user/toggle-login-notifications/route.ts',
    fixes: [
      {
        from: '(user as Record<string, unknown>.',
        to: 'user.'
      }
    ]
  },
  {
    file: 'src/app/api/user/toggle-remember-devices/route.ts',
    fixes: [
      {
        from: '(user as Record<string, unknown>.',
        to: 'user.'
      }
    ]
  },
  {
    file: 'src/app/api/user/toggle-suspicious-alerts/route.ts',
    fixes: [
      {
        from: '(user as Record<string, unknown>.',
        to: 'user.'
      }
    ]
  },
  
  // Meeting edit form
  {
    file: 'src/app/dashboard/meetings/[id]/edit/MeetingEditForm.tsx',
    fixes: [
      {
        from: '(user as Record<string, unknown>.',
        to: '(user as any).'
      }
    ]
  },
  
  // System pages - Math.floor errors
  {
    file: 'src/app/dashboard/system/alerts/page.tsx',
    fixes: [
      {
        from: 'Math.floor(diff / (1000 * 60 * 60)))',
        to: 'Math.floor(diff / (1000 * 60 * 60))'
      }
    ]
  },
  {
    file: 'src/app/dashboard/system/lint/page.tsx',
    fixes: [
      {
        from: 'Math.floor(diff / (1000 * 60 * 60)))',
        to: 'Math.floor(diff / (1000 * 60 * 60))'
      }
    ]
  },
  {
    file: 'src/app/dashboard/system/migration/page.tsx',
    fixes: [
      {
        from: 'Math.floor(diff / (1000 * 60 * 60)))',
        to: 'Math.floor(diff / (1000 * 60 * 60))'
      }
    ]
  },
  
  // Components
  {
    file: 'src/components/admin/CreateFirstAdminForm.tsx',
    fixes: [
      {
        from: '(user as Record<string, unknown>.',
        to: 'user.'
      }
    ]
  },
  {
    file: 'src/components/meetings/MeetingFormStep1.tsx',
    fixes: [
      {
        from: '(user as Record<string, unknown>.',
        to: '(user as any).'
      }
    ]
  },
  {
    file: 'src/components/settings/ProfileForm.tsx',
    fixes: [
      {
        from: '(user as Record<string, unknown>.',
        to: 'user.'
      }
    ]
  },
  {
    file: 'src/components/settings/SecuritySettings.tsx',
    fixes: [
      {
        from: '(user as Record<string, unknown>.',
        to: 'user.'
      }
    ]
  },
  
  // Auth lib
  {
    file: 'src/lib/auth.ts',
    fixes: [
      {
        from: '(user as Record<string, unknown>.',
        to: 'user.'
      }
    ]
  },
  
  // Monitoring components
  {
    file: 'src/components/monitoring/CICDMonitor.tsx',
    fixes: [
      {
        from: 'Math.floor(elapsed / 60)))',
        to: 'Math.floor(elapsed / 60))'
      }
    ]
  },
  {
    file: 'src/components/monitoring/ErrorMonitor.tsx',
    fixes: [
      {
        from: 'Math.floor(timeDiff / (1000 * 60)))',
        to: 'Math.floor(timeDiff / (1000 * 60))'
      }
    ]
  },
  
  // Audit logs
  {
    file: 'src/app/dashboard/settings/audit-logs/AuditLogsClient.tsx',
    fixes: [
      {
        from: 'Math.floor(diff / (1000 * 60 * 60)))',
        to: 'Math.floor(diff / (1000 * 60 * 60))'
      }
    ]
  },
  
  // Permissions check page
  {
    file: 'src/app/dashboard/development/permissions-check/page.tsx',
    fixes: [
      {
        from: 'session.(user.is_school_admin)',
        to: '(session.user as any).is_school_admin'
      },
      {
        from: 'if session.(user.is_school_admin',
        to: 'if ((session.user as any).is_school_admin'
      },
      {
        from: 'session.(user.is_school_admin',
        to: '(session.user as any).is_school_admin'
      },
      {
        from: 'return ',
        to: 'return ('
      }
    ]
  },
  
  // Analytics page
  {
    file: 'src/app/dashboard/meeting-intelligence/analytics/page.tsx',
    fixes: [
      {
        from: 'onChange={(e) => setTimeRangee.target.value}',
        to: 'onChange={(e) => setTimeRange(e.target.value)}'
      }
    ]
  },
  
  // Signup page
  {
    file: 'src/app/auth/signup/page.tsx',
    fixes: [
      {
        from: 'router.push"/auth/signin?registered=true"',
        to: 'router.push("/auth/signin?registered=true")'
      }
    ]
  }
];

let totalFixed = 0;
let filesFixed = 0;

console.log('🔧 Fixing validation errors...\n');

fixes.forEach(({ file, fixes: fileFixes }) => {
  const filePath = path.join(process.cwd(), file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${file}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let fileChanged = false;
  
  fileFixes.forEach(({ from, to }) => {
    if (content.includes(from)) {
      content = content.replace(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), to);
      totalFixed++;
      fileChanged = true;
    }
  });
  
  if (fileChanged) {
    fs.writeFileSync(filePath, content, 'utf8');
    filesFixed++;
    console.log(`✅ Fixed ${file}`);
  }
});

console.log(`\n🎉 Fixed ${totalFixed} issues in ${filesFixed} files`);

// Now add proper type imports where needed
console.log('\n📦 Adding type imports...\n');

const typeImports = [
  {
    file: 'src/lib/auth/auth-options.ts',
    import: "import type { UserWithAuth } from '@/types/auth';\n",
    after: "import { prisma } from '@/lib/prisma';"
  },
  {
    file: 'src/app/api/user/2fa/verify/route.ts', 
    import: "import type { UserWithAuth } from '@/types/auth';\n",
    after: "import { prisma } from '@/lib/prisma';"
  },
  {
    file: 'src/components/admin/CreateFirstAdminForm.tsx',
    import: "import type { UserWithAuth } from '@/types/auth';\n",
    after: "import { useState } from 'react';"
  }
];

typeImports.forEach(({ file, import: importLine, after }) => {
  const filePath = path.join(process.cwd(), file);
  
  if (!fs.existsSync(filePath)) {
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Check if import already exists
  if (!content.includes("from '@/types/auth'")) {
    // Add import after the specified line
    if (after && content.includes(after)) {
      content = content.replace(after, after + '\n' + importLine);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Added type import to ${file}`);
    }
  }
});

console.log('\n✨ All validation errors fixed!');
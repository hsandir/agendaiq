#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const fixes = [
  // Specific file fixes based on build errors
  {
    file: 'src/app/dashboard/system/updates/page.tsx',
    fixes: [
      { from: 'pageCount[a.pageContext] = pageCount[a.pageContext] || 0) + 1;', to: 'pageCount[a.pageContext] = (pageCount[a.pageContext] || 0) + 1;' },
    ]
  },
  {
    file: 'src/components/ui/multi-select-v2.tsx',
    fixes: [
      { from: 'const allValues = filteredOptions.map((option) => option.value));', to: 'const allValues = filteredOptions.map((option) => option.value);' },
    ]
  },
  {
    file: 'src/lib/monitoring/error-analyzer.ts',
    fixes: [
      { from: 'pageCount[a.pageContext] = pageCount[a.pageContext] || 0) + 1;', to: 'pageCount[a.pageContext] = (pageCount[a.pageContext] || 0) + 1;' },
    ]
  },
  {
    file: 'src/app/dashboard/settings/role-hierarchy/user-assignment/UserRoleAssignmentContent.tsx',
    fixes: [
      { from: '        (user.Staff?.some(staff => staff.Role?.title === roleFilter)\n      );', to: '        user.Staff?.some(staff => staff.Role?.title === roleFilter)\n      );' },
    ]
  },
  {
    file: 'src/app/dashboard/system/logs/client.tsx',
    fixes: [
      { from: '[newLog.level]: prevStats.byLevel[newLog.level] || 0) + 1', to: '[newLog.level]: (prevStats.byLevel[newLog.level] || 0) + 1' },
    ]
  },
];

function fixFile(filePath, fileFixes) {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let changed = false;

  fileFixes.forEach(fix => {
    if (content.includes(fix.from)) {
      content = content.replace(fix.from, fix.to);
      changed = true;
      console.log(`✅ Fixed in ${filePath}:`);
      console.log(`   - ${fix.from.substring(0, 50)}...`);
      console.log(`   + ${fix.to.substring(0, 50)}...`);
    }
  });

  if (changed) {
    fs.writeFileSync(fullPath, content);
    console.log(`📝 Updated: ${filePath}`);
  } else {
    console.log(`⏭️  No changes needed: ${filePath}`);
  }
}

console.log('🔧 Fixing final syntax errors...\n');

fixes.forEach(fix => {
  fixFile(fix.file, fix.fixes);
});

console.log('\n✅ Final syntax fixes completed!');
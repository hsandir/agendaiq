import * as fs from 'fs';
import * as path from 'path';

// Map old auth patterns to new capabilities
const authMappings = {
  'requireAdminRole: true': 'requireCapability: Capability.USER_MANAGE',
  'requireOpsAdmin: true': 'requireCapability: Capability.OPS_MONITORING',
  'requireDevAdmin: true': 'requireCapability: Capability.DEV_DEBUG',
  'requireLeadership: true': 'requireCapability: Capability.MEETING_CREATE',
  'requireStaff: true, requireAdminRole: true': 'requireCapability: Capability.USER_MANAGE',
  'requireStaff: true, requireOpsAdmin: true': 'requireCapability: Capability.OPS_MONITORING',
  'requireStaff: true, requireDevAdmin: true': 'requireCapability: Capability.DEV_DEBUG',
  'requireStaff: true, requireLeadership: true': 'requireCapability: Capability.MEETING_CREATE',
};

// Special mappings for specific routes
const routeMappings: Record<string, string> = {
  '/api/system/backup': 'Capability.OPS_BACKUP',
  '/api/system/alerts': 'Capability.OPS_ALERTS',
  '/api/system/settings': 'Capability.OPS_HEALTH',
  '/api/system/server': 'Capability.OPS_HEALTH',
  '/api/system/logs': 'Capability.OPS_LOGS',
  '/api/monitoring': 'Capability.OPS_MONITORING',
  '/api/dev': 'Capability.DEV_DEBUG',
  '/api/admin': 'Capability.USER_MANAGE',
  '/api/roles': 'Capability.ROLE_MANAGE',
  '/api/meetings': 'Capability.MEETING_CREATE',
  '/api/auth/admin-users': 'Capability.USER_MANAGE',
  '/api/auth/create-admin': 'Capability.USER_MANAGE',
  '/api/setup': 'Capability.DEV_UPDATE',
  '/api/school': 'Capability.SCHOOL_MANAGE',
  '/api/departments': 'Capability.SCHOOL_MANAGE',
  '/api/staff': 'Capability.STAFF_IMPORT',
};

function getCapabilityForRoute(filePath: string): string {
  // Check if path matches any route mapping
  for (const [route, capability] of Object.entries(routeMappings)) {
    if (filePath.includes(route.replace('/api/', ''))) {
      return capability;
    }
  }
  return 'Capability.USER_MANAGE'; // Default
}

function fixFile(filePath: string) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;
  
  // Check if file needs Capability import
  const hasLegacyAuth = /require(AdminRole|OpsAdmin|DevAdmin|Leadership|Staff)/.test(content);
  const hasCapabilityImport = /import.*Capability.*from.*policy/.test(content);
  
  if (hasLegacyAuth && !hasCapabilityImport) {
    // Add Capability import after withAuth import
    content = content.replace(
      /(import.*withAuth.*from.*['"]@\/lib\/auth\/api-auth['"];?)/,
      `$1\nimport { Capability } from '@/lib/auth/policy';`
    );
    modified = true;
  }
  
  // Get the appropriate capability for this route
  const capability = getCapabilityForRoute(filePath);
  
  // Replace all legacy patterns
  for (const [oldPattern, newPattern] of Object.entries(authMappings)) {
    const regex = new RegExp(oldPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    if (regex.test(content)) {
      // Use route-specific capability
      const replacement = newPattern.replace(/Capability\.\w+/, capability);
      content = content.replace(regex, `requireAuth: true, ${replacement}`);
      modified = true;
    }
  }
  
  // Handle special cases where requireStaff is alone
  if (/requireStaff:\s*true(?!.*require)/.test(content)) {
    content = content.replace(
      /requireStaff:\s*true/g,
      `requireAuth: true, requireCapability: ${capability}`
    );
    modified = true;
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed: ${filePath}`);
    return true;
  }
  
  return false;
}

function scanDirectory(dir: string) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  let fixedCount = 0;
  
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory() && !file.name.startsWith('.') && file.name !== 'node_modules') {
      fixedCount += scanDirectory(fullPath);
    } else if (file.isFile() && (file.name.endsWith('.ts') || file.name.endsWith('.tsx'))) {
      if (fixFile(fullPath)) {
        fixedCount++;
      }
    }
  }
  
  return fixedCount;
}

// Main execution
console.log('🔍 Scanning for legacy authentication patterns...\n');

const apiDir = path.join(process.cwd(), 'src/app/api');
const fixedCount = scanDirectory(apiDir);

console.log(`\n✨ Fixed ${fixedCount} files with legacy authentication patterns.`);

// Also scan pages for legacy patterns
console.log('\n🔍 Scanning pages for legacy patterns...\n');
const pagesDir = path.join(process.cwd(), 'src/app/dashboard');
const pagesFixed = scanDirectory(pagesDir);

console.log(`\n✨ Fixed ${pagesFixed} page files with legacy authentication patterns.`);
console.log('\n✅ All legacy authentication patterns have been updated to use capabilities!');
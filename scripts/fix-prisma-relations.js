#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Mapping of PascalCase to snake_case relations based on actual database schema
const relationMappings = {
  'User': 'users',
  'Staff': 'staff', 
  'Role': 'role',
  'Department': 'department',
  'School': 'school',
  'District': 'district',
  'Permission': 'permission',
  'Permissions': 'permission', // Fix plural to singular
  'ResponsibleStaff': 'responsible_staff',
  'MeetingAttendee': 'meeting_attendee',
  'ActionItems': 'action_items',
  'Comments': 'comments',
  'Attachments': 'attachments'
};

function fixPrismaRelations(content) {
  let modified = content;
  
  // Fix include statements
  Object.entries(relationMappings).forEach(([pascal, snake]) => {
    // Fix "include: { PascalCase: true }" or "include: { PascalCase: {"
    const includePattern = new RegExp(`(include:\\s*{[^}]*?)\\b${pascal}(\\s*:\\s*(?:true|{))`, 'g');
    modified = modified.replace(includePattern, `$1${snake}$2`);
    
    // Fix nested includes in multiline format
    const nestedPattern = new RegExp(`^(\\s+)${pascal}(\\s*:\\s*(?:true|{))`, 'gm');
    modified = modified.replace(nestedPattern, `$1${snake}$2`);
    
    // Fix property access like .PascalCase. or .PascalCase[
    const accessPattern = new RegExp(`\\.${pascal}([\\s.\\[\\?])`, 'g');
    modified = modified.replace(accessPattern, `.${snake}$1`);
  });
  
  return modified;
}

// Get all TypeScript/TSX files
const files = glob.sync('src/**/*.{ts,tsx}', { 
  ignore: ['**/node_modules/**', '**/dist/**', '**/build/**']
});

let filesUpdated = 0;

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const fixed = fixPrismaRelations(content);
  
  if (content !== fixed) {
    fs.writeFileSync(file, fixed);
    console.log(`Updated: ${file}`);
    filesUpdated++;
  }
});

console.log(`\n✅ Fixed Prisma relations in ${filesUpdated} files`);
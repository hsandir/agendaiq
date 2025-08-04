const fs = require('fs');
const path = require('path');

// Define additional field name replacements that were missed
const additionalReplacements = [
  // Specific field names in includes that weren't caught
  { pattern: /department:\s*true(?=,|\s*})/g, replacement: 'Department: true' },
  { pattern: /school:\s*true(?=,|\s*})/g, replacement: 'School: true' },
  { pattern: /district:\s*true(?=,|\s*})/g, replacement: 'District: true' },
  { pattern: /role:\s*true(?=,|\s*})/g, replacement: 'Role: true' },
  { pattern: /user:\s*true(?=,|\s*})/g, replacement: 'User: true' },
  { pattern: /organizer:\s*true(?=,|\s*})/g, replacement: 'Staff: true' },
  
  // MeetingAuditLog specific fixes
  { pattern: /meeting:\s*{/g, replacement: 'Meeting: {' },
  { pattern: /organizer:\s*{/g, replacement: 'Staff: {' },
  
  // Staff model includes - fix any remaining lowercase field names
  { pattern: /include:\s*{\s*role:\s*true,\s*department:/g, replacement: 'include: { Role: true, Department:' },
  { pattern: /include:\s*{\s*role:\s*true,\s*school:/g, replacement: 'include: { Role: true, School:' },
  { pattern: /include:\s*{\s*department:\s*true,\s*school:/g, replacement: 'include: { Department: true, School:' },
  
  // Nested includes
  { pattern: /organizer:\s*{\s*include:\s*{\s*user:/g, replacement: 'Staff: { include: { User:' },
  { pattern: /attendees:\s*{\s*include:\s*{\s*staff:/g, replacement: 'MeetingAttendee: { include: { Staff:' },
  
  // Property access patterns that might have been missed
  { pattern: /\.staff\[0\]\.role/g, replacement: '.Staff[0].Role' },
  { pattern: /\.staff\[0\]\.department/g, replacement: '.Staff[0].Department' },
  { pattern: /\.staff\[0\]\.school/g, replacement: '.Staff[0].School' },
  { pattern: /\.staff\[0\]\.district/g, replacement: '.Staff[0].District' },
];

// Function to recursively find all TypeScript and JavaScript files
function findFiles(dir, extension = '.ts') {
  let results = [];
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      results = results.concat(findFiles(filePath, extension));
    } else if (file.endsWith(extension) || file.endsWith('.tsx') || file.endsWith('.js')) {
      results.push(filePath);
    }
  }
  
  return results;
}

// Function to apply replacements to a file
function fixFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let updatedContent = content;
    let hasChanges = false;
    
    for (const { pattern, replacement } of additionalReplacements) {
      const newContent = updatedContent.replace(pattern, replacement);
      if (newContent !== updatedContent) {
        hasChanges = true;
        updatedContent = newContent;
      }
    }
    
    if (hasChanges) {
      fs.writeFileSync(filePath, updatedContent, 'utf8');
      console.log(`Fixed: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Main execution
function main() {
  const srcDir = path.join(__dirname, '..', 'src');
  const files = findFiles(srcDir);
  
  console.log(`Found ${files.length} files to check for remaining field name issues...`);
  
  let fixedCount = 0;
  for (const file of files) {
    if (fixFile(file)) {
      fixedCount++;
    }
  }
  
  console.log(`Fixed ${fixedCount} additional files with remaining Prisma field name issues.`);
}

if (require.main === module) {
  main();
}

module.exports = { fixFile, findFiles, additionalReplacements }; 
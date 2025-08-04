const fs = require('fs');
const path = require('path');

// Define the field name replacements
const replacements = [
  // User model includes
  { pattern: /include:\s*{\s*staff:\s*{/g, replacement: 'include: { Staff: {' },
  { pattern: /staff:\s*{\s*include:\s*{\s*role:/g, replacement: 'Staff: { include: { Role:' },
  { pattern: /staff:\s*{\s*include:\s*{\s*department:/g, replacement: 'Staff: { include: { Department:' },
  { pattern: /staff:\s*{\s*include:\s*{\s*school:/g, replacement: 'Staff: { include: { School:' },
  { pattern: /staff:\s*{\s*include:\s*{\s*district:/g, replacement: 'Staff: { include: { District:' },
  
  // General field names in includes
  { pattern: /include:\s*{\s*role:/g, replacement: 'include: { Role:' },
  { pattern: /include:\s*{\s*department:/g, replacement: 'include: { Department:' },
  { pattern: /include:\s*{\s*school:/g, replacement: 'include: { School:' },
  { pattern: /include:\s*{\s*district:/g, replacement: 'include: { District:' },
  { pattern: /include:\s*{\s*user:/g, replacement: 'include: { User:' },
  
  // Multi-field includes
  { pattern: /role:\s*true,\s*department:\s*true/g, replacement: 'Role: true, Department: true' },
  { pattern: /role:\s*true,\s*department:\s*true,\s*school:\s*true/g, replacement: 'Role: true, Department: true, School: true' },
  { pattern: /role:\s*true,\s*department:\s*true,\s*school:\s*true,\s*district:\s*true/g, replacement: 'Role: true, Department: true, School: true, District: true' },
  
  // Property access patterns
  { pattern: /user\.staff\?\.\[0\]\?\.role/g, replacement: 'user.Staff?.[0]?.Role' },
  { pattern: /user\.staff\?\.\[0\]\?\.department/g, replacement: 'user.Staff?.[0]?.Department' },
  { pattern: /user\.staff\?\.\[0\]\?\.school/g, replacement: 'user.Staff?.[0]?.School' },
  { pattern: /user\.staff\?\.\[0\]/g, replacement: 'user.Staff?.[0]' },
  { pattern: /staff\.role/g, replacement: 'staff.Role' },
  { pattern: /staff\.department/g, replacement: 'staff.Department' },
  { pattern: /staff\.school/g, replacement: 'staff.School' },
  { pattern: /staff\.district/g, replacement: 'staff.District' },
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
    
    for (const { pattern, replacement } of replacements) {
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
  
  console.log(`Found ${files.length} files to check...`);
  
  let fixedCount = 0;
  for (const file of files) {
    if (fixFile(file)) {
      fixedCount++;
    }
  }
  
  console.log(`Fixed ${fixedCount} files with Prisma field name issues.`);
}

if (require.main === module) {
  main();
}

module.exports = { fixFile, findFiles, replacements }; 
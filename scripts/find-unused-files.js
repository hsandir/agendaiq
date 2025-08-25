const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Directories to scan for files
const SCAN_DIRECTORIES = [
  'src',
  'scripts',
  'organization_structure',
  'public'
];

// File patterns to exclude (these are actively used)
const EXCLUDE_PATTERNS = [
  /\.git/,
  /node_modules/,
  /\.next/,
  /\.env/,
  /package-lock\.json/,
  /tsconfig\.json/,
  /next\.config\.ts/,
  /postcss\.config\.mjs/,
  /eslint\.config\.mjs/,
  /tailwind\.config\.ts/,
  /README\.md/,
  /CLEANUP_SUMMARY\.md/,
  /\.gitignore/,
  /\.env\.local/,
  /\.env\.example/,
  /prisma\/schema\.prisma/,
  /prisma\/migrations/,
  /prisma\/dev\.db/,
  /logs\//,
  /\.DS_Store/,
  /Thumbs\.db/
];

// Files that are definitely used (keep these)
const USED_FILES = [
  'src/app/layout.tsx',
  'src/app/page.tsx',
  'src/app/globals.css',
  'src/app/favicon.ico',
  'src/app/middleware.ts',
  'src/lib/prisma.ts',
  'src/lib/auth/auth-options.ts',
  'src/lib/auth.ts',
  'src/types/index.ts',
  'src/types/next-auth.d.ts',
  'package.json',
  'tsconfig.json',
  'next.config.ts',
  'postcss.config.mjs',
  'tailwind.config.ts',
  'eslint.config.mjs',
  'prisma/schema.prisma',
  '.env',
  '.gitignore',
  'README.md'
];

// Files that might be unused (candidates for moving)
const POTENTIALLY_UNUSED = [
  'src/pages/_document.tsx', // Next.js 13+ doesn't use pages directory
  'src/generated/', // Generated files that might be outdated
  'organization_structure/full_organization_schema.sql', // Old schema file
  'scripts/find-mock-data-pages.js', // Already deleted but checking
  'src/app/dashboard/system/health/page 2.tsx', // Duplicate file
  'src/app/dashboard/system/health/page.tsx', // Check if this is the main one
  'src/app/dashboard/system/health/page 2.tsx' // This duplicate should be moved
];

function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      getAllFiles(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

function isExcluded(filePath) {
  return EXCLUDE_PATTERNS.some(pattern => pattern.test(filePath));
}

function isUsedFile(filePath) {
  return USED_FILES.includes(filePath);
}

function checkFileUsage(filePath) {
  try {
    // Check if file is imported or referenced anywhere
    const fileName = path.basename(filePath);
    const fileExt = path.extname(filePath);
    
    // Skip certain file types that are typically not imported
    if (['.md', '.txt', '.log', '.sql', '.json'].includes(fileExt)) {
      return false; // These are usually not imported
    }
    
    // Search for imports/references in the codebase
    const searchPatterns = [
      `import.*${fileName}`,
      `require.*${fileName}`,
      `from.*${fileName}`,
      `'${fileName}'`,
      `"${fileName}"`,
      `/${fileName}`,
      `\\${fileName}`
    ];
    
    // Check if file is referenced in any TypeScript/JavaScript files
    const allTsFiles = getAllFiles('src').filter(f => 
      f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.js') || f.endsWith('.jsx')
    );
    
    for (const tsFile of allTsFiles) {
      if (tsFile === filePath) continue; // Skip the file itself
      
      try {
        const content = fs.readFileSync(tsFile, 'utf8');
        if (searchPatterns.some(pattern => {
          const regex = new RegExp(pattern, 'i');
          return regex.test(content);
        })) {
          return true; // File is referenced
        }
      } catch (err) {
        // Skip files that can't be read
      }
    }
    
    return false; // No references found
  } catch (error) {
    console.error(`Error checking usage for ${filePath}:`, error);
    return false;
  }
}

function createGereksizFolder() {
  const gereksizPath = 'gereksiz';
  if (!fs.existsSync(gereksizPath)) {
    fs.mkdirSync(gereksizPath, { recursive: true });
    console.log('✅ Created gereksiz folder');
  }
  return gereksizPath;
}

function moveFileToGereksiz(filePath, gereksizPath) {
  try {
    const fileName = path.basename(filePath);
    const relativePath = path.relative(process.cwd(), filePath);
    const targetPath = path.join(gereksizPath, relativePath);
    
    // Create target directory if it doesn't exist
    const targetDir = path.dirname(targetPath);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    // Move the file
    fs.renameSync(filePath, targetPath);
    console.log(`✅ Moved: ${relativePath} -> gereksiz/${relativePath}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to move ${filePath}:`, error);
    return false;
  }
}

function updateGitignore() {
  const gitignorePath = '.gitignore';
  const gereksizEntry = '\n# Unused files moved to gereksiz folder\ngereksiz/\n';
  
  try {
    let gitignoreContent = '';
    if (fs.existsSync(gitignorePath)) {
      gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    }
    
    if (!gitignoreContent.includes('gereksiz/')) {
      fs.appendFileSync(gitignorePath, gereksizEntry);
      console.log('✅ Updated .gitignore to exclude gereksiz folder');
    } else {
      console.log('ℹ️  .gitignore already excludes gereksiz folder');
    }
  } catch (error) {
    console.error('❌ Failed to update .gitignore:', error);
  }
}

function main() {
  console.log('🔍 Scanning for unused files...\n');
  
  // Get all files
  let allFiles = [];
  SCAN_DIRECTORIES.forEach(dir => {
    if (fs.existsSync(dir)) {
      allFiles = allFiles.concat(getAllFiles(dir));
    }
  });
  
  console.log(`📊 Found ${allFiles.length} total files`);
  
  // Filter out excluded files
  const candidateFiles = allFiles.filter(file => !isExcluded(file));
  console.log(`📊 ${candidateFiles.length} files after excluding patterns`);
  
  // Identify potentially unused files
  const unusedFiles = [];
  
  for (const file of candidateFiles) {
    if (isUsedFile(file)) {
      continue; // Skip known used files
    }
    
    // Check if file is actually used
    const isUsed = checkFileUsage(file);
    if (!isUsed) {
      unusedFiles.push(file);
    }
  }
  
  // Add known potentially unused files
  POTENTIALLY_UNUSED.forEach(file => {
    if (fs.existsSync(file) && !unusedFiles.includes(file)) {
      unusedFiles.push(file);
    }
  });
  
  console.log(`\n📋 Found ${unusedFiles.length} potentially unused files:`);
  unusedFiles.forEach(file => {
    console.log(`  - ${file}`);
  });
  
  if (unusedFiles.length === 0) {
    console.log('\n✅ No unused files found!');
    return;
  }
  
  // Ask for confirmation
  console.log('\n❓ Do you want to move these files to the gereksiz folder? (y/N)');
  process.stdin.once('data', (data) => {
    const answer = data.toString().trim().toLowerCase();
    
    if (answer === 'y' || answer === 'yes') {
      console.log('\n🚀 Moving files to gereksiz folder...\n');
      
      const gereksizPath = createGereksizFolder();
      let movedCount = 0;
      
      unusedFiles.forEach(file => {
        if (moveFileToGereksiz(file, gereksizPath)) {
          movedCount++;
        }
      });
      
      updateGitignore();
      
      console.log(`\n✅ Successfully moved ${movedCount} files to gereksiz folder`);
      console.log('📝 Updated .gitignore to exclude gereksiz folder from Git');
      console.log('💡 These files will no longer be pushed to GitHub');
      
    } else {
      console.log('\n❌ Operation cancelled');
    }
    
    process.exit(0);
  });
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { main, getAllFiles, checkFileUsage }; 
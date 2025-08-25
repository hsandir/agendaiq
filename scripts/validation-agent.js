#!/usr/bin/env node

/**
 * Validation Agent - Prevents syntax and type errors
 * Run before commits and builds
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Load validation rules
const rulesPath = path.join(process.cwd(), '.claude/validation-rules.json');
const rules = JSON.parse(fs.readFileSync(rulesPath, 'utf8'));

// Colors for terminal output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

let errors = 0;
let warnings = 0;

console.log(`${colors.blue}🔍 Validation Agent v${rules.version}${colors.reset}`);
console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

// Function to check file for forbidden patterns
function checkFile(filePath) {
  if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) return;
  if (filePath.includes('node_modules')) return;
  if (filePath.includes('.next')) return;
  
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  rules.forbiddenPatterns.forEach(rule => {
    lines.forEach((line, index) => {
      if (line.includes(rule.pattern)) {
        errors++;
        console.log(`${colors.red}❌ ERROR in ${filePath}:${index + 1}${colors.reset}`);
        console.log(`   Pattern: "${rule.pattern}"`);
        console.log(`   Reason: ${rule.reason}`);
        console.log(`   ${colors.green}Suggestion: ${rule.suggestion}${colors.reset}`);
        console.log(`   Line: ${line.trim()}\n`);
      }
    });
  });
}

// Function to check for missing interfaces
function checkInterfaces() {
  const authTypesPath = path.join(process.cwd(), 'src/types/auth.ts');
  
  if (!fs.existsSync(authTypesPath)) {
    warnings++;
    console.log(`${colors.yellow}⚠️  WARNING: Missing auth types file${colors.reset}`);
    console.log(`   Expected at: src/types/auth.ts`);
    console.log(`   Run: npm run generate:types\n`);
    return false;
  }
  
  const content = fs.readFileSync(authTypesPath, 'utf8');
  
  rules.requiredInterfaces.forEach(intf => {
    if (!content.includes(`interface ${intf.name}`)) {
      warnings++;
      console.log(`${colors.yellow}⚠️  WARNING: Missing interface ${intf.name}${colors.reset}`);
      console.log(`   Expected in: ${intf.location}\n`);
    }
  });
  
  return true;
}

// Function to run TypeScript check
function checkTypeScript() {
  console.log(`${colors.blue}📦 Running TypeScript check...${colors.reset}`);
  
  try {
    execSync('npx tsc --noEmit', { stdio: 'pipe' });
    console.log(`${colors.green}✅ TypeScript check passed${colors.reset}\n`);
    return true;
  } catch (error) {
    console.log(`${colors.red}❌ TypeScript errors found${colors.reset}`);
    console.log(`   Run: npx tsc --noEmit\n`);
    errors++;
    return false;
  }
}

// Function to check for syntax errors
function checkSyntax() {
  console.log(`${colors.blue}🔧 Checking syntax...${colors.reset}`);
  
  const patterns = [
    { 
      regex: /Math\.floor\([^)]*\)\)\)/g,
      message: 'Extra closing parenthesis in Math.floor'
    },
    {
      regex: /return\s+NextResponse\.json\s*{/g,
      message: 'Missing parenthesis in NextResponse.json'
    },
    {
      regex: /if\s+!\s*\(/g,
      message: 'Space between ! and ( in if statement'
    },
    {
      regex: /\(user\s+as\s+Record<string,\s*unknown>\./g,
      message: 'Invalid type casting syntax'
    }
  ];
  
  function checkSyntaxInFile(filePath) {
    if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) return;
    
    const content = fs.readFileSync(filePath, 'utf8');
    
    patterns.forEach(pattern => {
      const matches = content.match(pattern.regex);
      if (matches) {
        errors++;
        console.log(`${colors.red}❌ SYNTAX ERROR in ${filePath}${colors.reset}`);
        console.log(`   ${pattern.message}`);
        console.log(`   Found: ${matches[0]}\n`);
      }
    });
  }
  
  // Check all source files
  function walkDir(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        walkDir(filePath);
      } else if (stat.isFile()) {
        checkSyntaxInFile(filePath);
      }
    });
  }
  
  walkDir(path.join(process.cwd(), 'src'));
}

// Function to check git status
function checkGitStatus() {
  console.log(`${colors.blue}📋 Checking git status...${colors.reset}`);
  
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    const files = status.split('\n').filter(line => line.trim());
    
    files.forEach(line => {
      const file = line.substring(3).trim();
      if (file && fs.existsSync(file)) {
        checkFile(file);
      }
    });
  } catch (error) {
    console.log(`${colors.yellow}⚠️  Could not check git status${colors.reset}\n`);
  }
}

// Function to display critical rules
function showCriticalRules() {
  console.log(`${colors.yellow}📌 Critical Rules:${colors.reset}`);
  rules.criticalRules.forEach(rule => {
    console.log(`   • ${rule}`);
  });
  console.log('');
}

// Main validation flow
async function validate() {
  // Check interfaces
  checkInterfaces();
  
  // Check modified files
  checkGitStatus();
  
  // Check syntax
  checkSyntax();
  
  // TypeScript check (optional for speed)
  if (process.argv.includes('--strict')) {
    checkTypeScript();
  }
  
  // Show results
  console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  
  if (errors === 0 && warnings === 0) {
    console.log(`${colors.green}✅ All validation checks passed!${colors.reset}`);
    process.exit(0);
  } else {
    if (errors > 0) {
      console.log(`${colors.red}❌ Found ${errors} error(s)${colors.reset}`);
    }
    if (warnings > 0) {
      console.log(`${colors.yellow}⚠️  Found ${warnings} warning(s)${colors.reset}`);
    }
    
    console.log(`\n${colors.yellow}Please fix the issues before committing.${colors.reset}`);
    showCriticalRules();
    
    process.exit(errors > 0 ? 1 : 0);
  }
}

// Run validation
validate().catch(error => {
  console.error(`${colors.red}Validation agent error:${colors.reset}`, error);
  process.exit(1);
});
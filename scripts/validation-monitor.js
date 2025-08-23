#!/usr/bin/env node

/**
 * Validation Monitor
 * Diğer chat'lerde yapılan işleri kontrol eden monitoring script
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const VALIDATION_SERVER_URL = 'http://localhost:3456';
const PROJECT_ROOT = path.join(__dirname, '..');
const LOG_FILE = path.join(PROJECT_ROOT, 'logs', 'validation-monitor.log');
const CHANGES_FILE = path.join(PROJECT_ROOT, 'logs', 'validation-agent-changes.md');

// Ensure logs directory exists
const logsDir = path.dirname(LOG_FILE);
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  
  console.log(logMessage.trim());
  fs.appendFileSync(LOG_FILE, logMessage);
}

function updateChangesFile(analysisResults) {
  const timestamp = new Date().toISOString();
  const sessionId = `validation-analysis-${Date.now()}`;
  
  const newEntry = `
---

## 📋 Change Session: Periodic Analysis
**Date:** ${new Date().toISOString().split('T')[0]}  
**Time:** ${new Date().toLocaleTimeString()} UTC  
**Session ID:** ${sessionId}

### 🔍 Analysis Results:

#### Files Analyzed: ${analysisResults.totalFiles}
#### Issues Found: ${analysisResults.totalIssues}

${analysisResults.securityIssues.length > 0 ? `#### 🚨 Security Issues:
${analysisResults.securityIssues.map(issue => `- **${issue.file}:** ${issue.message}`).join('\n')}
` : ''}

${analysisResults.optimizationIssues.length > 0 ? `#### ⚡ Optimization Opportunities:
${analysisResults.optimizationIssues.map(issue => `- **${issue.file}:** ${issue.message} (${issue.occurrences || 1} occurrences)`).join('\n')}
` : ''}

#### 📊 Summary:
- **Security Alerts:** ${analysisResults.securityIssues.length}
- **Optimization Suggestions:** ${analysisResults.optimizationIssues.length}
- **Template Violations:** ${analysisResults.templateIssues.length}
- **Server Status:** ${analysisResults.serverRunning ? '✅ Running' : '❌ Offline'}

#### 🔗 Quick Actions:
${analysisResults.totalIssues > 0 ? `- Review files with issues
- Apply suggested templates from \`templates/cursor-templates/\`
- Use validation server for manual validation patterns
- Add missing auth checks` : '- ✅ No issues found in this analysis'}

**Next Analysis:** ${new Date(Date.now() + 5 * 60 * 1000).toLocaleTimeString()}

`;

  // Append to changes file
  fs.appendFileSync(CHANGES_FILE, newEntry);
  log(`📝 Updated changes file with ${analysisResults.totalIssues} issues found`);
}

async function checkValidationServer() {
  try {
    const response = await fetch(`${VALIDATION_SERVER_URL}/health`);
    if (response.ok) {
      const data = await response.json();
      log(`✅ Validation server is running. Available schemas: ${data.schemas.join(', ')}`);
      return true;
    }
  } catch (error) {
    log(`❌ Validation server is not running: ${error.message}`);
    return false;
  }
}

function getRecentFiles(hours = 2) {
  try {
    // Git'te son X saat içinde değişen dosyaları bul
    const sinceTime = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    const gitCommand = `git log --since="${sinceTime}" --name-only --pretty=format: | sort -u`;
    
    const output = execSync(gitCommand, { 
      cwd: PROJECT_ROOT, 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    return output
      .split('\n')
      .filter(file => file.trim() && !file.startsWith('.') && (
        file.endsWith('.ts') || 
        file.endsWith('.tsx') || 
        file.endsWith('.js') || 
        file.endsWith('.jsx')
      ))
      .map(file => path.join(PROJECT_ROOT, file));
  } catch (error) {
    log(`Warning: Could not get recent files from git: ${error.message}`);
    return [];
  }
}

function analyzeFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(PROJECT_ROOT, filePath);
    
    const issues = [];
    
    // Check for common patterns that should use validation server
    const validationPatterns = [
      {
        pattern: /z\.string\(\)\.email\(\)/g,
        message: 'Email validation detected. Consider using ValidationSchemas.EMAIL from validation server',
        suggestion: `import { validate, ValidationSchemas } from '@/lib/validation/client';
const result = await validate(ValidationSchemas.EMAIL, emailValue);`
      },
      {
        pattern: /z\.string\(\)\.url\(\)/g,
        message: 'URL validation detected. Consider using ValidationSchemas.URL',
        suggestion: `const result = await validate(ValidationSchemas.URL, urlValue);`
      },
      {
        pattern: /z\.object\({[\s\S]*?email:[\s\S]*?password:/g,
        message: 'Login form schema detected. Consider using ValidationSchemas.LOGIN_FORM',
        suggestion: `const result = await validateForm(formData, ValidationSchemas.LOGIN_FORM);`
      },
      {
        pattern: /const.*Schema.*=.*z\.object\(/g,
        message: 'Custom Zod schema detected. Consider adding to validation server',
        suggestion: `await addSchema('customSchemaName', schemaDefinition);`
      }
    ];
    
    // Check auth patterns
    const authPatterns = [
      {
        pattern: /getSession\(\)/g,
        message: 'Direct session access detected. Use requireAuth() instead',
        suggestion: `import { requireAuth, AuthPresets } from '@/lib/auth/auth-utils';
const user = await requireAuth(AuthPresets.requireAuth);`
      },
      {
        pattern: /role\.title\s*===\s*['"`]/g,
        message: 'Role title comparison detected. Use role.key with RoleKey enum instead',
        suggestion: `import { RoleKey } from '@/lib/auth/policy';
if (user.staff?.role.key === RoleKey.ROLE_1) { ... }`
      },
      {
        pattern: /NextResponse\.json\(\s*{\s*error/g,
        message: 'API error response detected. Ensure proper error format',
        suggestion: `return NextResponse.json({
  error: 'Descriptive error message',
  code: 'ERROR_CODE',
  timestamp: new Date().toISOString()
}, { status: 400 });`
      }
    ];
    
    // Check for template compliance
    if (filePath.includes('/api/') && filePath.endsWith('/route.ts')) {
      if (!content.includes('withAuth')) {
        issues.push({
          type: 'security',
          file: relativePath,
          message: 'API route without withAuth middleware detected',
          suggestion: 'Use api-route-template.ts from templates/cursor-templates/'
        });
      }
    }
    
    if (filePath.includes('/app/') && filePath.endsWith('/page.tsx')) {
      if (!content.includes('requireAuth')) {
        issues.push({
          type: 'security',
          file: relativePath,
          message: 'Page component without requireAuth detected',
          suggestion: 'Use server-page-template.tsx or client-page-template.tsx from templates/'
        });
      }
    }
    
    // Run all pattern checks
    [...validationPatterns, ...authPatterns].forEach(({ pattern, message, suggestion }) => {
      const matches = content.match(pattern);
      if (matches) {
        issues.push({
          type: 'optimization',
          file: relativePath,
          message,
          suggestion,
          occurrences: matches.length
        });
      }
    });
    
    if (issues.length > 0) {
      log(`📋 Analysis for ${relativePath}:`);
      issues.forEach((issue, index) => {
        log(`  ${index + 1}. [${issue.type.toUpperCase()}] ${issue.message}`);
        if (issue.occurrences > 1) {
          log(`     Found ${issue.occurrences} occurrences`);
        }
        if (issue.suggestion) {
          log(`     💡 Suggestion: ${issue.suggestion.split('\n')[0]}`);
        }
      });
      log('');
    }
    
    return issues;
  } catch (error) {
    log(`❌ Error analyzing ${filePath}: ${error.message}`);
    return [];
  }
}

async function validateRecentWork() {
  log('🔍 Starting validation monitor...');
  
  // Check if validation server is running
  const serverRunning = await checkValidationServer();
  if (!serverRunning) {
    log('⚠️  Validation server is not running. Starting it...');
    try {
      execSync('npm start', { 
        cwd: path.join(PROJECT_ROOT, 'validation-server'),
        detached: true,
        stdio: 'ignore'
      });
      log('✅ Validation server started');
    } catch (error) {
      log(`❌ Failed to start validation server: ${error.message}`);
    }
  }
  
  // Get recent files
  const recentFiles = getRecentFiles(2); // Son 2 saat
  log(`📁 Found ${recentFiles.length} recently modified files`);
  
  if (recentFiles.length === 0) {
    log('✅ No recent changes to analyze');
    
    // Still update changes file even if no files to analyze
    const analysisResults = {
      totalFiles: 0,
      totalIssues: 0,
      securityIssues: [],
      optimizationIssues: [],
      templateIssues: [],
      serverRunning
    };
    updateChangesFile(analysisResults);
    return;
  }
  
  let totalIssues = 0;
  let allIssues = [];
  
  // Analyze each file
  for (const filePath of recentFiles) {
    if (fs.existsSync(filePath)) {
      const issues = analyzeFile(filePath);
      allIssues = allIssues.concat(issues);
      totalIssues += issues.length;
    }
  }
  
  // Categorize issues
  const securityIssues = allIssues.filter(issue => issue.type === 'security');
  const optimizationIssues = allIssues.filter(issue => issue.type === 'optimization');
  const templateIssues = allIssues.filter(issue => 
    issue.message.includes('template') || issue.message.includes('withAuth') || issue.message.includes('requireAuth')
  );
  
  // Summary
  log(`📊 Analysis complete. Found ${totalIssues} potential improvements across ${recentFiles.length} files`);
  
  if (totalIssues > 0) {
    log('💡 Consider using the validation server and standardized templates to improve code quality');
    log(`📖 Check templates in: ${path.join(PROJECT_ROOT, 'templates/cursor-templates/')}`);
  }
  
  // Update changes file
  const analysisResults = {
    totalFiles: recentFiles.length,
    totalIssues,
    securityIssues,
    optimizationIssues,
    templateIssues,
    serverRunning
  };
  updateChangesFile(analysisResults);
}

// Run immediately
validateRecentWork().catch(error => {
  log(`❌ Monitor failed: ${error.message}`);
  process.exit(1);
});

// Schedule periodic checks (every 5 minutes)
setInterval(() => {
  validateRecentWork().catch(error => {
    log(`❌ Periodic check failed: ${error.message}`);
  });
}, 5 * 60 * 1000); // 5 minutes

log('🚀 Validation monitor is running. Press Ctrl+C to stop.');

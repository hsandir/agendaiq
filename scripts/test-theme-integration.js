#!/usr/bin/env node

/**
 * Theme System Integration Test Script
 * This script verifies that the theme system is working correctly across all pages
 */

const http = require('http');
const https = require('https');

const BASE_URL = 'http://localhost:3000';

// Pages to test
const PAGES_TO_TEST = [
  '/dashboard',
  '/dashboard/meetings',
  '/dashboard/team',
  '/dashboard/notes',
  '/dashboard/settings',
  '/dashboard/settings/theme',
  '/dashboard/development',
];

// CSS variables that should be present when theme is applied
const EXPECTED_CSS_VARS = [
  '--color-primary',
  '--color-background',
  '--color-text',
  '--font-primary',
  '--spacing-md',
  '--radius-md',
  '--shadow-sm',
];

// Theme IDs to test
const THEMES = [
  'modern-purple',
  'classic-light',
  'dark-mode',
  'high-contrast',
  'nature-green',
];

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          data: data,
        });
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function checkPageForThemeSupport(page) {
  try {
    const url = `${BASE_URL}${page}`;
    console.log(`\nTesting: ${url}`);
    
    const response = await makeRequest(url);
    
    if (response.statusCode !== 200 && response.statusCode !== 302) {
      console.log(`  ❌ Page returned status ${response.statusCode}`);
      return false;
    }
    
    // Check if page includes theme-related elements
    const hasThemeProvider = response.data.includes('ThemeProvider') || 
                            response.data.includes('theme-provider');
    const hasThemeVariables = response.data.includes('theme-variables.css');
    const hasCSSVariables = response.data.includes('var(--') || 
                           response.data.includes('--color-');
    
    if (hasThemeProvider || hasThemeVariables || hasCSSVariables) {
      console.log(`  ✅ Theme system detected`);
      
      if (hasThemeProvider) console.log(`     - ThemeProvider found`);
      if (hasThemeVariables) console.log(`     - Theme variables CSS found`);
      if (hasCSSVariables) console.log(`     - CSS variables usage found`);
      
      return true;
    } else {
      console.log(`  ⚠️  No theme system indicators found`);
      return false;
    }
  } catch (error) {
    console.log(`  ❌ Error testing page: ${error.message}`);
    return false;
  }
}

async function checkThemeFiles() {
  const fs = require('fs');
  const path = require('path');
  
  console.log('\n=== Checking Theme Files ===');
  
  const themeFiles = [
    '/src/lib/theme/themes.ts',
    '/src/lib/theme/theme-provider.tsx',
    '/src/lib/theme/theme-utils.ts',
    '/src/components/theme/theme-selector.tsx',
    '/src/styles/theme-variables.css',
    '/src/app/dashboard/settings/theme/page.tsx',
  ];
  
  let allFilesExist = true;
  
  for (const file of themeFiles) {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      console.log(`  ✅ ${file}`);
    } else {
      console.log(`  ❌ ${file} - NOT FOUND`);
      allFilesExist = false;
    }
  }
  
  return allFilesExist;
}

async function checkLayoutIntegration() {
  const fs = require('fs');
  const path = require('path');
  
  console.log('\n=== Checking Layout Integration ===');
  
  const layoutPath = path.join(process.cwd(), '/src/app/layout.tsx');
  
  if (!fs.existsSync(layoutPath)) {
    console.log('  ❌ Layout file not found');
    return false;
  }
  
  const layoutContent = fs.readFileSync(layoutPath, 'utf8');
  
  const hasThemeProvider = layoutContent.includes('ThemeProvider');
  const hasThemeImport = layoutContent.includes('@/lib/theme/theme-provider');
  
  if (hasThemeProvider && hasThemeImport) {
    console.log('  ✅ ThemeProvider is integrated in root layout');
    return true;
  } else {
    console.log('  ❌ ThemeProvider not found in root layout');
    if (!hasThemeImport) console.log('     - Missing import statement');
    if (!hasThemeProvider) console.log('     - Missing ThemeProvider component');
    return false;
  }
}

async function checkGlobalStyles() {
  const fs = require('fs');
  const path = require('path');
  
  console.log('\n=== Checking Global Styles ===');
  
  const globalsPath = path.join(process.cwd(), '/src/app/globals.css');
  
  if (!fs.existsSync(globalsPath)) {
    console.log('  ❌ globals.css not found');
    return false;
  }
  
  const globalsContent = fs.readFileSync(globalsPath, 'utf8');
  
  const hasThemeImport = globalsContent.includes('theme-variables.css');
  const hasColorVariables = globalsContent.includes('--color-');
  const hasSpacingVariables = globalsContent.includes('--spacing-');
  
  if (hasThemeImport) {
    console.log('  ✅ Theme variables imported in globals.css');
  } else {
    console.log('  ❌ Theme variables not imported in globals.css');
  }
  
  if (hasColorVariables) {
    console.log('  ✅ Color variables defined');
  }
  
  if (hasSpacingVariables) {
    console.log('  ✅ Spacing variables defined');
  }
  
  return hasThemeImport || (hasColorVariables && hasSpacingVariables);
}

async function runIntegrationTests() {
  console.log('========================================');
  console.log('  Theme System Integration Test');
  console.log('========================================');
  
  let allTestsPassed = true;
  
  // Check if all theme files exist
  const filesExist = await checkThemeFiles();
  if (!filesExist) {
    allTestsPassed = false;
  }
  
  // Check if ThemeProvider is integrated in layout
  const layoutIntegrated = await checkLayoutIntegration();
  if (!layoutIntegrated) {
    allTestsPassed = false;
  }
  
  // Check if global styles include theme
  const stylesIntegrated = await checkGlobalStyles();
  if (!stylesIntegrated) {
    allTestsPassed = false;
  }
  
  // Check if server is running
  console.log('\n=== Checking Server Status ===');
  try {
    const response = await makeRequest(BASE_URL);
    if (response.statusCode === 200 || response.statusCode === 302) {
      console.log('  ✅ Server is running');
      
      // Test each page
      console.log('\n=== Testing Pages for Theme Support ===');
      let pagesWithTheme = 0;
      let totalPages = 0;
      
      for (const page of PAGES_TO_TEST) {
        totalPages++;
        const hasTheme = await checkPageForThemeSupport(page);
        if (hasTheme) {
          pagesWithTheme++;
        } else {
          allTestsPassed = false;
        }
      }
      
      console.log(`\n=== Summary: ${pagesWithTheme}/${totalPages} pages have theme support ===`);
    } else {
      console.log(`  ❌ Server returned unexpected status: ${response.statusCode}`);
      console.log('     Please ensure the development server is running on port 3000');
      allTestsPassed = false;
    }
  } catch (error) {
    console.log(`  ❌ Server is not running on ${BASE_URL}`);
    console.log('     Please start the server with: npm run dev');
    allTestsPassed = false;
  }
  
  // Final summary
  console.log('\n========================================');
  if (allTestsPassed) {
    console.log('  ✅ ALL TESTS PASSED');
    console.log('  Theme system is properly integrated!');
  } else {
    console.log('  ⚠️  SOME TESTS FAILED');
    console.log('  Please review the issues above');
  }
  console.log('========================================\n');
  
  process.exit(allTestsPassed ? 0 : 1);
}

// Run the tests
runIntegrationTests().catch(console.error);
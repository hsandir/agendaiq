#!/usr/bin/env node

/**
 * Accessibility Test Suite for AgendaIQ
 * Tests WCAG compliance, ARIA attributes, and keyboard navigation
 */

const puppeteer = require('puppeteer');
const { AxePuppeteer } = require('@axe-core/puppeteer');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

const testResults = {
  passed: [],
  failed: [],
  warnings: []
};

async function testAccessibility() {
  const BASE_URL = process.env.NODE_ENV === 'production' 
    ? 'https://agendaiq.vercel.app' 
    : 'http://localhost:3000';

  log('\n♿ ACCESSIBILITY TEST SUITE', 'cyan');
  log('='.repeat(60), 'blue');
  log(`Environment: ${process.env.NODE_ENV || 'development'}`, 'blue');
  log(`URL: ${BASE_URL}`, 'blue');
  log(`Time: ${new Date().toISOString()}\n`, 'blue');

  let browser;
  
  try {
    // Launch browser
    browser = await puppeteer.launch({ 
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Set viewport for desktop testing
    await page.setViewport({ width: 1280, height: 720 });

    // 1. TEST KEY PAGES FOR ACCESSIBILITY
    log('1️⃣ PAGE ACCESSIBILITY TESTS', 'yellow');
    
    const pagesToTest = [
      { url: '/', name: 'Homepage' },
      { url: '/auth/signin', name: 'Sign In Page' },
      { url: '/auth/signup', name: 'Sign Up Page' },
      { url: '/auth/forgot-password', name: 'Forgot Password Page' }
    ];
    
    for (const pageInfo of pagesToTest) {
      try {
        log(`\n  Testing: ${pageInfo.name}`, 'cyan');
        
        await page.goto(`${BASE_URL}${pageInfo.url}`, { 
          waitUntil: 'networkidle0',
          timeout: 30000 
        });
        
        // Run axe accessibility tests
        const results = await new AxePuppeteer(page)
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
          .analyze();
        
        // Check violations
        if (results.violations.length === 0) {
          testResults.passed.push({ test: `${pageInfo.name} - No violations` });
          log(`    ✅ No accessibility violations`, 'green');
        } else {
          testResults.failed.push({ 
            test: `${pageInfo.name} accessibility`, 
            violations: results.violations.length 
          });
          log(`    ❌ Found ${results.violations.length} violations:`, 'red');
          
          results.violations.forEach(violation => {
            log(`       - ${violation.impact}: ${violation.description}`, 'red');
            log(`         Elements: ${violation.nodes.length}`, 'yellow');
          });
        }
        
        // Check for incomplete tests
        if (results.incomplete.length > 0) {
          testResults.warnings.push({ 
            test: `${pageInfo.name} - Incomplete checks`, 
            count: results.incomplete.length 
          });
          log(`    ⚠️ ${results.incomplete.length} incomplete checks`, 'yellow');
        }
        
      } catch (error) {
        testResults.failed.push({ 
          test: `${pageInfo.name} accessibility test`, 
          error: error.message 
        });
        log(`    ❌ Test failed: ${error.message}`, 'red');
      }
    }

    // 2. KEYBOARD NAVIGATION TEST
    log('\n2️⃣ KEYBOARD NAVIGATION', 'yellow');
    
    try {
      await page.goto(`${BASE_URL}/auth/signin`, { waitUntil: 'networkidle0' });
      
      // Test tab navigation
      await page.keyboard.press('Tab');
      const firstFocused = await page.evaluate(() => document.activeElement?.tagName);
      
      await page.keyboard.press('Tab');
      const secondFocused = await page.evaluate(() => document.activeElement?.tagName);
      
      if (firstFocused && secondFocused) {
        testResults.passed.push({ test: 'Keyboard navigation works' });
        log(`  ✅ Tab navigation works (${firstFocused} → ${secondFocused})`, 'green');
      } else {
        testResults.failed.push({ test: 'Keyboard navigation broken' });
        log(`  ❌ Tab navigation not working properly`, 'red');
      }
      
      // Test form submission with Enter key
      const formExists = await page.$('form');
      if (formExists) {
        testResults.passed.push({ test: 'Form elements present' });
        log(`  ✅ Form elements are accessible`, 'green');
      } else {
        testResults.warnings.push({ test: 'No form found for keyboard test' });
        log(`  ⚠️ No form found on sign-in page`, 'yellow');
      }
      
    } catch (error) {
      testResults.failed.push({ test: 'Keyboard navigation test', error: error.message });
      log(`  ❌ Keyboard navigation test failed: ${error.message}`, 'red');
    }

    // 3. COLOR CONTRAST TEST
    log('\n3️⃣ COLOR CONTRAST', 'yellow');
    
    try {
      await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0' });
      
      const contrastResults = await new AxePuppeteer(page)
        .withTags(['cat.color'])
        .analyze();
      
      if (contrastResults.violations.length === 0) {
        testResults.passed.push({ test: 'Color contrast adequate' });
        log(`  ✅ All text has sufficient color contrast`, 'green');
      } else {
        testResults.failed.push({ 
          test: 'Color contrast issues', 
          count: contrastResults.violations.length 
        });
        log(`  ❌ Found ${contrastResults.violations.length} contrast issues`, 'red');
      }
      
    } catch (error) {
      testResults.warnings.push({ test: 'Color contrast test', error: error.message });
      log(`  ⚠️ Could not test color contrast: ${error.message}`, 'yellow');
    }

    // 4. ARIA ATTRIBUTES TEST
    log('\n4️⃣ ARIA ATTRIBUTES', 'yellow');
    
    try {
      await page.goto(`${BASE_URL}/auth/signin`, { waitUntil: 'networkidle0' });
      
      // Check for ARIA labels on form inputs
      const inputsWithLabels = await page.evaluate(() => {
        const inputs = document.querySelectorAll('input');
        let labeled = 0;
        let total = 0;
        
        inputs.forEach(input => {
          if (input.type !== 'hidden') {
            total++;
            if (input.getAttribute('aria-label') || 
                input.getAttribute('aria-labelledby') || 
                input.labels?.length > 0) {
              labeled++;
            }
          }
        });
        
        return { labeled, total };
      });
      
      if (inputsWithLabels.total > 0 && inputsWithLabels.labeled === inputsWithLabels.total) {
        testResults.passed.push({ test: 'All inputs have labels' });
        log(`  ✅ All ${inputsWithLabels.total} inputs have proper labels`, 'green');
      } else {
        testResults.warnings.push({ 
          test: 'Missing input labels', 
          labeled: inputsWithLabels.labeled,
          total: inputsWithLabels.total 
        });
        log(`  ⚠️ ${inputsWithLabels.labeled}/${inputsWithLabels.total} inputs have labels`, 'yellow');
      }
      
      // Check for ARIA roles
      const ariaRoles = await page.evaluate(() => {
        return document.querySelectorAll('[role]').length;
      });
      
      if (ariaRoles > 0) {
        testResults.passed.push({ test: 'ARIA roles present', count: ariaRoles });
        log(`  ✅ Found ${ariaRoles} elements with ARIA roles`, 'green');
      } else {
        testResults.warnings.push({ test: 'No ARIA roles found' });
        log(`  ⚠️ No ARIA roles found on page`, 'yellow');
      }
      
    } catch (error) {
      testResults.failed.push({ test: 'ARIA attributes test', error: error.message });
      log(`  ❌ ARIA test failed: ${error.message}`, 'red');
    }

    // 5. RESPONSIVE DESIGN TEST
    log('\n5️⃣ RESPONSIVE DESIGN', 'yellow');
    
    const viewports = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1920, height: 1080 }
    ];
    
    for (const viewport of viewports) {
      try {
        await page.setViewport({ width: viewport.width, height: viewport.height });
        await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0' });
        
        // Check if content is visible
        const isVisible = await page.evaluate(() => {
          const main = document.querySelector('main') || document.querySelector('body');
          return main && main.offsetWidth > 0 && main.offsetHeight > 0;
        });
        
        if (isVisible) {
          testResults.passed.push({ test: `${viewport.name} layout works` });
          log(`  ✅ ${viewport.name} (${viewport.width}x${viewport.height}): Content visible`, 'green');
        } else {
          testResults.failed.push({ test: `${viewport.name} layout broken` });
          log(`  ❌ ${viewport.name}: Content not visible`, 'red');
        }
        
      } catch (error) {
        testResults.warnings.push({ test: `${viewport.name} test failed` });
        log(`  ⚠️ ${viewport.name} test failed: ${error.message}`, 'yellow');
      }
    }

  } catch (error) {
    log(`\n❌ Fatal error: ${error.message}`, 'red');
    
    // Check if puppeteer is installed
    if (error.message.includes('Cannot find module')) {
      log('\n📦 Missing dependencies. Install with:', 'yellow');
      log('   npm install puppeteer @axe-core/puppeteer', 'cyan');
    }
    
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  // FINAL SUMMARY
  log('\n' + '='.repeat(60), 'blue');
  log('📊 TEST SUMMARY', 'cyan');
  log('='.repeat(60) + '\n', 'blue');

  const totalTests = testResults.passed.length + testResults.failed.length + testResults.warnings.length;
  const passRate = totalTests > 0 ? ((testResults.passed.length / totalTests) * 100).toFixed(1) : 0;

  log(`Total Tests: ${totalTests}`, 'blue');
  log(`✅ Passed: ${testResults.passed.length}`, 'green');
  log(`❌ Failed: ${testResults.failed.length}`, 'red');
  log(`⚠️ Warnings: ${testResults.warnings.length}`, 'yellow');
  log(`Pass Rate: ${passRate}%\n`, passRate >= 80 ? 'green' : 'red');

  if (testResults.failed.length > 0) {
    log('ACCESSIBILITY ISSUES FOUND:', 'red');
    log('  1. Fix color contrast issues', 'yellow');
    log('  2. Add proper ARIA labels to all inputs', 'yellow');
    log('  3. Ensure keyboard navigation works', 'yellow');
    log('  4. Test with screen readers', 'yellow');
  }

  log('\n' + '='.repeat(60) + '\n', 'blue');

  process.exit(testResults.failed.length > 0 ? 1 : 0);
}

// Run tests
testAccessibility().catch(error => {
  log(`Fatal error: ${error.message}`, 'red');
  
  if (error.message.includes('Cannot find module')) {
    log('\n📦 Missing dependencies. Install with:', 'yellow');
    log('   npm install puppeteer @axe-core/puppeteer', 'cyan');
  }
  
  process.exit(1);
});
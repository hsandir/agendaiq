#!/usr/bin/env node

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Performance test configuration
const TEST_URL = 'http://localhost:3000';
const ADMIN_EMAIL = 'admin@agendaiq.com';
const ADMIN_PASSWORD = 'Test123!@#';

// Pages to test
const PAGES_TO_TEST = [
  { path: '/auth/signin', name: 'Sign In', requiresAuth: false },
  { path: '/dashboard', name: 'Dashboard', requiresAuth: true },
  { path: '/dashboard/users', name: 'Users', requiresAuth: true },
  { path: '/dashboard/users/staff', name: 'Staff', requiresAuth: true },
  { path: '/dashboard/users/staff/roles', name: 'Roles', requiresAuth: true },
  { path: '/dashboard/organization/districts', name: 'Districts', requiresAuth: true },
  { path: '/dashboard/organization/schools', name: 'Schools', requiresAuth: true },
  { path: '/dashboard/organization/departments', name: 'Departments', requiresAuth: true },
  { path: '/dashboard/meetings', name: 'Meetings', requiresAuth: true },
  { path: '/dashboard/meetings/calendar', name: 'Calendar', requiresAuth: true },
  { path: '/dashboard/meetings/agendas', name: 'Agendas', requiresAuth: true },
  { path: '/dashboard/meetings/minutes', name: 'Minutes', requiresAuth: true },
  { path: '/dashboard/settings', name: 'Settings', requiresAuth: true },
  { path: '/dashboard/settings/profile', name: 'Profile Settings', requiresAuth: true },
  { path: '/dashboard/settings/appearance', name: 'Appearance', requiresAuth: true },
  { path: '/dashboard/settings/notifications', name: 'Notifications', requiresAuth: true },
  { path: '/dashboard/settings/security', name: 'Security', requiresAuth: true },
  { path: '/dashboard/development', name: 'Development', requiresAuth: true },
  { path: '/dashboard/development/performance', name: 'Performance Monitor', requiresAuth: true },
  { path: '/dashboard/monitoring', name: 'Monitoring', requiresAuth: true },
  { path: '/dashboard/monitoring/sentry', name: 'Sentry Monitor', requiresAuth: true },
  { path: '/dashboard/monitoring/cicd', name: 'CI/CD Monitor', requiresAuth: true }
];

// Performance thresholds (in ms)
const THRESHOLDS = {
  pageLoad: 1500,      // Page should load in under 1.5s
  firstPaint: 500,     // First paint should happen under 500ms
  interactive: 2000,   // Page should be interactive under 2s
  apiCall: 300        // API calls should complete under 300ms
};

class PerformanceTestRunner {
  constructor() {
    this.results = [];
    this.browser = null;
    this.context = null;
    this.page = null;
  }

  async init() {
    console.log('🚀 Initializing browser...');
    this.browser = await chromium.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.context = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });
    this.page = await this.context.newPage();
    
    // Enable performance monitoring
    await this.context.addInitScript(() => {
      window.__performanceMarks = {};
      const originalMark = performance.mark;
      performance.mark = function(name) {
        window.__performanceMarks[name] = performance.now();
        return originalMark.call(this, name);
      };
    });
  }

  async login() {
    console.log('🔐 Logging in as admin...');
    await this.page.goto(`${TEST_URL}/auth/signin`, { waitUntil: 'networkidle' });
    
    // Fill login form
    await this.page.fill('input[name="email"]', ADMIN_EMAIL);
    await this.page.fill('input[name="password"]', ADMIN_PASSWORD);
    await this.page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await this.page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log('✅ Login successful');
  }

  async testPage(pageConfig) {
    const { path, name, requiresAuth } = pageConfig;
    console.log(`\n📊 Testing: ${name} (${path})`);
    
    const startTime = Date.now();
    const metrics = {
      page: name,
      path: path,
      timestamp: new Date().toISOString(),
      errors: [],
      warnings: [],
      performance: {}
    };

    try {
      // Navigate to page
      const navigationStart = Date.now();
      const response = await this.page.goto(`${TEST_URL}${path}`, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });
      const navigationEnd = Date.now();
      
      metrics.performance.navigationTime = navigationEnd - navigationStart;
      metrics.statusCode = response.status();
      
      // Check for errors
      if (response.status() >= 400) {
        metrics.errors.push(`HTTP ${response.status()} error`);
      }

      // Measure page metrics
      const performanceMetrics = await this.page.evaluate(() => {
        const timing = performance.timing;
        const navigation = performance.getEntriesByType('navigation')[0];
        
        return {
          domContentLoaded: timing.domContentLoadedEventEnd - timing.fetchStart,
          loadComplete: timing.loadEventEnd - timing.fetchStart,
          firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
          firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
          resourceCount: performance.getEntriesByType('resource').length,
          jsHeapUsed: performance.memory?.usedJSHeapSize || 0,
          jsHeapTotal: performance.memory?.totalJSHeapSize || 0
        };
      });
      
      Object.assign(metrics.performance, performanceMetrics);

      // Check for console errors
      this.page.on('console', msg => {
        if (msg.type() === 'error') {
          metrics.errors.push(msg.text());
        } else if (msg.type() === 'warning') {
          metrics.warnings.push(msg.text());
        }
      });

      // Wait for page to be fully interactive
      await this.page.waitForTimeout(1000);

      // Test all links on the page
      const links = await this.page.$$eval('a[href]', links => 
        links.map(link => ({
          href: link.href,
          text: link.textContent.trim()
        }))
      );
      
      metrics.linkCount = links.length;
      console.log(`  📎 Found ${links.length} links`);

      // Test a few critical links
      for (const link of links.slice(0, 3)) {
        if (link.href && link.href.startsWith(TEST_URL)) {
          const linkStart = Date.now();
          try {
            await this.page.goto(link.href, { 
              waitUntil: 'networkidle',
              timeout: 5000 
            });
            const linkTime = Date.now() - linkStart;
            console.log(`    ✓ Link "${link.text}": ${linkTime}ms`);
          } catch (err) {
            console.log(`    ✗ Link "${link.text}": Failed`);
            metrics.errors.push(`Link test failed: ${link.text}`);
          }
          // Navigate back
          await this.page.goto(`${TEST_URL}${path}`, { waitUntil: 'networkidle' });
        }
      }

      // Performance analysis
      this.analyzePerformance(metrics);
      
    } catch (error) {
      metrics.errors.push(error.message);
      console.error(`  ❌ Error testing ${name}:`, error.message);
    }

    metrics.totalTime = Date.now() - startTime;
    this.results.push(metrics);
    
    return metrics;
  }

  analyzePerformance(metrics) {
    const perf = metrics.performance;
    
    // Check against thresholds
    if (perf.navigationTime > THRESHOLDS.pageLoad) {
      console.log(`  ⚠️  Slow page load: ${perf.navigationTime}ms (threshold: ${THRESHOLDS.pageLoad}ms)`);
      metrics.warnings.push(`Slow page load: ${perf.navigationTime}ms`);
    } else {
      console.log(`  ✅ Page load: ${perf.navigationTime}ms`);
    }

    if (perf.firstContentfulPaint > THRESHOLDS.firstPaint) {
      console.log(`  ⚠️  Slow first paint: ${Math.round(perf.firstContentfulPaint)}ms`);
      metrics.warnings.push(`Slow first paint: ${Math.round(perf.firstContentfulPaint)}ms`);
    }

    if (perf.loadComplete > THRESHOLDS.interactive) {
      console.log(`  ⚠️  Slow to interactive: ${perf.loadComplete}ms`);
      metrics.warnings.push(`Slow to interactive: ${perf.loadComplete}ms`);
    }

    // Memory usage
    if (perf.jsHeapUsed > 50 * 1024 * 1024) { // 50MB
      console.log(`  ⚠️  High memory usage: ${Math.round(perf.jsHeapUsed / 1024 / 1024)}MB`);
      metrics.warnings.push(`High memory usage: ${Math.round(perf.jsHeapUsed / 1024 / 1024)}MB`);
    }
  }

  async generateReport() {
    console.log('\n📝 Generating performance report...\n');
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalPages: this.results.length,
        pagesWithErrors: this.results.filter(r => r.errors.length > 0).length,
        pagesWithWarnings: this.results.filter(r => r.warnings.length > 0).length,
        averageLoadTime: Math.round(
          this.results.reduce((sum, r) => sum + r.performance.navigationTime, 0) / this.results.length
        ),
        slowestPage: this.results.reduce((slowest, r) => 
          r.performance.navigationTime > (slowest?.performance.navigationTime || 0) ? r : slowest
        ),
        fastestPage: this.results.reduce((fastest, r) => 
          r.performance.navigationTime < (fastest?.performance.navigationTime || Infinity) ? r : fastest
        )
      },
      details: this.results,
      recommendations: []
    };

    // Add recommendations
    if (report.summary.averageLoadTime > THRESHOLDS.pageLoad) {
      report.recommendations.push('Overall page load times are above threshold. Consider code splitting and lazy loading.');
    }
    
    const errorPages = this.results.filter(r => r.errors.length > 0);
    if (errorPages.length > 0) {
      report.recommendations.push(`Fix errors on ${errorPages.length} pages: ${errorPages.map(p => p.page).join(', ')}`);
    }

    const slowPages = this.results.filter(r => r.performance.navigationTime > THRESHOLDS.pageLoad);
    if (slowPages.length > 0) {
      report.recommendations.push(`Optimize ${slowPages.length} slow pages: ${slowPages.map(p => p.page).join(', ')}`);
    }

    // Print summary
    console.log('='.repeat(60));
    console.log('PERFORMANCE TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Pages Tested: ${report.summary.totalPages}`);
    console.log(`Pages with Errors: ${report.summary.pagesWithErrors}`);
    console.log(`Pages with Warnings: ${report.summary.pagesWithWarnings}`);
    console.log(`Average Load Time: ${report.summary.averageLoadTime}ms`);
    console.log(`Slowest Page: ${report.summary.slowestPage.page} (${report.summary.slowestPage.performance.navigationTime}ms)`);
    console.log(`Fastest Page: ${report.summary.fastestPage.page} (${report.summary.fastestPage.performance.navigationTime}ms)`);
    
    if (report.recommendations.length > 0) {
      console.log('\n📋 Recommendations:');
      report.recommendations.forEach((rec, i) => {
        console.log(`${i + 1}. ${rec}`);
      });
    }

    // Save detailed report
    const reportPath = path.join(process.cwd(), 'performance-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n💾 Detailed report saved to: ${reportPath}`);

    return report;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async run() {
    try {
      await this.init();
      
      // Test public pages first
      for (const page of PAGES_TO_TEST.filter(p => !p.requiresAuth)) {
        await this.testPage(page);
      }

      // Login and test authenticated pages
      await this.login();
      for (const page of PAGES_TO_TEST.filter(p => p.requiresAuth)) {
        await this.testPage(page);
      }

      // Generate report
      const report = await this.generateReport();
      
      // Return exit code based on results
      const hasErrors = report.summary.pagesWithErrors > 0;
      const hasCriticalPerformanceIssues = report.summary.averageLoadTime > THRESHOLDS.pageLoad * 1.5;
      
      if (hasErrors || hasCriticalPerformanceIssues) {
        console.log('\n❌ Performance test failed');
        process.exit(1);
      } else {
        console.log('\n✅ Performance test passed');
        process.exit(0);
      }
      
    } catch (error) {
      console.error('Fatal error:', error);
      process.exit(1);
    } finally {
      await this.cleanup();
    }
  }
}

// Check if playwright is installed
try {
  require.resolve('playwright');
} catch {
  console.error('⚠️  Playwright not installed. Installing...');
  const { execSync } = require('child_process');
  execSync('npm install --save-dev playwright', { stdio: 'inherit' });
  console.log('✅ Playwright installed');
}

// Run tests
const runner = new PerformanceTestRunner();
runner.run();
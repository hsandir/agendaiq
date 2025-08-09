#!/usr/bin/env node

/**
 * Production Monitoring Script
 * Continuous monitoring for AgendaIQ production environment
 */

const PRODUCTION_URL = 'https://agendaiq.vercel.app';
const MONITORING_INTERVAL = 5 * 60 * 1000; // 5 minutes
const ALERT_THRESHOLD = {
  responseTime: 2000, // 2 seconds
  errorRate: 0.05, // 5%
  uptime: 0.999, // 99.9%
};

// Metrics storage
const metrics = {
  checks: [],
  errors: [],
  responseTimess: [],
  startTime: Date.now(),
};

// Calculate SLI/SLO
function calculateSLI() {
  const totalChecks = metrics.checks.length;
  const successfulChecks = metrics.checks.filter(c => c.success).length;
  const uptime = totalChecks > 0 ? successfulChecks / totalChecks : 0;
  
  const avgResponseTime = metrics.responseTimess.length > 0
    ? metrics.responseTimess.reduce((a, b) => a + b, 0) / metrics.responseTimess.length
    : 0;
  
  const errorRate = totalChecks > 0 
    ? metrics.errors.length / totalChecks
    : 0;

  return {
    uptime: (uptime * 100).toFixed(2) + '%',
    avgResponseTime: Math.round(avgResponseTime) + 'ms',
    errorRate: (errorRate * 100).toFixed(2) + '%',
    totalChecks,
    successfulChecks,
    failedChecks: totalChecks - successfulChecks,
    uptimeSince: new Date(metrics.startTime).toISOString(),
  };
}

// Health check
async function checkHealth() {
  const startTime = Date.now();
  const check = {
    timestamp: new Date().toISOString(),
    success: false,
    responseTime: 0,
    status: 0,
    error: null,
  };

  try {
    const response = await fetch(`${PRODUCTION_URL}/api/monitoring/health`, {
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });
    
    check.status = response.status;
    check.responseTime = Date.now() - startTime;
    check.success = response.ok;
    
    if (!response.ok) {
      check.error = `HTTP ${response.status}`;
      metrics.errors.push(check);
    }
    
    const data = await response.json();
    
    // Check for degraded services
    if (data.status === 'degraded' || data.status === 'unhealthy') {
      console.warn(`⚠️ Service ${data.status}:`, data.checks);
      sendAlert(`Service ${data.status}`, data);
    }
    
  } catch (error) {
    check.error = error instanceof Error ? error.message : 'Unknown error';
    check.responseTime = Date.now() - startTime;
    metrics.errors.push(check);
    console.error('❌ Health check failed:', check.error);
    sendAlert('Health check failed', check);
  }
  
  metrics.checks.push(check);
  metrics.responseTimess.push(check.responseTime);
  
  // Keep only last 1000 checks to prevent memory overflow
  if (metrics.checks.length > 1000) {
    metrics.checks.shift();
    metrics.responseTimess.shift();
  }
  
  return check;
}

// Check critical endpoints
async function checkEndpoints() {
  const criticalEndpoints = [
    { path: '/', name: 'Homepage' },
    { path: '/auth/signin', name: 'Sign In' },
    { path: '/api/auth/check-first-user', name: 'Auth API' },
  ];
  
  const results = [];
  
  for (const endpoint of criticalEndpoints) {
    const startTime = Date.now();
    try {
      const response = await fetch(`${PRODUCTION_URL}${endpoint.path}`, {
        signal: AbortSignal.timeout(5000),
      });
      
      const responseTime = Date.now() - startTime;
      
      results.push({
        endpoint: endpoint.name,
        status: response.status,
        responseTime,
        success: response.ok,
      });
      
      if (responseTime > ALERT_THRESHOLD.responseTime) {
        console.warn(`⚠️ Slow response from ${endpoint.name}: ${responseTime}ms`);
      }
      
      if (!response.ok) {
        console.error(`❌ ${endpoint.name} returned ${response.status}`);
        sendAlert(`Endpoint failure: ${endpoint.name}`, { status: response.status });
      }
      
    } catch (error) {
      results.push({
        endpoint: endpoint.name,
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false,
      });
      console.error(`❌ Failed to check ${endpoint.name}:`, error);
    }
  }
  
  return results;
}

// Alert mechanism (placeholder - integrate with Slack/PagerDuty)
function sendAlert(title, data) {
  console.log('\n🚨 ALERT:', title);
  console.log(JSON.stringify(data, null, 2));
  
  // TODO: Integrate with alerting service
  // - Slack webhook
  // - PagerDuty
  // - Email
  // - SMS
}

// Generate report
function generateReport() {
  const sli = calculateSLI();
  
  console.log('\n📊 Monitoring Report');
  console.log('====================');
  console.log(`Uptime: ${sli.uptime} (Target: 99.9%)`);
  console.log(`Avg Response Time: ${sli.avgResponseTime} (Target: <2000ms)`);
  console.log(`Error Rate: ${sli.errorRate} (Target: <5%)`);
  console.log(`Total Checks: ${sli.totalChecks}`);
  console.log(`Successful: ${sli.successfulChecks}`);
  console.log(`Failed: ${sli.failedChecks}`);
  console.log(`Monitoring Since: ${sli.uptimeSince}`);
  
  // Check SLO violations
  const uptimeValue = parseFloat(sli.uptime);
  const errorRateValue = parseFloat(sli.errorRate);
  const responseTimeValue = parseInt(sli.avgResponseTime);
  
  if (uptimeValue < ALERT_THRESHOLD.uptime * 100) {
    console.log(`\n⚠️ SLO VIOLATION: Uptime ${sli.uptime} below target 99.9%`);
    sendAlert('SLO Violation: Uptime', sli);
  }
  
  if (errorRateValue > ALERT_THRESHOLD.errorRate * 100) {
    console.log(`\n⚠️ SLO VIOLATION: Error rate ${sli.errorRate} above target 5%`);
    sendAlert('SLO Violation: Error Rate', sli);
  }
  
  if (responseTimeValue > ALERT_THRESHOLD.responseTime) {
    console.log(`\n⚠️ SLO VIOLATION: Response time ${sli.avgResponseTime} above target 2000ms`);
    sendAlert('SLO Violation: Response Time', sli);
  }
  
  return sli;
}

// Main monitoring loop
async function monitor() {
  console.log('🔍 Starting production monitoring...');
  console.log(`URL: ${PRODUCTION_URL}`);
  console.log(`Interval: ${MONITORING_INTERVAL / 1000} seconds\n`);
  
  // Initial check
  await runCheck();
  
  // Set up interval
  setInterval(runCheck, MONITORING_INTERVAL);
  
  // Generate report every hour
  setInterval(() => {
    generateReport();
  }, 60 * 60 * 1000);
}

async function runCheck() {
  console.log(`\n[${new Date().toISOString()}] Running checks...`);
  
  // Run health check
  const health = await checkHealth();
  console.log(`Health: ${health.success ? '✅' : '❌'} (${health.responseTime}ms)`);
  
  // Check critical endpoints
  const endpoints = await checkEndpoints();
  endpoints.forEach(e => {
    if (e.success) {
      console.log(`${e.endpoint}: ✅ (${e.responseTime}ms)`);
    } else {
      console.log(`${e.endpoint}: ❌ ${e.error || `Status ${e.status}`}`);
    }
  });
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\nShutting down monitoring...');
  const report = generateReport();
  console.log('\nFinal report saved.');
  process.exit(0);
});

// Start monitoring
monitor().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
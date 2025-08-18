import { test, expect } from '@playwright/test'

// Performance thresholds
const PERFORMANCE_THRESHOLDS = {
  api: {
    p95: 200, // 95th percentile should be under 200ms
    p99: 500, // 99th percentile should be under 500ms
  },
  page: {
    lcp: 2500, // Largest Contentful Paint
    fcp: 1800, // First Contentful Paint
    fid: 100,  // First Input Delay
    cls: 0.1,  // Cumulative Layout Shift
  }
}

test.describe('API Performance Tests', () => {
  test('GET /api/meetings performance', async ({ request }) => {
    const iterations = 100
    const responseTimes: number[] = []

    // Warm up
    await request.get('/api/meetings')

    // Run performance test
    for (let i = 0; i < iterations; i++) {
      const start = Date.now()
      const response = await request.get('/api/meetings')
      const duration = Date.now() - start
      
      expect(response.ok()).toBeTruthy()
      responseTimes.push(duration)
    }

    // Calculate percentiles
    responseTimes.sort((a, b) => a - b)
    const p95 = responseTimes[Math.floor(iterations * 0.95)]
    const p99 = responseTimes[Math.floor(iterations * 0.99)]
    const avg = responseTimes.reduce((a, b) => a + b, 0) / iterations

    console.log(`GET /api/meetings Performance:`)
    console.log(`  Average: ${avg.toFixed(2)}ms`)
    console.log(`  P95: ${p95}ms`)
    console.log(`  P99: ${p99}ms`)

    // Assert performance thresholds
    expect(p95).toBeLessThan(PERFORMANCE_THRESHOLDS.api.p95)
    expect(p99).toBeLessThan(PERFORMANCE_THRESHOLDS.api.p99)
  })

  test('POST /api/meetings performance', async ({ request }) => {
    const iterations = 50
    const responseTimes: number[] = []

    const meetingData = {
      title: 'Performance Test Meeting',
      description: 'Test meeting for performance testing',
      startTime: new Date(Date.now() + 3600000).toISOString(),
      endTime: new Date(Date.now() + 7200000).toISOString(),
    }

    for (let i = 0; i < iterations; i++) {
      const start = Date.now()
      const response = await request.post('/api/meetings', {
        data: meetingData,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token',
        }
      })
      const duration = Date.now() - start
      
      expect(response.ok()).toBeTruthy()
      responseTimes.push(duration)
    }

    responseTimes.sort((a, b) => a - b)
    const p95 = responseTimes[Math.floor(iterations * 0.95)]
    const p99 = responseTimes[Math.floor(iterations * 0.99)]

    expect(p95).toBeLessThan(PERFORMANCE_THRESHOLDS.api.p95 * 1.5) // Allow 50% more time for POST
    expect(p99).toBeLessThan(PERFORMANCE_THRESHOLDS.api.p99 * 1.5)
  })

  test('Concurrent API requests performance', async ({ request }) => {
    const concurrentRequests = 10
    const iterations = 5

    for (let i = 0; i < iterations; i++) {
      const start = Date.now()
      
      // Send concurrent requests
      const promises = Array(concurrentRequests).fill(null).map(() => 
        request.get('/api/meetings')
      )
      
      const responses = await Promise.all(promises)
      const duration = Date.now() - start
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.ok()).toBeTruthy()
      })
      
      // Average time per request
      const avgTimePerRequest = duration / concurrentRequests
      console.log(`Concurrent requests (${concurrentRequests}): ${avgTimePerRequest.toFixed(2)}ms per request`)
      
      // Should handle concurrent requests efficiently
      expect(avgTimePerRequest).toBeLessThan(PERFORMANCE_THRESHOLDS.api.p95 * 2)
    }
  })
})

test.describe('Page Load Performance', () => {
  test('Dashboard page performance metrics', async ({ page }) => {
    // Navigate to page
    await page.goto('/dashboard')
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle')
    
    // Get performance metrics
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      const paint = performance.getEntriesByType('paint')
      
      return {
        // Navigation timing
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        
        // Paint timing
        fcp: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
        lcp: 0, // Will be measured separately
        
        // Resource timing
        resources: performance.getEntriesByType('resource').length,
        totalResourceSize: performance.getEntriesByType('resource').reduce((total, resource) => 
          total + ((resource as PerformanceResourceTiming).transferSize || 0), 0
        ),
      }
    })
    
    // Measure LCP
    const lcp = await page.evaluate(() => new Promise<number>(resolve => {
      new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1] as PerformanceEntry & { startTime: number }
        resolve(lastEntry.startTime)
      }).observe({ entryTypes: ['largest-contentful-paint'] })
    }))
    
    console.log('Dashboard Performance Metrics:')
    console.log(`  FCP: ${metrics.fcp.toFixed(2)}ms`)
    console.log(`  LCP: ${lcp.toFixed(2)}ms`)
    console.log(`  DOM Content Loaded: ${metrics.domContentLoaded.toFixed(2)}ms`)
    console.log(`  Resources: ${metrics.resources}`)
    console.log(`  Total Resource Size: ${(metrics.totalResourceSize / 1024 / 1024).toFixed(2)}MB`)
    
    // Assert performance thresholds
    expect(metrics.fcp).toBeLessThan(PERFORMANCE_THRESHOLDS.page.fcp)
    expect(lcp).toBeLessThan(PERFORMANCE_THRESHOLDS.page.lcp)
  })

  test('Meeting list page with data performance', async ({ page }) => {
    await page.goto('/dashboard/meetings')
    
    // Measure time to interactive
    const start = Date.now()
    await page.waitForSelector('[data-testid="meeting-card"]')
    const timeToInteractive = Date.now() - start
    
    console.log(`Meeting List Time to Interactive: ${timeToInteractive}ms`)
    
    // Should be interactive quickly
    expect(timeToInteractive).toBeLessThan(3000)
    
    // Check for layout shifts
    const cls = await page.evaluate(() => {
      return new Promise<number>(resolve => {
        let cls = 0
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as PerformanceEntry & { hadRecentInput?: boolean }).hadRecentInput) {
              cls += (entry as PerformanceEntry & { value: number }).value
            }
          }
          resolve(cls)
        }).observe({ entryTypes: ['layout-shift'] })
        
        // Wait a bit for any layout shifts
        setTimeout(() => resolve(cls), 2000)
      })
    })
    
    console.log(`Cumulative Layout Shift: ${cls}`)
    expect(cls).toBeLessThan(PERFORMANCE_THRESHOLDS.page.cls)
  })

  test('Memory usage during navigation', async ({ page }) => {
    if (!page.context().browser()?.browserType().name().includes('chromium')) {
      test.skip()
      return
    }

    const pages = ['/dashboard', '/dashboard/meetings', '/dashboard/calendar', '/dashboard/users']
    const memorySnapshots: number[] = []

    for (const url of pages) {
      await page.goto(url)
      await page.waitForLoadState('networkidle')
      
      // Get memory usage
      const metrics = await page.evaluate(() => {
        return (performance as Performance & { memory?: { usedJSHeapSize?: number } }).memory?.usedJSHeapSize || 0
      })
      
      memorySnapshots.push(metrics)
      console.log(`Memory usage at ${url}: ${(metrics / 1024 / 1024).toFixed(2)}MB`)
    }

    // Check for memory leaks
    const memoryGrowth = memorySnapshots[memorySnapshots.length - 1] - memorySnapshots[0]
    const growthPercentage = (memoryGrowth / memorySnapshots[0]) * 100

    console.log(`Memory growth: ${(memoryGrowth / 1024 / 1024).toFixed(2)}MB (${growthPercentage.toFixed(2)}%)`)
    
    // Memory growth should be reasonable (less than 50%)
    expect(growthPercentage).toBeLessThan(50)
  })
})

test.describe('Load Testing', () => {
  test('Simulate multiple concurrent users', async ({ browser }) => {
    const userCount = 5
    const contexts = []
    const pages = []

    // Create multiple browser contexts (users)
    for (let i = 0; i < userCount; i++) {
      const context = await browser.newContext()
      const page = await context.newPage()
      contexts.push(context)
      pages.push(page)
    }

    // All users navigate simultaneously
    const start = Date.now()
    await Promise.all(pages.map(page => page.goto('/dashboard/meetings')))
    const loadTime = Date.now() - start

    console.log(`${userCount} concurrent users load time: ${loadTime}ms`)
    console.log(`Average per user: ${(loadTime / userCount).toFixed(2)}ms`)

    // Clean up
    await Promise.all(contexts.map(context => context.close()))

    // Should handle concurrent users efficiently
    expect(loadTime / userCount).toBeLessThan(3000)
  })
})
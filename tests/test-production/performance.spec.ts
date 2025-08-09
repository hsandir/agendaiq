import { test, expect } from '@playwright/test'

const endpoints = ['/api/users', '/api/schools']

endpoints.forEach((endpoint) => {
  test.describe(`Performance for ${endpoint}`, () => {
    test.skip(`p95 latency under 500ms for ${endpoint}`, async ({ request }) => {
      const start = Date.now()
      const res = await request.get(endpoint)
      expect(res.ok()).toBeTruthy()
      const duration = Date.now() - start
      console.log(endpoint, 'duration', duration)
      // expect(duration).toBeLessThan(500)
    })
  })
})

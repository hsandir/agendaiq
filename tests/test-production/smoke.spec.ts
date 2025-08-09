import { test, expect } from '@playwright/test'

const testUser = {
  email: process.env.TEST_EMAIL || 'test@example.com',
  password: process.env.TEST_PASSWORD || 'password',
}

test.describe('Production Smoke Tests', () => {
  test.skip('health endpoint is reachable', async ({ request }) => {
    const res = await request.get('/api/health')
    expect(res.ok()).toBeTruthy()
  })

  test.skip('login page loads', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/AgendaIQ/i)
  })
})

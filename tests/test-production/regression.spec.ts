import { test, expect } from '@playwright/test'

const creds = {
  email: process.env.TEST_EMAIL || 'test@example.com',
  password: process.env.TEST_PASSWORD || 'password',
}

test.describe('Production Regression', () => {
  test.skip('user can login and view dashboard', async ({ page }) => {
    await page.goto('/auth/login')
    await page.fill('input[name="email"]', creds.email)
    await page.fill('input[name="password"]', creds.password)
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard')
    await expect(page.url()).toContain('/dashboard')
  })
})

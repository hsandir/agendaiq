import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login')
  })

  test('should display login page', async ({ page }) => {
    await expect(page).toHaveTitle(/Sign In/)
    await expect(page.locator('h1')).toContainText('Sign in to your account')
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.locator('button[type="submit"]').click()
    
    await expect(page.locator('text=Email is required')).toBeVisible()
    await expect(page.locator('text=Password is required')).toBeVisible()
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.fill('input[name="email"]', 'invalid@example.com')
    await page.fill('input[name="password"]', 'wrongpassword')
    await page.locator('button[type="submit"]').click()
    
    await expect(page.locator('text=Invalid email or password')).toBeVisible()
  })

  test('should successfully login with valid credentials', async ({ page }) => {
    await page.fill('input[name="email"]', 'admin@test.com')
    await page.fill('input[name="password"]', 'password123')
    await page.locator('button[type="submit"]').click()
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('text=Welcome back')).toBeVisible()
  })

  test('should handle two-factor authentication', async ({ page }) => {
    // Enable 2FA for test user first
    await page.fill('input[name="email"]', 'user-with-2fa@test.com')
    await page.fill('input[name="password"]', 'password123')
    await page.locator('button[type="submit"]').click()
    
    // Should redirect to 2FA page
    await expect(page).toHaveURL('/auth/two-factor')
    await expect(page.locator('text=Two-Factor Authentication')).toBeVisible()
    
    // Enter 2FA code
    await page.fill('input[name="code"]', '123456')
    await page.locator('button[type="submit"]').click()
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard')
  })

  test('should logout successfully', async ({ page }) => {
    // First login
    await page.fill('input[name="email"]', 'admin@test.com')
    await page.fill('input[name="password"]', 'password123')
    await page.locator('button[type="submit"]').click()
    
    await expect(page).toHaveURL('/dashboard')
    
    // Click user menu and logout
    await page.locator('[data-testid="user-menu"]').click()
    await page.locator('text=Sign out').click()
    
    // Should redirect to login
    await expect(page).toHaveURL('/auth/login')
  })

  test('should handle remember me functionality', async ({ page, context }) => {
    await page.fill('input[name="email"]', 'admin@test.com')
    await page.fill('input[name="password"]', 'password123')
    await page.check('input[name="rememberMe"]')
    await page.locator('button[type="submit"]').click()
    
    await expect(page).toHaveURL('/dashboard')
    
    // Check cookies
    const cookies = await context.cookies()
    const sessionCookie = cookies.find(c => c.name === 'next-auth.session-token')
    expect(sessionCookie).toBeDefined()
    expect(sessionCookie?.expires).toBeGreaterThan(Date.now() / 1000 + 7 * 24 * 60 * 60) // 7 days
  })
})

test.describe('Registration Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/register')
  })

  test('should display registration page', async ({ page }) => {
    await expect(page).toHaveTitle(/Create Account/)
    await expect(page.locator('h1')).toContainText('Create your account')
    await expect(page.locator('input[name="name"]')).toBeVisible()
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
    await expect(page.locator('input[name="confirmPassword"]')).toBeVisible()
  })

  test('should validate password requirements', async ({ page }) => {
    await page.fill('input[name="password"]', 'weak')
    await page.locator('input[name="confirmPassword"]').click()
    
    await expect(page.locator('text=Password must be at least 8 characters')).toBeVisible()
  })

  test('should validate password confirmation', async ({ page }) => {
    await page.fill('input[name="password"]', 'StrongPassword123!')
    await page.fill('input[name="confirmPassword"]', 'DifferentPassword123!')
    await page.locator('button[type="submit"]').click()
    
    await expect(page.locator('text=Passwords do not match')).toBeVisible()
  })

  test('should successfully register new user', async ({ page }) => {
    const timestamp = Date.now()
    const email = `newuser${timestamp}@test.com`
    
    await page.fill('input[name="name"]', 'New User')
    await page.fill('input[name="email"]', email)
    await page.fill('input[name="password"]', 'StrongPassword123!')
    await page.fill('input[name="confirmPassword"]', 'StrongPassword123!')
    await page.check('input[name="acceptTerms"]')
    await page.locator('button[type="submit"]').click()
    
    // Should redirect to verification page
    await expect(page).toHaveURL('/auth/verify-email')
    await expect(page.locator('text=Check your email')).toBeVisible()
  })
})

test.describe('Password Reset Flow', () => {
  test('should handle forgot password flow', async ({ page }) => {
    await page.goto('/auth/login')
    await page.locator('text=Forgot password?').click()
    
    await expect(page).toHaveURL('/auth/forgot-password')
    await expect(page.locator('h1')).toContainText('Reset your password')
    
    await page.fill('input[name="email"]', 'admin@test.com')
    await page.locator('button[type="submit"]').click()
    
    await expect(page.locator('text=Check your email')).toBeVisible()
  })
})
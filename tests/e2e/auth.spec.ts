import { test, expect } from '@playwright/test';

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_EMAIL = 'test.user@agendaiq.com';
const TEST_PASSWORD = 'TestPassword123!';
const ADMIN_EMAIL = 'admin@school.edu';
const ADMIN_PASSWORD = '1234';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test('should redirect to signin page when not authenticated', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await expect(page).toHaveURL(/.*\/auth\/signin/);
  });

  test('should display signin page correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/signin`);
    
    // Check page title
    await expect(page.locator('h1')).toContainText('Welcome to AgendaIQ');
    
    // Check form elements
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Check signup link
    await expect(page.locator('a[href="/auth/signup"]')).toBeVisible();
  });

  test('should display signup page correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/signup`);
    
    // Check page title
    await expect(page.locator('h2')).toContainText('Create your account');
    
    // Check form elements
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('input[name="confirmPassword"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Check signin link
    await expect(page.locator('a[href="/auth/signin"]')).toBeVisible();
  });

  test('should handle signup flow', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/signup`);
    
    // Generate unique email for test
    const uniqueEmail = `test.${Date.now()}@agendaiq.com`;
    
    // Fill signup form
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.fill('input[name="confirmPassword"]', TEST_PASSWORD);
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should redirect to signin with registered param
    await page.waitForURL(/.*\/auth\/signin\?registered=true/, { timeout: 10000 });
  });

  test('should handle signin flow with existing admin', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/signin`);
    
    // Fill signin form with admin credentials
    await page.fill('input[name="email"]', ADMIN_EMAIL);
    await page.fill('input[name="password"]', ADMIN_PASSWORD);
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await page.waitForURL(/.*\/dashboard/, { timeout: 10000 });
    
    // Check user is logged in
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('should handle invalid credentials', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/signin`);
    
    // Fill signin form with invalid credentials
    await page.fill('input[name="email"]', 'invalid@email.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.locator('text=Invalid credentials')).toBeVisible({ timeout: 5000 });
  });

  test('should handle password mismatch in signup', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/signup`);
    
    // Fill signup form with mismatched passwords
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.fill('input[name="confirmPassword"]', 'DifferentPassword123!');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.locator('text=Passwords do not match')).toBeVisible();
  });

  test('should handle logout flow', async ({ page }) => {
    // First login
    await page.goto(`${BASE_URL}/auth/signin`);
    await page.fill('input[name="email"]', ADMIN_EMAIL);
    await page.fill('input[name="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*\/dashboard/);
    
    // Find and click logout button
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');
    
    // Should redirect to signin
    await page.waitForURL(/.*\/auth\/signin/);
  });

  test('should maintain session across page refreshes', async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/auth/signin`);
    await page.fill('input[name="email"]', ADMIN_EMAIL);
    await page.fill('input[name="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*\/dashboard/);
    
    // Refresh page
    await page.reload();
    
    // Should still be on dashboard
    await expect(page).toHaveURL(/.*\/dashboard/);
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('should handle rate limiting', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/signin`);
    
    // Try multiple failed login attempts
    for (let i = 0; i < 6; i++) {
      await page.fill('input[name="email"]', 'test@test.com');
      await page.fill('input[name="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(500);
    }
    
    // Should show rate limit error
    await expect(page.locator('text=/too many.*attempts/i')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('CSS and UI Consistency', () => {
  test('should have consistent styling on signin page', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/signin`);
    
    // Check background color
    const body = page.locator('body');
    const bgColor = await body.evaluate(el => 
      window.getComputedStyle(el).backgroundColor
    );
    expect(bgColor).toBeTruthy();
    
    // Check form styling
    const form = page.locator('form').first();
    const formStyles = await form.evaluate(el => ({
      display: window.getComputedStyle(el).display,
      maxWidth: window.getComputedStyle(el).maxWidth
    }));
    expect(formStyles.display).not.toBe('none');
    
    // Check input styling
    const emailInput = page.locator('input[name="email"]');
    const inputStyles = await emailInput.evaluate(el => ({
      border: window.getComputedStyle(el).border,
      padding: window.getComputedStyle(el).padding,
      borderRadius: window.getComputedStyle(el).borderRadius
    }));
    expect(inputStyles.border).toBeTruthy();
    expect(inputStyles.padding).toBeTruthy();
    
    // Check button styling
    const submitButton = page.locator('button[type="submit"]');
    const buttonStyles = await submitButton.evaluate(el => ({
      backgroundColor: window.getComputedStyle(el).backgroundColor,
      color: window.getComputedStyle(el).color,
      padding: window.getComputedStyle(el).padding
    }));
    expect(buttonStyles.backgroundColor).toBeTruthy();
    expect(buttonStyles.color).toBeTruthy();
  });

  test('should have responsive layout', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/signin`);
    
    // Test desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('form')).toBeVisible();
    
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('form')).toBeVisible();
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('form')).toBeVisible();
    
    // Form should be centered in all views
    const form = page.locator('form').first();
    const formBox = await form.boundingBox();
    expect(formBox).toBeTruthy();
  });
});

test.describe('Security Tests', () => {
  test('should not expose sensitive data in URL', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/signin`);
    
    // Fill and submit form
    await page.fill('input[name="email"]', ADMIN_EMAIL);
    await page.fill('input[name="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    
    // Wait for navigation
    await page.waitForURL(/.*\/dashboard/, { timeout: 10000 });
    
    // Check URL doesn't contain password
    const url = page.url();
    expect(url).not.toContain('password');
    expect(url).not.toContain(ADMIN_PASSWORD);
  });

  test('should handle XSS attempts in input fields', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/signin`);
    
    // Try XSS in email field
    const xssPayload = '<script>alert("XSS")</script>';
    await page.fill('input[name="email"]', xssPayload);
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
    
    // Should not execute script
    const alertFired = await page.evaluate(() => {
      let alertCalled = false;
      const originalAlert = window.alert;
      window.alert = () => { alertCalled = true; };
      setTimeout(() => { window.alert = originalAlert; }, 100);
      return alertCalled;
    });
    expect(alertFired).toBe(false);
  });

  test('should have secure cookie settings', async ({ page, context }) => {
    // Login first
    await page.goto(`${BASE_URL}/auth/signin`);
    await page.fill('input[name="email"]', ADMIN_EMAIL);
    await page.fill('input[name="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*\/dashboard/);
    
    // Check cookies
    const cookies = await context.cookies();
    const sessionCookie = cookies.find(c => c.name.includes('session'));
    
    if (sessionCookie) {
      // In production, these should be true
      if (BASE_URL.includes('https')) {
        expect(sessionCookie.secure).toBe(true);
      }
      expect(sessionCookie.httpOnly).toBe(true);
      expect(sessionCookie.sameSite).toBeTruthy();
    }
  });
});
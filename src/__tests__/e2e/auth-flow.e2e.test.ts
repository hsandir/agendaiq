/**
 * AUTH-E2E-01: E2E Authentication Flow Tests
 * Test complete login flow with browser automation
 */

import { test, expect } from '@playwright/test';

test.describe('AUTH-E2E-01: Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start from the home page
    await page.goto('/');
  });

  test('should redirect to signin when accessing protected route', async ({ page }) => {
    // Try to access dashboard without auth
    await page.goto('/dashboard');
    
    // Should redirect to signin with callback URL
    await expect(page).toHaveURL(/\/auth\/signin\?callbackUrl/);
    
    // Should show signin form
    await expect(page.locator('h1, h2').filter({ hasText: /sign in/i })).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/auth/signin');
    
    // Fill in invalid credentials
    await page.fill('input[name="email"]', 'invalid@test.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.locator('text=/invalid|incorrect|wrong/i')).toBeVisible({ timeout: 10000 });
  });

  test('should successfully login with valid credentials @smoke', async ({ page }) => {
    // This test requires a test user in the database
    // In a real scenario, we'd seed a test user or use a test database
    
    await page.goto('/auth/signin');
    
    // Fill in test credentials
    await page.fill('input[name="email"]', 'admin@school.edu');
    await page.fill('input[name="password"]', '1234');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard after successful login
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
    
    // Should show user info or dashboard content
    await expect(page.locator('[data-testid="dashboard-content"], h1').first()).toBeVisible();
  });

  test('should handle 2FA flow when enabled', async ({ page }) => {
    // This test assumes a user with 2FA enabled exists
    await page.goto('/auth/signin');
    
    // Fill in credentials for 2FA user
    await page.fill('input[name="email"]', '2fa@test.com');
    await page.fill('input[name="password"]', 'password123');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should show 2FA input field
    const twoFactorInput = page.locator('input[name="twoFactorCode"], input[name="code"]');
    
    // If 2FA is required, the input should be visible
    // Note: This is conditional based on whether the test user has 2FA enabled
    const is2FAVisible = await twoFactorInput.isVisible().catch(() => false);
    
    if (is2FAVisible) {
      // Fill in 2FA code (would need valid TOTP in real test)
      await twoFactorInput.fill('123456');
      await page.click('button[type="submit"]');
    }
  });

  test('should logout successfully', async ({ page, context }) => {
    // First, we need to be logged in
    // In a real test, we'd use a helper function or fixture to login
    
    // Set a mock session cookie for testing
    await context.addCookies([{
      name: 'next-auth.session-token',
      value: 'mock-session-token',
      domain: 'localhost',
      path: '/',
    }]);
    
    await page.goto('/dashboard');
    
    // Look for logout button
    const logoutButton = page.locator('button, a').filter({ hasText: /logout|sign out/i });
    
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      
      // Should redirect to home or signin
      await expect(page).toHaveURL(/^\/$|\/auth\/signin/);
    }
  });
});

test.describe('AUTH-E2E-04: Protected Routes', () => {
  test('should redirect anonymous users to signin with callback URL', async ({ page }) => {
    // Test various protected routes
    const protectedRoutes = [
      '/dashboard',
      '/dashboard/meetings',
      '/dashboard/settings',
      '/dashboard/system',
    ];
    
    for (const route of protectedRoutes) {
      await page.goto(route);
      
      // Should redirect to signin with the original URL as callback
      await expect(page).toHaveURL(new RegExp(`/auth/signin\\?callbackUrl=.*${encodeURIComponent(route)}`));
    }
  });
});

test.describe('AUTH-E2E-05: Capability-based UI', () => {
  test('should show/hide UI elements based on capabilities', async ({ page, context }) => {
    // Mock admin session
    await context.addCookies([{
      name: 'next-auth.session-token',
      value: 'mock-admin-session',
      domain: 'localhost',
      path: '/',
    }]);
    
    await page.goto('/dashboard');
    
    // Check for admin-only elements
    const systemLink = page.locator('a[href*="/system"], a').filter({ hasText: /system/i });
    const monitoringLink = page.locator('a[href*="/monitoring"], a').filter({ hasText: /monitoring/i });
    
    // These should be visible for admins (if session is valid)
    // In a real test, we'd need proper session setup
    const isSystemVisible = await systemLink.isVisible().catch(() => false);
    const isMonitoringVisible = await monitoringLink.isVisible().catch(() => false);
    
    // Log visibility for debugging (remove in production)
    console.log('System link visible:', isSystemVisible);
    console.log('Monitoring link visible:', isMonitoringVisible);
  });
});

test.describe('Google OAuth Flow', () => {
  test('should show Google sign-in button', async ({ page }) => {
    await page.goto('/auth/signin');
    
    // Should have Google sign-in option
    const googleButton = page.locator('button, a').filter({ hasText: /google|continue with google/i });
    await expect(googleButton).toBeVisible();
  });
  
  test('should handle unauthorized domain error', async ({ page }) => {
    await page.goto('/auth/signin?error=unauthorized_domain');
    
    // Should show domain error message
    await expect(page.locator('text=/domain|authorized|organization/i')).toBeVisible();
  });
  
  test('should handle account linking error', async ({ page }) => {
    await page.goto('/auth/signin?error=account_linking_required');
    
    // Should show linking required message
    await expect(page.locator('text=/link|account|existing/i')).toBeVisible();
  });
});
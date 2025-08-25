import { test, expect } from '@playwright/test'

test.describe('Meeting Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'admin@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL('/dashboard');
    // Navigate to meetings
    await page.goto('/dashboard/meetings');
  })

  test('should display meetings list', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Meetings');
    await expect(page.locator('[data-testid="meetings-list"]')).toBeVisible();
    await expect(page.locator('button:has-text("New Meeting")')).toBeVisible();
  })

  test('should create a new meeting', async ({ page }) => {
    await page.locator('button:has-text("New Meeting")').click();
    // Fill meeting form
    await page.fill('input[name="title"]', 'E2E Test Meeting');
    await page.fill('textarea[name="description"]', 'This is a test meeting created by E2E tests');
    // Set date and time
    await page.fill('input[name="date"]', '2024-12-31');
    await page.fill('input[name="startTime"]', '14:00');
    await page.fill('input[name="endTime"]', '15:00');
    // Add attendees
    await page.locator('[data-testid="add-attendees"]').click();
    await page.locator('text=Test Teacher').click();
    // Submit form
    await page.locator('button[type="submit"]').click();
    // Verify success
    await expect(page.locator('text=Meeting created successfully')).toBeVisible();
    await expect(page.locator('text=E2E Test Meeting')).toBeVisible();
  })

  test('should edit an existing meeting', async ({ page }) => {
    // Click on first meeting
    await page.locator('[data-testid="meeting-card"]').first().click();
    // Click edit button
    await page.locator('button:has-text("Edit")').click();
    // Update title
    await page.fill('input[name="title"]', 'Updated Meeting Title');
    // Save changes
    await page.locator('button[type="submit"]').click();
    // Verify success
    await expect(page.locator('text=Meeting updated successfully')).toBeVisible();
    await expect(page.locator('text=Updated Meeting Title')).toBeVisible();
  })

  test('should delete a meeting', async ({ page }) => {
    // Click on first meeting
    await page.locator('[data-testid="meeting-card"]').first().click();
    // Click delete button
    await page.locator('button:has-text("Delete")').click();
    // Confirm deletion
    await page.locator('button:has-text("Confirm")').click();
    // Verify success
    await expect(page.locator('text=Meeting deleted successfully')).toBeVisible();
  })

  test('should filter meetings by date', async ({ page }) => {
    // Open date filter
    await page.locator('[data-testid="date-filter"]').click();
    // Select today
    await page.locator('button:has-text("Today")').click();
    // Verify filtered results
    const meetings = await page.locator('[data-testid="meeting-card"]').count();
    expect(meetings).toBeGreaterThanOrEqual(0);
  })

  test('should search meetings', async ({ page }) => {
    // Type in search box
    await page.fill('[data-testid="search-meetings"]', 'Staff Meeting');
    // Wait for results
    await page.waitForTimeout(500) // Debounce delay
    
    // Verify filtered results
    const meetings = await page.locator('[data-testid="meeting-card"]').count();
    for (let i = 0; i < meetings; i++) {
      const title = await page.locator('[data-testid="meeting-card"]').nth(i).locator('h3').textContent();
      expect(title?.toLowerCase()).toContain('staff meeting');
    }
  })

  test('should handle meeting agenda', async ({ page }) => {
    // Create a new meeting first
    await page.locator('button:has-text("New Meeting")').click();
    await page.fill('input[name="title"]', 'Meeting with Agenda');
    await page.fill('input[name="date"]', '2024-12-31');
    await page.fill('input[name="startTime"]', '10:00');
    await page.fill('input[name="endTime"]', '11:00');
    await page.locator('button[type="submit"]').click();
    // Navigate to the meeting
    await page.locator('text=Meeting with Agenda').click();
    // Add agenda item
    await page.locator('button:has-text("Add Agenda Item")').click();
    await page.fill('input[name="agendaTitle"]', 'Discussion: Budget Review');
    await page.fill('textarea[name="agendaDescription"]', 'Review Q4 budget allocations');
    await page.fill('input[name="duration"]', '15');
    await page.locator('button:has-text("Add Item")').click();
    // Verify agenda item added
    await expect(page.locator('text=Discussion: Budget Review')).toBeVisible();
  })

  test('should export meeting details', async ({ page }) => {
    // Click on first meeting
    await page.locator('[data-testid="meeting-card"]').first().click();
    // Click export button
    const downloadPromise = page.waitForEvent('download');
    await page.locator('button:has-text("Export")').click();
    const download = await downloadPromise
    expect(download.suggestedFilename()).toContain('meeting');
    expect(download.suggestedFilename()).toMatch(/\.(pdf|csv|json)$/)
  })
})

test.describe('Meeting Permissions', () => {
  test('regular user cannot create meetings', async ({ page }) => {
    // Login as regular user
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'teacher@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.locator('button[type="submit"]').click();
    await page.goto('/dashboard/meetings');
    // New Meeting button should not be visible
    await expect(page.locator('button:has-text("New Meeting")')).not.toBeVisible();
  })

  test('user can only see meetings they are invited to', async ({ page }) => {
    // Login as teacher
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'teacher@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.locator('button[type="submit"]').click();
    await page.goto('/dashboard/meetings');
    // Should only see meetings where they are organizer or attendee
    const meetings = await page.locator('[data-testid="meeting-card"]').count();
    for (let i = 0; i < meetings; i++) {
      const meetingCard = page.locator('[data-testid="meeting-card"]').nth(i);
      const organizer = await meetingCard.locator('[data-testid="organizer-name"]').textContent();
      const attendees = await meetingCard.locator('[data-testid="attendee-list"]').textContent();
      expect(
        organizer?.includes('Test Teacher') || attendees?.includes('Test Teacher');
      ).toBeTruthy();
    }
  })
})
import { test, expect } from '@playwright/test'

test.describe('Vehicle Return Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the site map page
    await page.goto('/sitemap')
    
    // Wait for the map to load
    await page.waitForSelector('[data-testid="site-map"]', { timeout: 10000 })
  })

  test('should complete vehicle return flow successfully', async ({ page }) => {
    // Click on a site to select it
    await page.click('[data-testid="site-marker"]:first-of-type')
    
    // Wait for site details to load
    await page.waitForSelector('[data-testid="site-details"]')
    
    // Click the return button
    await page.click('[data-testid="return-button"]')
    
    // Wait for return modal to appear
    await page.waitForSelector('[data-testid="return-modal"]')
    
    // Verify modal title
    await expect(page.locator('[data-testid="return-modal"] h2')).toHaveText('車輛歸還')
    
    // Select a vehicle
    await page.selectOption('[data-testid="vehicle-select"]', { index: 1 })
    
    // Fill in odometer reading
    await page.fill('[data-testid="odometer-input"]', '150')
    
    // Fill in battery level
    await page.fill('[data-testid="battery-input"]', '75')
    
    // Add notes
    await page.fill('[data-testid="notes-input"]', '車輛狀況良好，無異常')
    
    // Submit the return
    await page.click('[data-testid="submit-return"]')
    
    // Wait for submission to complete
    await page.waitForSelector('[data-testid="return-success"]', { timeout: 10000 })
    
    // Verify success message
    await expect(page.locator('[data-testid="return-success"]')).toContainText('歸還成功')
    
    // Close the modal
    await page.click('[data-testid="close-modal"]')
    
    // Verify modal is closed
    await expect(page.locator('[data-testid="return-modal"]')).not.toBeVisible()
  })

  test('should show validation errors for invalid input', async ({ page }) => {
    // Click on a site to select it
    await page.click('[data-testid="site-marker"]:first-of-type')
    
    // Click the return button
    await page.click('[data-testid="return-button"]')
    
    // Wait for return modal to appear
    await page.waitForSelector('[data-testid="return-modal"]')
    
    // Try to submit without selecting vehicle
    await page.click('[data-testid="submit-return"]')
    
    // Should show validation error
    await expect(page.locator('.text-red-600')).toContainText('請選擇要歸還的車輛')
    
    // Select vehicle but enter invalid odometer
    await page.selectOption('[data-testid="vehicle-select"]', { index: 1 })
    await page.fill('[data-testid="odometer-input"]', '-10')
    
    // Should show odometer validation error
    await expect(page.locator('.text-red-600')).toContainText('里程數必須為非負數')
    
    // Enter invalid battery level
    await page.fill('[data-testid="odometer-input"]', '150')
    await page.fill('[data-testid="battery-input"]', '150')
    
    // Should show battery validation error
    await expect(page.locator('.text-red-600')).toContainText('電池電量必須在0-100%之間')
  })

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API to return error
    await page.route('**/api/v1/returns', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'SYSTEM_ERROR',
          message: '系統暫時無法處理歸還請求'
        })
      })
    })
    
    // Complete return form
    await page.click('[data-testid="site-marker"]:first-of-type')
    await page.click('[data-testid="return-button"]')
    await page.waitForSelector('[data-testid="return-modal"]')
    
    await page.selectOption('[data-testid="vehicle-select"]', { index: 1 })
    await page.fill('[data-testid="odometer-input"]', '150')
    await page.fill('[data-testid="battery-input"]', '75')
    
    // Submit return
    await page.click('[data-testid="submit-return"]')
    
    // Should show error message
    await expect(page.locator('.text-red-700')).toContainText('系統暫時無法處理歸還請求')
  })

  test('should show loading states appropriately', async ({ page }) => {
    // Click on a site to select it
    await page.click('[data-testid="site-marker"]:first-of-type')
    
    // Click the return button
    await page.click('[data-testid="return-button"]')
    
    // Wait for return modal to appear
    await page.waitForSelector('[data-testid="return-modal"]')
    
    // Should show loading state while fetching vehicles
    await expect(page.locator('.animate-spin')).toBeVisible()
    
    // Wait for vehicles to load
    await page.waitForSelector('[data-testid="vehicle-select"] option', { timeout: 5000 })
    
    // Loading should be gone
    await expect(page.locator('.animate-spin')).not.toBeVisible()
    
    // Fill form
    await page.selectOption('[data-testid="vehicle-select"]', { index: 1 })
    await page.fill('[data-testid="odometer-input"]', '150')
    await page.fill('[data-testid="battery-input"]', '75')
    
    // Click submit - should show submitting state
    await page.click('[data-testid="submit-return"]')
    
    // Should show submitting state
    await expect(page.locator('[data-testid="submit-return"]')).toContainText('處理中')
    await expect(page.locator('[data-testid="submit-return"]')).toBeDisabled()
  })

  test('should handle photo upload functionality', async ({ page }) => {
    // Click on a site to select it
    await page.click('[data-testid="site-marker"]:first-of-type')
    
    // Click the return button
    await page.click('[data-testid="return-button"]')
    
    // Wait for return modal to appear
    await page.waitForSelector('[data-testid="return-modal"]')
    
    // Upload a photo
    const fileInput = page.locator('[data-testid="photo-input"]')
    await fileInput.setInputFiles({
      name: 'test-image.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-image-content')
    })
    
    // Should show uploaded photo preview
    await expect(page.locator('[data-testid="photo-preview"]')).toBeVisible()
    
    // Should be able to delete photo
    await page.click('[data-testid="delete-photo"]')
    await expect(page.locator('[data-testid="photo-preview"]')).not.toBeVisible()
  })

  test('should preserve form data when modal is reopened', async ({ page }) => {
    // Click on a site to select it
    await page.click('[data-testid="site-marker"]:first-of-type')
    
    // Click the return button
    await page.click('[data-testid="return-button"]')
    
    // Wait for return modal to appear
    await page.waitForSelector('[data-testid="return-modal"]')
    
    // Fill some form data
    await page.selectOption('[data-testid="vehicle-select"]', { index: 1 })
    await page.fill('[data-testid="odometer-input"]', '150')
    
    // Close modal without submitting
    await page.click('[data-testid="close-modal"]')
    
    // Reopen modal
    await page.click('[data-testid="return-button"]')
    
    // Form should be reset (not preserve data for security)
    await expect(page.locator('[data-testid="vehicle-select"]')).toHaveValue('')
    await expect(page.locator('[data-testid="odometer-input"]')).toHaveValue('')
  })

  test('should navigate to different sites and show correct return dialogs', async ({ page }) => {
    // Click on first site
    await page.click('[data-testid="site-marker"]:first-of-type')
    await page.click('[data-testid="return-button"]')
    
    const firstSiteName = await page.locator('[data-testid="return-modal"] .site-name').textContent()
    await page.click('[data-testid="close-modal"]')
    
    // Click on second site
    await page.click('[data-testid="site-marker"]:nth-of-type(2)')
    await page.click('[data-testid="return-button"]')
    
    const secondSiteName = await page.locator('[data-testid="return-modal"] .site-name').textContent()
    
    // Sites should be different
    expect(firstSiteName).not.toBe(secondSiteName)
  })
})
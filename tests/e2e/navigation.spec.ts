import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:5173')
  })

  test('should display main navigation menu', async ({ page }) => {
    // Check if the app loads correctly
    await expect(page.locator('h1')).toContainText('系統總覽')
    
    // Check if navigation menu exists
    await expect(page.locator('[data-test="nav-menu"]')).toBeVisible()
  })

  test('should navigate to different pages', async ({ page }) => {
    // Navigate to Site Map page
    await page.click('[data-test="nav-sitemap"]')
    await expect(page.locator('h1')).toContainText('場域地圖')
    
    // Navigate to Vehicles page
    await page.click('[data-test="nav-vehicles"]')
    await expect(page.locator('h1')).toContainText('車輛清單')
    
    // Navigate to Alerts page
    await page.click('[data-test="nav-alerts"]')
    await expect(page.locator('h1')).toContainText('警報中心')
    
    // Navigate to ML Prediction page
    await page.click('[data-test="nav-ml"]')
    await expect(page.locator('h1')).toContainText('機器學習綜合預測')
    
    // Navigate to User Management page
    await page.click('[data-test="nav-users"]')
    await expect(page.locator('h1')).toContainText('帳號管理')
  })

  test('should highlight active navigation item', async ({ page }) => {
    // Click on Vehicles nav item
    await page.click('[data-test="nav-vehicles"]')
    
    // Check if the navigation item is highlighted
    const activeNav = page.locator('[data-test="nav-vehicles"]')
    await expect(activeNav).toHaveClass(/active|bg-brand-primary/)
  })
})

test.describe('Vehicle Return Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/sitemap')
  })

  test('should open return modal when clicking return button', async ({ page }) => {
    // Wait for the map to load
    await page.waitForTimeout(1000)
    
    // Click on a site marker (assuming there's at least one)
    const siteMarker = page.locator('[data-test="site-marker"]').first()
    if (await siteMarker.count() > 0) {
      await siteMarker.click()
      
      // Click return vehicle button
      await page.click('[data-test="return-button"]')
      
      // Check if return modal opens
      await expect(page.locator('[data-test="return-modal"]')).toBeVisible()
      await expect(page.locator('text=歸還車輛')).toBeVisible()
    }
  })

  test('should validate form fields in return modal', async ({ page }) => {
    // Assuming modal is open
    await page.click('[data-test="site-marker"]')
    await page.click('[data-test="return-button"]')
    
    // Try to submit empty form
    await page.click('button[type="submit"]')
    
    // Should show validation errors
    await expect(page.locator('text=請選擇車輛')).toBeVisible()
  })

  test('should successfully complete vehicle return', async ({ page }) => {
    // Open return modal
    await page.click('[data-test="site-marker"]')
    await page.click('[data-test="return-button"]')
    
    // Fill form
    await page.selectOption('select', { index: 1 }) // Select first available vehicle
    await page.fill('input[placeholder*="里程數"]', '150')
    await page.fill('input[type="range"]', '85')
    
    // Add notes
    await page.fill('textarea[placeholder*="備註"]', '車輛狀況良好')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Should show success message or close modal
    await expect(page.locator('text=歸還成功')).toBeVisible()
  })
})

test.describe('User Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/admin/users')
  })

  test('should display user list', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('帳號管理')
    
    // Should show stats cards
    await expect(page.locator('text=總使用者')).toBeVisible()
    await expect(page.locator('text=啟用中')).toBeVisible()
    await expect(page.locator('text=停用中')).toBeVisible()
    
    // Should show user table
    await expect(page.locator('table')).toBeVisible()
  })

  test('should open add user modal', async ({ page }) => {
    await page.click('button:has-text("新增使用者")')
    
    await expect(page.locator('text=新增使用者')).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[placeholder*="姓名"]')).toBeVisible()
    await expect(page.locator('select')).toBeVisible()
  })

  test('should validate add user form', async ({ page }) => {
    await page.click('button:has-text("新增使用者")')
    
    // Try to submit empty form
    await page.click('button[type="submit"]')
    
    // Should show validation (HTML5 validation or custom)
    const emailInput = page.locator('input[type="email"]')
    await expect(emailInput).toBeFocused()
  })
})

test.describe('Alerts Center', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/alerts')
  })

  test('should display alerts dashboard', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('警報中心')
    
    // Should show alert summary stats
    await expect(page.locator('text=危急')).toBeVisible()
    await expect(page.locator('text=警告')).toBeVisible()
    await expect(page.locator('text=資訊')).toBeVisible()
  })

  test('should filter alerts by severity', async ({ page }) => {
    // Select critical alerts only
    await page.selectOption('select', 'critical')
    
    // Should filter the alert list
    await page.waitForTimeout(500)
    
    // All visible alerts should be critical
    const alertItems = page.locator('[data-test="alert-item"]')
    const count = await alertItems.count()
    
    if (count > 0) {
      // Check if alerts contain critical severity indicators
      await expect(alertItems.first().locator('.bg-red-')).toBeVisible()
    }
  })

  test('should show alert details when clicking on alert', async ({ page }) => {
    // Click on first alert
    const firstAlert = page.locator('[data-test="alert-item"]').first()
    if (await firstAlert.count() > 0) {
      await firstAlert.click()
      
      // Should show alert details in right panel
      await expect(page.locator('text=警報詳情')).toBeVisible()
      await expect(page.locator('text=建議處理方式')).toBeVisible()
    }
  })
})

test.describe('ML Prediction', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/ml/predict')
  })

  test('should display ML prediction interface', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('機器學習綜合預測')
    
    // Should show route information
    await expect(page.locator('text=花蓮路線')).toBeVisible()
    await expect(page.locator('text=距離')).toBeVisible()
    
    // Should have recalculate button
    await expect(page.locator('button:has-text("重新計算")')).toBeVisible()
  })

  test('should show prediction results table', async ({ page }) => {
    // Wait for data to load
    await page.waitForTimeout(1000)
    
    // Should show table with predictions
    await expect(page.locator('table')).toBeVisible()
    await expect(page.locator('text=車輛 ID')).toBeVisible()
    await expect(page.locator('text=預計時間')).toBeVisible()
    await expect(page.locator('text=能耗')).toBeVisible()
    await expect(page.locator('text=減碳')).toBeVisible()
  })

  test('should recalculate predictions', async ({ page }) => {
    await page.click('button:has-text("重新計算")')
    
    // Should show loading state
    await expect(page.locator('button:has-text("計算中")')).toBeVisible()
    
    // Wait for calculation to complete
    await page.waitForTimeout(2000)
    
    // Should show recalculate button again
    await expect(page.locator('button:has-text("重新計算")')).toBeVisible()
  })
})
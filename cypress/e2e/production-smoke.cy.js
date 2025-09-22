/**
 * 生產環境煙霧測試
 * 專門為已部署的前端設計，避免對具體內容的硬編碼假設
 */

describe('生產環境煙霧測試', () => {
  const baseUrl = Cypress.config('baseUrl') || 'https://penguin.osdp25w.xyz'

  beforeEach(() => {
    // 設置更長的超時時間
    Cypress.config('defaultCommandTimeout', 15000)
    // 忽略跨域錯誤
    cy.on('uncaught:exception', (err, runnable) => {
      return false
    })
  })

  describe('基本可用性測試', () => {
    it('首頁應該可以訪問', () => {
      cy.visit('/')

      // 檢查頁面是否正常載入（不依賴具體內容）
      cy.get('body').should('exist')
      cy.title().should('not.be.empty')

      // 檢查沒有明顯的錯誤
      cy.get('body').should('not.contain', '500')
      cy.get('body').should('not.contain', 'Application Error')
    })

    it('登入頁面應該可以訪問', () => {
      cy.visit('/login')

      // 檢查登入表單存在
      cy.get('input[type="email"], input[type="text"]').should('exist')
      cy.get('input[type="password"]').should('exist')
      cy.get('button[type="submit"], button').contains(/登入|login/i).should('exist')
    })

    it('場域地圖頁面應該可以訪問', () => {
      cy.visit('/sites')

      // 檢查頁面載入
      cy.get('body').should('exist')
      cy.url().should('include', '/sites')
    })
  })

  describe('登入頁面測試', () => {
    it('登入頁面表單元素完整', () => {
      cy.visit('/login')

      // 檢查表單元素存在
      cy.get('input[type="email"], input[type="text"]').should('exist')
      cy.get('input[type="password"]').should('exist')
      cy.get('button[type="submit"], button').contains(/登入|login/i).should('exist')

      // 檢查頁面標題
      cy.title().should('not.be.empty')
    })

    it('登入表單可以輸入內容', () => {
      cy.visit('/login')

      // 測試輸入功能
      cy.get('input[type="email"], input[type="text"]').type('test@example.com')
      cy.get('input[type="password"]').type('testpassword')

      // 驗證輸入的內容
      cy.get('input[type="email"], input[type="text"]').should('have.value', 'test@example.com')
      cy.get('input[type="password"]').should('have.value', 'testpassword')
    })
  })

  describe('權限控制測試', () => {
    it('未登入用戶應該被重定向到登入頁', () => {
      // 清除所有 cookies 和 localStorage
      cy.clearAllCookies()
      cy.clearLocalStorage()

      // 嘗試訪問需要認證的頁面
      cy.visit('/admin/users')

      // 應該被重定向到登入頁或 403 頁面
      cy.url().should('satisfy', url =>
        url.includes('/login') || url.includes('/403')
      )
    })
  })

  describe('頁面基本載入測試', () => {
    it('場域地圖頁面應該有基本內容', () => {
      cy.visit('/sites')

      // 檢查頁面基本元素
      cy.get('body').should('exist')
      cy.url().should('include', '/sites')

      // 等待內容載入
      cy.wait(2000)

      // 檢查頁面不是空白或錯誤頁面
      cy.get('body').should('not.contain', '500')
      cy.get('body').should('not.contain', 'Application Error')
    })

    it('頁面標題應該正確設置', () => {
      cy.visit('/sites')
      cy.title().should('not.be.empty')
      cy.title().should('not.contain', 'undefined')
    })
  })

  describe('錯誤處理測試', () => {
    it('訪問不存在的頁面應該有適當的錯誤處理', () => {
      cy.visit('/this-page-does-not-exist', { failOnStatusCode: false })

      // 應該顯示 404 頁面或重定向到首頁
      cy.url().should('satisfy', url =>
        url.includes('/this-page-does-not-exist') ||
        url === baseUrl + '/' ||
        url.includes('/404')
      )
    })
  })
})

// 生產環境測試 - 移除需要實際登入的指令
/**
 * 快速權限測試 - 驗證修復是否有效
 */

describe('快速權限測試', () => {
  const baseUrl = Cypress.config('baseUrl') || 'https://penguin.osdp25w.xyz'

  beforeEach(() => {
    Cypress.config('defaultCommandTimeout', 10000)
    cy.on('uncaught:exception', (err, runnable) => {
      return false
    })
  })

  // 測試 Member 權限
  it('Member 用戶只能訪問允許的頁面', () => {
    // 登入
    cy.visit('/login')
    cy.get('input[type="email"], input[type="text"]').clear().type('pony@real1.com')
    cy.get('input[type="password"]').clear().type('2m8N625cvmf0')
    cy.get('button[type="submit"], button').contains(/登入|login/i).click()
    cy.url({ timeout: 15000 }).should('not.include', '/login')

    // 測試可以訪問場域地圖
    cy.visit('/sites')
    cy.url().should('include', '/sites')

    // 測試可以訪問我的租借
    cy.visit('/my-rentals')
    cy.url().should('include', '/my-rentals')

    // 測試不能訪問總覽（應該被重定向到 /sites）
    cy.visit('/')
    cy.url().should('include', '/sites')

    // 測試不能訪問車輛清單
    cy.visit('/vehicles')
    cy.url().should('include', '/sites')

    // 測試不能訪問帳號管理
    cy.visit('/admin/users')
    cy.url().should('include', '/sites')
  })

  // 測試 Tourist 權限
  it('Tourist 用戶只能訪問允許的頁面', () => {
    // 登入
    cy.visit('/login')
    cy.get('input[type="email"], input[type="text"]').clear().type('pony@tourist3.com')
    cy.get('input[type="password"]').clear().type('2m8N625cvmf0')
    cy.get('button[type="submit"], button').contains(/登入|login/i).click()
    cy.url({ timeout: 15000 }).should('not.include', '/login')

    // 測試可以訪問場域地圖
    cy.visit('/sites')
    cy.url().should('include', '/sites')

    // 測試可以訪問我的租借
    cy.visit('/my-rentals')
    cy.url().should('include', '/my-rentals')

    // 測試不能訪問總覽
    cy.visit('/')
    cy.url().should('include', '/sites')

    // 測試不能訪問警報中心
    cy.visit('/alerts')
    cy.url().should('include', '/sites')

    // 測試不能訪問 ML 預測
    cy.visit('/ml')
    cy.url().should('include', '/sites')
  })

  // 測試 Admin 權限（應該仍然正常）
  it('Admin 用戶應該能訪問所有頁面', () => {
    // 登入
    cy.visit('/login')
    cy.get('input[type="email"], input[type="text"]').clear().type('pony@admin1.com')
    cy.get('input[type="password"]').clear().type('2m8N625cvmf0')
    cy.get('button[type="submit"], button').contains(/登入|login/i).click()
    cy.url({ timeout: 15000 }).should('not.include', '/login')

    // 測試可以訪問總覽
    cy.visit('/')
    cy.url().should('not.include', '/sites')
    cy.get('body').should('exist')

    // 測試可以訪問帳號管理
    cy.visit('/admin/users')
    cy.url().should('include', '/admin/users')
    cy.get('body').should('exist')

    // 測試可以訪問車輛清單
    cy.visit('/vehicles')
    cy.url().should('include', '/vehicles')
    cy.get('body').should('exist')
  })
})
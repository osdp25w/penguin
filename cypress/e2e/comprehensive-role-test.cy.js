/**
 * 完整角色權限測試
 * 測試所有角色在每個頁面的訪問權限和功能
 */

describe('完整角色權限測試', () => {
  const baseUrl = Cypress.config('baseUrl') || 'https://penguin.osdp25w.xyz'

  // 測試帳號
  const accounts = {
    admin: { email: 'pony@admin1.com', password: '2m8N625cvmf0', expectedRole: 'admin' },
    staff: { email: 'pony@staff1.com', password: '2m8N625cvmf0', expectedRole: 'staff' },
    member: { email: 'pony@real1.com', password: '2m8N625cvmf0', expectedRole: 'member' },
    tourist: { email: 'pony@tourist3.com', password: '2m8N625cvmf0', expectedRole: 'tourist' }
  }

  // 所有頁面路徑
  const pages = [
    { path: '/', name: '總覽', requiresAuth: true },
    { path: '/sites', name: '場域地圖', requiresAuth: true },
    { path: '/vehicles', name: '車輛清單', requiresAuth: true },
    { path: '/alerts', name: '警報中心', requiresAuth: true },
    { path: '/ml', name: 'ML 預測', requiresAuth: true },
    { path: '/my-rentals', name: '我的租借', requiresAuth: true },
    { path: '/admin/users', name: '帳號管理', requiresAuth: true, adminOnly: true },
    { path: '/admin/sites', name: '場域管理', requiresAuth: true, adminOnly: true },
    { path: '/admin/telemetry', name: '遙測設備', requiresAuth: true, adminOnly: true },
    { path: '/admin/rentals', name: '租借管理', requiresAuth: true, adminOnly: true },
    { path: '/login', name: '登入頁面', requiresAuth: false }
  ]

  beforeEach(() => {
    // 設置較長的超時時間
    Cypress.config('defaultCommandTimeout', 10000)

    // 忽略跨域錯誤
    cy.on('uncaught:exception', (err, runnable) => {
      return false
    })
  })

  // 測試登入功能
  Object.entries(accounts).forEach(([roleName, account]) => {
    describe(`${roleName.toUpperCase()} 角色測試`, () => {

      it(`應該能成功登入 (${account.email})`, () => {
        cy.visit('/login')

        // 輸入登入資訊
        cy.get('input[type="email"], input[type="text"]').clear().type(account.email)
        cy.get('input[type="password"]').clear().type(account.password)

        // 提交登入
        cy.get('button[type="submit"], button').contains(/登入|login/i).click()

        // 等待重定向
        cy.url({ timeout: 15000 }).should('not.include', '/login')

        // 檢查登入成功
        cy.get('body').should('not.contain', '登入失敗')
        cy.get('body').should('not.contain', '帳號或密碼錯誤')
      })

      // 測試每個頁面的訪問權限
      pages.forEach(page => {
        it(`訪問 ${page.name} (${page.path})`, () => {
          // 先登入
          cy.loginAsRole(roleName)

          // 訪問頁面
          cy.visit(page.path, { failOnStatusCode: false })

          // 等待頁面載入
          cy.wait(2000)

          // 檢查訪問結果
          cy.url().then(currentUrl => {
            const hasAccess = !currentUrl.includes('/403') &&
                            !currentUrl.includes('/login') &&
                            currentUrl.includes(page.path.split('/')[1] || '')

            // 根據角色和頁面類型判斷是否應該有訪問權限
            let shouldHaveAccess = true

            if (page.adminOnly) {
              shouldHaveAccess = roleName === 'admin' || roleName === 'staff'
            } else if (page.path === '/my-rentals') {
              shouldHaveAccess = roleName === 'member' || roleName === 'tourist'
            } else if (page.requiresAuth && (roleName === 'member' || roleName === 'tourist')) {
              // member/tourist 只能訪問場域地圖和我的租借
              shouldHaveAccess = page.path === '/sites' || page.path === '/my-rentals'
            }

            if (shouldHaveAccess) {
              expect(hasAccess, `${roleName} 應該能訪問 ${page.name}`).to.be.true

              // 檢查頁面內容載入
              cy.get('body').should('exist')
              cy.get('body').should('not.contain', '500')
              cy.get('body').should('not.contain', 'Application Error')
            } else {
              // 應該被重定向或顯示 403
              expect(
                currentUrl.includes('/403') ||
                currentUrl.includes('/sites') ||
                !hasAccess,
                `${roleName} 不應該能訪問 ${page.name}`
              ).to.be.true
            }
          })
        })
      })

      // 測試導航選單
      it(`檢查導航選單內容`, () => {
        cy.loginAsRole(roleName)
        cy.visit('/')

        // 等待頁面載入
        cy.wait(2000)

        // 檢查導航選單
        cy.get('body').then($body => {
          const bodyText = $body.text()

          // 根據角色檢查應該顯示的選單項目
          if (roleName === 'admin' || roleName === 'staff') {
            expect(bodyText).to.include('帳號管理')
            expect(bodyText).to.include('遙測設備')
            expect(bodyText).to.include('租借管理')
          } else if (roleName === 'member' || roleName === 'tourist') {
            expect(bodyText).to.include('場域地圖')
            expect(bodyText).to.include('我的租借')
            expect(bodyText).to.not.include('帳號管理')
            expect(bodyText).to.not.include('遙測設備')
          }
        })
      })
    })
  })

  // 測試未登入狀態
  describe('未登入狀態測試', () => {
    beforeEach(() => {
      // 清除所有認證資訊
      cy.clearAllCookies()
      cy.clearLocalStorage()
    })

    pages.filter(p => p.requiresAuth).forEach(page => {
      it(`未登入訪問 ${page.name} 應該重定向`, () => {
        cy.visit(page.path, { failOnStatusCode: false })

        cy.url().should('satisfy', url =>
          url.includes('/login') || url.includes('/403')
        )
      })
    })
  })
})

// 自定義登入指令
Cypress.Commands.add('loginAsRole', (roleName) => {
  const accounts = {
    admin: { email: 'pony@admin1.com', password: '2m8N625cvmf0' },
    staff: { email: 'pony@staff1.com', password: '2m8N625cvmf0' },
    member: { email: 'pony@real1.com', password: '2m8N625cvmf0' },
    tourist: { email: 'pony@tourist3.com', password: '2m8N625cvmf0' }
  }

  const account = accounts[roleName]
  if (!account) {
    throw new Error(`Unknown role: ${roleName}`)
  }

  cy.session(`login-${roleName}`, () => {
    cy.visit('/login')
    cy.get('input[type="email"], input[type="text"]').clear().type(account.email)
    cy.get('input[type="password"]').clear().type(account.password)
    cy.get('button[type="submit"], button').contains(/登入|login/i).click()

    // 等待登入完成
    cy.url({ timeout: 15000 }).should('not.include', '/login')

    // 簡單驗證登入成功
    cy.get('body').should('exist')
  }, {
    validate() {
      // 檢查是否仍然登入
      cy.visit('/')
      cy.url().should('not.include', '/login')
    }
  })
})
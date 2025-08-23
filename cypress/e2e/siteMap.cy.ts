describe('SiteMap Page', () => {
  beforeEach(() => {
    // 攔截 WMTS 請求
    cy.intercept('GET', 'https://wmts.nlsc.gov.tw/wmts/**', {
      statusCode: 200,
      body: 'fake-tile-data'
    }).as('wmtsTiles')
    
    cy.visit('/sites')
  })

  it('should display empty state when no data', () => {
    cy.contains('目前沒有站點資料').should('be.visible')
    cy.contains('啟用測試資料').should('be.visible')
  })

  it('should allow region switching', () => {
    cy.get('select').select('taitung')
    cy.get('select').should('have.value', 'taitung')
  })

  it('should load MapLibre map with NLSC tiles', () => {
    // 檢查 MapLibre 畫布存在
    cy.get('.maplibregl-canvas', { timeout: 10000 }).should('exist')
    
    // 等待至少一個 WMTS 瓦片請求
    cy.wait('@wmtsTiles')
    
    // 檢查版權標示
    cy.contains('© 內政部國土測繪中心（NLSC）').should('exist')
  })

  it('should show seed guide modal', () => {
    cy.contains('啟用測試資料').click()
    cy.contains('啟用測試資料').should('be.visible')
    cy.contains('VITE_SEED_MOCK=1').should('be.visible')
  })

  it('should handle map loading states', () => {
    // 重新載入頁面以測試載入狀態
    cy.reload()
    
    // 可能看到載入指示器
    cy.get('body').should('contain.text', '載入地圖中...')
    
    // 最終應該看到地圖
    cy.get('.maplibregl-canvas', { timeout: 10000 }).should('be.visible')
  })

  // TODO: Add tests for mock data scenarios
  // This requires setting VITE_SEED_MOCK=1 in test environment
})
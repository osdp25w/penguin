describe('Admin user flow', () => {
  beforeEach(() => {
    cy.loginAs('admin', { redirect: '/' })
  })

  it('shows overview dashboard KPIs', () => {
    cy.contains('系統總覽').should('be.visible')
    cy.contains('現在上線').should('exist')
  })

  it('loads vehicles management page', () => {
    cy.intercept('GET', '**/api/bike/bikes/**').as('fetchVehicles')
    cy.visit('/vehicles')
    cy.contains('車輛清單').should('be.visible')
    cy.wait('@fetchVehicles', { timeout: 20000 }).its('response.statusCode').should('eq', 200)
  })

  it('loads admin rentals data', () => {
    cy.intercept('GET', '**/api/rental/staff/rentals/**').as('fetchAdminRentals')
    cy.visit('/admin/rentals')
    cy.contains('租借管理').should('be.visible')
    cy.wait('@fetchAdminRentals', { timeout: 20000 }).its('response.statusCode').should('eq', 200)
  })

  it('loads telemetry devices page', () => {
    cy.intercept('GET', '**/api/telemetry/**').as('fetchTelemetry')
    cy.visit('/admin/telemetry')
    cy.contains('遙測設備').should('be.visible')
    cy.wait('@fetchTelemetry', { timeout: 20000 }).its('response.statusCode').should('be.oneOf', [200, 404])
  })

  it('loads alerts center', () => {
    cy.intercept('GET', '**/api/rental/staff/rentals/active_rentals/**').as('fetchActiveRentals')
    cy.visit('/alerts')
    cy.contains('警報中心').should('be.visible')
    cy.wait('@fetchActiveRentals', { timeout: 20000 }).its('response.statusCode').should('eq', 200)
  })
})

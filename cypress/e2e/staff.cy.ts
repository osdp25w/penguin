describe('Staff user flow', () => {
  beforeEach(() => {
    cy.loginAs('staff', { redirect: '/admin/rentals' })
  })

  it('can view staff rentals list', () => {
    cy.intercept('GET', '**/api/rental/staff/rentals/**').as('fetchStaffRentals')
    cy.visit('/admin/rentals')
    cy.contains('租借管理').should('be.visible')
    cy.wait('@fetchStaffRentals', { timeout: 20000 }).its('response.statusCode').should('eq', 200)
  })

  it('can access site map', () => {
    cy.intercept('GET', 'https://wmts.nlsc.gov.tw/wmts/**', {
      statusCode: 200,
      body: 'tile'
    }).as('tiles')
    cy.visit('/sites')
    cy.get('.maplibregl-canvas', { timeout: 10000 }).should('exist')
    cy.wait('@tiles')
  })

  it('can access vehicles page', () => {
    cy.intercept('GET', '**/api/bike/bikes/**').as('fetchVehicles')
    cy.visit('/vehicles')
    cy.contains('車輛清單').should('be.visible')
    cy.wait('@fetchVehicles', { timeout: 20000 }).its('response.statusCode').should('eq', 200)
  })
})

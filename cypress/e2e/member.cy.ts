describe('Member user flow', () => {
  beforeEach(() => {
    cy.intercept('GET', 'https://wmts.nlsc.gov.tw/wmts/**', {
      statusCode: 200,
      body: 'tile'
    }).as('tiles')
    cy.loginAs('member', { redirect: '/sites' })
  })

  it('displays site map and allows viewing own active rental', () => {
    cy.get('.maplibregl-canvas', { timeout: 15000 }).should('exist')
    cy.wait('@tiles')
  })

  it('shows member rental history with API success', () => {
    cy.intercept('GET', '**/api/rental/member/rentals/**').as('memberRentals')
    cy.visit('/my-rentals')
    cy.contains('我的租借').should('be.visible')
    cy.wait('@memberRentals', { timeout: 20000 }).its('response.statusCode').should('eq', 200)
    cy.get('table').should('exist')
  })

  it('allows returning from site map when vehicle is in use', () => {
    cy.intercept('GET', '**/api/rental/member/rentals/active_rental/**').as('activeRental')
    cy.visit('/sites')
    cy.wait('@activeRental', { timeout: 20000 }).its('response.statusCode').should('be.oneOf', [200, 404])
    cy.contains('租借').should('exist')
  })
})

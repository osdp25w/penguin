describe('Tourist user access', () => {
  beforeEach(() => {
    cy.intercept('GET', 'https://wmts.nlsc.gov.tw/wmts/**', {
      statusCode: 200,
      body: 'tile'
    }).as('tiles')
    cy.loginAs('tourist', { redirect: '/sites' })
  })

  it('lands on site map and blocks admin navigation', () => {
    cy.location('pathname').should('eq', '/sites')
    cy.get('.maplibregl-canvas', { timeout: 15000 }).should('exist')

    cy.visit('/admin/rentals', { failOnStatusCode: false })
    cy.location('pathname', { timeout: 5000 }).should('eq', '/sites')
  })

  it('cannot see privileged navigation items', () => {
    cy.get('nav').should('not.contain.text', '帳號管理')
    cy.get('nav').should('not.contain.text', '租借管理')
  })
})

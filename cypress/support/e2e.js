/// <reference types="cypress" />

const USERS = {
  admin: {
    email: 'pony@admin1.com',
    password: '2m8N625cvmf0',
    expectedRedirect: '/',
  },
  staff: {
    email: 'pony@staff1.com',
    password: '2m8N625cvmf0',
    expectedRedirect: '/admin/rentals',
  },
  member: {
    email: 'pony@real1.com',
    password: '2m8N625cvmf0',
    expectedRedirect: '/sites',
  },
  tourist: {
    email: 'pony@tourist3.com',
    password: '2m8N625cvmf0',
    expectedRedirect: '/sites',
  },
}

Cypress.Commands.add('loginAs', (role, options = {}) => {
  const user = USERS[role]
  if (!user) {
    throw new Error(`Unknown test user role: ${role}`)
  }

  cy.log(`Logging in as ${role}`)
  cy.visit('/login')

  cy.get('#login-email').clear().type(user.email)
  cy.get('#login-password').clear().type(user.password, { log: false })
  cy.get('form').submit()

  const expected = options.redirect || user.expectedRedirect || '/'

  cy.location('pathname', { timeout: 15000 }).should((pathname) => {
    expect(pathname.startsWith(expected)).to.be.true
  })

  cy.wait(500)
})

Cypress.Commands.add('logout', () => {
  cy.window().then((win) => {
    win.localStorage.removeItem('auth_access_token')
    win.localStorage.removeItem('auth_refresh_token')
    win.localStorage.removeItem('penguin.role')
    win.localStorage.removeItem('penguin.user')
    win.localStorage.removeItem('penguin.refresh')
    win.sessionStorage.clear()
  })
})

beforeEach(() => {
  cy.logout()
})

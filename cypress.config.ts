import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL || 'http://localhost:5173',
    env: {
      SITE_BASE_URL: process.env.CYPRESS_BASE_URL || 'http://localhost:5173',
    },
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
})

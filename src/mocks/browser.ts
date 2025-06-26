// src/mocks/browser.ts
import { setupWorker } from 'msw'
import { handlers } from './handlers'

/** 僅在 dev 時啟動 worker */
export const worker = setupWorker(...handlers)

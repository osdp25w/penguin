import { MODEL_PATHS } from './config'

export type ModelKey = keyof typeof MODEL_PATHS

const current: Record<ModelKey, string> = { ...MODEL_PATHS }

export function setModelPaths(partial: Partial<Record<ModelKey, string>>): void {
  Object.assign(current, partial)
}

export function getModelPath(key: ModelKey): string {
  return current[key]
}

export function getAllModelPaths(): Record<ModelKey, string> {
  return { ...current }
}


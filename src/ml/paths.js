import { MODEL_PATHS } from './config';
const current = { ...MODEL_PATHS };
export function setModelPaths(partial) {
    Object.assign(current, partial);
}
export function getModelPath(key) {
    return current[key];
}
export function getAllModelPaths() {
    return { ...current };
}

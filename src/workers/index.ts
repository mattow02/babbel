/** La couche de generation : le worker, son client, le cache. */

export { LruCache } from './cache.ts'
export {
  createDefaultEngine,
  createInlineEngine,
  createWorkerEngine,
  type PageEngine,
} from './engine.ts'
export {
  DEFAULT_CAPACITY,
  PageLibrary,
  type PageLibraryOptions,
  type PageLibraryStats,
} from './client.ts'
export { DEFAULT_RADIUS, readingNeighbourhood } from './neighbourhood.ts'
export { isFailure, isPage, type WorkerRequest, type WorkerResponse } from './protocol.ts'

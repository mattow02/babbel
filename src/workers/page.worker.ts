/// <reference lib="webworker" />
/**
 * Le worker de generation.
 *
 * Il ne fait qu'une chose : recevoir une adresse, rendre 3 200 caracteres.
 * Aucun etat, aucun cache — le cache vit du cote du client, ou il est visible
 * et mesurable. Un worker sans etat est un worker qu'on peut tuer et relancer
 * sans rien perdre.
 *
 * Regle d'or (CLAUDE.md) : le thread qui dessine ne calcule jamais. Meme si une
 * page ne coute que 0,6 ms, le principe protege le framerate pour toujours —
 * et il tiendra encore si le cout augmente un jour.
 */

import { pageAt } from '../core/index.ts'
import type { PageRequest, PageResponse } from './protocol.ts'

const scope = self as unknown as DedicatedWorkerGlobalScope

scope.addEventListener('message', (event: MessageEvent<PageRequest>) => {
  const { id, address } = event.data
  let response: PageResponse
  try {
    response = { id, text: pageAt(address) }
  } catch (cause) {
    response = { id, error: cause instanceof Error ? cause.message : String(cause) }
  }
  scope.postMessage(response)
})

/// <reference lib="webworker" />
/**
 * Le worker de generation.
 *
 * Il repond a deux demandes : rendre le texte d'une adresse, ou calculer
 * l'adresse d'un texte. Aucun etat, aucun cache — le cache vit du cote du
 * client, ou il est visible et mesurable. Un worker sans etat est un worker
 * qu'on peut tuer et relancer sans rien perdre.
 *
 * Regle d'or (CLAUDE.md) : le thread qui dessine ne calcule jamais.
 */

import { locate, pageAt } from '../core/index.ts'
import type { WorkerRequest, WorkerResponse } from './protocol.ts'

/*
 * Ce fichier est compile avec la bibliotheque DOM autant qu'avec celle des
 * workers : `self` y est donc type comme une fenetre. La conversion dit ce que
 * la directive `webworker` ci-dessus a deja etabli — c'est le seul endroit du
 * projet ou elle est necessaire.
 */
const scope = self as unknown as DedicatedWorkerGlobalScope

scope.addEventListener('message', (event: MessageEvent<WorkerRequest>) => {
  const request = event.data
  let response: WorkerResponse
  try {
    response =
      request.kind === 'page'
        ? { id: request.id, text: pageAt(request.address) }
        : { id: request.id, address: locate(request.text) }
  } catch (cause) {
    response = { id: request.id, error: cause instanceof Error ? cause.message : String(cause) }
  }
  scope.postMessage(response)
})

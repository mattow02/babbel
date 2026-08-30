/**
 * D'ou viennent les pages, concretement.
 *
 * Le client ne connait que cette interface. Cela permet trois choses :
 *   - remplacer le worker par un calcul direct quand `Worker` n'existe pas
 *     (rendu hors navigateur, vieux environnement, test) ;
 *   - injecter un faux moteur dans les tests, et verifier le comportement du
 *     cache sans dependre d'une API de navigateur ;
 *   - changer plus tard de strategie (plusieurs workers, WASM) sans toucher a
 *     une ligne du client.
 */

import { locate, pageAt, type Address } from '../core/index.ts'
import { isFailure, isPage, type WorkerRequest, type WorkerResponse } from './protocol.ts'

export interface PageEngine {
  /** Rend les 3 200 caracteres d'une page. */
  compute(address: Address): Promise<string>
  /** Calcule ou se trouve un texte. L'autre sens de la bijection. */
  locate(text: string): Promise<Address>
  /** Libere les ressources. Idempotent. */
  dispose(): void
}

/**
 * Le moteur normal : un worker dedie.
 *
 * Un seul worker suffit. Une page coute 0,6 ms ; meme une file de dix demandes
 * se vide en 6 ms, bien en dessous du budget de 16,6 ms d'une image. Ouvrir
 * plusieurs workers ajouterait de la complexite et de la memoire pour resoudre
 * un probleme que nous n'avons pas. On y reviendra si la mesure le demande.
 */
export function createWorkerEngine(): PageEngine {
  const worker = new Worker(new URL('./page.worker.ts', import.meta.url), { type: 'module' })
  const pending = new Map<
    number,
    { resolve: (value: never) => void; reject: (error: Error) => void }
  >()
  let nextId = 0
  let disposed = false

  worker.addEventListener('message', (event: MessageEvent<WorkerResponse>) => {
    const response = event.data
    const slot = pending.get(response.id)
    if (!slot) return
    pending.delete(response.id)
    if (isFailure(response)) {
      slot.reject(new Error(response.error))
    } else if (isPage(response)) {
      ;(slot.resolve as unknown as (text: string) => void)(response.text)
    } else {
      ;(slot.resolve as unknown as (address: Address) => void)(response.address)
    }
  })

  worker.addEventListener('error', (event) => {
    const failure = new Error(`Le worker de generation a echoue : ${event.message}`)
    for (const slot of pending.values()) slot.reject(failure)
    pending.clear()
  })

  /** Envoie une demande et attend sa reponse, quel qu'en soit le genre. */
  function ask<T>(build: (id: number) => WorkerRequest): Promise<T> {
    if (disposed) return Promise.reject(new Error('Moteur libere.'))
    const id = nextId
    nextId += 1
    return new Promise<T>((resolve, reject) => {
      pending.set(id, { resolve: resolve as unknown as (value: never) => void, reject })
      worker.postMessage(build(id))
    })
  }

  return {
    compute(address) {
      return ask<string>((id) => ({ kind: 'page', id, address }))
    },
    locate(text) {
      return ask<Address>((id) => ({ kind: 'locate', id, text }))
    },
    dispose() {
      if (disposed) return
      disposed = true
      for (const slot of pending.values()) slot.reject(new Error('Moteur libere.'))
      pending.clear()
      worker.terminate()
    },
  }
}

/**
 * Le moteur de repli : calcul direct, sur le thread appelant.
 *
 * A n'utiliser que la ou il n'y a pas de `Worker` : hors navigateur, ou dans
 * les tests du coeur. Jamais dans la boucle de rendu.
 */
export function createInlineEngine(): PageEngine {
  let disposed = false
  return {
    compute(address) {
      if (disposed) return Promise.reject(new Error('Moteur libere.'))
      try {
        return Promise.resolve(pageAt(address))
      } catch (cause) {
        return Promise.reject(cause instanceof Error ? cause : new Error(String(cause)))
      }
    },
    locate(text) {
      if (disposed) return Promise.reject(new Error('Moteur libere.'))
      try {
        return Promise.resolve(locate(text))
      } catch (cause) {
        return Promise.reject(cause instanceof Error ? cause : new Error(String(cause)))
      }
    },
    dispose() {
      disposed = true
    },
  }
}

/** Le worker si l'environnement en propose un, le calcul direct sinon. */
export function createDefaultEngine(): PageEngine {
  return typeof Worker === 'undefined' ? createInlineEngine() : createWorkerEngine()
}

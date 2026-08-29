/**
 * Le contrat entre le thread principal et le worker.
 *
 * Les adresses voyagent telles quelles : l'algorithme de clonage structure des
 * navigateurs sait transporter un BigInt nativement, il n'y a donc rien a
 * serialiser a la main pour le numero de galerie.
 */

import type { Address } from '../core/index.ts'

/** Thread principal -> worker : « genere cette page ». */
export interface PageRequest {
  readonly id: number
  readonly address: Address
}

/** Worker -> thread principal : le texte, ou l'echec. */
export type PageResponse =
  | { readonly id: number; readonly text: string }
  | { readonly id: number; readonly error: string }

export function isFailure(
  response: PageResponse,
): response is { readonly id: number; readonly error: string } {
  return 'error' in response
}

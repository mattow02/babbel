/**
 * Le contrat entre le thread principal et le worker.
 *
 * Deux demandes seulement, mais elles vont dans les deux sens de la bijection :
 *
 *   `page`   : une adresse -> les 3 200 caracteres qui s'y trouvent ;
 *   `locate` : un texte    -> l'adresse ou il se trouve.
 *
 * La seconde est ce que la bijection inversible achete (decision D14). Elle
 * coute autant que la premiere, mais elle doit passer par le worker pour la
 * meme raison : le thread qui dessine ne calcule jamais.
 *
 * Les adresses voyagent telles quelles : l'algorithme de clonage structure des
 * navigateurs sait transporter un BigInt nativement.
 */

import type { Address } from '../core/index.ts'

/** Thread principal -> worker. */
export type WorkerRequest =
  | { readonly kind: 'page'; readonly id: number; readonly address: Address }
  | { readonly kind: 'locate'; readonly id: number; readonly text: string }

/** Worker -> thread principal. */
export type WorkerResponse =
  | { readonly id: number; readonly text: string }
  | { readonly id: number; readonly address: Address }
  | { readonly id: number; readonly error: string }

export function isFailure(
  response: WorkerResponse,
): response is { readonly id: number; readonly error: string } {
  return 'error' in response
}

export function isPage(
  response: WorkerResponse,
): response is { readonly id: number; readonly text: string } {
  return 'text' in response
}

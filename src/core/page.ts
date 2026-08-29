/**
 * L'API publique du coeur : d'une adresse au texte, et du texte a l'adresse.
 *
 * C'est ici que les trois briques se rejoignent :
 *
 *     adresse --address.ts--> emplacement --bijection.ts--> contenu
 *                                                              |
 *                                                        base 25 (ici)
 *                                                              v
 *                                                    3 200 caracteres
 *
 * La conversion en base 25 se fait par paquets de 13 chiffres. 25^13 tient
 * dans 61 bits, donc chaque division extrait 13 caracteres d'un coup : 247
 * divisions au lieu de 3 200. C'est treize fois moins de travail pour trois
 * lignes de code en plus.
 */

import { RADIX_BIG, symbolOf, valueOf } from './alphabet.ts'
import { addressOf, locationOf, type Address } from './address.ts'
import { forward, inverse } from './bijection.ts'
import { CHARS_PER_LINE, CHARS_PER_PAGE, LINES_PER_PAGE } from './layout.ts'

/** Nombre de chiffres traites par division. 25^13 < 2^61. */
const CHUNK = 13
const CHUNK_POWER = RADIX_BIG ** BigInt(CHUNK)

/** Contenu (entier) -> les 3 200 caracteres de la page. */
export function contentToText(content: bigint): string {
  const digits = new Uint8Array(CHARS_PER_PAGE)
  let remaining = content
  let cursor = CHARS_PER_PAGE
  while (cursor > 0) {
    const take = Math.min(CHUNK, cursor)
    const power = take === CHUNK ? CHUNK_POWER : RADIX_BIG ** BigInt(take)
    let chunk = remaining % power
    remaining /= power
    // Le reste porte les `take` chiffres de poids faible, donc les DERNIERS
    // caracteres du bloc : on remplit de la droite vers la gauche.
    for (let offset = 1; offset <= take; offset += 1) {
      digits[cursor - offset] = Number(chunk % RADIX_BIG)
      chunk /= RADIX_BIG
    }
    cursor -= take
  }
  let text = ''
  for (const digit of digits) {
    text += symbolOf(digit)
  }
  return text
}

/** Les 3 200 caracteres d'une page -> contenu (entier). */
export function textToContent(text: string): bigint {
  if (text.length !== CHARS_PER_PAGE) {
    throw new RangeError(`Une page compte exactement ${CHARS_PER_PAGE} caracteres, recu ${text.length}.`)
  }
  let content = 0n
  let cursor = 0
  while (cursor < CHARS_PER_PAGE) {
    const take = Math.min(CHUNK, CHARS_PER_PAGE - cursor)
    const power = take === CHUNK ? CHUNK_POWER : RADIX_BIG ** BigInt(take)
    let chunk = 0n
    for (let offset = 0; offset < take; offset += 1) {
      chunk = chunk * RADIX_BIG + BigInt(valueOf(text[cursor + offset] as string))
    }
    content = content * power + chunk
    cursor += take
  }
  return content
}

/**
 * LA fonction du projet : l'adresse d'une page, son contenu.
 *
 * Pure, deterministe, sans effet de bord, sans reseau, sans stockage.
 */
export function pageAt(address: Address): string {
  return contentToText(forward(locationOf(address)))
}

/**
 * La reciproque : ou se trouve ce texte.
 *
 * Le texte n'est pas cherche, il est CALCULE. C'est ce que la bijection
 * achete (decision D14).
 *
 * Un texte plus court que 3 200 caracteres est complete par des espaces, ce
 * qui en fait une page parmi une infinite d'autres qui le contiennent : celle
 * ou il commence au tout debut, suivi de blanc. L'interface de recherche
 * (phase 7) pourra proposer d'autres remplissages.
 */
export function locate(text: string): Address {
  if (text.length > CHARS_PER_PAGE) {
    throw new RangeError(`Un texte de plus de ${CHARS_PER_PAGE} caracteres ne tient pas sur une page.`)
  }
  const padded = text.padEnd(CHARS_PER_PAGE, symbolOf(0))
  return addressOf(inverse(textToContent(padded)))
}

/** Decoupe une page en ses 40 lignes de 80 caracteres. */
export function toLines(text: string): string[] {
  if (text.length !== CHARS_PER_PAGE) {
    throw new RangeError(`Une page compte exactement ${CHARS_PER_PAGE} caracteres, recu ${text.length}.`)
  }
  const lines: string[] = new Array<string>(LINES_PER_PAGE)
  for (let line = 0; line < LINES_PER_PAGE; line += 1) {
    lines[line] = text.slice(line * CHARS_PER_LINE, (line + 1) * CHARS_PER_LINE)
  }
  return lines
}

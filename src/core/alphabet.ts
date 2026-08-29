/**
 * Le jeu de caracteres de la bibliotheque.
 *
 * Borges donne 25 symboles : 22 lettres, l'espace, la virgule et le point.
 * Il ne dit jamais LESQUELLES sont les 22 lettres. Nous retenons l'alphabet
 * latin prive de ses quatre lettres tardives ou etrangeres (j, k, w, x), ce
 * qui en laisse exactement 22.
 *
 * CONSEQUENCE ASSUMEE : sans j, k, w ni x, certains mots courants ne
 * s'ecrivent tout simplement pas. Le titre de notre propre video de reference
 * (« je vais te montrer l'infini ») est intraduisible dans la bibliotheque.
 * C'est fidele a Borges, dont l'alphabet est plus pauvre que le notre, et
 * c'est aussi une jolie illustration du propos de la nouvelle.
 *
 * L'espace occupe l'indice 0 : la page numero zero est donc entierement
 * blanche, ce qui est a la fois joli et commode pour les tests.
 *
 * REGLE (decision D9) : rien ailleurs dans le code ne doit supposer 25 en dur.
 * Tout passe par RADIX.
 */

/** Les 25 symboles, dans l'ordre. L'indice dans cette chaine EST la valeur. */
export const ALPHABET = ' abcdefghilmnopqrstuvyz,.'

/** 25. La base de numeration de toute la bibliotheque. */
export const RADIX = ALPHABET.length

/** RADIX en BigInt, pour ne pas le reconstruire a chaque conversion. */
export const RADIX_BIG = BigInt(RADIX)

/** Table inverse caractere -> valeur, construite une fois. */
const VALUE_OF = new Map<string, number>(
  Array.from(ALPHABET, (char, index) => [char, index] as const),
)

/** Vrai si le caractere appartient au jeu. */
export function isSymbol(char: string): boolean {
  return VALUE_OF.has(char)
}

/**
 * Valeur d'un symbole, dans [0, RADIX).
 * @throws si le caractere n'appartient pas au jeu.
 */
export function valueOf(char: string): number {
  const value = VALUE_OF.get(char)
  if (value === undefined) {
    throw new RangeError(`Caractere hors alphabet : ${JSON.stringify(char)}`)
  }
  return value
}

/**
 * Symbole correspondant a une valeur.
 * @throws si la valeur est hors de [0, RADIX).
 */
export function symbolOf(value: number): string {
  const char = ALPHABET[value]
  if (char === undefined) {
    throw new RangeError(`Valeur hors alphabet : ${value}`)
  }
  return char
}

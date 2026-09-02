/**
 * L'introduction, en battements.
 *
 * Le site n'a plus de page d'accueil : on arrive directement devant la
 * bibliotheque, et le texte s'ecrit par-dessus elle. Ce module ne contient que
 * le minutage, sans le moindre composant, pour que l'enchainement soit
 * verifiable sans navigateur : c'est la seule partie qui puisse se tromper.
 *
 * Le texte tient en quatre phrases parce qu'une cinquieme ferait attendre. On
 * dit ce qu'est le lieu, sa contrainte, et le seul fait qui surprenne vraiment
 * (rien n'est conserve). Le reste, le visiteur le trouvera en marchant.
 */

export interface Battement {
  readonly texte: string
  /** Duree d'affichage, en millisecondes. */
  readonly duree: number
}

export const BATTEMENTS: readonly Battement[] = [
  { texte: 'La Bibliothèque de Babel', duree: 2600 },
  { texte: 'Tous les livres que l’on peut écrire y sont déjà écrits.', duree: 3100 },
  { texte: '410 pages, 40 lignes, 80 signes, 25 caractères.', duree: 2900 },
  { texte: 'Aucun n’est conservé : votre navigateur les recalcule.', duree: 3100 },
]

/**
 * L'invitation. Elle ne s'efface pas, et elle remplace le bouton d'entree :
 * on ne clique pas sur un mot, on clique sur la porte.
 */
export const INVITE = 'poussez la porte'

export const DUREE_TOTALE = BATTEMENTS.reduce((somme, b) => somme + b.duree, 0)

/**
 * Quel battement est a l'ecran a cet instant.
 *
 * Renvoie -1 quand l'introduction est finie : il ne reste alors que le lieu et
 * l'invitation.
 */
export function battementA(ms: number): number {
  if (ms < 0) return 0
  let fin = 0
  for (let i = 0; i < BATTEMENTS.length; i += 1) {
    fin += BATTEMENTS[i]!.duree
    if (ms < fin) return i
  }
  return -1
}

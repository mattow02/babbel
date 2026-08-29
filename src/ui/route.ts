/**
 * L'URL est la seule source de verite de ce qu'on lit.
 *
 * ------------------------------------------------------------------------
 * POURQUOI LE FRAGMENT (#) ET PAS UN CHEMIN
 *
 * Deux raisons, et la seconde est la plus jolie.
 *
 * 1. Le site est deploye en statique. Un chemin profond comme
 *    /7c4gpbw…/1/2/24/368 obligerait l'hebergeur a reecrire toutes les routes
 *    vers index.html, sinon un simple rechargement renvoie une 404. Le
 *    fragment, lui, marche partout sans la moindre configuration.
 *
 * 2. Un fragment n'est JAMAIS envoye au serveur. Il reste dans le navigateur.
 *    Autrement dit, l'hebergeur ne peut pas savoir quelle page vous lisez —
 *    non pas par politique de confidentialite, mais par construction du web.
 *    C'est le prolongement exact de l'exigence du projet : le serveur ne sert
 *    que des fichiers statiques, il ne sait rien.
 *
 * ------------------------------------------------------------------------
 * SUR LA LONGUEUR
 *
 * Une adresse fait environ 2 890 caracteres. Ce n'est pas un defaut de
 * conception : le numero de galerie PORTE le contenu de la page. Une URL
 * courte devrait pointer vers un stockage, et il n'y en a pas. La longueur de
 * l'URL est la preuve qu'on ne triche pas.
 */

import { fromPath, toPath, type Address } from '../core/index.ts'

/** Adresse -> fragment d'URL, avec son croisillon. */
export function toHash(address: Address): string {
  return `#/${toPath(address)}`
}

/**
 * Fragment d'URL -> adresse, ou `null` si le fragment est vide, mal forme ou
 * hors bornes. On ne jette jamais ici : une URL bricolee a la main ne doit pas
 * casser la page, elle doit ramener a l'entree de la bibliotheque.
 */
export function fromHash(hash: string): Address | null {
  const raw = hash.replace(/^#/, '')
  if (raw === '' || raw === '/') return null
  try {
    return fromPath(raw)
  } catch {
    return null
  }
}

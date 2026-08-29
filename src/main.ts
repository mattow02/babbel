/**
 * Point d'entree provisoire.
 *
 * Le coeur (src/core) est termine et teste ; l'interface de lecture arrive en
 * phase 3, la scene 3D en phase 4. Ce fichier n'existe pour l'instant que pour
 * que la chaine de build soit verte de bout en bout, et pour prouver que le
 * coeur fonctionne bien DANS LE NAVIGATEUR, sans serveur ni base de donnees.
 *
 * Voir docs/ROADMAP.md.
 */

import { locate, pageAt, toLines, toPath } from './core/index.ts'

const root = document.querySelector('#root')
if (root) {
  const address = locate('la bibliotheque est totale.')
  const lines = toLines(pageAt(address))
  const pre = document.createElement('pre')
  pre.textContent = lines.join('\n')
  const caption = document.createElement('p')
  caption.textContent = `galerie ${toPath(address).slice(0, 24)}... / page ${address.page}`
  root.append(caption, pre)
}

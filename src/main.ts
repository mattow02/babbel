/**
 * Point d'entree provisoire.
 *
 * L'interface de lecture arrive en phase 3, la scene 3D en phase 4. Ce fichier
 * sert pour l'instant a une seule chose, mais elle est essentielle : prouver
 * que la chaine complete fonctionne DANS LE NAVIGATEUR, et que la generation
 * se fait bien dans un worker, sans serveur ni base de donnees.
 *
 * Voir docs/ROADMAP.md.
 */

import { locate, toLines, toPath, PAGES_PER_BOOK } from './core/index.ts'
import { PageLibrary, readingNeighbourhood } from './workers/index.ts'

const root = document.querySelector('#root')

async function main(): Promise<void> {
  if (!root) return
  const library = new PageLibrary()
  const address = locate('la bibliotheque est totale.')

  const caption = document.createElement('p')
  const pre = document.createElement('pre')
  const report = document.createElement('p')
  root.append(caption, pre, report)

  const start = performance.now()
  const text = await library.read(address)
  const first = performance.now() - start

  caption.textContent = `galerie ${toPath(address).slice(0, 24)}… / page ${address.page} sur ${PAGES_PER_BOOK}`
  pre.textContent = toLines(text).join('\n')

  // On tourne cent pages, en prechargeant les voisines, et on mesure le temps
  // reellement passe a bloquer le thread principal.
  library.prefetch(readingNeighbourhood(address, 2))
  let blocking = 0
  for (let page = 1; page <= 100; page += 1) {
    const at = { ...address, page }
    const tick = performance.now()
    library.peek(at)
    void library.read(at)
    library.prefetch(readingNeighbourhood(at, 2))
    blocking += performance.now() - tick
  }

  const summary = [
    `premiere page via le worker : ${first.toFixed(1)} ms`,
    `100 tournages, temps bloquant sur le thread principal : ${blocking.toFixed(2)} ms`,
    `budget d'une image a 60 fps : 16,60 ms`,
  ].join(' | ')
  report.textContent = summary
  report.dataset['ready'] = 'true'
  console.log('[babbel]', summary)
}

void main()

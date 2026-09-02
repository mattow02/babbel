import { useMemo } from 'react'
import { PAGES_PER_BOOK, type Address } from '../../core/index.ts'
import type { PageLibrary } from '../../workers/index.ts'
import { usePageText } from '../../ui/usePageText.ts'

/**
 * Les deux pages qu'un livre ouvert montre.
 *
 * Un livre ouvert ne montre jamais une page, mais deux : celle de gauche et
 * celle de droite. On les demande donc toutes les deux, et le cache du worker
 * fait que la seconde est presque toujours deja la : le prechargement des
 * voisines s'en charge depuis la phase 2.
 */
export function useSpread(
  library: PageLibrary,
  address: Address,
): { left: string | null; right: string | null } {
  const droite = useMemo<Address>(
    () => ({ ...address, page: Math.min(PAGES_PER_BOOK, address.page + 1) }),
    [address],
  )

  const gauche = usePageText(library, address)
  const suivante = usePageText(library, droite)

  return {
    left: gauche.text,
    // Sur la toute derniere page, il n'y a rien en face.
    right: address.page >= PAGES_PER_BOOK ? null : suivante.text,
  }
}

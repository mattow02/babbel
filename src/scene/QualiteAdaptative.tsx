import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { useLibraryStore } from '../store/useLibraryStore.ts'
import { doitBaisser, profilBaisse } from './quality.ts'

/** La duree d'une fenetre d'observation. Assez longue pour ne pas juger un a-coup. */
const FENETRE_MS = 2000

/**
 * La qualite qui se corrige elle-meme.
 *
 * Les indices lus au demarrage disent ce que la machine ANNONCE : son nombre
 * de coeurs, sa memoire, la finesse de son pointeur. Aucun ne dit ce que sa
 * carte graphique tient reellement, et un ordinateur de bureau a carte
 * integree passe pour « complet » tout en rendant a dix images par seconde.
 *
 * La cadence, elle, le dit tout de suite. On l'observe donc par fenetres de
 * deux secondes et l'on retire un cran de qualite quand elle ne suit pas :
 * d'abord les ombres, qui coutent six rendus de la scene par image, puis le
 * post-traitement. On ne remonte jamais : une qualite qui oscille attire
 * l'oeil a chaque bascule, ce qui est pire que de rester en dessous.
 *
 * La premiere fenetre est ignoree : elle contient le montage de la scene et
 * la compilation des shaders, et ne dit rien de la vitesse de croisiere.
 */
export function QualiteAdaptative(): null {
  const profile = useLibraryStore((state) => state.profile)
  const setProfile = useLibraryStore((state) => state.setProfile)
  const cadences = useRef<number[]>([])
  const bornee = useRef(0)
  const premiere = useRef(true)

  useFrame(() => {
    const maintenant = performance.now()
    if (bornee.current === 0) {
      bornee.current = maintenant
      return
    }
    if (maintenant - bornee.current < FENETRE_MS) return
    bornee.current = maintenant

    if (premiere.current) {
      premiere.current = false
      return
    }

    const { fps } = useLibraryStore.getState().perf
    cadences.current = [...cadences.current, fps].slice(-4)
    if (doitBaisser(profile.level, cadences.current)) {
      cadences.current = []
      setProfile(profilBaisse(profile))
    }
  })

  return null
}

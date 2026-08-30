import { useMemo } from 'react'
import { useLibraryStore } from '../store/useLibraryStore.ts'
import { Boxes } from './Boxes.tsx'
import { galleryOrigins } from './galleries.ts'
import { Books } from './hexagon/Books.tsx'
import { Slabs } from './hexagon/Slabs.tsx'
import { stoneBoxes, woodBoxes } from './hexagon/parts.ts'
import { stairBoxes } from './hexagon/stairs.ts'
import { Lamps } from './lighting/Lamp.tsx'
import { PALETTE } from './materials/palette.ts'

/**
 * Les galeries visibles autour du visiteur.
 *
 * ------------------------------------------------------------------------
 * LE STREAMING, ET POURQUOI IL NE COUTE RIEN
 *
 * Toutes les galeries sont geometriquement IDENTIQUES. Comme le visiteur est
 * toujours ramene au centre de la sienne (origine flottante, voir
 * navigation/geometry.ts), l'ensemble des galeries visibles est toujours le
 * meme : de -depth a +depth, aux memes positions relatives.
 *
 * Autrement dit, il n'y a rien a charger ni a decharger. Les maillages
 * instancies sont construits une seule fois au montage et ne changent PLUS
 * JAMAIS, quelle que soit la distance parcourue. Pas de gestionnaire de
 * morceaux, pas de reservoir d'objets a recycler, aucune allocation en cours
 * de marche — donc aucune fuite possible.
 *
 * C'est le genre d'economie qu'on ne trouve qu'en regardant le probleme :
 * l'infini de Borges est parfaitement repetitif, autant s'en servir.
 *
 * Seules les COULEURS des tranches suivent le numero de galerie, pour qu'on
 * sente qu'on avance. Elles se recalculent au passage d'un couloir.
 */
export function Library({
  depth = 1,
  onSelectBook,
}: {
  depth?: number
  onSelectBook: (instanceId: number) => void
}): React.ReactElement {
  const hexagon = useLibraryStore((state) => state.hexagon)

  const origins = useMemo(() => galleryOrigins(depth), [depth])
  const stone = useMemo(() => origins.flatMap((origin) => stoneBoxes(origin)), [origins])
  const wood = useMemo(() => origins.flatMap((origin) => woodBoxes(origin)), [origins])
  const stairs = useMemo(() => origins.flatMap((origin) => stairBoxes(origin)), [origins])

  return (
    <>
      {/*
        Une ambiance tres faible, juste pour que les noirs ne soient pas des
        trous. Toute la lumiere vient des lampes spheriques.
      */}
      <ambientLight color={PALETTE.calcaire} intensity={0.045} />
      <Lamps origins={origins} shadowIndex={Math.floor(origins.length / 2)} />

      <Slabs origins={origins} />
      <Boxes boxes={stone} color={PALETTE.calcaire} roughness={0.94} castShadow />
      <Boxes boxes={wood} color={PALETTE.bois} roughness={0.75} castShadow />
      <Boxes boxes={stairs} color={PALETTE.bois} roughness={0.6} metalness={0.25} castShadow />
      <Books origins={origins} hexagon={hexagon} depth={depth} onSelect={onSelectBook} />
    </>
  )
}

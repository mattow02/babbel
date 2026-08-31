import { useMemo } from 'react'
import type { InstancedMesh } from 'three'
import { useLibraryStore } from '../store/useLibraryStore.ts'
import { Boxes } from './Boxes.tsx'
import { galleryOrigins } from './galleries.ts'
import { Books } from './hexagon/Books.tsx'
import { Slabs } from './hexagon/Slabs.tsx'
import { stoneBoxes, woodBoxes } from './hexagon/parts.ts'
import { stairBoxes } from './hexagon/stairs.ts'
import { Dust } from './effects/Dust.tsx'
import { Effects } from './effects/Effects.tsx'
import { Halo } from './effects/LightShaft.tsx'
import { LAMP_RADIUS, LAMP_Y, ROOM_HEIGHT } from './dimensions.ts'
import { Lamps } from './lighting/Lamp.tsx'
import { useMarble } from './materials/Marble.tsx'
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
  booksRef,
  stairsRef,
}: {
  depth?: number
  booksRef?: React.RefObject<InstancedMesh | null> | undefined
  stairsRef?: React.RefObject<InstancedMesh | null> | undefined
}): React.ReactElement {
  const hexagon = useLibraryStore((state) => state.hexagon)
  const profile = useLibraryStore((state) => state.profile)

  /*
   * Le calcaire des murs n'est pas uni : il porte de longues veines sourdes.
   * C'est ce que demande la direction artistique (§ 5) — « calcaire mat,
   * micro-relief » — et c'est ce qui empeche les grandes surfaces claires de
   * ressembler a du carton.
   */
  const calcaire = useMarble({
    base: PALETTE.calcaire,
    vein: '#a89073',
    scale: 2.8,
    sharpness: 2.6,
    // Le calcaire couvre d'immenses surfaces vues de pres : c'est le materiau
    // le plus cher du site s'il est traite comme du marbre de premier plan.
    octaves: 2,
    warp: false,
  })

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
      <Lamps
        origins={origins}
        shadowIndex={profile.shadows ? Math.floor(origins.length / 2) : -1}
      />

      <Slabs origins={origins} />
      <Boxes boxes={stone} color={PALETTE.calcaire} roughness={0.94} castShadow materialRef={calcaire} />
      <Boxes boxes={wood} color={PALETTE.bois} roughness={0.75} castShadow />
      <Boxes
        boxes={stairs}
        color={PALETTE.bois}
        roughness={0.6}
        metalness={0.25}
        castShadow
        meshRef={stairsRef}
      />
      <Books origins={origins} hexagon={hexagon} depth={depth} meshRef={booksRef} />

      {/*
        L'aureole des lampes. Le bloom seul ne suffit pas quand la source est
        petite : il faut lui donner du volume.
      */}
      {origins.map((origin, index) => (
        <Halo
          key={index}
          position={[origin.x, LAMP_Y, origin.z]}
          radius={LAMP_RADIUS * 5.5}
          color={PALETTE.lampe}
          strength={0.36}
        />
      ))}

      {/* La poussiere qui tourne dans la lumiere de la galerie courante. */}
      <Dust
        count={profile.dust}
        radius={2.2}
        height={ROOM_HEIGHT}
        color={PALETTE.lampe}
        strength={0.16}
        size={6}
      />

      <Effects ambiance="bibliotheque" complet={profile.fullEffects} />
    </>
  )
}

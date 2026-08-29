import { useMemo } from 'react'
import { galleryOrigins } from './galleries.ts'
import { Books } from './hexagon/Books.tsx'
import { Slabs } from './hexagon/Slabs.tsx'
import { stoneBoxes, woodBoxes } from './hexagon/parts.ts'
import { Lamps } from './lighting/Lamp.tsx'
import { Boxes } from './Boxes.tsx'
import { PALETTE } from './materials/palette.ts'
import { PerfProbe } from './PerfProbe.tsx'

export function Library({ depth = 1 }: { depth?: number }): React.ReactElement {
  const origins = useMemo(() => galleryOrigins(depth), [depth])
  const stone = useMemo(() => origins.flatMap((origin) => stoneBoxes(origin)), [origins])
  const wood = useMemo(() => origins.flatMap((origin) => woodBoxes(origin)), [origins])

  return (
    <>
      <PerfProbe />

      {/*
        Une ambiance tres faible, juste pour que les noirs ne soient pas des
        trous. Toute la lumiere vient des lampes spheriques.
      */}
      <ambientLight color={PALETTE.calcaire} intensity={0.045} />
      <Lamps origins={origins} shadowIndex={Math.floor(origins.length / 2)} />

      <Slabs origins={origins} />
      <Boxes boxes={stone} color={PALETTE.calcaire} roughness={0.94} castShadow />
      <Boxes boxes={wood} color={PALETTE.bois} roughness={0.75} castShadow />
      <Books origins={origins} />
    </>
  )
}

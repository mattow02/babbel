import { useMemo } from 'react'
import type { Address } from '../core/index.ts'
import { COULEURS, dosDe, teinter, usureDe } from './couleurs.ts'
import { galerie, type Tranche } from './perspective.ts'

/**
 * La galerie, dessinee.
 *
 * Il n'y a plus de moteur 3D : la salle est un dessin, et chaque volume un
 * quadrilatere qui porte son adresse. Le gain n'est pas seulement le poids,
 * c'est que le dessin est PLUS BEAU que ce qu'on obtenait en modelisant, pour
 * une fraction du travail.
 *
 * Ce qui n'a pas change : le placement est calcule, pas ecrit, et il vit dans
 * un module pur et teste (`perspective.ts`).
 */
export function Galerie({
  hexagon,
  onOuvrir,
  onZaguan,
  onEtage,
}: {
  hexagon: bigint
  onOuvrir: (address: Address) => void
  onZaguan: () => void
  onEtage: (sens: 1 | -1) => void
}): React.ReactElement {
  const g = useMemo(() => galerie(), [])

  /*
   * Les couleurs dependent de la GALERIE autant que de la place du volume :
   * sans cela toutes les salles se ressembleraient exactement, et l'on ne
   * sentirait jamais qu'on avance.
   */
  const graine = useMemo(() => Number(hexagon % 4294967291n), [hexagon])

  const dessin = useMemo(
    () =>
      [...g.tranches]
        // Du fond vers l'avant : un volume lointain ne doit pas se dessiner
        // par-dessus un volume proche.
        .sort((a, b) => a.proximite - b.proximite)
        .map((t) => {
          const cle = (t.wall * 5 + t.shelf) * 32 + t.volume + graine * 7919
          const base = dosDe(cle)
          // La distance mange la lumiere : c'est ce qui creuse la salle.
          const couleur = teinter(base, usureDe(cle) * (0.42 + 0.58 * t.proximite))
          return { t, couleur }
        }),
    [g, graine],
  )

  const points = (t: Tranche): string => t.coins.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ')
  const fuite = g.fuite

  return (
    <svg
      className="galerie2d"
      viewBox={`0 0 ${g.largeur} ${g.hauteur}`}
      preserveAspectRatio="xMidYMid slice"
      role="group"
      aria-label="Une galerie de la bibliothèque"
    >
      <defs>
        <radialGradient id="g2d-lampe" cx="50%" cy="50%">
          <stop offset="0" stopColor="#fff6de" stopOpacity="1" />
          <stop offset=".22" stopColor="#ffdda0" stopOpacity=".8" />
          <stop offset=".55" stopColor={COULEURS.halo} stopOpacity=".28" />
          <stop offset="1" stopColor={COULEURS.halo} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="g2d-chute" cx="50%" cy="42%">
          <stop offset=".45" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".82" />
        </radialGradient>
        <linearGradient id="g2d-puits" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0a0705" />
          <stop offset=".6" stopColor="#1d1610" />
          <stop offset="1" stopColor="#050403" />
        </linearGradient>
      </defs>

      <rect width={g.largeur} height={g.hauteur} fill={COULEURS.nuit} />

      {/* Le pan libre du fond, et le plafond bas */}
      <polygon points={g.zaguan.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ')} fill={COULEURS.pierreLoin} />
      <polygon
        points={`0,${-g.hauteur * 0.06} ${g.largeur},${-g.hauteur * 0.06} ${g.zaguan[2].x.toFixed(1)},${g.zaguan[2].y.toFixed(1)} ${g.zaguan[3].x.toFixed(1)},${g.zaguan[3].y.toFixed(1)}`}
        fill={COULEURS.plafond}
      />
      <polygon
        points={`0,${g.hauteur} ${g.largeur},${g.hauteur} ${g.zaguan[1].x.toFixed(1)},${g.zaguan[1].y.toFixed(1)} ${g.zaguan[0].x.toFixed(1)},${g.zaguan[0].y.toFixed(1)}`}
        fill={COULEURS.sol}
      />

      {/* Les quatre pans garnis */}
      {g.pans.map((p) => (
        <polygon
          key={p.wall}
          points={p.coins.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ')}
          fill={teinter(COULEURS.pierre, 0.5 + 0.5 * p.proximite)}
        />
      ))}

      {/* Les volumes : un quadrilatere par adresse, cliquable */}
      <g>
        {dessin.map(({ t, couleur }) => (
          <polygon
            key={`${t.wall}-${t.shelf}-${t.volume}`}
            className="tranche"
            points={points(t)}
            fill={couleur}
            onClick={() => onOuvrir({ hexagon, wall: t.wall, shelf: t.shelf, volume: t.volume, page: 1 })}
          >
            <title>{`mur ${t.wall + 1}, étagère ${t.shelf + 1}, volume ${t.volume + 1}`}</title>
          </polygon>
        ))}
      </g>

      {/* Les tablettes */}
      {g.etageres.map((e) => (
        <line
          key={`${e.wall}-${e.shelf}`}
          x1={e.de.x}
          y1={e.de.y}
          x2={e.a.x}
          y2={e.a.y}
          stroke={COULEURS.bois}
          strokeWidth={3}
        />
      ))}

      {/* Le zaguan : l'ouverture du fond, par ou l'on passe */}
      <g className="passage" onClick={onZaguan} role="button" aria-label="Passer dans la galerie voisine">
        <path
          d={`M${fuite.x - g.largeur * 0.048} ${fuite.y + g.hauteur * 0.19}
              L${fuite.x - g.largeur * 0.048} ${fuite.y - g.hauteur * 0.03}
              A${g.largeur * 0.048} ${g.hauteur * 0.062} 0 0 1 ${fuite.x + g.largeur * 0.048} ${fuite.y - g.hauteur * 0.03}
              L${fuite.x + g.largeur * 0.048} ${fuite.y + g.hauteur * 0.19} Z`}
          fill="#040302"
          stroke="#0d0906"
          strokeWidth={2}
        />
        <title>Passer dans la galerie voisine</title>
      </g>

      {/* La lampe spherique, juste au-dessus de la tete */}
      <ellipse cx={fuite.x} cy={fuite.y - g.hauteur * 0.16} rx={g.largeur * 0.3} ry={g.hauteur * 0.33} fill="url(#g2d-lampe)" />
      <line x1={fuite.x} y1={fuite.y - g.hauteur * 0.245} x2={fuite.x} y2={fuite.y - g.hauteur * 0.195} stroke="#3a2e21" strokeWidth={2} />
      <circle cx={fuite.x} cy={fuite.y - g.hauteur * 0.163} r={g.hauteur * 0.034} fill={COULEURS.lampe} />
      <circle cx={fuite.x} cy={fuite.y - g.hauteur * 0.163} r={g.hauteur * 0.034} fill="none" stroke={COULEURS.trait} strokeWidth={2} />

      {/* Le puits d'aeration, et sa balustrade tres basse */}
      <g className="puits" onClick={() => onEtage(-1)} role="button" aria-label="Descendre d'un étage">
        <ellipse cx={fuite.x} cy={fuite.y + g.hauteur * 0.28} rx={g.largeur * 0.184} ry={g.hauteur * 0.094} fill="url(#g2d-puits)" />
        <ellipse cx={fuite.x} cy={fuite.y + g.hauteur * 0.28} rx={g.largeur * 0.184} ry={g.hauteur * 0.094} fill="none" stroke="#0a0705" strokeWidth={6} />
        <ellipse cx={fuite.x} cy={fuite.y + g.hauteur * 0.265} rx={g.largeur * 0.13} ry={g.hauteur * 0.055} fill="#000" opacity={0.75} />
        <title>Descendre d’un étage</title>
      </g>
      <g>
        <ellipse cx={fuite.x} cy={fuite.y + g.hauteur * 0.24} rx={g.largeur * 0.198} ry={g.hauteur * 0.102} fill="none" stroke="#0e0a07" strokeWidth={9} />
        <ellipse cx={fuite.x} cy={fuite.y + g.hauteur * 0.24} rx={g.largeur * 0.198} ry={g.hauteur * 0.102} fill="none" stroke={COULEURS.rambarde} strokeWidth={5} />
        {Array.from({ length: 15 }, (_, i) => {
          const a = (Math.PI * i) / 14
          const dx = g.largeur * 0.198 * Math.cos(a)
          const dy = g.hauteur * 0.102 * Math.sin(a)
          return (
            <rect
              key={i}
              x={fuite.x + dx - 3.5}
              y={fuite.y + g.hauteur * 0.24 + dy}
              width={7}
              height={17 + 11 * Math.sin(a)}
              rx={2.5}
              fill="#6b5334"
              stroke="#0e0a07"
              strokeWidth={1.4}
            />
          )
        })}
      </g>

      {/* L'escalier du zaguan, pour monter : il s'abime et s'eleve */}
      <g className="montee" onClick={() => onEtage(1)} role="button" aria-label="Monter d'un étage">
        <rect x={fuite.x - g.largeur * 0.044} y={fuite.y - g.hauteur * 0.03} width={g.largeur * 0.088} height={g.hauteur * 0.05} fill="#0f0b08" opacity={0.01} />
        <title>Monter d’un étage</title>
      </g>

      <rect width={g.largeur} height={g.hauteur} fill="url(#g2d-chute)" pointerEvents="none" />
    </svg>
  )
}

import { useMemo } from 'react'
import { teinter } from './couleurs.ts'
import { hash32, unitOf } from './hash.ts'
import { hall } from './hall.ts'

/**
 * Le hall, dessine.
 *
 * C'est le sas entre le plein soleil et les tenebres : on a pousse la porte,
 * on n'est pas encore dans la bibliotheque. Une nef, deux files de piliers,
 * des bas-cotes noirs, un plafond a caissons, et au bout de l'axe le cube
 * d'or, en levitation au-dessus de son socle.
 *
 * Toute la geometrie vient de `hall.ts`, ou un test verifie la symetrie pilier
 * par pilier : le Seuil a deja coute une colonnade decentree que rien ne
 * signalait a l'oeil.
 */
export function Hall({ onEntrer }: { onEntrer: () => void }): React.ReactElement {
  const h = useMemo(() => hall(), [])
  const { fuite, cube } = h

  const pts = (coins: readonly { x: number; y: number }[]): string =>
    coins.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ')

  // Du fond vers l'avant : un pilier proche doit couvrir un pilier lointain.
  const piliers = useMemo(
    () => [...h.piliers].sort((a, b) => a.proximite - b.proximite),
    [h],
  )

  const poussiere = useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) => {
        const u = (k: number): number => unitOf(hash32(i * 8461 + k))
        const x = fuite.x + (u(1) - 0.5) * h.largeur * 0.5
        const y = fuite.y + (u(2) - 0.2) * h.hauteur * 0.45
        const d = Math.hypot((x - fuite.x) / (h.largeur * 0.28), (y - cube.avant[3].y) / (h.hauteur * 0.3))
        return {
          x,
          y,
          r: 0.7 + 1.5 * u(3),
          eclat: Math.max(0.06, 1 - d),
          duree: 12 + 15 * u(4),
          retard: -28 * u(5),
        }
      }),
    [fuite.x, fuite.y, h.largeur, h.hauteur, cube],
  )

  const arete = cube.avant[1].x - cube.avant[0].x
  const fond = h.travees[h.travees.length - 1]!

  return (
    <div className="hall">
      <svg
        className="hall2d"
        viewBox={`0 0 ${h.largeur} ${h.hauteur}`}
        preserveAspectRatio="xMidYMid slice"
        role="group"
        aria-label="Le hall, et le cube d’or au bout de la nef"
      >
        <defs>
          <linearGradient id="h-sol" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0b0805"/><stop offset=".45" stopColor="#1c130c"/>
            <stop offset="1" stopColor="#2a1d13"/>
          </linearGradient>
          <linearGradient id="h-plafond" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#241811"/><stop offset="1" stopColor="#0d0906"/>
          </linearGradient>
          {/* Le faisceau qui tombe sur le cube : de la lumiere, donc sans bord. */}
          <linearGradient id="h-faisceau" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffce7c" stopOpacity="0"/>
            <stop offset=".55" stopColor="#ffce7c" stopOpacity=".1"/>
            <stop offset="1" stopColor="#ffce7c" stopOpacity=".2"/>
          </linearGradient>
          <linearGradient id="h-cube" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffeaa8"/><stop offset=".42" stopColor="#f0c469"/>
            <stop offset="1" stopColor="#a9761f"/>
          </linearGradient>
          <linearGradient id="h-cube-dessus" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff6d6"/><stop offset="1" stopColor="#ffe3a2"/>
          </linearGradient>
          {/* La flaque de lumiere sur la pierre polie, sous le socle. */}
          <linearGradient id="h-reflet" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffc86a" stopOpacity=".26"/>
            <stop offset=".55" stopColor="#ffb44e" stopOpacity=".08"/>
            <stop offset="1" stopColor="#ff9d3c" stopOpacity="0"/>
          </linearGradient>
          <radialGradient id="h-halo" cx="50%" cy="50%">
            <stop offset="0" stopColor="#fff0c4" stopOpacity=".85"/>
            <stop offset=".38" stopColor="#ffc86a" stopOpacity=".3"/>
            <stop offset="1" stopColor="#ff9d3c" stopOpacity="0"/>
          </radialGradient>
          <radialGradient id="h-chute" cx="50%" cy="46%">
            <stop offset=".42" stopColor="#000" stopOpacity="0"/>
            <stop offset="1" stopColor="#000" stopOpacity=".88"/>
          </radialGradient>
        </defs>

        <rect width={h.largeur} height={h.hauteur} fill="#0a0705"/>

        {/* Le plafond, puis le sol poli : deux plans, deux degrades. */}
        <polygon points={pts([{ x: 0, y: -h.hauteur * 0.11 }, { x: h.largeur, y: -h.hauteur * 0.11 }, fond.droite, fond.gauche])} fill="url(#h-plafond)"/>
        <rect y={fuite.y} width={h.largeur} height={h.hauteur - fuite.y} fill="url(#h-sol)"/>

        {/* Les bas-cotes : le noir derriere les files, ou l'on devine des livres. */}
        {h.basCotes.map((c, i) => (
          <polygon key={i} points={pts(c)} fill="#070504"/>
        ))}

        {/* Les caissons : nervures en travers, et fuyantes vers le point de fuite. */}
        {h.travees.map((t) => (
          <line
            key={t.proximite}
            x1={t.gauche.x}
            y1={t.gauche.y}
            x2={t.droite.x}
            y2={t.droite.y}
            stroke="#241a10"
            strokeWidth={1.2 + 2.6 * t.proximite}
          />
        ))}
        {h.fuyantes.map((n, i) => (
          <line key={i} x1={n.de.x} y1={n.de.y} x2={n.a.x} y2={n.a.y} stroke="#241a10" strokeWidth="1.4"/>
        ))}

        {/* Le faisceau, avant les piliers : c'est de l'air, pas un objet. */}
        <polygon
          points={`${(fuite.x - arete * 0.42).toFixed(1)},${(-h.hauteur * 0.11).toFixed(1)} ${(fuite.x + arete * 0.42).toFixed(1)},${(-h.hauteur * 0.11).toFixed(1)} ${(fuite.x + arete * 1.15).toFixed(1)},${cube.socleFace[0].y.toFixed(1)} ${(fuite.x - arete * 1.15).toFixed(1)},${cube.socleFace[0].y.toFixed(1)}`}
          fill="url(#h-faisceau)"
        />

        {/* L'arcade : les arcs d'abord, les piliers ensuite, du fond vers l'avant. */}
        {h.arcs.map((a, i) => (
          <path
            key={i}
            d={`M${a.de.x.toFixed(1)} ${a.de.y.toFixed(1)} Q${a.sommet.x.toFixed(1)} ${a.sommet.y.toFixed(1)} ${a.a.x.toFixed(1)} ${a.a.y.toFixed(1)}`}
            fill="none"
            stroke={teinter('#5c4830', 0.36 + 0.64 * a.proximite)}
            strokeWidth={5 + 13 * a.proximite}
            strokeLinecap="butt"
          />
        ))}
        {piliers.map((p, i) => (
          <g key={i}>
            <polygon points={pts(p.coins)} fill={teinter('#40321f', 0.32 + 0.68 * p.proximite)}/>
            {/* La joue tournee vers la nef prend le peu de jour qu'il y a. */}
            <polygon
              points={pts([
                p.coins[0],
                { x: p.coins[0].x + (p.coins[1].x - p.coins[0].x) * 0.28, y: p.coins[0].y },
                { x: p.coins[3].x + (p.coins[2].x - p.coins[3].x) * 0.28, y: p.coins[3].y },
                p.coins[3],
              ])}
              fill={teinter('#6b5539', 0.3 + 0.7 * p.proximite)}
            />
          </g>
        ))}

        {/* Le socle, puis le cube qui ne le touche pas. */}
        <polygon points={pts(cube.socleDessus)} fill="#6a5232"/>
        <polygon points={pts(cube.socleDessus)} fill="url(#h-halo)" opacity=".45"/>
        <polygon points={pts(cube.socleFace)} fill="#2e2114"/>
        <polygon points={pts([cube.socleDessus[0], cube.socleDessus[1], cube.socleFace[2], cube.socleFace[3]])} fill="#8a6c42" opacity=".55"/>

        {/* La flaque de lumiere sur la pierre polie : elle vient vers nous. */}
        <polygon
          points={`${cube.socleFace[0].x.toFixed(1)},${cube.socleFace[0].y.toFixed(1)} ${cube.socleFace[1].x.toFixed(1)},${cube.socleFace[1].y.toFixed(1)} ${(fuite.x + arete * 2.4).toFixed(1)},${h.hauteur} ${(fuite.x - arete * 2.4).toFixed(1)},${h.hauteur}`}
          fill="url(#h-reflet)"
        />

        <ellipse className="cube__halo" cx={fuite.x} cy={(cube.avant[0].y + cube.avant[3].y) / 2} rx={arete * 2.2} ry={arete * 2} fill="url(#h-halo)"/>

        <g className="cube">
          <polygon points={pts(cube.dessus)} fill="url(#h-cube-dessus)"/>
          <polygon points={pts(cube.avant)} fill="url(#h-cube)"/>
          <polygon points={pts(cube.avant)} fill="none" stroke="#fff3cd" strokeWidth="1.1" opacity=".7"/>
        </g>

        {/* La poussiere, qui monte dans le faisceau. */}
        <g className="poussiere">
          {poussiere.map((g, i) => (
            <circle
              key={i}
              cx={g.x}
              cy={g.y}
              r={g.r}
              fill="#ffe7bd"
              fillOpacity={g.eclat.toFixed(2)}
              style={{ animationDuration: `${g.duree.toFixed(1)}s`, animationDelay: `${g.retard.toFixed(1)}s` }}
            />
          ))}
        </g>

        <rect width={h.largeur} height={h.hauteur} fill="url(#h-chute)"/>

        {/*
          La cible, en dernier et seule : c'est la regle du projet depuis qu'un
          halo de lampe a avale les clics de la porte du fond (D66).
        */}
        <g className="cibles">
          <polygon
            className="cible"
            points={pts([cube.dessus[3], cube.dessus[2], cube.avant[1], cube.avant[0]])}
            role="button"
            tabIndex={0}
            aria-label="Entrer dans la bibliothèque"
            onClick={onEntrer}
            onKeyDown={(event) => {
              if (event.key !== 'Enter' && event.key !== ' ') return
              event.preventDefault()
              onEntrer()
            }}
          >
            <title>Entrer dans la bibliothèque</title>
          </polygon>
        </g>
      </svg>

      <p className="hall__souffle">touchez le cube</p>
    </div>
  )
}

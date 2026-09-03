import { useMemo } from 'react'
import { hash32, unitOf } from './hash.ts'
import { hall, type Quad } from './hall.ts'
import type { Point } from './perspective.ts'

const pts = (coins: readonly { x: number; y: number }[]): string =>
  coins.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ')

/** Une teinte de pierre, du fond vers l'avant. */
const pierre = (k: number, base: readonly [number, number, number]): string => {
  const f = 0.26 + 0.74 * k
  return `rgb(${Math.round(base[0] * f)} ${Math.round(base[1] * f)} ${Math.round(base[2] * f)})`
}

/**
 * Le hall, dessine.
 *
 * C'est le sas entre le plein soleil et les tenebres : on a pousse la porte,
 * on n'est pas encore dans la bibliotheque. Une nef, deux files de piliers
 * portant une arcade, des bas-cotes garnis de rayonnages, une voute a caissons
 * percee d'un puits de lumiere, le cube d'or en levitation dans le faisceau,
 * et au fond la statue qui porte le monde.
 *
 * Toute la geometrie vient de `hall.ts`, ou un test verifie la symetrie pilier
 * par pilier : le Seuil a deja coute une colonnade decentree que rien ne
 * signalait a l'oeil.
 */
export function Hall({ onEntrer }: { onEntrer: () => void }): React.ReactElement {
  const h = useMemo(() => hall(), [])
  const { fuite, cube, porteur, puits } = h
  const arete = cube.avant[1].x - cube.avant[0].x

  // Du fond vers l'avant : un pilier proche doit couvrir un pilier lointain.
  const piliers = useMemo(() => [...h.piliers].sort((a, b) => a.proximite - b.proximite), [h])
  const arcs = useMemo(() => [...h.arcs].sort((a, b) => a.proximite - b.proximite), [h])

  /* Les dos de livres entrevus dans les bas-cotes : ils disent que la
     bibliotheque commence deja derriere l'arcade. */
  const dos = useMemo(
    () =>
      h.tablettes.flatMap((t, r) =>
        Array.from({ length: 26 }, (_, i) => {
          const u = (k: number): number => unitOf(hash32(r * 6151 + i * 131 + k))
          const f = (i + 0.5) / 26
          const x = t.de.x + (t.a.x - t.de.x) * f
          const y = t.de.y + (t.a.y - t.de.y) * f
          const h0 = (10 + 16 * u(1)) * (1 - f * 0.72)
          return { x, y, h: h0, l: (1.6 + 2.4 * u(2)) * (1 - f * 0.72), c: 0.06 + 0.16 * u(3) }
        }),
      ),
    [h.tablettes],
  )

  const poussiere = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => {
        const u = (k: number): number => unitOf(hash32(i * 8461 + k))
        const x = fuite.x + (u(1) - 0.5) * arete * 3.4
        const y = puits.centre.y + u(2) * (cube.socleDessus[0].y - puits.centre.y)
        const d = Math.abs(x - fuite.x) / (arete * 1.7)
        return {
          x,
          y,
          r: 0.7 + 1.5 * u(3),
          eclat: Math.max(0.05, 1 - d),
          duree: 13 + 16 * u(4),
          retard: -30 * u(5),
        }
      }),
    [fuite.x, arete, puits.centre.y, cube.socleDessus],
  )

  /*
   * Un arc en PLEIN CINTRE, pas une ogive.
   *
   * Une courbe de Bezier a un seul point de controle fait une parabole, donc
   * une pointe : l'arcade se lisait comme une file de capuchons. Deux points
   * de controle, tires vers le sommet, arrondissent l'epaule et donnent le
   * demi-cercle qu'on attend d'une arcade.
   */
  const cintre = (de: Point, sommet: Point, a: Point): string => {
    const c = (p: Point): string =>
      `${(p.x + (sommet.x - p.x) * 0.56).toFixed(1)} ${sommet.y.toFixed(1)}`
    return `C${c(de)} ${c(a)} ${a.x.toFixed(1)} ${a.y.toFixed(1)}`
  }

  const bandeau = (a: (typeof arcs)[number]): string =>
    `M${a.de.x.toFixed(1)} ${a.de.y.toFixed(1)} ${cintre(a.de, a.sommet, a.a)}` +
    ` L${a.aHaut.x.toFixed(1)} ${a.aHaut.y.toFixed(1)} ${cintre(a.aHaut, a.sommetHaut, a.deHaut)} Z`

  const bloc = (q: Quad, k: number, base: readonly [number, number, number]): React.ReactElement => (
    <polygon points={pts(q)} fill={pierre(k, base)} />
  )

  return (
    <div className="hall">
      <svg
        className="hall2d"
        viewBox={`0 0 ${h.largeur} ${h.hauteur}`}
        preserveAspectRatio="xMidYMid slice"
        role="group"
        aria-label="Le hall : la nef, la statue qui porte le monde, et le cube d’or"
      >
        <defs>
          <linearGradient id="h-sol" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0a0705" /><stop offset=".4" stopColor="#1a120b" />
            <stop offset="1" stopColor="#2b1e13" />
          </linearGradient>
          <linearGradient id="h-voute" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0b0805" /><stop offset="1" stopColor="#241a11" />
          </linearGradient>
          <linearGradient id="h-fond" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#150e08" /><stop offset=".6" stopColor="#3a2810" />
            <stop offset="1" stopColor="#6b4a1d" />
          </linearGradient>
          <linearGradient id="h-bascote" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#221708" /><stop offset="1" stopColor="#0b0806" />
          </linearGradient>
          {/* Le faisceau : de la lumiere, donc sans bord. */}
          <linearGradient id="h-faisceau" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffe0a8" stopOpacity=".2" />
            <stop offset=".45" stopColor="#ffce7c" stopOpacity=".07" />
            <stop offset="1" stopColor="#ffce7c" stopOpacity=".12" />
          </linearGradient>
          <linearGradient id="h-cube" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffdd93" /><stop offset=".42" stopColor="#e6a83f" />
            <stop offset="1" stopColor="#7d5312" />
          </linearGradient>
          <linearGradient id="h-cube-dessus" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff3cf" /><stop offset="1" stopColor="#f5cf85" />
          </linearGradient>
          <linearGradient id="h-reflet" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffc86a" stopOpacity=".3" />
            <stop offset=".5" stopColor="#ffb44e" stopOpacity=".09" />
            <stop offset="1" stopColor="#ff9d3c" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="h-halo" cx="50%" cy="50%">
            <stop offset="0" stopColor="#fff0c4" stopOpacity=".8" />
            <stop offset=".36" stopColor="#ffc86a" stopOpacity=".28" />
            <stop offset="1" stopColor="#ff9d3c" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="h-puits" cx="50%" cy="50%">
            <stop offset="0" stopColor="#fff6de" stopOpacity=".95" />
            <stop offset=".55" stopColor="#ffdda0" stopOpacity=".5" />
            <stop offset="1" stopColor="#ffc072" stopOpacity=".12" />
          </radialGradient>
          {/* Une silhouette : toujours plus sombre que le mur qu'elle masque,
              sinon la statue se dissout dedans au lieu de s'en detacher. */}
          <linearGradient id="h-statue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0f0a05" /><stop offset=".6" stopColor="#090603" />
            <stop offset="1" stopColor="#050301" />
          </linearGradient>
          <radialGradient id="h-chute" cx="50%" cy="44%">
            <stop offset=".38" stopColor="#000" stopOpacity="0" />
            <stop offset="1" stopColor="#000" stopOpacity=".9" />
          </radialGradient>
        </defs>

        <rect width={h.largeur} height={h.hauteur} fill="#080605" />

        {/* La voute, puis le sol poli : deux plans, deux degrades. */}
        <polygon
          points={pts([
            { x: 0, y: -h.hauteur * 0.32 },
            { x: h.largeur, y: -h.hauteur * 0.32 },
            h.travees[h.travees.length - 1]!.a,
            h.travees[h.travees.length - 1]!.de,
          ])}
          fill="url(#h-voute)"
        />
        <rect y={fuite.y} width={h.largeur} height={h.hauteur - fuite.y} fill="url(#h-sol)" />

        {/* Les bas-cotes, et les rayonnages qu'on y devine. */}
        {h.basCotes.map((c, i) => (
          <polygon key={i} points={pts(c)} fill="url(#h-bascote)" />
        ))}
        {dos.map((d, i) => (
          <rect key={i} x={d.x - d.l / 2} y={d.y - d.h} width={d.l} height={d.h} fill={`rgb(${Math.round(210 * d.c)} ${Math.round(186 * d.c)} ${Math.round(146 * d.c)})`} />
        ))}
        {h.tablettes.map((t, i) => (
          <line key={i} x1={t.de.x} y1={t.de.y} x2={t.a.x} y2={t.a.y} stroke="#0d0906" strokeWidth="2" />
        ))}

        {/* Le mur du fond, sur lequel se detache la statue. */}
        <polygon points={pts(h.fond)} fill="url(#h-fond)" />

        {/* Le puits de lumiere, et le faisceau qui en tombe. */}
        <polygon
          points={pts([
            { x: fuite.x - puits.rx, y: puits.centre.y },
            { x: fuite.x + puits.rx, y: puits.centre.y },
            { x: fuite.x + arete * 1.5, y: cube.socleDessus[0].y },
            { x: fuite.x - arete * 1.5, y: cube.socleDessus[0].y },
          ])}
          fill="url(#h-faisceau)"
        />
        {/*
          Celui qui porte le monde.

          Il est bati en deux temps : une moitie, puis son miroir. Une statue
          frontale est symetrique par construction, et la dessiner deux fois
          serait se donner l'occasion de la desaxer.
        */}
        {(() => {
          const { cx, sol, epaules, demiEpaules: dE, demiCoudes: dC, globe } = porteur
          const H = sol - epaules
          const y = (k: number): number => sol - H * k
          /*
           * Les membres sont des POLYLIGNES EPAISSIES, pas des polygones.
           *
           * Dessines a la main, contour par contour, ils devenaient des
           * losanges : l'epaisseur qu'on donne au coude finit par egaler la
           * longueur du bras. Une ligne brisee que l'on epaissit garde son
           * epaisseur partout, et se plie ou on lui dit de se plier. Un membre
           * est une ligne, pas une surface.
           */
          const membre = (points: string, e: number): React.ReactElement => (
            <polyline points={points} fill="none" strokeWidth={e} strokeLinecap="round" strokeLinejoin="round" />
          )
          return (
            <g fill="url(#h-statue)" stroke="url(#h-statue)" strokeLinejoin="round">
              {([1, -1] as const).map((m) => (
                <g key={m} transform={m === 1 ? undefined : `translate(${2 * cx} 0) scale(-1 1)`}>
                  {/* La jambe, repliee : il est a genoux sous la charge. */}
                  {membre(
                    `${cx + dE * 0.34},${y(0.42)} ${cx + dC * 0.9},${y(0.14)} ${cx + dC * 0.52},${sol}`,
                    H * 0.2,
                  )}
                  {/* Le bras : epaule, coude en dehors et en l'air, main sous le globe. */}
                  {membre(
                    `${cx + dE * 0.72},${epaules + H * 0.06} ${cx + dC * 0.98},${epaules - H * 0.1} ${cx + globe.r * 0.68},${globe.centre.y + globe.r * 0.78}`,
                    H * 0.14,
                  )}
                </g>
              ))}
              {/* Le buste, la seule surface : des hanches aux epaules. */}
              <path
                d={`M${cx - dE * 0.52} ${y(0.4)}
                    L${cx + dE * 0.52} ${y(0.4)}
                    L${cx + dE * 0.44} ${y(0.62)}
                    L${cx + dE * 0.82} ${y(0.94)}
                    L${cx + dE * 0.26} ${epaules}
                    L${cx - dE * 0.26} ${epaules}
                    L${cx - dE * 0.82} ${y(0.94)}
                    L${cx - dE * 0.44} ${y(0.62)} Z`}
              />
              {/* La tete, courbee sous la charge, et la nuque. */}
              {membre(`${cx},${epaules + H * 0.04} ${cx},${epaules - H * 0.12}`, H * 0.13)}
              <ellipse cx={cx} cy={epaules - H * 0.15} rx={H * 0.095} ry={H * 0.11} />
            </g>
          )
        })()}

        {/* Le globe qu'il souleve, et ses cercles. */}
        <circle cx={porteur.globe.centre.x} cy={porteur.globe.centre.y} r={porteur.globe.r} fill="#241a0f" />
        <circle cx={porteur.globe.centre.x} cy={porteur.globe.centre.y} r={porteur.globe.r} fill="url(#h-halo)" opacity=".35" />
        {[0.34, 0.66].map((k) => (
          <ellipse
            key={k}
            cx={porteur.globe.centre.x}
            cy={porteur.globe.centre.y}
            rx={porteur.globe.r}
            ry={porteur.globe.r * k}
            fill="none"
            stroke="#6b5334"
            strokeWidth=".8"
            opacity=".55"
          />
        ))}
        <circle cx={porteur.globe.centre.x} cy={porteur.globe.centre.y} r={porteur.globe.r} fill="none" stroke="#8a6c42" strokeWidth="1.1" opacity=".7" />

        <ellipse cx={puits.centre.x} cy={puits.centre.y} rx={puits.rx} ry={puits.ry} fill="url(#h-puits)" />
        <ellipse cx={puits.centre.x} cy={puits.centre.y} rx={puits.rx} ry={puits.ry} fill="none" stroke="#3a2a17" strokeWidth="3" />

        {/* Les caissons de la voute. */}
        {h.travees.map((t, i) => (
          <line key={i} x1={t.de.x} y1={t.de.y} x2={t.a.x} y2={t.a.y} stroke="#2a1d12" strokeWidth={1.2 + 2.8 * t.proximite} />
        ))}
        {h.fuyantes.map((n, i) => (
          <line key={i} x1={n.de.x} y1={n.de.y} x2={n.a.x} y2={n.a.y} stroke="#2a1d12" strokeWidth="1.6" />
        ))}

        {/* L'arcade : les arcs d'abord, les piliers ensuite, du fond vers l'avant. */}
        {arcs.map((a, i) => (
          <g key={i}>
            <path d={bandeau(a)} fill={pierre(a.proximite, [92, 74, 50])} />
            <path d={bandeau(a)} fill="none" stroke={pierre(a.proximite, [26, 19, 12])} strokeWidth="1" />
          </g>
        ))}
        {piliers.map((p, i) => (
          <g key={i}>
            {bloc(p.fut, p.proximite, [78, 62, 42])}
            {/* La joue tournee vers la nef prend le peu de jour qu'il y a. */}
            <polygon
              points={pts([
                p.fut[0],
                { x: p.fut[0].x + (p.fut[1].x - p.fut[0].x) * 0.3, y: p.fut[0].y },
                { x: p.fut[3].x + (p.fut[2].x - p.fut[3].x) * 0.3, y: p.fut[3].y },
                p.fut[3],
              ])}
              fill={pierre(p.proximite, [118, 96, 64])}
            />
            {bloc(p.base, p.proximite, [96, 78, 52])}
            {bloc(p.chapiteau, p.proximite, [110, 90, 60])}
          </g>
        ))}

        {/* Le socle, puis le cube qui ne le touche pas. */}
        <polygon points={pts(cube.socleDessus)} fill="#6f5735" />
        <polygon points={pts(cube.socleDessus)} fill="url(#h-halo)" opacity=".5" />
        <polygon points={pts(cube.socleFace)} fill="#2c2013" />
        <polygon points={pts([cube.socleDessus[0], cube.socleDessus[1], cube.socleFace[2], cube.socleFace[3]])} fill="#8f7046" opacity=".5" />

        {/* La flaque de lumiere sur la pierre polie : elle vient vers nous. */}
        <polygon
          points={pts([
            cube.socleFace[0],
            cube.socleFace[1],
            { x: fuite.x + arete * 2.6, y: h.hauteur },
            { x: fuite.x - arete * 2.6, y: h.hauteur },
          ])}
          fill="url(#h-reflet)"
        />

        <ellipse
          className="cube__halo"
          cx={fuite.x}
          cy={(cube.avant[0].y + cube.avant[3].y) / 2}
          rx={arete * 2.4}
          ry={arete * 2.2}
          fill="url(#h-halo)"
        />

        <g className="cube">
          <polygon points={pts(cube.dessus)} fill="url(#h-cube-dessus)" />
          <polygon points={pts(cube.avant)} fill="url(#h-cube)" />
          <polygon points={pts(cube.avant)} fill="none" stroke="#fff0c0" strokeWidth=".9" opacity=".55" />
        </g>

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

        <rect width={h.largeur} height={h.hauteur} fill="url(#h-chute)" />

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

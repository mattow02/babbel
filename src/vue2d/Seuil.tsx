/**
 * Le Seuil : la bibliotheque vue du dehors, au soleil rasant.
 *
 * Chez Borges, la bibliotheque n'a pas d'exterieur : elle EST l'univers. Ce
 * lieu est donc une invention assumee du projet (D11), gardee parce qu'elle
 * donne l'arc du site : on passe du plein soleil aux tenebres, et c'est cette
 * bascule qui fait comprendre ou l'on entre.
 *
 * Le dessin vient des planches validees. Ce qui l'a fait tenir debout, apres
 * plusieurs essais : le fond du portique est a l'OMBRE. Une colonnade posee
 * devant une surface claire se lit toujours comme un decor decoupe, quoi qu'on
 * mette dessous ; c'est l'ombre derriere elle qui lui donne son epaisseur.
 *
 * On entre en cliquant la porte, et non par un bouton : le site doit avoir
 * l'air d'un lieu, pas d'une application. La porte est donc une cible pour de
 * vrai, avec sa lueur qui respire et sa reponse au survol.
 */
import { hash32, unitOf as unite } from './hash.ts'

/**
 * Le portail, decrit une seule fois.
 *
 * Il etait un rectangle noir pose sur le dessin : pas d'encadrement, pas
 * d'epaisseur de mur, pas de seuil. Une porte n'est pas un trou, c'est une
 * piece d'architecture, et elle se construit comme telle. Toutes ses parties
 * decoulent de ces six nombres, et la cible du clic aussi : le dessin et la
 * zone cliquable ne peuvent donc plus se desaccorder.
 */
const PORTAIL = {
  cx: 480,
  /** Demi-largeur de l'ouverture. */
  demi: 40,
  /** Le niveau du portique, ou l'escalier arrive. */
  sol: 396,
  /**
   * Ou l'arc commence a tourner.
   *
   * Le mur de la cella fait cent quatre pixels, de 292 a 396 : le portail doit
   * TENIR DEDANS, chambranle et clef compris. C'est ce qui fixe tout le reste,
   * et c'est ce qui manquait : l'arc montait jusqu'a 250 et passait donc
   * par-dessus l'entablement, ce qui est une des raisons pour lesquelles la
   * porte avait l'air posee sur le dessin.
   */
  naissance: 351,
  /** La hauteur de l'arc : egale a la demi-largeur, donc un plein cintre. */
  fleche: 40,
  /** La largeur du chambranle. */
  cadre: 13,
  /** L'epaisseur du mur, vue de biais dans l'embrasure. */
  ebrasement: 8,
} as const

/**
 * Les colonnes.
 *
 * Elles n'etaient PAS dans l'axe : ecrites de 204 a 780, leur centre tombait a
 * 492 quand celui de la coupole, du portail, de l'entablement et du stylobate
 * tombe a 480. Douze pixels de decalage, invisibles isolement, mais qui
 * faisaient que rien ne repondait a rien.
 *
 * Elles se calculent donc a partir de l'axe, et non plus a la main : cinq de
 * chaque cote, au meme pas, symetriques par construction. L'entrecolonnement
 * central est plus large que les autres, ce qui est la regle pour une entree
 * monumentale et ce qui laisse la place au portail.
 */
const AXE = 480
const PAS = 42
const COLONNES: readonly number[] = [0, 1, 2, 3, 4].flatMap((i) => [
  AXE - 106 - PAS * (4 - i),
  AXE + 76 + PAS * i,
])

/** Une colonne : abaque, fut, base. Le meme dessin dehors et dans le reflet. */
function Colonne({ x }: { x: number }): React.ReactElement {
  return (
    <g>
      <rect x={x} y="292" width="30" height="8" fill="#efdfbc" stroke="#a68d66" strokeWidth="1"/>
      <rect x={x + 3} y="300" width="24" height="86" fill="url(#s-fut)"/>
      <rect x={x - 1} y="386" width="32" height="10" fill="#e8d6b0" stroke="#a68d66" strokeWidth="1"/>
    </g>
  )
}

/**
 * Les cypres du parvis.
 *
 * Ils se tiennent DEVANT la terrasse, et non plus a cheval sur l'horizon : les
 * plus proches encadrent donc l'image de deux verticales sombres, ce qui pose
 * le monument au lieu de le border.
 *
 * La liste est triee du fond vers l'avant une fois pour toutes, parce que
 * l'ordre de dessin est un fait de la scene et non une affaire de boucle.
 */
const CYPRES = Array.from({ length: 8 }, (_, i) => {
  const t = i / 7
  const ry = 46 - t * 29
  const ombreY = 500 - t * 40
  const vert = (a: number, b: number): number => Math.round(a + (b - a) * t)
  return {
    ry,
    ombreY,
    cy: ombreY - ry,
    ombreRx: 26 - t * 16,
    feuille: `rgb(${vert(38, 64)} ${vert(52, 86)} ${vert(40, 70)})`,
    // Le vent ne souffle pas en cadence : chaque arbre a sa periode, tiree du
    // hachage et non d'une multiplication, qui redonnerait un motif (D32).
    souffle: (3.4 + 2.8 * unite(hash32(i * 7919 + 13))).toFixed(2),
    retard: (-8 * unite(hash32(i * 104729 + 5))).toFixed(2),
    x: 26 + i * 18.5,
  }
})
  .flatMap((a) => [
    { ...a, cle: `${a.x}g`, cx: a.x, cote: -1 as const },
    { ...a, cle: `${a.x}d`, cx: 960 - a.x, cote: 1 as const },
  ])
  .sort((a, b) => a.ombreY - b.ombreY)

/** Le contour d'une baie en plein cintre, a la largeur qu'on lui donne. */
function baie(demi: number, fleche: number): string {
  const { cx, sol, naissance } = PORTAIL
  return [
    `M${cx - demi} ${sol}`,
    `L${cx - demi} ${naissance}`,
    `A${demi} ${fleche} 0 0 1 ${cx + demi} ${naissance}`,
    `L${cx + demi} ${sol}`,
    'Z',
  ].join(' ')
}

export function Seuil({ onEntrer }: { onEntrer: () => void }): React.ReactElement {
  const { cx, demi, sol, naissance, fleche, cadre, ebrasement } = PORTAIL
  const ouverture = baie(demi, fleche)

  return (
    <div className="seuil">
      <svg viewBox="0 0 960 620" preserveAspectRatio="xMidYMid slice" role="group"
           aria-label="La bibliothèque vue du dehors, au soleil rasant">

  <defs>
    <linearGradient id="s-ciel" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#12303f"/><stop offset=".38" stopColor="#4e7079"/>
      <stop offset=".68" stopColor="#b09068"/><stop offset="1" stopColor="#f0c78e"/>
    </linearGradient>
    <radialGradient id="s-soleil" cx="50%" cy="50%">
      <stop offset="0" stopColor="#fff3d6" stopOpacity=".95"/>
      <stop offset=".3" stopColor="#ffd79a" stopOpacity=".5"/>
      <stop offset="1" stopColor="#ffb968" stopOpacity="0"/>
    </radialGradient>
    <linearGradient id="s-dome" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stopColor="#8f7a56"/><stop offset=".3" stopColor="#f6e8c6"/>
      <stop offset=".62" stopColor="#e0caa2"/><stop offset="1" stopColor="#9c8461"/>
    </linearGradient>
    <linearGradient id="s-fut" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stopColor="#a68d66"/><stop offset=".4" stopColor="#f4e6c6"/>
      <stop offset="1" stopColor="#b09a74"/>
    </linearGradient>
    <linearGradient id="s-bassin" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#c7b48f" stopOpacity=".62"/>
      <stop offset=".45" stopColor="#8a7d63" stopOpacity=".3"/>
      <stop offset="1" stopColor="#3d3529" stopOpacity=".05"/>
    </linearGradient>
    {/* Le chambranle prend le jour a gauche et le perd a droite. */}
    <linearGradient id="s-chambranle" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stopColor="#f0e1bd"/><stop offset=".45" stopColor="#dcc9a1"/>
      <stop offset="1" stopColor="#b39a74"/>
    </linearGradient>
    {/* L embrasement : la joue eclairee d un cote, l autre dans le noir. */}
    <linearGradient id="s-embrasement" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stopColor="#6b5335"/><stop offset=".5" stopColor="#3a2a19"/>
      <stop offset="1" stopColor="#241a10"/>
    </linearGradient>
    {/* Le vestibule : noir en haut, un peu de sol eclaire en bas. */}
    <linearGradient id="s-vestibule" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#0b0805"/><stop offset=".62" stopColor="#140e08"/>
      <stop offset="1" stopColor="#33240f"/>
    </linearGradient>
    {/* La lueur de la porte : un degrade, pas un disque. Une lumiere n'a pas de bord. */}
    <radialGradient id="s-porte" cx="50%" cy="50%">
      <stop offset="0" stopColor="#ffc072" stopOpacity=".85"/>
      <stop offset=".5" stopColor="#ffb15a" stopOpacity=".3"/>
      <stop offset="1" stopColor="#ff9d3c" stopOpacity="0"/>
    </radialGradient>
    {/* L ombre de contact : noire au ras du socle, evanouie quinze pixels plus bas. */}
    <linearGradient id="s-contact" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#33240f" stopOpacity=".78"/>
      <stop offset=".5" stopColor="#33240f" stopOpacity=".3"/>
      <stop offset="1" stopColor="#3d2c18" stopOpacity="0"/>
    </linearGradient>
    {/* La face de la terrasse est un plan vertical : elle s assombrit en bas. */}
    <linearGradient id="s-terrasse" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#bda683"/><stop offset="1" stopColor="#9c8462"/>
    </linearGradient>
    <linearGradient id="s-brume" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#e8c9a0" stopOpacity="0"/>
      <stop offset="1" stopColor="#e8c9a0" stopOpacity=".55"/>
    </linearGradient>
  </defs>

  <rect width="960" height="620" fill="url(#s-ciel)"/>
  <ellipse className="soleil" cx="480.0" cy="352" rx="300" ry="215" fill="url(#s-soleil)"/>

  {/*
    Les cirrus, qui derivent.

    Deux couches a deux vitesses : c'est la difference entre les deux qui
    donne la profondeur du ciel, pas la vitesse elle-meme.

    Chaque couche est dessinee DEUX FOIS, la seconde decalee d'une largeur de
    cadre, et l'ensemble glisse d'exactement cette largeur : la boucle se
    referme sur elle-meme, et l'on ne voit jamais de raccord.
  */}
  {([
    ['ciel__haut', [
      { y: 74, rx: 250, ry: 5.5, x: 300, o: 0.13 },
      { y: 96, rx: 170, ry: 4, x: 690, o: 0.1 },
      { y: 132, rx: 120, ry: 3.4, x: 150, o: 0.12 },
      { y: 158, rx: 210, ry: 4.6, x: 800, o: 0.14 },
    ]],
    ['ciel__bas', [
      { y: 196, rx: 140, ry: 3.8, x: 120, o: 0.16 },
      { y: 214, rx: 190, ry: 4.2, x: 760, o: 0.15 },
      { y: 246, rx: 110, ry: 3, x: 220, o: 0.18 },
    ]],
  ] as const).map(([couche, bandes]) => (
    <g key={couche} className={couche}>
      {[0, 960].map((decalage) =>
        bandes.map((c) => (
          <ellipse key={`${decalage}-${c.x}-${c.y}`} cx={c.x + decalage} cy={c.y} rx={c.rx} ry={c.ry} fill="#f2ddba" opacity={c.o}/>
        )),
      )}
    </g>
  ))}

  {/*
    Une volee d'oiseaux, minuscule : c'est elle qui donne sa taille au ciel.
    Elle tourne lentement, et chacun bat des ailes a son rythme.
  */}
  <g className="volee" stroke="#22343c" strokeWidth="1.4" fill="none" opacity=".42" strokeLinecap="round">
    {[
      { x: 196, y: 128, t: 5.5 },
      { x: 224, y: 143, t: 4.4 },
      { x: 248, y: 120, t: 3.6 },
      { x: 269, y: 152, t: 5 },
      { x: 292, y: 134, t: 3.2 },
      { x: 168, y: 156, t: 4 },
      { x: 312, y: 160, t: 2.8 },
    ].map((o, i) => (
      <path
        key={`${o.x}-${o.y}`}
        className="oiseau"
        d={`M${o.x - o.t} ${o.y} q${o.t} ${-o.t * 0.62} ${o.t} 0 q0 ${-o.t * 0.62} ${o.t} 0`}
        style={{
          animationDuration: `${(0.34 + 0.22 * unite(hash32(i * 2654435761 + 17))).toFixed(2)}s`,
          animationDelay: `${(-1.4 * unite(hash32(i * 40503 + 3))).toFixed(2)}s`,
        }}
      />
    ))}
  </g>

  {/*
    Les montagnes, en plans qui s effacent, et a silhouette BRISEE.

    Quatre triangles nets se lisaient comme des pyramides posees sur le ciel.
    Une crete se casse : deux ressauts par versant suffisent a la faire lire
    comme du relief plutot que comme une figure.
  */}
  <polygon points="-40,419 60,354 132,300 206,348 300,419" fill="#7f8f92" opacity=".26"/>
  <polygon points="640,419 748,332 830,286 902,342 1010,419" fill="#7f8f92" opacity=".26"/>
  <polygon points="72,419 172,364 270,326 342,370 462,419" fill="#77858a" opacity=".4"/>
  <polygon points="498,419 620,360 700,318 792,366 902,419" fill="#77858a" opacity=".4"/>
  <rect y="330" width="960" height="90" fill="url(#s-brume)"/>

  {/*
    LA TERRASSE, et c'est elle qui remet tout d'aplomb.

    Il y avait la une incoherence de fond : le socle du monument et le muret
    d'enceinte avaient leur base A 424 et 426, donc AU-DESSUS de la ligne
    d'horizon, qui etait a 430. Or ce qui est au-dessus de l'horizon est
    au-dela de l'infini : un mur ne peut pas y poser. C'est ce qui produisait
    la bande claire, plate et flottante, qui courait sous le batiment.

    Le monument se tient donc sur une terrasse surelevee dont on ne voit,
    frontalement, que la face. Cette face court d'un bord a l'autre du cadre :
    elle cache l'horizon, elle DEVIENT l'horizon, et il n'y a plus rien a
    empiler derriere. Les montagnes butent dessus, l'escalier la traverse, et
    les cypres se tiennent devant, sur le parvis.
  */}
  <rect y="418" width="960" height="202" fill="#c9ae86"/>
  <rect y="424" width="960" height="26" fill="url(#s-terrasse)"/>
  <rect y="418" width="960" height="6" fill="#e8d6b0"/>
  <rect y="450" width="960" height="14" fill="url(#s-contact)"/>

  {/* Le dome, derriere la colonnade */}
  <path d="M294.0 300 A186 168 0 0 1 666.0 300 Z" fill="url(#s-dome)"/>
  <path d="M294.0 300 A186 168 0 0 1 666.0 300" fill="none" stroke="#8f7a56" strokeWidth="2"/>
  <ellipse cx="480.0" cy="134" rx="16" ry="10" fill="#f6e8c6" stroke="#8f7a56"/>

  {/* Le socle de la coupole : elle repose sur quelque chose, elle ne pousse
      pas hors du toit. */}
  <rect x="286.0" y="252" width="388" height="10" fill="#d9c49b" stroke="#a68d66" strokeWidth="1"/>
  <rect x="296.0" y="244" width="368" height="8" fill="#c7b088" stroke="#a68d66" strokeWidth="1"/>

  {/* LE FOND DU PORTIQUE, en ombre.
       Sans lui, on voit le dome eclaire entre les colonnes et la colonnade se
       lit comme un decor decoupe pose devant. C est l ombre derriere qui la
       fait tenir : chaque entrecolonnement devient une fente noire. */}
  <rect x="188.0" y="292" width="584" height="104" fill="#2a2016"/>

  {/* Les assises : une ombre ne doit pas etre un aplat, sinon le mur n'a pas
      de matiere et tout ce qu'on y pose a l'air colle dessus. */}
  {[306, 320, 334, 348, 362, 376].map((y) => (
    <rect key={y} x="188.0" y={y} width="584" height="1.4" fill="#1d150e"/>
  ))}

  <rect x="188.0" y="292" width="584" height="15" fill="#191209"/>
  <rect x="188.0" y="380" width="584" height="16" fill="#3a2d1f"/>
  <rect x="188.0" y="378" width="584" height="2.5" fill="#4a3a28"/>

  {/* Les antes, aux extremites : elles donnent des bords au mur. */}
  {[188, 760].map((x) => (
    <g key={x}>
      <rect x={x} y="292" width="12" height="104" fill="#33281c"/>
      <rect x={x} y="292" width="12" height="4" fill="#4a3a28"/>
    </g>
  ))}

  {/* L entablement et la colonnade */}
  <rect x="180.0" y="276" width="600" height="18" fill="#f2e2bf" stroke="#a68d66"/>
  <rect x="172.0" y="262" width="616" height="14" fill="#e2cda3" stroke="#a68d66"/>
  <rect x="172.0" y="276" width="616" height="3" fill="#a68d66" opacity=".45"/>
  <rect x="172.0" y="294" width="616" height="5" fill="#8f7a56" opacity=".7"/>
  {COLONNES.map((x) => (
    <Colonne key={x} x={x}/>
  ))}

  {/*
    L ENTREE UNIQUE, batie.

    De l exterieur vers l interieur : le chambranle qui saille du mur, la clef
    qui le couronne, l embrasement qui montre l epaisseur du mur, puis le
    vestibule. C est l embrasement qui fait le plus de travail : sans lui, la
    porte reste une decoupe, quelle que soit la richesse du cadre.
  */}
  <path d={baie(demi + cadre + 3, fleche + cadre + 3)} fill="#241a10"/>
  <path d={baie(demi + cadre, fleche + cadre)} fill="url(#s-chambranle)"/>

  {/* Les claveaux, qui disent que l arc est appareille. */}
  {[-58, -35, -12, 12, 35, 58].map((deg) => {
    const a = ((deg - 90) * Math.PI) / 180
    const dx = Math.cos(a)
    const dy = Math.sin(a)
    return (
      <line
        key={deg}
        x1={cx + dx * demi}
        y1={naissance + dy * fleche}
        x2={cx + dx * (demi + cadre)}
        y2={naissance + dy * (fleche + cadre)}
        stroke="#a68d66"
        strokeWidth="1"
        opacity=".55"
      />
    )
  })}

  {/* La clef, qui saille un peu : c est elle qui centre tout le monument. */}
  <path
    d={`M${cx - 10} ${naissance - fleche - cadre - 4} L${cx + 10} ${naissance - fleche - cadre - 4} L${cx + 7.5} ${naissance - fleche + 8} L${cx - 7.5} ${naissance - fleche + 8} Z`}
    fill="#f3e5c4"
    stroke="#a68d66"
    strokeWidth="1"
  />

  {/* L embrasement : le mur a une epaisseur, et on la voit. */}
  <path d={ouverture} fill="url(#s-embrasement)"/>
  <path d={baie(demi - ebrasement, fleche - ebrasement)} fill="url(#s-vestibule)"/>

  {/* Le seuil, sur lequel l escalier arrive. */}
  <rect x={cx - demi - cadre - 5} y={sol - 6} width={2 * (demi + cadre + 5)} height="7" fill="#efdfbc" stroke="#a68d66" strokeWidth="1"/>

  {/*
    Le dallage du parvis, en cercles.

    Deux traits suffisent : la terrasse etait un aplat, et le regard n'y avait
    rien pour mesurer la distance. Les cercles reprennent le plan du bassin et
    de l'ombre, donc le lieu reste concentrique, ce qu'il est.
  */}
  {[
    { rx: 344, ry: 22, o: 0.3 },
    { rx: 424, ry: 28, o: 0.22 },
    { rx: 512, ry: 34, o: 0.16 },
  ].map((c) => (
    <ellipse key={c.rx} cx="480" cy="486" rx={c.rx} ry={c.ry} fill="none" stroke="#e2cda4" strokeWidth="1.6" opacity={c.o}/>
  ))}

  {/*
    L ombre portee du monument.

    Le soleil est DERRIERE lui : son ombre vient donc vers nous, et s etale sur
    le parvis. Trois nappes de plus en plus etroites et de plus en plus sombres
    en remontant vers le batiment : c est le degrade qui fait la distance, pas
    le contour.
  */}
  <ellipse cx="480.0" cy="498" rx="540" ry="42" fill="#6b5b42" opacity=".2"/>
  <ellipse cx="480.0" cy="488" rx="404" ry="28" fill="#6b5b42" opacity=".34"/>
  <ellipse cx="480.0" cy="478" rx="306" ry="17" fill="#503f2b" opacity=".42"/>

  {/*
    LE STEREOBATE : trois assises, et non une dalle.

    Le temple avait l'air pose sur rien, et il l'etait : son socle etait une
    seule dalle de seize pixels, de la meme valeur que la terrasse, sans
    ressaut et sans ombre de contact. Rien ne disait ou le batiment finissait
    et ou le sol commencait.

    Trois assises qui s'elargissent en descendant, chacune avec son dessus au
    jour et sa face dans l'ombre, puis une ombre portee qui se colle sous la
    derniere : c'est le noir du contact qui pose un batiment, plus surement que
    n'importe quel detail.
  */}
  {[
    { y: 396, x0: 180, x1: 780, dessus: '#f4e6c6', face: '#d6c096' },
    { y: 405, x0: 171, x1: 789, dessus: '#ead9b5', face: '#c5ae83' },
    { y: 414, x0: 162, x1: 798, dessus: '#dfcda7', face: '#b19871' },
  ].map((a) => (
    <g key={a.y}>
      <rect x={a.x0} y={a.y} width={a.x1 - a.x0} height="3.4" fill={a.dessus}/>
      <rect x={a.x0} y={a.y + 3.4} width={a.x1 - a.x0} height="5.6" fill={a.face}/>
    </g>
  ))}
  <rect x="150.0" y="423" width="660" height="18" fill="url(#s-contact)"/>
  {/*
    L escalier.

    Il s arretait a 424, c est-a-dire contre la face du stylobate : on montait
    sept marches pour se cogner a un mur de seize pixels, et le parvis ne
    menait nulle part. Il monte maintenant jusqu au niveau ou posent les
    colonnes, en tranchant la face du podium, ce qui est exactement ce que
    fait un escalier monumental.

    Chaque marche est en deux temps, la contremarche dans l ombre et le nez
    qui prend le jour : sans cela sept rectangles empiles font des rayures,
    pas des marches.
  */}
  {Array.from({ length: 9 }, (_, i) => {
    const y = 396 + (8 - i) * 10.6
    const x0 = 234 + i * 15
    const large = 726 - i * 15 - x0
    return (
      <g key={i}>
        <rect x={x0} y={y + 3.2} width={large} height={7.8} fill="#c9b389"/>
        <rect x={x0} y={y} width={large} height={3.6} fill="#f4e7c6"/>
        <rect x={x0} y={y + 10.6} width={large} height={1} fill="#a68d66" opacity=".5"/>
      </g>
    )
  })}

  {/* Les cypres */}
  {/*
    Les cypres : toutes les ombres d'abord, puis les arbres du fond vers
    l'avant.

    Ils etaient dessines arbre par arbre, du plus proche au plus lointain :
    l'ombre d'un arbre lointain se peignait donc PAR-DESSUS un arbre proche,
    et l'arbre lointain lui-meme passait devant. Deux passes reglent les deux
    d'un coup, et l'ordre est celui de la profondeur, jamais celui de la
    boucle.
  */}
  <g>
    {CYPRES.map((a) => (
      <g key={`o${a.cle}`}>
        <ellipse cx={a.cx + a.cote * a.ombreRx * 0.667} cy={a.ombreY} rx={a.ombreRx} ry={a.ombreRx * 0.185} fill="#6b5b42" opacity=".38"/>
        <ellipse cx={a.cx} cy={a.ombreY} rx={a.ry * 0.2} ry={a.ry * 0.051} fill="#4a3f2e" opacity=".55"/>
      </g>
    ))}
  </g>
  <g>
    {CYPRES.map((a) => (
      <g key={`a${a.cle}`}>
        <rect x={a.cx - 1.4} y={a.ombreY - 5} width="2.8" height="6" fill="#33291d"/>
        <ellipse
          className="cypres"
          cx={a.cx}
          cy={a.cy}
          rx={a.ry * 0.23}
          ry={a.ry}
          fill={a.feuille}
          style={{ animationDuration: `${a.souffle}s`, animationDelay: `${a.retard}s` }}
        />
      </g>
    ))}
  </g>

  {/*
    Deux vasques au pied des marches.

    Elles reprennent les formes primitives de la direction artistique, le bol
    et le cube, et ce sont les deux seules taches chaudes du dehors : elles
    annoncent la lumiere qu'on trouvera dedans.
  */}
  {[200, 760].map((x) => (
    <g key={x}>
      <ellipse cx={x} cy="484" rx="30" ry="6" fill="#6b5b42" opacity=".4"/>
      <rect x={x - 13} y="452" width="26" height="32" fill="#d8c49c" stroke="#a68d66" strokeWidth="1"/>
      <rect x={x - 17} y="446" width="34" height="7" fill="#efdfbc" stroke="#a68d66" strokeWidth="1"/>
      <path d={`M${x - 22} 440 a22 15 0 0 0 44 0 z`} fill="#c9b183" stroke="#a68d66" strokeWidth="1"/>
      <ellipse cx={x} cy="438" rx="22" ry="5" fill="#8a7250"/>
      <ellipse className="flamme" cx={x} cy="432" rx="26" ry="18" fill="url(#s-porte)" style={{ animationDelay: x === 200 ? "0s" : "-1.7s" }}/>
    </g>
  ))}

  {/*
    Les silhouettes : l echelle ne se lit que par elles.

    Une seule ne suffisait pas a peupler le parvis. Trois, a trois distances,
    disent aussi la profondeur.
  */}
  {/* Chacune a son ombre au sol : sans elle, elles flottent. */}
  <g fill="#5a4a34" opacity=".42">
    <ellipse cx="576.0" cy="480" rx="11" ry="2.6"/>
    <ellipse cx="392" cy="458" rx="8.4" ry="2"/>
    <ellipse cx="298" cy="494" rx="13" ry="3.1"/>
  </g>
  <g fill="#2b1f12" opacity=".9">
    <ellipse cx="576.0" cy="444" rx="4.5" ry="5.5"/>
    <path d="M571.5 450 h9 l2 30 h-4 l-1.5 -16 -1.5 16 h-4 z"/>
    <ellipse cx="392" cy="430" rx="3.4" ry="4.2"/>
    <path d="M388.6 435 h6.8 l1.5 23 h-3 l-1.1 -12 -1.1 12 h-3 z"/>
    <ellipse cx="298" cy="452" rx="5.2" ry="6.4"/>
    <path d="M292.8 459 h10.4 l2.3 35 h-4.6 l-1.7 -18.5 -1.7 18.5 h-4.6 z"/>
  </g>

  {/* Le bassin : c est lui qui double le monument */}
  <rect y="512" width="960" height="108" fill="#6d6250"/>
  <g opacity=".32" transform="translate(0,768.0) scale(1,-0.5)">
    <path d="M294.0 300 A186 168 0 0 1 666.0 300 Z" fill="#e0caa2"/>
    <rect x="188.0" y="276" width="584" height="18" fill="#f2e2bf"/>
    {COLONNES.map((x) => (
      <Colonne key={x} x={x}/>
    ))}
    <rect x="427" y="298" width="106" height="98" fill="#1a1209"/>
    <rect y="418" width="960" height="32" fill="#b39a74"/>
  </g>
  <rect y="512" width="960" height="108" fill="url(#s-bassin)"/>
  <g className="rides" stroke="#f0dcb4" strokeWidth="1.2" fill="none">
    <path d="M60 540h840"/>
    <path d="M120 562h720"/>
    <path d="M180 584h600"/>
    <path d="M240 604h480"/>
  </g>
  <rect y="508" width="960" height="4" fill="#9a8a6c"/>
  <rect y="504" width="960" height="4" fill="#c4b18c"/>

  {/*
    La porte, seule chose cliquable du dehors.

    Elle est dessinee EN DERNIER, et c'est une regle et non un hasard : une
    cible posee au milieu d'un dessin finit toujours par passer sous un decor
    ajoute apres elle, et le clic se perd sans que rien ne le montre. La lueur
    suit la cible pour que le survol se voie.
  */}
  <g className="porte">
    <path
      className="cible"
      d={baie(demi + cadre, fleche + cadre)}
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
    </path>
    <ellipse className="porte__appel" cx={cx} cy={sol - 24} rx="36" ry="32" fill="url(#s-porte)"/>
    <ellipse className="porte__lueur" cx={cx} cy={sol - 24} rx="36" ry="32" fill="url(#s-porte)"/>
  </g>

      </svg>
    </div>
  )
}

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
export function Seuil({ onEntrer }: { onEntrer: () => void }): React.ReactElement {
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
    {/* La lueur de la porte : un degrade, pas un disque. Une lumiere n'a pas de bord. */}
    <radialGradient id="s-porte" cx="50%" cy="50%">
      <stop offset="0" stopColor="#ffc072" stopOpacity=".85"/>
      <stop offset=".5" stopColor="#ffb15a" stopOpacity=".3"/>
      <stop offset="1" stopColor="#ff9d3c" stopOpacity="0"/>
    </radialGradient>
    <linearGradient id="s-brume" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#e8c9a0" stopOpacity="0"/>
      <stop offset="1" stopColor="#e8c9a0" stopOpacity=".55"/>
    </linearGradient>
  </defs>

  <rect width="960" height="620" fill="url(#s-ciel)"/>
  <ellipse cx="480.0" cy="352" rx="300" ry="215" fill="url(#s-soleil)"/>

  {/*
    Les cirrus.

    Le ciel occupait le tiers haut de l'image sans rien y mettre. Des bandes
    tres etirees et tres pales suffisent : elles donnent l'echelle du ciel sans
    concurrencer le monument, et elles chauffent en descendant vers le soleil.
  */}
  {[
    { y: 74, rx: 250, ry: 5.5, x: 300, o: 0.13 },
    { y: 96, rx: 170, ry: 4, x: 690, o: 0.1 },
    { y: 132, rx: 120, ry: 3.4, x: 150, o: 0.12 },
    { y: 158, rx: 210, ry: 4.6, x: 800, o: 0.14 },
    { y: 196, rx: 140, ry: 3.8, x: 120, o: 0.16 },
    { y: 214, rx: 190, ry: 4.2, x: 760, o: 0.15 },
    { y: 246, rx: 110, ry: 3, x: 220, o: 0.18 },
  ].map((c) => (
    <ellipse key={`${c.x}-${c.y}`} cx={c.x} cy={c.y} rx={c.rx} ry={c.ry} fill="#f2ddba" opacity={c.o}/>
  ))}

  {/* Une volee d'oiseaux, minuscule : c'est elle qui donne sa taille au ciel. */}
  <g stroke="#22343c" strokeWidth="1.4" fill="none" opacity=".42" strokeLinecap="round">
    {[
      { x: 196, y: 128, t: 5.5 },
      { x: 224, y: 143, t: 4.4 },
      { x: 248, y: 120, t: 3.6 },
      { x: 269, y: 152, t: 5 },
      { x: 292, y: 134, t: 3.2 },
      { x: 168, y: 156, t: 4 },
      { x: 312, y: 160, t: 2.8 },
    ].map((o) => (
      <path key={`${o.x}-${o.y}`} d={`M${o.x - o.t} ${o.y} q${o.t} ${-o.t * 0.62} ${o.t} 0 q0 ${-o.t * 0.62} ${o.t} 0`}/>
    ))}
  </g>

  {/* Les montagnes, en plans qui s effacent */}
  <polygon points="-30,430 130,300 300,430" fill="#7f8f92" opacity=".38"/>
  <polygon points="660,430 830,286 1000,430" fill="#7f8f92" opacity=".38"/>
  <polygon points="90,430 270,326 450,430" fill="#77858a" opacity=".55"/>
  <polygon points="520,430 700,318 880,430" fill="#77858a" opacity=".55"/>
  <rect y="330" width="960" height="78" fill="url(#s-brume)"/>

  {/* Le sol */}
  <rect y="430" width="960" height="190" fill="#c9ae86"/>

  {/* Le dome, derriere la colonnade */}
  <path d="M294.0 300 A186 168 0 0 1 666.0 300 Z" fill="url(#s-dome)"/>
  <path d="M294.0 300 A186 168 0 0 1 666.0 300" fill="none" stroke="#8f7a56" strokeWidth="2"/>
  <ellipse cx="480.0" cy="134" rx="16" ry="10" fill="#f6e8c6" stroke="#8f7a56"/>

  {/* LE FOND DU PORTIQUE, en ombre.
       Sans lui, on voit le dome eclaire entre les colonnes et la colonnade se
       lit comme un decor decoupe pose devant. C est l ombre derriere qui la
       fait tenir : chaque entrecolonnement devient une fente noire. */}
  <rect x="188.0" y="292" width="584" height="104" fill="#2a2016"/>
  <rect x="188.0" y="292" width="584" height="16" fill="#1a130c"/>
  <rect x="188.0" y="380" width="584" height="16" fill="#3b2e20"/>

  {/*
    Le mur d'enceinte.

    Le monument posait sur une plaine vide : de part et d'autre il ne se
    passait rien, et le batiment flottait. Un mur a refends le prolonge
    jusqu'au bord du cadre.

    Il monte plus haut que le pied des cypres, et c'est la seule facon de le
    voir : pose plus bas, il disparaissait entierement derriere eux. Les
    verticales sombres des arbres se detachent maintenant sur une surface
    claire, ce qui vaut mieux que les deux a plat sur le ciel.
  */}
  {([[0, 152, '#b9a078', '#cdb489'], [808, 960, '#8f7a56', '#a28c65']] as const).map(([x0, x1, corps, clair]) => (
    <g key={x0}>
      <rect x={x0} y="384" width={x1 - x0} height="40" fill={corps}/>
      <rect x={x0} y="378" width={x1 - x0} height="7" fill={clair}/>
      <rect x={x0} y="420" width={x1 - x0} height="6" fill="#6f5c3f"/>
      {Array.from({ length: Math.ceil((x1 - x0) / 44) }, (_, i) => (
        <rect key={i} x={x0 + 12 + i * 44} y="378" width="12" height="44" fill={clair} opacity=".7"/>
      ))}
    </g>
  ))}

  {/* Les retours lateraux : le batiment a des coins, donc une epaisseur */}
  <polygon points="188.0,292 150.0,304 150.0,404 188.0,396" fill="#b9a078"/>
  <polygon points="772.0,292 810.0,304 810.0,404 772.0,396" fill="#8f7a56"/>

  {/* L entablement et la colonnade */}
  <rect x="180.0" y="276" width="600" height="18" fill="#f2e2bf" stroke="#a68d66"/>
  <rect x="172.0" y="262" width="616" height="14" fill="#e2cda3" stroke="#a68d66"/>
  <rect x="180.0" y="294" width="600" height="5" fill="#a68d66" opacity=".6"/>
  <rect x="204" y="292" width="30" height="8" fill="#efdfbc" stroke="#a68d66" strokeWidth="1"/><rect x="207" y="300" width="24" height="86" fill="url(#s-fut)"/><rect x="203" y="386" width="32" height="10" fill="#e8d6b0" stroke="#a68d66" strokeWidth="1"/><rect x="246" y="292" width="30" height="8" fill="#efdfbc" stroke="#a68d66" strokeWidth="1"/><rect x="249" y="300" width="24" height="86" fill="url(#s-fut)"/><rect x="245" y="386" width="32" height="10" fill="#e8d6b0" stroke="#a68d66" strokeWidth="1"/><rect x="288" y="292" width="30" height="8" fill="#efdfbc" stroke="#a68d66" strokeWidth="1"/><rect x="291" y="300" width="24" height="86" fill="url(#s-fut)"/><rect x="287" y="386" width="32" height="10" fill="#e8d6b0" stroke="#a68d66" strokeWidth="1"/><rect x="330" y="292" width="30" height="8" fill="#efdfbc" stroke="#a68d66" strokeWidth="1"/><rect x="333" y="300" width="24" height="86" fill="url(#s-fut)"/><rect x="329" y="386" width="32" height="10" fill="#e8d6b0" stroke="#a68d66" strokeWidth="1"/><rect x="372" y="292" width="30" height="8" fill="#efdfbc" stroke="#a68d66" strokeWidth="1"/><rect x="375" y="300" width="24" height="86" fill="url(#s-fut)"/><rect x="371" y="386" width="32" height="10" fill="#e8d6b0" stroke="#a68d66" strokeWidth="1"/><rect x="582" y="292" width="30" height="8" fill="#efdfbc" stroke="#a68d66" strokeWidth="1"/><rect x="585" y="300" width="24" height="86" fill="url(#s-fut)"/><rect x="581" y="386" width="32" height="10" fill="#e8d6b0" stroke="#a68d66" strokeWidth="1"/><rect x="624" y="292" width="30" height="8" fill="#efdfbc" stroke="#a68d66" strokeWidth="1"/><rect x="627" y="300" width="24" height="86" fill="url(#s-fut)"/><rect x="623" y="386" width="32" height="10" fill="#e8d6b0" stroke="#a68d66" strokeWidth="1"/><rect x="666" y="292" width="30" height="8" fill="#efdfbc" stroke="#a68d66" strokeWidth="1"/><rect x="669" y="300" width="24" height="86" fill="url(#s-fut)"/><rect x="665" y="386" width="32" height="10" fill="#e8d6b0" stroke="#a68d66" strokeWidth="1"/><rect x="708" y="292" width="30" height="8" fill="#efdfbc" stroke="#a68d66" strokeWidth="1"/><rect x="711" y="300" width="24" height="86" fill="url(#s-fut)"/><rect x="707" y="386" width="32" height="10" fill="#e8d6b0" stroke="#a68d66" strokeWidth="1"/><rect x="750" y="292" width="30" height="8" fill="#efdfbc" stroke="#a68d66" strokeWidth="1"/><rect x="753" y="300" width="24" height="86" fill="url(#s-fut)"/><rect x="749" y="386" width="32" height="10" fill="#e8d6b0" stroke="#a68d66" strokeWidth="1"/>

  {/* L entree unique, en ombre franche */}
  <rect x="428.0" y="296" width="104" height="100" fill="#1a1209"/>
  <path d="M428.0 316 A52 46 0 0 1 532.0 316" fill="#1a1209"/>

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

  {/* L ombre du monument sur la terrasse : c est elle qui le pose */}
  <ellipse cx="480.0" cy="486" rx="392" ry="26" fill="#6b5b42" opacity=".36"/>
  <ellipse cx="480.0" cy="480" rx="300" ry="16" fill="#584b38" opacity=".4"/>

  {/* Le stylobate : on en voit le dessus, donc les colonnes posent dessus */}
  <polygon points="180.0,396 780.0,396 798.0,408 162.0,408" fill="#f0e0bd"/>
  <rect x="162.0" y="408" width="636" height="16" fill="#cdb894" stroke="#a68d66" strokeWidth="1"/>
  <rect x="354" y="424" width="252" height="9" fill="#e6d3ac" stroke="#b39a70" strokeWidth="1"/><rect x="334" y="432" width="292" height="9" fill="#dcc79c" stroke="#b39a70" strokeWidth="1"/><rect x="314" y="440" width="332" height="9" fill="#e6d3ac" stroke="#b39a70" strokeWidth="1"/><rect x="294" y="448" width="372" height="9" fill="#dcc79c" stroke="#b39a70" strokeWidth="1"/><rect x="274" y="456" width="412" height="9" fill="#e6d3ac" stroke="#b39a70" strokeWidth="1"/><rect x="254" y="464" width="452" height="9" fill="#dcc79c" stroke="#b39a70" strokeWidth="1"/><rect x="234" y="472" width="492" height="9" fill="#e6d3ac" stroke="#b39a70" strokeWidth="1"/>

  {/* Les cypres */}
  <ellipse cx="13.2" cy="462.0" rx="22.2" ry="4.1" fill="#6b5b42" opacity=".38"/><ellipse cx="28.0" cy="462.0" rx="7.4" ry="1.9" fill="#4a3f2e" opacity=".55"/><ellipse cx="28.0" cy="425.0" rx="8.5" ry="37.0" fill="#263428"/><rect x="26.6" y="457.0" width="2.8" height="6" fill="#33291d"/><ellipse cx="946.8" cy="462.0" rx="22.2" ry="4.1" fill="#6b5b42" opacity=".38"/><ellipse cx="932.0" cy="462.0" rx="7.4" ry="1.9" fill="#4a3f2e" opacity=".55"/><ellipse cx="932.0" cy="425.0" rx="8.5" ry="37.0" fill="#263428"/><rect x="930.6" y="457.0" width="2.8" height="6" fill="#33291d"/><ellipse cx="33.0" cy="457.1" rx="20.3" ry="3.7" fill="#6b5b42" opacity=".38"/><ellipse cx="46.6" cy="457.1" rx="6.8" ry="1.8" fill="#4a3f2e" opacity=".55"/><ellipse cx="46.6" cy="423.3" rx="7.8" ry="33.9" fill="#29382c"/><rect x="45.2" y="452.1" width="2.8" height="6" fill="#33291d"/><ellipse cx="927.0" cy="457.1" rx="20.3" ry="3.7" fill="#6b5b42" opacity=".38"/><ellipse cx="913.4" cy="457.1" rx="6.8" ry="1.8" fill="#4a3f2e" opacity=".55"/><ellipse cx="913.4" cy="423.3" rx="7.8" ry="33.9" fill="#29382c"/><rect x="912.0" y="452.1" width="2.8" height="6" fill="#33291d"/><ellipse cx="52.9" cy="452.3" rx="18.4" ry="3.4" fill="#6b5b42" opacity=".38"/><ellipse cx="65.1" cy="452.3" rx="6.1" ry="1.6" fill="#4a3f2e" opacity=".55"/><ellipse cx="65.1" cy="421.6" rx="7.1" ry="30.7" fill="#2d3d30"/><rect x="63.7" y="447.3" width="2.8" height="6" fill="#33291d"/><ellipse cx="907.1" cy="452.3" rx="18.4" ry="3.4" fill="#6b5b42" opacity=".38"/><ellipse cx="894.9" cy="452.3" rx="6.1" ry="1.6" fill="#4a3f2e" opacity=".55"/><ellipse cx="894.9" cy="421.6" rx="7.1" ry="30.7" fill="#2d3d30"/><rect x="893.5" y="447.3" width="2.8" height="6" fill="#33291d"/><ellipse cx="72.7" cy="447.4" rx="16.5" ry="3.0" fill="#6b5b42" opacity=".38"/><ellipse cx="83.7" cy="447.4" rx="5.5" ry="1.4" fill="#4a3f2e" opacity=".55"/><ellipse cx="83.7" cy="419.9" rx="6.3" ry="27.6" fill="#314234"/><rect x="82.3" y="442.4" width="2.8" height="6" fill="#33291d"/><ellipse cx="887.3" cy="447.4" rx="16.5" ry="3.0" fill="#6b5b42" opacity=".38"/><ellipse cx="876.3" cy="447.4" rx="5.5" ry="1.4" fill="#4a3f2e" opacity=".55"/><ellipse cx="876.3" cy="419.9" rx="6.3" ry="27.6" fill="#314234"/><rect x="874.9" y="442.4" width="2.8" height="6" fill="#33291d"/><ellipse cx="92.5" cy="442.6" rx="14.7" ry="2.7" fill="#6b5b42" opacity=".38"/><ellipse cx="102.3" cy="442.6" rx="4.9" ry="1.3" fill="#4a3f2e" opacity=".55"/><ellipse cx="102.3" cy="418.1" rx="5.6" ry="24.4" fill="#344739"/><rect x="100.9" y="437.6" width="2.8" height="6" fill="#33291d"/><ellipse cx="867.5" cy="442.6" rx="14.7" ry="2.7" fill="#6b5b42" opacity=".38"/><ellipse cx="857.7" cy="442.6" rx="4.9" ry="1.3" fill="#4a3f2e" opacity=".55"/><ellipse cx="857.7" cy="418.1" rx="5.6" ry="24.4" fill="#344739"/><rect x="856.3" y="437.6" width="2.8" height="6" fill="#33291d"/><ellipse cx="112.3" cy="437.7" rx="12.8" ry="2.3" fill="#6b5b42" opacity=".38"/><ellipse cx="120.9" cy="437.7" rx="4.3" ry="1.1" fill="#4a3f2e" opacity=".55"/><ellipse cx="120.9" cy="416.4" rx="4.9" ry="21.3" fill="#384c3d"/><rect x="119.5" y="432.7" width="2.8" height="6" fill="#33291d"/><ellipse cx="847.7" cy="437.7" rx="12.8" ry="2.3" fill="#6b5b42" opacity=".38"/><ellipse cx="839.1" cy="437.7" rx="4.3" ry="1.1" fill="#4a3f2e" opacity=".55"/><ellipse cx="839.1" cy="416.4" rx="4.9" ry="21.3" fill="#384c3d"/><rect x="837.7" y="432.7" width="2.8" height="6" fill="#33291d"/><ellipse cx="132.2" cy="432.9" rx="10.9" ry="2.0" fill="#6b5b42" opacity=".38"/><ellipse cx="139.4" cy="432.9" rx="3.6" ry="0.9" fill="#4a3f2e" opacity=".55"/><ellipse cx="139.4" cy="414.7" rx="4.2" ry="18.1" fill="#3c5141"/><rect x="138.0" y="427.9" width="2.8" height="6" fill="#33291d"/><ellipse cx="827.8" cy="432.9" rx="10.9" ry="2.0" fill="#6b5b42" opacity=".38"/><ellipse cx="820.6" cy="432.9" rx="3.6" ry="0.9" fill="#4a3f2e" opacity=".55"/><ellipse cx="820.6" cy="414.7" rx="4.2" ry="18.1" fill="#3c5141"/><rect x="819.2" y="427.9" width="2.8" height="6" fill="#33291d"/><ellipse cx="152.0" cy="428.0" rx="9.0" ry="1.6" fill="#6b5b42" opacity=".38"/><ellipse cx="158.0" cy="428.0" rx="3.0" ry="0.8" fill="#4a3f2e" opacity=".55"/><ellipse cx="158.0" cy="413.0" rx="3.5" ry="15.0" fill="#405646"/><rect x="156.6" y="423.0" width="2.8" height="6" fill="#33291d"/><ellipse cx="808.0" cy="428.0" rx="9.0" ry="1.6" fill="#6b5b42" opacity=".38"/><ellipse cx="802.0" cy="428.0" rx="3.0" ry="0.8" fill="#4a3f2e" opacity=".55"/><ellipse cx="802.0" cy="413.0" rx="3.5" ry="15.0" fill="#405646"/><rect x="800.6" y="423.0" width="2.8" height="6" fill="#33291d"/>

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
      <ellipse cx={x} cy="432" rx="26" ry="18" fill="url(#s-porte)" opacity=".55"/>
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
    <rect x="204" y="292" width="30" height="8" fill="#efdfbc" stroke="#a68d66" strokeWidth="1"/><rect x="207" y="300" width="24" height="86" fill="url(#s-fut)"/><rect x="203" y="386" width="32" height="10" fill="#e8d6b0" stroke="#a68d66" strokeWidth="1"/><rect x="246" y="292" width="30" height="8" fill="#efdfbc" stroke="#a68d66" strokeWidth="1"/><rect x="249" y="300" width="24" height="86" fill="url(#s-fut)"/><rect x="245" y="386" width="32" height="10" fill="#e8d6b0" stroke="#a68d66" strokeWidth="1"/><rect x="288" y="292" width="30" height="8" fill="#efdfbc" stroke="#a68d66" strokeWidth="1"/><rect x="291" y="300" width="24" height="86" fill="url(#s-fut)"/><rect x="287" y="386" width="32" height="10" fill="#e8d6b0" stroke="#a68d66" strokeWidth="1"/><rect x="330" y="292" width="30" height="8" fill="#efdfbc" stroke="#a68d66" strokeWidth="1"/><rect x="333" y="300" width="24" height="86" fill="url(#s-fut)"/><rect x="329" y="386" width="32" height="10" fill="#e8d6b0" stroke="#a68d66" strokeWidth="1"/><rect x="372" y="292" width="30" height="8" fill="#efdfbc" stroke="#a68d66" strokeWidth="1"/><rect x="375" y="300" width="24" height="86" fill="url(#s-fut)"/><rect x="371" y="386" width="32" height="10" fill="#e8d6b0" stroke="#a68d66" strokeWidth="1"/><rect x="582" y="292" width="30" height="8" fill="#efdfbc" stroke="#a68d66" strokeWidth="1"/><rect x="585" y="300" width="24" height="86" fill="url(#s-fut)"/><rect x="581" y="386" width="32" height="10" fill="#e8d6b0" stroke="#a68d66" strokeWidth="1"/><rect x="624" y="292" width="30" height="8" fill="#efdfbc" stroke="#a68d66" strokeWidth="1"/><rect x="627" y="300" width="24" height="86" fill="url(#s-fut)"/><rect x="623" y="386" width="32" height="10" fill="#e8d6b0" stroke="#a68d66" strokeWidth="1"/><rect x="666" y="292" width="30" height="8" fill="#efdfbc" stroke="#a68d66" strokeWidth="1"/><rect x="669" y="300" width="24" height="86" fill="url(#s-fut)"/><rect x="665" y="386" width="32" height="10" fill="#e8d6b0" stroke="#a68d66" strokeWidth="1"/><rect x="708" y="292" width="30" height="8" fill="#efdfbc" stroke="#a68d66" strokeWidth="1"/><rect x="711" y="300" width="24" height="86" fill="url(#s-fut)"/><rect x="707" y="386" width="32" height="10" fill="#e8d6b0" stroke="#a68d66" strokeWidth="1"/><rect x="750" y="292" width="30" height="8" fill="#efdfbc" stroke="#a68d66" strokeWidth="1"/><rect x="753" y="300" width="24" height="86" fill="url(#s-fut)"/><rect x="749" y="386" width="32" height="10" fill="#e8d6b0" stroke="#a68d66" strokeWidth="1"/>
    <rect x="428.0" y="296" width="104" height="100" fill="#1a1209"/>
    <rect x="0" y="378" width="152" height="46" fill="#b9a078"/>
    <rect x="808" y="378" width="152" height="46" fill="#8f7a56"/>
  </g>
  <rect y="512" width="960" height="108" fill="url(#s-bassin)"/>
  <g stroke="#f0dcb4" strokeWidth="1.2" opacity=".22" fill="none">
    <path d="M60 540h840M120 562h720M180 584h600M240 604h480"/>
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
      d="M428 400 L428 316 A52 46 0 0 1 532 316 L532 400 Z"
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
    <ellipse className="porte__lueur" cx="480.0" cy="372" rx="46" ry="40" fill="url(#s-porte)"/>
  </g>

      </svg>
    </div>
  )
}

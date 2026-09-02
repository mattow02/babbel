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

  {/* L ombre du monument sur la terrasse : c est elle qui le pose */}
  <ellipse cx="480.0" cy="486" rx="392" ry="26" fill="#6b5b42" opacity=".36"/>
  <ellipse cx="480.0" cy="480" rx="300" ry="16" fill="#584b38" opacity=".4"/>

  {/* Le stylobate : on en voit le dessus, donc les colonnes posent dessus */}
  <polygon points="180.0,396 780.0,396 798.0,408 162.0,408" fill="#f0e0bd"/>
  <rect x="162.0" y="408" width="636" height="16" fill="#cdb894" stroke="#a68d66" strokeWidth="1"/>
  <rect x="354" y="424" width="252" height="9" fill="#e6d3ac" stroke="#b39a70" strokeWidth="1"/><rect x="334" y="432" width="292" height="9" fill="#dcc79c" stroke="#b39a70" strokeWidth="1"/><rect x="314" y="440" width="332" height="9" fill="#e6d3ac" stroke="#b39a70" strokeWidth="1"/><rect x="294" y="448" width="372" height="9" fill="#dcc79c" stroke="#b39a70" strokeWidth="1"/><rect x="274" y="456" width="412" height="9" fill="#e6d3ac" stroke="#b39a70" strokeWidth="1"/><rect x="254" y="464" width="452" height="9" fill="#dcc79c" stroke="#b39a70" strokeWidth="1"/><rect x="234" y="472" width="492" height="9" fill="#e6d3ac" stroke="#b39a70" strokeWidth="1"/>

  {/* Les cypres */}
  <ellipse cx="13.2" cy="462.0" rx="22.2" ry="4.1" fill="#6b5b42" opacity=".38"/><ellipse cx="28.0" cy="462.0" rx="7.4" ry="1.9" fill="#4a3f2e" opacity=".55"/><ellipse cx="28.0" cy="425.0" rx="8.5" ry="37.0" fill="#263428"/><rect x="26.6" y="457.0" width="2.8" height="6" fill="#33291d"/><ellipse cx="946.8" cy="462.0" rx="22.2" ry="4.1" fill="#6b5b42" opacity=".38"/><ellipse cx="932.0" cy="462.0" rx="7.4" ry="1.9" fill="#4a3f2e" opacity=".55"/><ellipse cx="932.0" cy="425.0" rx="8.5" ry="37.0" fill="#263428"/><rect x="930.6" y="457.0" width="2.8" height="6" fill="#33291d"/><ellipse cx="33.0" cy="457.1" rx="20.3" ry="3.7" fill="#6b5b42" opacity=".38"/><ellipse cx="46.6" cy="457.1" rx="6.8" ry="1.8" fill="#4a3f2e" opacity=".55"/><ellipse cx="46.6" cy="423.3" rx="7.8" ry="33.9" fill="#29382c"/><rect x="45.2" y="452.1" width="2.8" height="6" fill="#33291d"/><ellipse cx="927.0" cy="457.1" rx="20.3" ry="3.7" fill="#6b5b42" opacity=".38"/><ellipse cx="913.4" cy="457.1" rx="6.8" ry="1.8" fill="#4a3f2e" opacity=".55"/><ellipse cx="913.4" cy="423.3" rx="7.8" ry="33.9" fill="#29382c"/><rect x="912.0" y="452.1" width="2.8" height="6" fill="#33291d"/><ellipse cx="52.9" cy="452.3" rx="18.4" ry="3.4" fill="#6b5b42" opacity=".38"/><ellipse cx="65.1" cy="452.3" rx="6.1" ry="1.6" fill="#4a3f2e" opacity=".55"/><ellipse cx="65.1" cy="421.6" rx="7.1" ry="30.7" fill="#2d3d30"/><rect x="63.7" y="447.3" width="2.8" height="6" fill="#33291d"/><ellipse cx="907.1" cy="452.3" rx="18.4" ry="3.4" fill="#6b5b42" opacity=".38"/><ellipse cx="894.9" cy="452.3" rx="6.1" ry="1.6" fill="#4a3f2e" opacity=".55"/><ellipse cx="894.9" cy="421.6" rx="7.1" ry="30.7" fill="#2d3d30"/><rect x="893.5" y="447.3" width="2.8" height="6" fill="#33291d"/><ellipse cx="72.7" cy="447.4" rx="16.5" ry="3.0" fill="#6b5b42" opacity=".38"/><ellipse cx="83.7" cy="447.4" rx="5.5" ry="1.4" fill="#4a3f2e" opacity=".55"/><ellipse cx="83.7" cy="419.9" rx="6.3" ry="27.6" fill="#314234"/><rect x="82.3" y="442.4" width="2.8" height="6" fill="#33291d"/><ellipse cx="887.3" cy="447.4" rx="16.5" ry="3.0" fill="#6b5b42" opacity=".38"/><ellipse cx="876.3" cy="447.4" rx="5.5" ry="1.4" fill="#4a3f2e" opacity=".55"/><ellipse cx="876.3" cy="419.9" rx="6.3" ry="27.6" fill="#314234"/><rect x="874.9" y="442.4" width="2.8" height="6" fill="#33291d"/><ellipse cx="92.5" cy="442.6" rx="14.7" ry="2.7" fill="#6b5b42" opacity=".38"/><ellipse cx="102.3" cy="442.6" rx="4.9" ry="1.3" fill="#4a3f2e" opacity=".55"/><ellipse cx="102.3" cy="418.1" rx="5.6" ry="24.4" fill="#344739"/><rect x="100.9" y="437.6" width="2.8" height="6" fill="#33291d"/><ellipse cx="867.5" cy="442.6" rx="14.7" ry="2.7" fill="#6b5b42" opacity=".38"/><ellipse cx="857.7" cy="442.6" rx="4.9" ry="1.3" fill="#4a3f2e" opacity=".55"/><ellipse cx="857.7" cy="418.1" rx="5.6" ry="24.4" fill="#344739"/><rect x="856.3" y="437.6" width="2.8" height="6" fill="#33291d"/><ellipse cx="112.3" cy="437.7" rx="12.8" ry="2.3" fill="#6b5b42" opacity=".38"/><ellipse cx="120.9" cy="437.7" rx="4.3" ry="1.1" fill="#4a3f2e" opacity=".55"/><ellipse cx="120.9" cy="416.4" rx="4.9" ry="21.3" fill="#384c3d"/><rect x="119.5" y="432.7" width="2.8" height="6" fill="#33291d"/><ellipse cx="847.7" cy="437.7" rx="12.8" ry="2.3" fill="#6b5b42" opacity=".38"/><ellipse cx="839.1" cy="437.7" rx="4.3" ry="1.1" fill="#4a3f2e" opacity=".55"/><ellipse cx="839.1" cy="416.4" rx="4.9" ry="21.3" fill="#384c3d"/><rect x="837.7" y="432.7" width="2.8" height="6" fill="#33291d"/><ellipse cx="132.2" cy="432.9" rx="10.9" ry="2.0" fill="#6b5b42" opacity=".38"/><ellipse cx="139.4" cy="432.9" rx="3.6" ry="0.9" fill="#4a3f2e" opacity=".55"/><ellipse cx="139.4" cy="414.7" rx="4.2" ry="18.1" fill="#3c5141"/><rect x="138.0" y="427.9" width="2.8" height="6" fill="#33291d"/><ellipse cx="827.8" cy="432.9" rx="10.9" ry="2.0" fill="#6b5b42" opacity=".38"/><ellipse cx="820.6" cy="432.9" rx="3.6" ry="0.9" fill="#4a3f2e" opacity=".55"/><ellipse cx="820.6" cy="414.7" rx="4.2" ry="18.1" fill="#3c5141"/><rect x="819.2" y="427.9" width="2.8" height="6" fill="#33291d"/><ellipse cx="152.0" cy="428.0" rx="9.0" ry="1.6" fill="#6b5b42" opacity=".38"/><ellipse cx="158.0" cy="428.0" rx="3.0" ry="0.8" fill="#4a3f2e" opacity=".55"/><ellipse cx="158.0" cy="413.0" rx="3.5" ry="15.0" fill="#405646"/><rect x="156.6" y="423.0" width="2.8" height="6" fill="#33291d"/><ellipse cx="808.0" cy="428.0" rx="9.0" ry="1.6" fill="#6b5b42" opacity=".38"/><ellipse cx="802.0" cy="428.0" rx="3.0" ry="0.8" fill="#4a3f2e" opacity=".55"/><ellipse cx="802.0" cy="413.0" rx="3.5" ry="15.0" fill="#405646"/><rect x="800.6" y="423.0" width="2.8" height="6" fill="#33291d"/>

  {/* Une silhouette au pied des marches : l echelle ne se lit que par elle */}
  <g fill="#2b1f12" opacity=".9">
    <ellipse cx="576.0" cy="444" rx="4.5" ry="5.5"/>
    <path d="M571.5 450 h9 l2 30 h-4 l-1.5 -16 -1.5 16 h-4 z"/>
  </g>

  {/* Le bassin : c est lui qui double le monument */}
  <rect y="512" width="960" height="108" fill="#6d6250"/>
  <g opacity=".32" transform="translate(0,768.0) scale(1,-0.5)">
    <path d="M294.0 300 A186 168 0 0 1 666.0 300 Z" fill="#e0caa2"/>
    <rect x="188.0" y="276" width="584" height="18" fill="#f2e2bf"/>
    <rect x="204" y="292" width="30" height="8" fill="#efdfbc" stroke="#a68d66" strokeWidth="1"/><rect x="207" y="300" width="24" height="86" fill="url(#s-fut)"/><rect x="203" y="386" width="32" height="10" fill="#e8d6b0" stroke="#a68d66" strokeWidth="1"/><rect x="246" y="292" width="30" height="8" fill="#efdfbc" stroke="#a68d66" strokeWidth="1"/><rect x="249" y="300" width="24" height="86" fill="url(#s-fut)"/><rect x="245" y="386" width="32" height="10" fill="#e8d6b0" stroke="#a68d66" strokeWidth="1"/><rect x="288" y="292" width="30" height="8" fill="#efdfbc" stroke="#a68d66" strokeWidth="1"/><rect x="291" y="300" width="24" height="86" fill="url(#s-fut)"/><rect x="287" y="386" width="32" height="10" fill="#e8d6b0" stroke="#a68d66" strokeWidth="1"/><rect x="330" y="292" width="30" height="8" fill="#efdfbc" stroke="#a68d66" strokeWidth="1"/><rect x="333" y="300" width="24" height="86" fill="url(#s-fut)"/><rect x="329" y="386" width="32" height="10" fill="#e8d6b0" stroke="#a68d66" strokeWidth="1"/><rect x="372" y="292" width="30" height="8" fill="#efdfbc" stroke="#a68d66" strokeWidth="1"/><rect x="375" y="300" width="24" height="86" fill="url(#s-fut)"/><rect x="371" y="386" width="32" height="10" fill="#e8d6b0" stroke="#a68d66" strokeWidth="1"/><rect x="582" y="292" width="30" height="8" fill="#efdfbc" stroke="#a68d66" strokeWidth="1"/><rect x="585" y="300" width="24" height="86" fill="url(#s-fut)"/><rect x="581" y="386" width="32" height="10" fill="#e8d6b0" stroke="#a68d66" strokeWidth="1"/><rect x="624" y="292" width="30" height="8" fill="#efdfbc" stroke="#a68d66" strokeWidth="1"/><rect x="627" y="300" width="24" height="86" fill="url(#s-fut)"/><rect x="623" y="386" width="32" height="10" fill="#e8d6b0" stroke="#a68d66" strokeWidth="1"/><rect x="666" y="292" width="30" height="8" fill="#efdfbc" stroke="#a68d66" strokeWidth="1"/><rect x="669" y="300" width="24" height="86" fill="url(#s-fut)"/><rect x="665" y="386" width="32" height="10" fill="#e8d6b0" stroke="#a68d66" strokeWidth="1"/><rect x="708" y="292" width="30" height="8" fill="#efdfbc" stroke="#a68d66" strokeWidth="1"/><rect x="711" y="300" width="24" height="86" fill="url(#s-fut)"/><rect x="707" y="386" width="32" height="10" fill="#e8d6b0" stroke="#a68d66" strokeWidth="1"/><rect x="750" y="292" width="30" height="8" fill="#efdfbc" stroke="#a68d66" strokeWidth="1"/><rect x="753" y="300" width="24" height="86" fill="url(#s-fut)"/><rect x="749" y="386" width="32" height="10" fill="#e8d6b0" stroke="#a68d66" strokeWidth="1"/>
    <rect x="428.0" y="296" width="104" height="100" fill="#1a1209"/>
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

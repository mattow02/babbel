# Plan de reprise esthétique

> Écrit le 2026-09-02. Objectif : rapprocher le rendu 3D de la qualité des
> illustrations produites pour la fiche Babel de Cobaalt, sans rien lâcher sur
> le budget d'image ni sur les disciplines du projet.

## 1. La cible, et ce qui en transfère

Les trois illustrations de la fiche `cobaalt.app/realisations/bibliotheque-de-babel`
servent de référence. Ce sont des dessins vectoriels : leur **rendu** n'est pas
transposable tel quel en 3D temps réel, et ce n'est pas ce qu'on cherche. Ce qui
transfère est précis :

| Ce qui transfère | Ce qui ne transfère pas |
|---|---|
| La composition : axe central, symétrie frontale, point de fuite unique | Le trait vectoriel et les aplats |
| La structure des valeurs : un noir vrai, un cœur lumineux franc | Les dégradés peints à la main |
| La densité de détail : colonnade, cyprès, dos de livres distincts | Les ombres portées dessinées |
| Le miroir : bassin dehors, sol poli dedans | |

## 2. Le constat, mesuré

Mesures photométriques sur l'illustration et sur la capture 3D correspondante.
La luminance est relative (0 à 1), le contraste est le rapport
`(p95 + 0,05) / (p5 + 0,05)`, la variation locale est l'écart-type moyen de la
luminance sur des tuiles de 16 px : elle dit si une surface est plate.

| Vue | p95 (hautes lumières) | Contraste | Noirs | Variation locale |
|---|---|---|---|---|
| **Le Seuil**, illustration | 0,70 | 6,7:1 | 0 % | 0,069 |
| Le Seuil, rendu actuel | **0,37** | **4,5:1** | 0 % | **0,022** |
| **La galerie**, illustration | 0,14 | 3,7:1 | 65 % | 0,024 |
| La galerie, rendu actuel | 0,12 | 3,4:1 | 50 % | **0,013** |
| **Le livre**, illustration | 0,81 | 16,8:1 | 34 % | 0,072 |
| Le livre, rendu actuel | **0,12** | **3,4:1** | 50 % | **0,013** |

Trois conclusions, dont une qui contredit l'intuition de départ :

1. **Le Seuil manque de lumière haute et de détail.** Ses hautes lumières
   plafonnent à la moitié de la cible et ses surfaces sont trois fois plus
   plates. Il ne manque pas d'obscurité, il manque de relief.
2. **La galerie n'est pas trop sombre.** L'illustration l'est autant. Ce qui
   lui manque n'est pas la luminosité mais l'**articulation** : un halo autour
   de la lampe, des dos de livres qui se distinguent les uns des autres, un sol
   qui réfléchit. La variation locale est deux fois trop basse.
3. **Le livre est le plus gros écart, et c'est le sujet du projet.**
   L'illustration montre une page éclairée dans le noir, contraste 16,8:1. Le
   lecteur actuel montre du texte sombre sur fond sombre. C'est là qu'il faut
   commencer.

Ces mesures sont reproductibles : voir la phase 0.

## 3. Les règles de travail

Elles ne sont pas négociables, et elles priment sur le résultat visuel.

1. **Rien sans mesure.** Aucune modification n'est retenue sans un avant/après
   sur les mêmes images de référence. « C'est mieux » n'est pas un critère.
2. **Un changement à la fois.** Deux changements groupés rendent l'effet
   inattribuable, et le mauvais des deux survit.
3. **Le budget d'image est une barrière, pas un objectif.** 16,6 ms. Une phase
   qui dépasse est annulée, pas « optimisée plus tard ». Le dernier relevé
   connu est de 5,69 ms et 53 appels de rendu dans la bibliothèque : la marge
   existe, elle se dépense une fois.
4. **Toute maths de placement est un module pur, testé, sans three.js**
   (CLAUDE.md). C'est la seule façon de vérifier une géométrie sans GPU.
5. **Chaque choix structurant devient une décision** dans `DECISIONS.md`, à
   partir de D60.
6. **Le mode dégradé (D41) reste vert.** Tout nouvel effet passe derrière
   l'interrupteur de qualité existant.
7. `npm run check` vert à chaque étape.

## 4. Les phases

### Phase 0 : l'atelier de mesure

Rien de visible. On se donne les moyens de prouver une amélioration.

- `npm run captures` : un script qui ouvre le build de production dans un
  navigateur, se place à **six points de vue fixes** (parvis, portail, nef,
  galerie, zaguán, livre ouvert), attend la stabilisation, et écrit six PNG
  déterministes plus un `mesures.json` (appels de rendu, ms/image, triangles).
- `src/mesure/photometrie.ts` : un module **pur**, sans navigateur, qui calcule
  sur un tampon de pixels les grandeurs du § 2. Testé comme le reste du cœur.
- Les valeurs du § 2 sont rejouées et consignées comme référence de départ.

**Sortie (GO) :** les six captures sont reproductibles à l'identique deux fois
de suite, le module de mesure est testé, la référence est écrite.
**NO-GO :** si les captures ne sont pas déterministes, on ne va pas plus loin :
sans elles, tout le reste est une question de goût.

### Phase 1 : le livre

Le plus grand écart, et le sujet même du projet.

- La page devient **une feuille éclairée dans le noir** : matériau clair, une
  source rasante, le reste de la scène éteint.
- Le texte gagne le contraste d'une encre sur papier, pas d'un gris sur gris.
- La tranche, la reliure et la courbure des pages donnent le volume que
  l'illustration obtient par le dessin.

**Sortie :** sur la capture « livre », p95 ≥ 0,60, contraste ≥ 10:1, noirs entre
25 % et 50 %, variation locale ≥ 0,05. Le texte reste lisible au caractère près
(le test de bijection ne bouge pas). Budget : +0 appel de rendu.

### Phase 2 : la galerie

- **La lampe devient une source** : cœur émissif, halo en volume (D38 existe
  déjà), décroissance en carré inverse. Le halo est ce qui manque le plus.
- **Les dos de livres se distinguent** : teinte et valeur variées par instance,
  tirées du hachage existant (D32, jamais une multiplication affine), avec un
  liseré clair qui accroche la lampe.
- **Le sol réfléchit**, comme le hall le fait déjà (`Marble.tsx` est réutilisable).

**Sortie :** variation locale ≥ 0,024 (le niveau de l'illustration), halo
visible sur la mesure (présence de pixels entre 0,3 et 0,8 autour de la source),
budget d'image sous 8 ms, appels de rendu sous 60.

### Phase 3 : le Seuil

- **La colonnade et les marches** : ce qui donne l'échelle et le détail. Tout
  en boîte unitaire instanciée (D25), sinon le compte d'appels explose.
- **Le bassin réfléchissant** qui double le dôme. C'est l'élément le plus fort
  de l'illustration, et le moins cher : un plan miroir.
- **La perspective atmosphérique** : brume teintée du ciel, pour que les
  montagnes s'effacent au lieu d'être découpées.
- **Le soleil visible** et son halo.

**Sortie :** p95 ≥ 0,65, contraste ≥ 6:1, variation locale ≥ 0,05, appels de
rendu sous 60, budget sous 10 ms.

### Phase 4 : le post-traitement

En dernier, et seulement en dernier : régler le vignettage, le bloom, le grain
et l'aberration sur des images qui ont déjà la bonne structure de valeurs. Les
régler avant reviendrait à corriger au maquillage un défaut d'éclairage.

**Sortie :** budget sous 12 ms effets compris, aucune régression sur les
critères des phases 1 à 3, relevé consigné.

## 5. Les risques

| Risque | Parade |
|---|---|
| Le miroir et le halo sont les deux effets qui peuvent ruiner le budget | Mesurés isolément dès leur ajout, annulés s'ils dépassent |
| Assombrir la galerie peut la rendre impraticable | Critère de jouabilité : le bord du sol reste visible à 3 m, vérifié sur capture |
| Ajouter de la géométrie au Seuil fait monter les appels de rendu | Instanciation obligatoire, compte vérifié à chaque ajout |
| Le rendu peut devenir joli sur les six captures et laid ailleurs | Les six points de vue couvrent les trois ambiances et deux distances |

## 6. La question ouverte

Deux lectures de « ce style d'esthétique », et elles mènent à deux projets
différents :

- **A. Transposer la composition et la lumière** en gardant un rendu réaliste.
  C'est ce que ce plan décrit. Risque faible, gain sûr.
- **B. Adopter le rendu lui-même**, c'est-à-dire un rendu à aplats, contours
  marqués, ombres en bandes. C'est un choix radical et cohérent avec le
  vectoriel, mais c'est un autre projet : il faut écrire ses propres shaders et
  refaire tous les matériaux.

Ce plan retient **A** par défaut. B reste possible et se déciderait avant la
phase 1, pas après.

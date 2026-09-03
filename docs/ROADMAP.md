# Roadmap : Babbel

État : **le site a quitté la 3D.** Les scènes sont dessinées (`src/vue2d/`), le hall a été retiré, et il ne reste que le Seuil et les salles des livres. **194 tests.** L'audit du 31 août 2026 a été supprimé : il mesurait l'architecture three.js, qui n'existe plus. Les décisions, elles, sont toutes dans [`docs/DECISIONS.md`](DECISIONS.md).
Mise à jour : 2026-08-29

Règle : une phase n'est close que si ses critères de sortie sont vérifiés.
On ne passe pas à la suivante « à peu près ».

---

## Phase 0 : Cadrage ✅ (recherche) / ⏳ (décisions)
- [x] Spécifications canoniques de Borges établies et sourcées
- [x] Compréhension de l'algorithme de libraryofbabel.info
- [x] Limites physiques et techniques identifiées
- [x] Architecture proposée
- [x] Arbitrages : alphabet 25 (Borges), Vite+React+TS, 1re personne sans ZQSD,
      séquence d'arrivée par le Seuil (D9 à D12)
- [x] Schéma de contrôle, recherche inverse, mobile tranchés (D13 à D15)
- [x] Direction artistique établie d'après la vidéo de référence (D16 ; le document a ete repris dans CLAUDE.md)
- [x] **Phase 0 close. Plus aucune question ouverte.**

## Phase 1 : Le cœur mathématique ✅ (2026-08-29)
Pur TypeScript, aucun rendu. C'est la fondation.
- [x] `core/layout.ts` : constantes Borges
- [x] `core/alphabet.ts` : 25 symboles, encode/decode
- [x] `core/address.ts` : Address <-> emplacement <-> URL
- [x] `core/bijection.ts` : permutation inversible par **cycle walking**
- [x] `core/page.ts` : address -> 3 200 caractères, et `locate` en sens inverse
- [x] `core/index.ts` : API publique
- [x] 48 tests Vitest, verts
- [x] Socle Vite + TypeScript strict, `npm run check` vert

**Sortie atteinte.** `inverse(forward(x)) === x` sur 2 000 tirages, plus les
bornes du domaine et l'injectivité sur 1 000 valeurs. Une adresse donne toujours
la même page ; `locate(texte)` retrouve son adresse, vérifié bout en bout.

**Mesures :**
| | |
|---|---|
| Domaine | 25^3200, soit 4 474 chiffres décimaux |
| Largeur de travail | 14 861 bits (~1,8 ko par entier) |
| Cycle walking | 1,58 tour en moyenne |
| Génération d'une page | ~0,6 ms |
| Galeries | un nombre à 4 468 chiffres |
| Bundle du cœur | **4,3 ko, 2,0 ko gzip** |

**Écart au plan :** la Phase 1 devait utiliser un LCG inversible façon
libraryofbabel.info. Le cycle walking (Black & Rogaway) s'est révélé plus propre
- voir la décision D17.

## Phase 2 : Génération asynchrone ✅ (2026-08-29)
- [x] `workers/page.worker.ts`, sans état, une seule responsabilité
- [x] `workers/engine.ts` : worker réel, moteur direct de repli, moteur injectable
- [x] `workers/cache.ts` : LRU en 60 lignes, sur la seule propriété d'ordre de `Map`
- [x] `workers/client.ts`, `PageLibrary` : `peek` / `read` / `prefetch`, déduplication
- [x] `workers/neighbourhood.ts`, quelles pages précharger, et dans quel ordre
- [x] 26 tests supplémentaires (74 au total)

**Sortie atteinte, et vérifiée dans un vrai navigateur** (Chromium, build de
production servi par `vite preview`) :

| | |
|---|---|
| 100 tournages de page, temps bloquant sur le thread principal | **2,80 ms au total** |
| Budget d'UNE image à 60 fps | 16,60 ms |
| Taux de succès du cache en lecture suivie | 99 sur 100 |
| Première page (démarrage du worker compris) | 60,5 ms |
| Worker émis comme chunk séparé | 2,30 ko |

Les 100 tournages réunis consomment 17 % du budget d'une seule image : aucune
frame ne peut être perdue.

**À retenir pour la phase 3 :** la toute première page coûte 60 ms, entièrement
dus au démarrage du worker (chargement et compilation du module). Il faudra le
réveiller pendant l'écran d'entrée, pas au moment où le visiteur ouvre un livre.

**Deux points de conception qui ont émergé :**
- `peek()` (lecture synchrone du cache) est la méthode centrale : une boucle de
  rendu ne peut pas `await`. Le cache n'est pas une optimisation, c'est ce qui
  rend l'affichage possible sans bloquer.
- La clé de cache est le numéro d'emplacement **en BigInt**, jamais sa forme
  textuelle : convertir un entier de 14 861 bits en base 36 coûte 0,14 ms, soit
  près de 1 % d'une image, à chaque consultation. `Map` compare les BigInt par
  valeur, donc la clé brute est 300 fois plus rapide.

## Phase 3 : Lecture, sans 3D ✅ (2026-08-29)
- [x] Affichage 410 pages / 40 lignes / 80 colonnes, taille de police **calculée**
      pour tenir en largeur et en hauteur (D22)
- [x] Navigation clavier : ←/→ une page, Maj ou Pg↑/Pg↓ dix pages, ↑/↓ volume
      voisin, Début/Fin bords du volume : bornée, testée
- [x] Barre d'adresse (galerie tronquée, mur, étagère, volume, page) + copie
- [x] URL dans le **fragment** (D20), synchronisée dans les deux sens
- [x] Direction artistique appliquée : noir chaud, calcaire, or, vignettage
- [x] 16 tests supplémentaires (90 au total)

**Sortie atteinte, vérifiée dans Chromium sur le build de production :**
- navigation clavier complète, bornes respectées (page 410 ne déborde pas) ;
- une adresse profonde de **2 901 caractères** partagée puis ouverte **à froid**
  redonne un texte **identique au caractère près** ;
- le format tient partout : 40 lignes × 80 colonnes.

Capture : `docs/captures/phase3-lecteur.png`.

**Deux points de conception :**
- `usePageText` lit le cache **pendant le rendu** (`peek`) au lieu de le recopier
  dans un état : une page déjà générée s'affiche sans clignotement et sans le
  rendu en cascade qu'imposerait un `setState` dans un effet.
- Le worker est réveillé au montage, pas à l'ouverture du livre : les 60 ms de
  démarrage relevées en phase 2 sont payées pendant que le visiteur regarde
  l'écran d'entrée.

## Phase 4 : La galerie 3D ✅ (2026-08-29)
- [x] Géométrie de l'hexagone : 6 murs, dont 4 portent 5 étagères de 32 volumes
      et 2 sont percés d'un couloir : **placement en mathématiques pures**,
      testable sans GPU (`scene/hexagon/layout3d.ts`, `parts.ts`)
- [x] 640 volumes (1 920 sur trois galeries) en **un seul appel de rendu**,
      couleur et hauteur de tranche par instance, dérivées de l'indice
- [x] Éclairage : la lampe sphérique de Borges, une par galerie, ombres portées
      seulement sur celle du visiteur
- [x] Couloirs opposés : la perspective file de galerie en galerie
- [x] Sonde de performance maison + zustand pour l'état hors React
- [x] 15 tests supplémentaires (105 au total)

**Sortie atteinte, mesurée dans Chromium sur GPU réel** (Intel Iris Xe) :

| | Mesuré | Budget |
|---|---|---|
| Appels de rendu | **27** | < 100 |
| Coût d'une image | **0,37 ms** | 16,6 ms |
| Triangles | 173 500 | : |
| Volumes affichés | 1 920 | : |

**Écart au plan assumé :** le « puits central + balustrade + escalier » de la
roadmap initiale n'est pas fidèle au texte : chez Borges l'escalier en colimaçon
est dans le *couloir*, pas au centre de la salle. Reporté en phase 5 avec la
navigation verticale, plutôt que d'inventer une géométrie que la nouvelle ne
décrit pas.

**Reste pour la phase 6 (esthétique) :** l'éclairage est encore plat, sans
clair-obscur marqué ; pas de bloom sur la lampe, pas de grain, pas de
vignettage. C'est exactement le contenu de la phase 6, et c'est là que les
lightmaps du Seuil (D16) entreront en jeu.

Capture : `docs/captures/phase4-galerie.png`.

## Phase 5 : Navigation et streaming ✅ (2026-08-30)
- [x] Déplacement à la première personne : souris aux bords pour le regard,
      clic maintenu pour avancer, ZQSD en secours (D28)
- [x] Collisions et couloirs, en **maths pures** (`navigation/geometry.ts`)
- [x] **Origine flottante** (D30) : indispensable, aucun système de coordonnées
      ne couvre 10^4468 galeries
- [x] ~~ChunkManager, pool d'objets~~ → **inutiles** (D29), voir ci-dessous
- [x] Transition marche → désigner un volume → travelling → lecture
      (`hexagon/approach.ts`, testé)
- [x] Escalier en colimaçon dans le couloir (D31)
- [x] 39 tests supplémentaires (144 au total)

**Sortie atteinte, mesurée dans Chromium :**

| | Mesuré |
|---|---|
| Marche continue | **~25 000 images**, tas de 8 à 18 Mo, **sans dérive** |
| Après 5 640 images de marche | tas **18,5 → 14,0 Mo**, stable au repos |
| Franchissements de galeries | 0 → 1 → 3, l'écart latéral reste nul |
| Coordonnées après 100 000 galeries (test unitaire) | aucune dérive |

**La découverte de la phase :** il n'y a **rien à streamer**. Toutes les galeries
sont géométriquement identiques et le visiteur est toujours ramené au centre de
la sienne, donc l'ensemble des galeries visibles ne change jamais. Les maillages
instanciés sont construits une fois au montage et ne bougent plus. Il n'y a donc
aucune allocation en cours de marche, pas de fuite possible, non parce qu'on la
prévient mais parce qu'il n'y a rien à allouer. Seules les couleurs des tranches
suivent le numéro de galerie, pour qu'on sente qu'on avance.

**Non vérifié de bout en bout :** l'ouverture d'un volume au clic. Le calcul
(indice d'instance → adresse → point d'approche) est couvert par 13 tests, mais
le clic lui-même n'a pas pu être déclenché dans le navigateur piloté : R3F
ignore les événements de pointeur synthétiques, et le clic réel de Playwright
attend une stabilité d'image impossible avec `requestAnimationFrame` bridé.
**À vérifier à la main en premier.**

Captures : `docs/captures/phase5-marche.png`.

## Phase 5bis : Le Seuil ✅ (2026-08-30)
Scène authorée, hors contrainte procédurale. Voir ARCHITECTURE § 9.
- [x] Extérieur : dôme dans son bassin, deux terrasses plantées de cyprès,
      montagnes en silhouette, ciel en dégradé teal → brume dorée (shader)
- [x] Marches et montée vers l'entrée unique
- [x] Franchissement du portail, traité en **coupe** et non en fondu
- [x] Grand hall : coupole à caissons, colonnade, **cube d'or en lévitation**
- [x] Enchaînement Seuil → Bibliothèque, automatique en fin de séquence
- [x] Bouton « entrer directement » pour passer la séquence
- [x] 27 tests supplémentaires (171 au total)

**Mesures :** 20 à 22 appels de rendu à l'extérieur, 6 dans le hall, contre un
budget de 100. La séquence dure **29,5 s**, sous les 30 s du critère.

Captures : `docs/captures/phase5bis-seuil.png` et `phase5bis-hall.png`.

**Deux défauts visuels réels attrapés par les tests et corrigés :**
- un hachage purement multiplicatif est **affine**, donc les écarts entre
  indices consécutifs se répètent : les cyprès *et* les couleurs de tranches
  suivaient un motif périodique. Corrigé par un vrai finalisateur
  (`scene/hash.ts`, D32) ;
- les caissons de la coupole saillaient comme des plots faute d'inclinaison :
  une boîte instanciée ne pouvait pivoter qu'autour de la verticale (D33).

**Reste pour la phase 6 :** l'éclairage du hall est encore brun et plat, pas
de faisceau visible sous l'oculus, pas de bloom sur le cube, marbre trop chaud.
Les montagnes gardent une silhouette trop conique. C'est exactement le contenu
de la phase suivante.

**Note d'exploitation :** l'éclairage précalculé du Seuil (D16) n'est pas fait.
L'extérieur n'en a pas besoin : il n'a qu'une source, le soleil. C'est
l'intérieur du hall qui le réclame, et cela suppose une chaîne de cuisson hors
ligne : c'est une optimisation de phase 6/7, pas un prérequis.

## Phase 6 : Esthétique ✅ (2026-08-30)
- [x] Direction artistique arrêtée (reprise dans CLAUDE.md)
- [x] **Post-traitement** réglé par ambiance (extérieur / hall / bibliothèque) :
      vignettage, bloom, grain, aberration chromatique, saturation, contraste
- [x] **Faisceaux de lumière et halos** en volume, par shader additif
- [x] **Poussière en suspension**, animée entièrement dans le shader : aucune
      écriture de tampon par image, coût processeur nul
- [x] **Son d'ambiance procédural** : bourdon de quatre voix non harmoniques +
      bruit brun filtré, synthétisé dans le navigateur. **Aucun fichier audio.**
- [x] **Écran d'entrée** : titre, le décompte réel des pages, et le geste qui
      autorise le son et réveille le worker
- [ ] Lightmaps bakées du hall : reporté, voir ci-dessous
- [ ] Marbre veiné et sol réfléchissant : reportés en phase 7

**Sortie atteinte.** Captures : `phase6-seuil.png`, `phase6-bibliotheque.png`.

| Mesuré (Chromium, 2880×1575) | |
|---|---|
| Appels de rendu, extérieur | **39** (22 de scène + 17 de post-traitement) |
| Appels de rendu, bibliothèque | **53** |
| Coût d'une image, effets compris | **5,69 ms** (budget 16,6) |
| Tests | 181 |

**Deux défauts de conception attrapés par les tests :**
- le bourdon était **un accord** : 77,3/38,5 tombait sur une octave exacte. Un
  test vérifie qu'aucune voix n'est un harmonique d'une autre : on veut une
  rumeur de pierre, pas de la musique. Fréquences reprises ;
- le relevé de performance affichait « 1 appel » : avec un composeur, `gl.info`
  est remis à zéro **à chaque passe**. Corrigé en désactivant la remise à zéro
  automatique et en totalisant par image (D35).

**Reste, honnêtement :** l'éclairage précalculé du hall (D16) demande une chaîne
de cuisson hors ligne et n'est pas fait ; le marbre veiné et le sol réfléchissant
non plus. Les montagnes gardent une silhouette un peu conique.

## Phase 7 : Finition ✅ (2026-08-30)
- [x] **Recherche par texte** : la contrepartie de la bijection, promise en
      phase 1 (D14). Le calcul passe par le worker (D39)
- [x] **Transcription dans l'alphabet de Borges** (D40) : « Kafka » → « cafca »,
      « bibliothèque » → « bibliotheque », accents retirés, j/k/w/x transcrits
- [x] **Mode dégradé** décidé par une fonction pure et testée (`scene/quality.ts`)
- [x] `prefers-reduced-motion` respecté : la séquence d'arrivée ne s'impose plus
- [x] Déploiement statique documenté, `vercel.json`, métadonnées de partage
- [x] 26 tests supplémentaires (207 au total)

**Vérifié dans Chromium, de bout en bout :** on tape « Kafka a écrit dans la
bibliothèque », le site l'écrit « cafca a ecrit dans la bibliotheque » en
expliquant pourquoi, puis **calcule** son adresse : galerie `70ze8o0zbtso…`,
mur 3, étagère 1, volume 29, page 241, et ouvre la page. La phrase est sur la
première ligne, le reste est blanc, le format reste 40 × 80, l'URL de 2 902
caractères est partageable.

**Déploiement :** aucune réécriture de route n'est nécessaire, puisque l'adresse
vit dans le fragment (D20). `npm run build` puis servir `dist/`, n'importe où.


---

## Phase 8 : Après la roadmap ✅ (2026-08-30)

Deux chantiers de la liste « ce qui n'est pas fait » ont été repris.

### L'interaction ne passe plus par le moteur de rendu (D42)
Le rayon est désormais lancé **à la main**, depuis le centre exact de l'écran,
au lieu de dépendre du système d'événements de R3F. Trois gains :

- le réticule **est** le viseur (D28) : on désigne ce qu'on regarde, pas ce que
  survole un curseur ;
- la touche <kbd>E</kbd> et le clic bref deviennent le même geste ;
- cela ne dépend plus d'aucune plomberie d'événements, **et devient donc
  vérifiable de l'extérieur.**

**Le trou de vérification ouvert depuis la phase 5 est comblé.** Mesuré dans
Chromium : le visiteur marche jusqu'à une étagère, vise, appuie sur <kbd>E</kbd>,
la caméra fait son travelling et la page s'ouvre : `#/0/3/3/30/1`, mur 4,
étagère 4, volume 31, 40 lignes × 80 colonnes.

### La bibliothèque a des étages (D43)
Elle n'est plus une ligne de galeries : c'est un volume. Sans ajouter la
moindre coordonnée : **le même entier est lu dans deux dimensions** :

```
galerie = étage × 25^800 + colonne
```

Monter d'un étage ajoute une foulée, avancer dans un couloir ajoute un. Un
étage est donc long d'autant de galeries qu'il y a de façons de remplir huit
cents signes, soit environ 10^1118. L'escalier en colimaçon, décoratif depuis
la phase 5, sert enfin.

Mesuré dans Chromium : étages **0 → 1 → 2 → 0**, la colonne ne bouge pas, on
monte bien à la verticale.

**216 tests.** Zéro avertissement de lint.

---

## Phase 9 : Les chantiers restants, et l'audit ✅ (2026-08-31)

Toute la liste « ce qui n'est pas fait » a été reprise.

### Le zaguán : la bibliothèque a enfin le vertige (D44)
L'escalier ne pouvait pas tenir dans un couloir sans le boucher : les cotes le
disaient. La bonne réponse était celle de Borges lui-même : le **zaguán**, un
vestibule carré entre deux galeries, percé en son centre d'une **trémie**. On
marche sur un anneau autour du puits, et l'on voit l'escalier s'abîmer et
s'élever au-delà de ce que la lampe éclaire.

### Matériaux (D45)
Marbre veiné **calculé** : aucune texture, greffé sur le matériau standard pour
conserver éclairage, ombres et brouillard. Sol du hall réellement réfléchissant.
Éclairage d'environnement rendu **une fois** au démarrage : l'équivalent le plus
proche de lightmaps disponible dans un navigateur.

### Reste
Faisceau volumétrique corrigé (il se voit de biais, pas de face), massifs à
silhouette brisée, lisibilité mobile, secours sans WebGL, worker résilient.

**227 tests**, zéro avertissement.

### Audit
Voir `docs/AUDIT.md`, depuis supprimé. Sept défauts corrigés pendant l'audit,
dont une **régression de performance qui faisait passer la bibliothèque
au-dessus du budget d'image**, invisible au compte des appels de rendu. Quatre
constats P1 et cinq P2 restent ouverts, avec un ordre de traitement recommandé.

---

## Phase 10 : Correction de l'audit ✅ (2026-08-31)

**Tous les constats P1 et P2 de l'audit sont corrigés**, chacun vérifié.

- **Découpage de code** : 347 → **69 Ko gzippés** pour lire une page. Un lien
  partagé ouvre désormais la page sans jamais télécharger la 3D.
- **Intégration continue** : types, lint, 256 tests et build à chaque poussée.
- **Accessibilité** : la modale tient le focus qu'elle annonce ; le lecteur ne
  fait plus énoncer 3 200 caractères au hasard mais un résumé.
- **`useSyncExternalStore`** pour lire le cache, et comparaison des adresses
  **par valeur** : un défaut trouvé en écrivant le test.
- **Sonde de mesure** derrière `?sonde`, **licence** MIT, conversions `as
  unknown as` ramenées de 8 à 2.
- **React est testé** : jsdom et Testing Library, 29 tests de composants.

**256 tests**, zéro avertissement. Détail dans `docs/AUDIT.md`, depuis supprimé.

---

## Phase 11 : Le lieu, sur retours (2026-08-31)

Cinq reproches, cinq chantiers. Le fil commun : **le site se regardait au lieu
de se visiter.**

- **L'arrivée s'arrête devant l'entrée.** Le film ne traverse plus le portail
  ni les murs : il s'interrompt à quelques pas du seuil, à hauteur d'homme, et
  rend la main. Un test vérifie que la caméra ne passe **jamais** derrière le
  plan du portail. Le parvis, lui, se marche.
- **Le hall est une nef.** Allée centrale, deux files de piliers, bas-côtés,
  deux escaliers latéraux vers les tribunes, cube d'or au bout de l'axe.
  On y entre à pied, on en sort en s'approchant du cube.
- **Le marcheur connaît plusieurs mondes.** `usePlayer` reçoit collisions,
  sols et origine flottante ; la bibliothèque n'est qu'un monde parmi d'autres.
  Deux sols peuvent se superposer (bas-côté sous tribune) : le pas maximal
  tranche, et interdit du même coup de tomber par-dessus une balustrade.
- **La matière.** Pierre de taille calculée (assises, patine, grain), montagnes
  brisées dans le vertex shader, ciel avec soleil, cirrus, brume dissymétrique
  et tramage anti-bandes.
- **Le lecteur est un livre.** Il vole jusqu'à nous, s'ouvre, se tourne au clic.
  Plus aucun tableau de bord : une croix, et rien d'autre.

**293 tests**, zéro avertissement.

---

## Ce qui n'est pas fait

**Une seule chose :** aucun test sur un vrai appareil mobile. Le mode dégradé
est décidé par une fonction testée et vérifié dans une fenêtre de 390 × 844,
mais une fenêtre étroite n'est pas un téléphone.

Les quatre constats de l'audit (§ 5) restent vrais par nature : ce sont des
propriétés à connaître, pas des défauts à corriger.


---

## Après les sept phases : le site quitte la 3D (2026-09-03)

Trois jours de travail sur le rendu ont produit une galerie que la première
illustration dessinée a dépassée en une heure. La mesure le disait avant l'oeil :
l'illustration avait deux fois la variation locale du rendu pour une luminance
identique.

**Ce qui est parti** : `src/scene/` en entier (71 fichiers, 8 102 lignes),
three.js, @react-three/fiber, drei, postprocessing, @types/three.
**Ce qui reste** : la bijection, le worker, le lecteur, la recherche,
l'adressage dans le fragment d'URL. Rien du coeur n'a bougé.
**Ce qui arrive** : `src/vue2d/`, les scènes dessinées en SVG calculé.

Trois erreurs de fidélité au texte ont été corrigées au passage, toutes
vérifiables dans la nouvelle :
- la hauteur des étagères **est** celle de l'étage : la salle fait deux mètres,
  pas trois, et il n'y a aucun mur nu au-dessus des livres (D63) ;
- il y a bien de **vastes puits d'aération au milieu** des galeries, ceints de
  balustrades très basses : D31 avait conclu l'inverse, à tort (D64) ;
- l'escalier en colimaçon est dans le zaguán, et coexiste avec le puits.

**Mesures** : 174 tests verts ; le site passe de 1,3 Mo à **232 Ko** ;
640 volumes cliquables par galerie, chacun portant son adresse ; parcours
complet vérifié dans Chromium, de l'écran d'entrée à une page lue, sans une
seule erreur de console.

## Le site perd sa page d'accueil (2026-09-03)

Sur les retours de l'utilisateur, trois choses.

**L'arrivée.** Plus d'écran de titre ni de bouton : la bibliothèque est là dès
la première image, et l'introduction s'écrit par-dessus elle en quatre phrases,
puis s'efface. On entre en cliquant la porte (D65). Un lien partagé n'a plus
aucun écran à franchir.

**Les portes se cliquaient mal**, et la cause n'était pas dans la porte : le
halo de la lampe, dessiné après elle, en couvrait 93 % et avalait le clic. Tout
le décor est désormais privé d'événements, et les cibles vivent dans une couche
dessinée en dernier (D66). Vérifié : 5 points d'essai sur 5 pour la porte du
dehors, 6 sur 6 pour celle du fond, sommet de l'arc et bords compris.

**On peut enfin monter**, et par un objet visible : le puits traverse aussi le
plafond, et l'on y voit la lampe de la galerie du dessus (D67).

**180 tests.** La feuille de style perd 88 lignes devenues orphelines.

## Le livre se suffit (2026-09-03)

La lecture avait une barre d'outils devant elle. Le volume est désormais
dessiné ouvert, deux pages face à face, et il porte lui-même ce que la barre
affichait : l'adresse est le titre courant du verso et la toucher copie le
lien, les numéros sont aux angles extérieurs, on tourne en cliquant la page et
le coin se soulève au survol, on referme en cliquant à côté (D68). La galerie
reste montée derrière, dans le noir.

Une seule mesure gouverne l'objet, le corps du texte, si bien qu'il se pose
dans n'importe quelle fenêtre : 1 182 x 643 px dans 1 440 x 900, et sous
860 px il n'ouvre qu'un feuillet. **184 tests.**

## Le puits remis dans la pièce, le Seuil peuplé (2026-09-03)

**La balustrade était hors de la pièce.** Elle montait 33 px au-dessus de la
ligne de sol du mur du fond, ce qui est impossible pour un garde-corps posé sur
un trou creusé dans le plancher : elle amputait le bas de la porte, qui
paraissait donc posée sur elle. La géométrie du puits vit maintenant dans
`perspective.ts`, en fractions du sol visible, avec un test qui lui interdit de
sortir de la pièce (D69). Mesuré à l'écran : 54 px d'écart.

**Le dessin de la balustrade** n'était qu'une ellipse et quinze rectangles de
largeur constante. C'est une main courante coupée en deux arcs, celui du fond
passant derrière les montants, et 34 montants dont l'épaisseur suit la distance.

**Le Seuil se peuple** (D70) : cirrus et volée d'oiseaux, mur d'enceinte à
refends, deux vasques au pied des marches, dallage en cercles, trois
silhouettes avec leur ombre. **190 tests.**

## L'escalier, et la vie dans les scènes (2026-09-03)

**L'escalier ne menait nulle part** : il s'arrêtait contre la face du
stylobate, on montait sept marches pour se cogner à un mur. Il monte
maintenant jusqu'au niveau où posent les colonnes, en tranchant la face du
podium, et chaque marche a sa contremarche dans l'ombre et son nez au jour
(D71).

**Les scènes bougent** (D72), et tout passe par `transform` ou `opacity`, donc
par le compositeur : aucune image calculée, aucun JavaScript. Dehors, cirrus
sur deux couches à deux vitesses, volée d'oiseaux qui bat des ailes, cyprès au
vent, vasques qui scintillent, eau qui glisse, soleil qui respire, porte qui
appelle. Dedans, lampe qui respire, lampes voisines hors de phase, et
poussière qui monte dans la lumière. **190 tests**, et `prefers-reduced-motion`
éteint tout.

## Deux retours du poste de l'utilisateur (2026-09-03)

**Rien n'était animé sur son PC de bureau.** Windows propose d'éteindre les
effets d'animation, ce réglage se lit dans `prefers-reduced-motion`, et nous
coupions absolument tout. Le mouvement réduit arrête désormais ce qui se
**déplace** (nuages, oiseaux, arbres, poussière, halo qui s'ouvre) et garde ce
qui **luit** (lampe, vasques, eau, porte), chaque animation ayant sa variante
en opacité seule (D74).

**L'URL affichait `#/0/0/0/0/1` dès le chargement**, soit l'adresse d'un livre
qu'on n'avait pas ouvert. Elle ne s'écrit plus qu'au premier geste qui la
justifie, et un test le tient (D73). **194 tests.**

## Le portail bâti, et l'axe retrouvé (2026-09-03)

**La porte avait l'air posée sur le dessin**, et c'était exact : un rectangle
noir sans encadrement, sans épaisseur de mur et sans seuil, sur une bande
d'ombre plate. Elle est bâtie : chambranle, joints de claveaux, clef qui
saille, seuil, et surtout **embrasement** qui montre le mur en coupe, la seule
chose qui empêche une porte de rester une découpe (D75). Le mur de la cella a
ses assises, sa plinthe et ses antes.

**La colonnade n'était pas dans l'axe** (D76), trouvé en vérifiant le portail :
centrée sur 492 quand tout le reste l'est sur 480. Elle se calcule désormais à
partir de l'axe, symétrique par construction, avec un entrecolonnement central
élargi. Vérifié à l'écran : colonnade, portail, coupole et milieu du cadre
tombent sur la même abscisse. **194 tests**, entrée par la porte vérifiée sur
6 points d'essai sur 6.

## Revue du Seuil : rien ne pose au-dessus de l'horizon (2026-09-03)

Deux défauts signalés, une seule cause. La **bande claire** qui courait sous le
bâtiment était le muret d'enceinte, posé au ras de la ligne d'horizon ; le
socle du monument avait le même problème. Ce qui est au-dessus de l'horizon est
au-delà de l'infini : rien ne peut y poser, et les deux flottaient.

Le monument se tient maintenant sur une **terrasse** dont on ne voit,
frontalement, que la face. Elle court d'un bord à l'autre, cache l'horizon et
le devient. Les **retours latéraux** sont supprimés : une élévation
strictement frontale ne montre aucune face latérale, et les éclairer
différemment supposait un point de vue de biais. La masse se lit par les
ressauts (D77). Crêtes brisées, sous-face de corniche sur toute sa longueur.
**194 tests**, axes vérifiés à l'écran.

## Le temple posé, les ombres dans l'ordre (2026-09-03)

**Les ombres des cyprès se peignaient sur les cyprès** : les arbres étaient
dessinés un par un, ombre puis feuillage, du plus proche au plus lointain.
Deux passes et un tri par profondeur à la construction règlent les deux
problèmes d'un coup (D78).

**Le temple avait l'air posé sur rien**, et il l'était : son socle était une
dalle unique de la même valeur que la terrasse, sans ressaut ni ombre. Il a
maintenant une ombre de contact, un stéréobate à trois assises, et une ombre
portée qui vient vers nous puisque le soleil est derrière lui (D79).
**194 tests.**

## Le hall (2026-09-03)

On passait du plein soleil aux ténèbres en un clic. Il y a maintenant un sas :
une nef, deux files de six piliers, des bas-côtés noirs, un plafond à caissons,
un faisceau qui tombe de la voûte, et au bout de l'axe **le cube d'or** en
lévitation au-dessus de son socle (D80). Le cube est la seule chose claire de
la salle et la seule chose qui se clique.

La géométrie vit dans `hall.ts` avec la même discipline que la galerie, et le
test qui compte est celui de la symétrie pilier par pilier. **207 tests.**

## Le hall, repris en entier (2026-09-03)

Sur les premiers retours : voûte montée très au-dessus du cadre (c'est de là
que vient la majesté, et c'est ce qui a libéré la place pour la statue),
bas-côtés garnis de **rayonnages** au lieu de noir, piliers à base et
chapiteau, arcade en **plein cintre** à bandeaux, **puits de lumière** percé
dans la voûte avec son faisceau, cube qui **flotte franchement** au-dessus de
son socle, et au fond **le colosse qui porte le monde**, en silhouette (D81).

Trois règles tirées de la reprise : un arc tracé au fil se lit comme un fil ;
un membre est une ligne épaissie, pas une surface dessinée contour par contour ;
une silhouette a besoin de quelque chose derrière elle et de rien devant.
**214 tests.**

## Ce qui n'est pas fait, à jour au 2026-09-03

- Le **Seuil** est une invention : chez Borges, la bibliothèque *est* l'univers,
  elle n'a pas d'extérieur. Il est gardé comme seuil de fiction, à assumer ou à
  retirer.
- Les **deux petits cabinets** du zaguán (un pour dormir debout, un pour les
  besoins) ne sont pas dessinés.
- Aucun test sur un vrai appareil mobile.

## Le hall retire (2026-09-03)

Annulation de la journee : le hall monte le matin est **supprime**, avec sa
geometrie (`hall.ts`), son composant (`Hall.tsx`), ses tests et sa capture.
Le chantier en cours, un atlas de motifs (`atlas.ts`) qui n'existait que pour
lui, est abandonne avant d'avoir servi.

Le seuil ouvre desormais directement sur les salles des livres. La raison est
dans D82 : la bibliotheque de Borges *est* l'univers, elle n'a pas de
vestibule, et le hall etait le seul endroit du site ou l'on ne faisait que
regarder.

`Stage` retombe a deux valeurs, `seuil` et `library`.

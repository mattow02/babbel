# Babbel : La Bibliothèque de Babel en 3D

> Fichier de contexte projet. Chargé automatiquement quand Claude est ouvert
> depuis `~/projets/Babbel`. À tenir à jour à chaque session notable.

## Comment fonctionne ce fichier
Claude Code charge, en cumulant :
1. `~/.claude/CLAUDE.md` : global, toutes machines/projets ;
2. **ce fichier**, `~/projets/Babbel/CLAUDE.md` : projet, chargé dès que le
   répertoire de travail est ici ou en dessous ;
3. un éventuel `CLAUDE.md` dans un sous-dossier, chargé quand on y touche.

Donc : ouvrir Claude directement dans `~/projets/Babbel` charge ce fichier.
Les règles globales (français, pas de traces IA, etc.) restent actives.

---

## Le projet en une phrase
Un site web où l'on visite en 3D la bibliothèque infinie de Borges, dont chaque
livre est généré à la volée dans le navigateur du visiteur.

## Attentes de l'utilisateur (à respecter, non négociable)

1. **Fidélité au format de Borges.** 410 pages, 40 lignes, 80 caractères,
   hexagones, 4 murs × 5 étagères × 32 livres. Le format est la contrainte.
2. **Génération à la volée, côté client.** Les caractères d'une page sont
   calculés au moment où le visiteur tourne la page. **Par son navigateur,
   jamais par l'hébergeur.** C'est une exigence explicite : le serveur ne sert
   que des fichiers statiques.
3. **Vraiment propre.** Structure de projet claire et professionnelle,
   architecture pensée avant le code, séparation nette des responsabilités.
   Pas de code jeté vite fait.
4. **Développement logique et astucieux.** On cherche la solution élégante,
   pas la force brute. Le cœur du projet est un problème d'astuce
   mathématique, on l'attaque comme tel.
5. **Vraiment esthétique.** L'exigence de design de l'utilisateur s'applique
   pleinement : beau et distinctif, jamais générique, jamais une démo three.js
   par défaut. Passer par les skills design avant de coder une UI.
6. **Faire les choses dans l'ordre.** Suivre `docs/ROADMAP.md` phase par
   phase, ne pas sauter d'étape, valider les critères de sortie.

## Documentation du projet
| Fichier | Contenu |
|---|---|
| `docs/RECHERCHE.md` | Faits sourcés : Borges, l'algorithme, les limites techniques |
| `docs/ARCHITECTURE.md` | Stack, arborescence, modèle de données, budget perf |
| `docs/ROADMAP.md` | Les 7 phases et l'état d'avancement |
| `docs/DECISIONS.md` | Chaque choix structurant + son pourquoi (59 ADR) |
| `docs/AUDIT.md` | **Revue complète, classée par gravité. À lire en premier.** |
| `docs/DIRECTION-ARTISTIQUE.md` | Palette, formes, matériaux, post-process, motifs |
| `docs/captures/` | Captures de l'état du projet, phase par phase |

**Avant toute session de dev : lire ROADMAP.md pour savoir où on en est.**
La section « Ce qui n'est pas fait », en fin de ROADMAP, est la liste honnête
des chantiers restants, par ordre d'importance.

## Les 3 faits techniques à ne jamais oublier

1. **25^1 312 000 livres.** Rien n'est stockable. Tout est une fonction pure
   de l'adresse. Il n'y a pas de base de données, il n'y en aura jamais.
2. **La bijection opère à l'échelle de la page** (3 200 caractères = 14 861 bits
   en BigInt), pas du livre (6,1 Mbits, trop lourd).
3. **Le facteur limitant en 3D est le nombre de draw calls**, pas les polygones.
   InstancedMesh partout, streaming par chunks, une seule page de texte réel
   existante à la fois.

## Disciplines de dev
- `src/core/` est du TypeScript pur : **aucune** dépendance à React ou three.js.
  Testable sans navigateur. Si le rendu change, le cœur ne bouge pas.
- Tout calcul dans un Web Worker. Le thread de rendu ne calcule jamais.
- Depuis la boucle de rendu, on appelle `PageLibrary.peek()` (synchrone, cache)
  et **jamais** `read()` en `await`. Une frame ne peut pas attendre.
- Toute conversion d'un grand entier vers du texte est chère (0,14 ms) : jamais
  sur un chemin chaud (D19).
- Les adresses se comparent **par valeur** (le numéro d'emplacement), jamais par
  référence de l'objet : sinon la correction dépend de la discipline de
  l'appelant.
- Ajouter `?sonde` à l'URL pour installer les fonctions de mesure sur un build
  de production.
- Le placement 3D s'écrit en maths pures dans `scene/**/layout3d.ts` et
  `parts.ts`, sans three.js : c'est la seule façon de vérifier 640 objets (D24).
- L'interaction ne passe **pas** par les événements du moteur de rendu : on
  lance le rayon soi-même depuis le réticule (D42). C'est plus juste, et c'est
  la seule version vérifiable de l'extérieur.
- Toute géométrie répétée passe par une **boîte unitaire instanciée** (D25) :
  un appel de rendu par matériau, quel que soit le nombre d'objets.
- Les positions du monde sont **toujours relatives à la galerie courante** (D30).
  Jamais de coordonnée absolue : il y a 10^4468 galeries.
- Toute logique un peu subtile d'un composant 3D est extraite en module pur et
  testée (`geometry.ts`, `steering.ts`, `picking.ts`, `approach.ts`,
  `landscape.ts`, `sequence.ts`).
- Pour dérégler un alignement, passer par `scene/hash.ts` : **jamais** par une
  simple multiplication, qui est affine et produit un motif périodique (D32).
- Ce qui peut être une **fonction du temps** ne doit pas devenir un état : la
  poussière est animée dans le shader, sans coût processeur (D37).
- Rien n'est téléchargé : ni texture, ni police, ni son. Tout est calculé.
- Zéro allocation et zéro `setState` React dans `useFrame`.
- Le test `inverse(forward(x)) === x` est le test le plus important du projet.
  S'il casse, tout est faux. Il vit dans `src/core/__tests__/bijection.test.ts`.
- `npm run check` (typecheck + lint + tests) doit être vert avant tout commit.
- Mesurer avant d'optimiser, et mesurer le **temps d'une image**, pas seulement
  les appels de rendu : un shader peut ruiner le budget sans toucher au nombre
  d'appels ni de triangles (constat A6 de `docs/AUDIT.md`).

## Décisions actées (2026-08-29)
- **Alphabet : 25 symboles**, fidèle à Borges (22 lettres + espace + virgule + point).
  Mais paramétré dans `core/alphabet.ts` : jamais 25 en dur ailleurs.
- **Stack : Vite + React + TypeScript** (Next.js écarté).
- **Navigation : première personne.** Souris = regard, clic maintenu = avancer,
  clic sur un point d'intérêt = travelling cadré. Tactile : doigt appuyé =
  avancer. ZQSD en fallback silencieux. FOV 55-65°, accélérations douces,
  `prefers-reduced-motion` respecté.
- **Bijection inversible dès la Phase 1** (gratuit maintenant, coûteux après),
  interface de recherche seulement en Phase 7.
- **Desktop cible v1**, leviers de dégradation mobile prévus dès l'architecture.
- **Deux mondes distincts** (D11) : *le Seuil*, scène authorée à la main
  (extérieur → dôme → marches → entrée unique → grand hall → cube flottant),
  et *la Bibliothèque*, procédurale et infinie. Budgets et dossiers séparés.
  La séquence d'arrivée est le morceau de bravoure esthétique, elle a le droit
  d'être coûteuse parce qu'elle est unique.

## Direction artistique
**Référence visuelle** : la vidéo « Viens, je vais te Montrer l'Infini »
<https://www.youtube.com/watch?v=J3JsyxABi0g>. Ses images ne sont pas
conservées dans le dépôt ; ce qu'on en a retenu est décrit en mots dans
`docs/DIRECTION-ARTISTIQUE.md`, qui fait désormais foi. En résumé :
- **Deux régimes de lumière** : le Seuil solaire, calcaire crème et or, ciel teal.
  La Bibliothèque ténébreuse, noir chaud et halos ambrés. Le visiteur passe du
  plein soleil aux ténèbres : c'est l'arc du site entier.
- Géométrie **primitive et monumentale** (sphère, bol, cube, colonnes),
  symétrie frontale, point de fuite central, contre-plongée basse, échelle écrasante.
- **Répétition sérielle** partout (cyprès, colonnades, caissons, dos de livres) :
  elle dit l'infini, et c'est gratuit en instancing GPU.
- Sol **poli réfléchissant** dans tous les intérieurs, c'est ce qui donne la profondeur.
- Post-process par ordre d'importance : vignettage lourd, bloom sur les sources,
  grain, DOF léger, aberration chromatique subtile, tone mapping ACES.
- ⛔ Jamais de gris neutre ni de lumière blanche uniforme. Les ombres tirent vers
  le brun-violacé, les lumières vers l'ambre.

**Le levier technique clé (D16) :** le Seuil est statique, donc son éclairage
sera **précalculé en lightmaps** : c'est ce qui permet d'approcher en WebGL la
qualité des rendus offline de référence. La Bibliothèque, procédurale, ne peut
pas être bakée : elle sera donc sombre, ce qui est justement le parti pris du
film. La contrainte technique et l'intention esthétique coïncident.

## Journal
- **2026-08-29**, Création du projet. Phase 0 : recherche faite (Borges,
  algorithme de libraryofbabel.info, limites navigateur), architecture et
  roadmap rédigées. En attente des arbitrages `docs/DECISIONS.md` § ouvertes.
  Aucun code applicatif écrit à ce stade, volontairement.
  Arbitrages rendus dans la foulée : D9 à D15 (voir DECISIONS.md).
  Direction artistique établie d'après la vidéo de référence
  (D16). Plus aucune question ouverte.
- **2026-08-29 (suite)** : **Phase 1 terminée.** Socle Vite + TS strict monté,
  `src/core/` écrit et testé : 48 tests verts, `npm run check` vert.
  La bijection utilise le **cycle walking** et non un LCG masqué (D17) : plus
  simple à prouver correct, aucun cas particulier. Une page se génère en 0,6 ms,
  le cœur pèse 2 ko gzip. `locate(texte)` fonctionne déjà de bout en bout.
  Prochaine étape : Phase 2, la génération dans un Web Worker.
- **2026-08-29 (suite)**, **Phase 2 terminée.** `src/workers/` : worker sans
  état, moteur injectable (D18), cache LRU, déduplication, préchargement des
  voisines. 74 tests verts. **Vérifié dans un vrai Chromium** sur le build de
  production : 100 tournages de page ne bloquent le thread principal que
  **2,80 ms au total**, soit 17 % du budget d'UNE image. Clé de cache en BigInt
  et non en chaîne (D19, 300× plus rapide). Prochaine étape : Phase 3, le
  lecteur en HTML nu.
- **2026-08-29 (suite)**, **Phase 3 terminée.** Lecteur React : 40×80, clavier
  borné, barre d'adresse, URL dans le **fragment** (D20 : marche en statique
  sans config, et le serveur ne peut pas savoir ce qu'on lit). DA appliquée.
  90 tests verts. **Vérifié en Chromium** : une adresse de 2 901 caractères
  partagée puis ouverte à froid redonne un texte identique au caractère près.
  Zustand repoussé à la phase 4 (D21).
- **2026-08-29 (suite)** : **Phase 4 terminée.** Galerie hexagonale en R3F :
  placement en maths pures et testé sans GPU (D24), tout ramené à une boîte
  unitaire instanciée (D25), murs libres opposés pour que la perspective file
  (D23), lampe sphérique de Borges avec ombres sur une seule galerie (D26),
  sonde de performance maison (D27). 105 tests verts. **Mesuré sur GPU réel :
  27 appels de rendu (budget 100), 0,37 ms par image (budget 16,6 ms)**,
  1 920 volumes affichés.
- **2026-08-30** : **Phase 5 terminée.** Navigation 1re personne (regard par les
  bords de l'écran D28, clic maintenu pour avancer, ZQSD en secours),
  collisions en maths pures, **origine flottante** obligatoire (D30),
  désignation d'un volume → travelling → lecture, escalier en colimaçon dans le
  couloir (D31). 144 tests verts. **Mémoire stable sur ~25 000 images de marche**
  (tas 18,5 → 14,0 Mo). **Le ChunkManager prévu s'est révélé inutile** (D29) :
  toutes les galeries étant identiques, il n'y a rien à charger ni décharger.
  ⚠️ L'ouverture d'un volume au clic n'est pas vérifiée de bout en bout dans le
  navigateur, à tester à la main.
- **2026-08-30 (suite)**, **Phase 5bis terminée : le Seuil.** Séquence
  d'arrivée de 29,5 s en plans composés : plaine, dôme dans son bassin, deux
  anneaux de cyprès, montagnes, ciel en dégradé (shader), montée des marches,
  entrée unique (passage traité en **coupe**, D34), grand hall à coupole
  caissonnée avec le **cube d'or en lévitation**, puis passage automatique à la
  bibliothèque. 171 tests verts, 20-22 appels de rendu dehors, 6 dans le hall.
  Deux défauts visuels attrapés : hachage affine donnant des motifs périodiques
  (D32) et caissons saillants faute d'inclinaison (D33).
- **2026-08-30 (suite)**, **Phase 6 terminée : l'esthétique.** Post-traitement
  réglé par ambiance (vignettage, bloom, grain, aberration), faisceaux et halos
  en volume par shader additif (D38), poussière animée entièrement dans le
  shader (D37), **son d'ambiance synthétisé** : aucun fichier audio (D36), et
  écran d'entrée qui autorise le son et réveille le worker. 181 tests verts.
  **39 appels de rendu dehors, 53 dans la bibliothèque, 5,69 ms par image**
  effets compris. Deux défauts attrapés par les tests : le bourdon était un
  accord (octave exacte), et le comptage d'appels était faux avec un composeur
  (D35).
- **2026-08-30 (suite)** : **Phase 7 terminée. Les sept phases sont faites.**
  **Recherche par texte** livrée (D39, via le worker) avec **transcription dans
  l'alphabet de Borges** (D40 : « Kafka » → « cafca »). **Mode dégradé** décidé
  par une fonction pure et testée (D41), `prefers-reduced-motion` respecté.
  Déploiement statique documenté. **207 tests verts.**
  Vérifié en Chromium : on tape une phrase, le site calcule son adresse et ouvre
  la page : première ligne = la phrase, reste blanc, URL partageable.
  **Ce qui reste ouvert est listé en fin de `docs/ROADMAP.md`.**
- **2026-08-30 (suite)** : **Reprise après la roadmap.** Deux chantiers repris :
  (1) **le rayon d'interaction est lancé à la main** depuis le réticule, plus
  par R3F (D42) : le réticule devient le viseur, <kbd>E</kbd> et le clic bref
  sont le même geste, et **le trou de vérification ouvert depuis la phase 5 est
  comblé** : ouverture d'un volume vérifiée en Chromium ; (2) **la bibliothèque
  a des étages** (D43) : `galerie = étage × 25^800 + colonne`, le même entier
  lu dans deux dimensions, sans toucher à la bijection ni aux URL déjà
  partagées. Étages 0 → 1 → 2 → 0 vérifiés. 216 tests, zéro avertissement.
- **2026-08-31** : **Tous les chantiers restants repris, puis AUDIT.**
  Le **zaguán** avec sa trémie (D44) donne enfin le vertige ; marbre veiné
  calculé, sol miroir et éclairage d'environnement (D45) ; secours sans WebGL
  et worker résilient (D46). **227 tests.**
  **L'audit est dans `docs/AUDIT.md`** : 7 défauts corrigés, dont une
  **régression de performance à 19,45 ms/image**, invisible au compte des
  appels de rendu et rattrapée à 6,44 ms, et 9 constats P1/P2.
- **2026-08-31 (suite)** : **Tous les constats de l'audit sont corrigés.**
  Découpage de code (**347 → 69 Ko gzip** pour lire ; un lien partagé ouvre la
  page sans charger la 3D), intégration continue, piège à focus, lecteur
  audible, `useSyncExternalStore`, sonde derrière `?sonde`, licence MIT,
  conversions 8 → 2, et **React enfin testé** (jsdom, 29 tests). **256 tests.**
  Trois défauts trouvés *en écrivant les tests* : adresses comparées par
  référence, filtre de focus dépendant de la mise en page, seuil de test au
  millième d'une image.
- **2026-08-31 (retours sur le rendu)** : **Le site cesse d'être une
  cinématique.** Sur les remarques de l'utilisateur : (1) **l'arrivée s'arrête
  DEVANT l'entrée** (D51), plus de traversée des murs, le visiteur marche sur
  le parvis et franchit le portail lui-même ; (2) **le hall devient une nef**
  (D52) où l'on marche : grande allée, deux files de piliers, bas-côtés,
  **escaliers latéraux** vers les tribunes, cube d'or au bout de l'axe ;
  `usePlayer` reçoit désormais un **monde** (collisions, sols, origine
  flottante) au lieu de connaître la seule bibliothèque, et deux sols peuvent
  se superposer (D53) ; (3) **la matière** : pierre de taille calculée avec
  assises, patine et grain (D54), montagnes à silhouette brisée dans le vertex
  shader (D55), ciel avec soleil, cirrus, brume dissymétrique et tramage (D56) ;
  (4) **le lecteur est un livre** (D57) : il quitte l'étagère, vient flotter
  devant nous, s'ouvre, et se tourne au clic : droite pour avancer ;
  (5) **tout le HUD a disparu** (D58) : il ne reste qu'une croix pour refermer.
  Deux pièges trouvés dans le navigateur : **un objet accroché à la caméra n'est
  jamais rendu** (D59), et un tir de réticule pile au centre d'une galerie passe
  dans l'interstice entre deux volumes. **293 tests**, zéro avertissement.

# Roadmap — Babbel

État : **Sept phases + une reprise.** Reste ouvert : voir « Ce qui n'est pas fait » en fin de document.
Mise à jour : 2026-08-29

Règle : une phase n'est close que si ses critères de sortie sont vérifiés.
On ne passe pas à la suivante « à peu près ».

---

## Phase 0 — Cadrage ✅ (recherche) / ⏳ (décisions)
- [x] Spécifications canoniques de Borges établies et sourcées
- [x] Compréhension de l'algorithme de libraryofbabel.info
- [x] Limites physiques et techniques identifiées
- [x] Architecture proposée
- [x] Arbitrages : alphabet 25 (Borges), Vite+React+TS, 1re personne sans ZQSD,
      séquence d'arrivée par le Seuil (D9 à D12)
- [x] Schéma de contrôle, recherche inverse, mobile tranchés (D13 à D15)
- [x] Direction artistique établie à partir de `design/` (D16, DIRECTION-ARTISTIQUE.md)
- [x] **Phase 0 close. Plus aucune question ouverte.**

## Phase 1 — Le cœur mathématique ✅ (2026-08-29)
Pur TypeScript, aucun rendu. C'est la fondation.
- [x] `core/layout.ts` — constantes Borges
- [x] `core/alphabet.ts` — 25 symboles, encode/decode
- [x] `core/address.ts` — Address <-> emplacement <-> URL
- [x] `core/bijection.ts` — permutation inversible par **cycle walking**
- [x] `core/page.ts` — address -> 3 200 caractères, et `locate` en sens inverse
- [x] `core/index.ts` — API publique
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
— voir la décision D17.

## Phase 2 — Génération asynchrone ✅ (2026-08-29)
- [x] `workers/page.worker.ts` — sans état, une seule responsabilité
- [x] `workers/engine.ts` — worker réel, moteur direct de repli, moteur injectable
- [x] `workers/cache.ts` — LRU en 60 lignes, sur la seule propriété d'ordre de `Map`
- [x] `workers/client.ts` — `PageLibrary` : `peek` / `read` / `prefetch`, déduplication
- [x] `workers/neighbourhood.ts` — quelles pages précharger, et dans quel ordre
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

## Phase 3 — Lecture, sans 3D ✅ (2026-08-29)
- [x] Affichage 410 pages / 40 lignes / 80 colonnes, taille de police **calculée**
      pour tenir en largeur et en hauteur (D22)
- [x] Navigation clavier : ←/→ une page, Maj ou Pg↑/Pg↓ dix pages, ↑/↓ volume
      voisin, Début/Fin bords du volume — bornée, testée
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

## Phase 4 — La galerie 3D ✅ (2026-08-29)
- [x] Géométrie de l'hexagone : 6 murs, dont 4 portent 5 étagères de 32 volumes
      et 2 sont percés d'un couloir — **placement en mathématiques pures**,
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
| Triangles | 173 500 | — |
| Volumes affichés | 1 920 | — |

**Écart au plan assumé :** le « puits central + balustrade + escalier » de la
roadmap initiale n'est pas fidèle au texte — chez Borges l'escalier en colimaçon
est dans le *couloir*, pas au centre de la salle. Reporté en phase 5 avec la
navigation verticale, plutôt que d'inventer une géométrie que la nouvelle ne
décrit pas.

**Reste pour la phase 6 (esthétique) :** l'éclairage est encore plat, sans
clair-obscur marqué ; pas de bloom sur la lampe, pas de grain, pas de
vignettage. C'est exactement le contenu de la phase 6, et c'est là que les
lightmaps du Seuil (D16) entreront en jeu.

Capture : `docs/captures/phase4-galerie.png`.

## Phase 5 — Navigation et streaming ✅ (2026-08-30)
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
aucune allocation en cours de marche — pas de fuite possible, non parce qu'on la
prévient mais parce qu'il n'y a rien à allouer. Seules les couleurs des tranches
suivent le numéro de galerie, pour qu'on sente qu'on avance.

**Non vérifié de bout en bout :** l'ouverture d'un volume au clic. Le calcul
(indice d'instance → adresse → point d'approche) est couvert par 13 tests, mais
le clic lui-même n'a pas pu être déclenché dans le navigateur piloté : R3F
ignore les événements de pointeur synthétiques, et le clic réel de Playwright
attend une stabilité d'image impossible avec `requestAnimationFrame` bridé.
**À vérifier à la main en premier.**

Captures : `docs/captures/phase5-marche.png`.

## Phase 5bis — Le Seuil ✅ (2026-08-30)
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

**Reste pour la phase 6 :** l'éclairage du hall est encore brun et plat — pas
de faisceau visible sous l'oculus, pas de bloom sur le cube, marbre trop chaud.
Les montagnes gardent une silhouette trop conique. C'est exactement le contenu
de la phase suivante.

**Note d'exploitation :** l'éclairage précalculé du Seuil (D16) n'est pas fait.
L'extérieur n'en a pas besoin — il n'a qu'une source, le soleil. C'est
l'intérieur du hall qui le réclame, et cela suppose une chaîne de cuisson hors
ligne : c'est une optimisation de phase 6/7, pas un prérequis.

## Phase 6 — Esthétique ✅ (2026-08-30)
- [x] Direction artistique arrêtée (voir DIRECTION-ARTISTIQUE.md)
- [x] **Post-traitement** réglé par ambiance (extérieur / hall / bibliothèque) :
      vignettage, bloom, grain, aberration chromatique, saturation, contraste
- [x] **Faisceaux de lumière et halos** en volume, par shader additif
- [x] **Poussière en suspension**, animée entièrement dans le shader — aucune
      écriture de tampon par image, coût processeur nul
- [x] **Son d'ambiance procédural** : bourdon de quatre voix non harmoniques +
      bruit brun filtré, synthétisé dans le navigateur. **Aucun fichier audio.**
- [x] **Écran d'entrée** : titre, le décompte réel des pages, et le geste qui
      autorise le son et réveille le worker
- [ ] Lightmaps bakées du hall — reporté, voir ci-dessous
- [ ] Marbre veiné et sol réfléchissant — reportés en phase 7

**Sortie atteinte.** Captures : `phase6-seuil.png`, `phase6-bibliotheque.png`.

| Mesuré (Chromium, 2880×1575) | |
|---|---|
| Appels de rendu, extérieur | **39** (22 de scène + 17 de post-traitement) |
| Appels de rendu, bibliothèque | **53** |
| Coût d'une image, effets compris | **5,69 ms** (budget 16,6) |
| Tests | 181 |

**Deux défauts de conception attrapés par les tests :**
- le bourdon était **un accord** : 77,3/38,5 tombait sur une octave exacte. Un
  test vérifie qu'aucune voix n'est un harmonique d'une autre — on veut une
  rumeur de pierre, pas de la musique. Fréquences reprises ;
- le relevé de performance affichait « 1 appel » : avec un composeur, `gl.info`
  est remis à zéro **à chaque passe**. Corrigé en désactivant la remise à zéro
  automatique et en totalisant par image (D35).

**Reste, honnêtement :** l'éclairage précalculé du hall (D16) demande une chaîne
de cuisson hors ligne et n'est pas fait ; le marbre veiné et le sol réfléchissant
non plus. Les montagnes gardent une silhouette un peu conique.

## Phase 7 — Finition ✅ (2026-08-30)
- [x] **Recherche par texte** — la contrepartie de la bijection, promise en
      phase 1 (D14). Le calcul passe par le worker (D39)
- [x] **Transcription dans l'alphabet de Borges** (D40) : « Kafka » → « cafca »,
      « bibliothèque » → « bibliotheque », accents retirés, j/k/w/x transcrits
- [x] **Mode dégradé** décidé par une fonction pure et testée (`scene/quality.ts`)
- [x] `prefers-reduced-motion` respecté : la séquence d'arrivée ne s'impose plus
- [x] Déploiement statique documenté, `vercel.json`, métadonnées de partage
- [x] 26 tests supplémentaires (207 au total)

**Vérifié dans Chromium, de bout en bout :** on tape « Kafka a écrit dans la
bibliothèque », le site l'écrit « cafca a ecrit dans la bibliotheque » en
expliquant pourquoi, puis **calcule** son adresse — galerie `70ze8o0zbtso…`,
mur 3, étagère 1, volume 29, page 241 — et ouvre la page. La phrase est sur la
première ligne, le reste est blanc, le format reste 40 × 80, l'URL de 2 902
caractères est partageable.

**Déploiement :** aucune réécriture de route n'est nécessaire, puisque l'adresse
vit dans le fragment (D20). `npm run build` puis servir `dist/`, n'importe où.


---

## Phase 8 — Après la roadmap ✅ (2026-08-30)

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
la caméra fait son travelling et la page s'ouvre — `#/0/3/3/30/1`, mur 4,
étagère 4, volume 31, 40 lignes × 80 colonnes.

### La bibliothèque a des étages (D43)
Elle n'est plus une ligne de galeries : c'est un volume. Sans ajouter la
moindre coordonnée — **le même entier est lu dans deux dimensions** :

```
galerie = étage × 25^800 + colonne
```

Monter d'un étage ajoute une foulée, avancer dans un couloir ajoute un. Un
étage est donc long d'autant de galeries qu'il y a de façons de remplir huit
cents signes, soit environ 10^1118. L'escalier en colimaçon, décoratif depuis
la phase 5, sert enfin.

Mesuré dans Chromium : étages **0 → 1 → 2 → 0**, la colonne ne bouge pas — on
monte bien à la verticale.

**216 tests.** Zéro avertissement de lint.

---

## Ce qui n'est pas fait

Honnêtement, et par ordre d'importance :

1. **L'éclairage précalculé du hall** (D16). L'extérieur n'en a pas besoin — il
   n'a qu'une source. Le hall le réclame, et cela suppose une chaîne de cuisson
   hors ligne : un chantier, pas une itération.
2. **Marbre veiné et sol réfléchissant** (DIRECTION-ARTISTIQUE § 5). Le sol poli
   est en place mais ne réfléchit pas encore.
3. **Pas de cage d'escalier.** On change d'étage par un court travelling, mais
   le couloir n'a pas de trémie : on ne voit ni au-dessus ni en dessous. C'est
   ce qui donnerait vraiment le vertige.
4. **La silhouette des montagnes** reste un peu trop conique.
5. **Aucun test sur un vrai appareil mobile.** Le mode dégradé est décidé par
   une fonction testée, mais son rendu n'a été vu que sur ordinateur.

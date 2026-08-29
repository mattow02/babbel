# Roadmap — Babbel

État : **Phase 2 terminée. Prochaine étape : Phase 3 (lecture, sans 3D).**
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

## Phase 3 — Lecture, sans 3D
Une page HTML nue qui affiche le livre. Sert à valider le contenu.
- [ ] Affichage 410 pages / 40 lignes / 80 colonnes
- [ ] Navigation clavier
- [ ] Barre d'adresse + URL synchronisée
**Sortie :** on peut lire un livre, partager l'URL, retomber sur le même texte.

## Phase 4 — La galerie 3D
- [ ] Géométrie de l'hexagone (4 murs, 5 étagères, 32 livres, couloirs)
- [ ] 640 livres en un seul InstancedMesh
- [ ] Éclairage : la lampe sphérique de Borges
- [ ] Puits central + balustrade + escalier
**Sortie :** 60 fps stables, < 100 draw calls, mesuré au Perf monitor.

## Phase 5 — Navigation et streaming
- [ ] Déplacement à la première personne
- [ ] ChunkManager : hexagones voisins seulement, pool d'objets
- [ ] Transition marche -> prendre un livre -> lecture
**Sortie :** marcher 5 minutes sans fuite mémoire (heap stable au profiler).

## Phase 5bis — Le Seuil (séquence d'arrivée)
Scène authorée, hors contrainte procédurale. Voir ARCHITECTURE § 9.
- [ ] Extérieur et dôme (demi-sphère)
- [ ] Marches et montée vers l'entrée unique
- [ ] Franchissement du portail
- [ ] Grand hall et cube flottant au centre
- [ ] Enchaînement Seuil -> Bibliothèque, avec préchargement des premiers chunks
**Sortie :** les 30 premières secondes du site donnent envie. C'est le test.

## Phase 6 — Esthétique
La phase où on a le droit d'être ambitieux, parce que le reste tient.
- [x] Direction artistique arrêtée (voir DIRECTION-ARTISTIQUE.md)
- [ ] Lightmaps bakées du Seuil
- [ ] Matériaux : calcaire mat, marbre veiné, or émissif, sol réfléchissant
- [ ] Post-processing : bloom, grain, vignettage, aberration
- [ ] Son d'ambiance
- [ ] Écran d'entrée
**Sortie :** ça a une identité, ça ne ressemble pas à une démo three.js.

## Phase 7 — Finition
- [ ] Mode dégradé mobile
- [ ] Recherche par texte (bijection inverse) exposée dans l'UI
- [ ] Accessibilité de l'overlay, réduction des animations
- [ ] Déploiement statique

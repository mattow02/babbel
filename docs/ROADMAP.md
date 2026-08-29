# Roadmap — Babbel

État : **Phase 0 — recherche terminée, en attente de validation des choix.**
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
- [ ] Reste ouvert : schéma de contrôle, direction artistique (captures de la
      vidéo attendues), recherche inverse, mobile

## Phase 1 — Le cœur mathématique
Pur TypeScript, aucun rendu. C'est la fondation.
- [ ] `core/alphabet.ts` — jeu de caractères, encode/decode base-N
- [ ] `core/layout.ts` — constantes Borges
- [ ] `core/address.ts` — Address <-> URL
- [ ] `core/bijection.ts` — LCG BigInt inversible + couche XOR/shift
- [ ] `core/page.ts` — address -> 3 200 caractères, et l'inverse
- [ ] Tests Vitest
**Sortie :** `inverse(forward(x)) === x` sur 10 000 tirages aléatoires, vert.
Une adresse donne toujours la même page. Une page retrouve son adresse.

## Phase 2 — Génération asynchrone
- [ ] `workers/page.worker.ts`
- [ ] Client promisifié + cache LRU
- [ ] Préchargement des pages n−1 / n+1
**Sortie :** tourner 100 pages d'affilée sans une seule frame perdue.

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
- [ ] Direction artistique arrêtée (moodboard, palette, matériaux)
- [ ] Post-processing : bloom, grain, vignettage, aberration
- [ ] Son d'ambiance
- [ ] Écran d'entrée
**Sortie :** ça a une identité, ça ne ressemble pas à une démo three.js.

## Phase 7 — Finition
- [ ] Mode dégradé mobile
- [ ] Recherche par texte (bijection inverse) exposée dans l'UI
- [ ] Accessibilité de l'overlay, réduction des animations
- [ ] Déploiement statique

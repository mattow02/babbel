# Décisions — Babbel (ADR)

Chaque décision structurante, avec sa raison. On n'annule pas une décision
sans écrire pourquoi.

## Prises

### D1 — Génération procédurale intégrale
25^1 312 000 livres : aucun stockage possible. Le contenu est une fonction pure
de l'adresse. Conséquence : pas de backend, déploiement statique, coût ~0.

### D2 — Bijection à l'échelle de la page, pas du livre
Un livre = 1 312 000 caractères ≈ 6,1 Mbits en BigInt : les opérations
modulaires deviennent lourdes. Une page = 3 200 caractères ≈ 14,9 kbits :
sous la milliseconde. C'est aussi ce que fait libraryofbabel.info, et ça
correspond exactement à la demande (génération au tournage de page).

### D3 — Calcul dans un Web Worker
Le thread qui dessine ne calcule jamais. Même si c'est rapide, le principe
protège le framerate pour toujours.

### D4 — BigInt natif, pas de GMP/WASM
JS a BigInt en natif ; à l'échelle page, aucune raison d'ajouter du WASM.
Réévaluer seulement si on passe à une bijection au niveau du livre.

### D5 — InstancedMesh systématique
Le facteur limitant en WebGL2 est le nombre de draw calls, pas les polygones.
640 livres par hexagone => 1 draw call.

### D6 — Streaming par chunks
On ne charge que l'hexagone courant et ses voisins visibles. L'infini est
suggéré par l'obscurité et le brouillard, jamais instancié.

### D7 — Une seule page de texte réel à la fois
Les livres lointains n'ont aucun texte généré, seulement une texture.
C'est ce qui rend l'ensemble tenable.

### D8 — `core/` sans dépendance
Le cœur mathématique est du TypeScript pur, testable sans navigateur.
Le rendu peut être entièrement réécrit sans y toucher.


### D9 — Alphabet : 25 symboles, fidèle à Borges
22 lettres + espace + virgule + point. Choix de fidélité assumé contre la
lisibilité des fragments (l'option 29 caractères de libraryofbabel.info est
écartée). L'alphabet reste **paramétré** dans `core/alphabet.ts` : rien dans le
code ne doit supposer 25 en dur, pour pouvoir changer d'avis sans tout casser.
Décidé le 2026-08-29.

### D10 — Vite + React + TypeScript
Pas de SSR ni d'API à servir : l'expérience est entièrement cliente. HMR rapide,
ce qui est décisif quand on itère sur de la 3D. Build statique.
Décidé le 2026-08-29.

### D11 — Deux mondes distincts : le Seuil et la Bibliothèque
Le projet contient **deux natures de scène**, à ne jamais confondre :

1. **Le Seuil** — scène *authorée à la main*, finie, composée : on arrive à
   l'extérieur, on voit le dôme (demi-sphère), on monte les marches, on franchit
   l'entrée unique, on débouche dans le grand hall où flotte le cube.
   C'est la séquence d'arrivée, le morceau de bravoure esthétique. Budget de
   rendu généreux (scène unique, chargée une fois, jamais dupliquée).
2. **La Bibliothèque** — infinie, *procédurale*, streamée par chunks,
   sous contrainte permanente de draw calls et de mémoire.

Conséquence : deux budgets de performance, deux méthodes de construction, deux
dossiers séparés dans `src/scene/`. Le Seuil peut se permettre ce que la
Bibliothèque ne peut pas. Décidé le 2026-08-29.

### D12 — Navigation à la première personne, sans ZQSD
La première personne est retenue (immersion), mais le clavier ZQSD est écarté :
inconfortable, et inadapté à un site web qu'on visite au trackpad ou au doigt.
Le schéma de contrôle exact reste à trancher (voir O3').
Décidé le 2026-08-29.


### D13 — Schéma de contrôle : clic maintenu + points d'intérêt
- souris : oriente le regard en continu ;
- clic maintenu : on avance vers où l'on regarde ; relâcher : on s'arrête ;
- clic sur un point d'intérêt (étagère, couloir, escalier, livre) : travelling
  cadré vers lui, la caméra compose le plan elle-même ;
- tactile : doigt appuyé = avancer, glissé = regarder. Même logique, rien à réécrire ;
- ZQSD reste fonctionnel en fallback silencieux, jamais annoncé dans l'UI.

Une seule règle à comprendre, une seule main, et les beaux plans sont placés
dans les points d'intérêt plutôt que laissés au hasard du joueur.
Contraintes de confort : accélérations douces, FOV 55-65°, respect de
`prefers-reduced-motion`. Décidé le 2026-08-29.

### D14 — Bijection inversible dès le départ, recherche exposée plus tard
Le LCG est inversible **par construction** : rendre `core/bijection.ts`
réversible ne coûte rien de plus maintenant, alors que l'ajouter après
obligerait à tout reconcevoir. On implémente donc l'inverse et son test dès la
Phase 1, mais l'interface de recherche n'entre dans le périmètre qu'en Phase 7.
Décidé le 2026-08-29.

### D15 — Desktop cible v1, mobile en mode dégradé prévu dès le départ
La qualité visuelle se juge sur desktop. Mais les leviers de dégradation
(`dpr` plafonné, post-processing réduit, LOD agressif, distance de streaming
raccourcie) sont prévus dans l'architecture dès maintenant, pour ne pas avoir à
la retourner plus tard. Décidé le 2026-08-29.


### D16 — Direction artistique arrêtée, et éclairage baké au Seuil
DA établie à partir des 10 captures de `design/` (film « Viens, je vais te
Montrer l'Infini »), documentée dans `docs/DIRECTION-ARTISTIQUE.md`.
Parti pris : **deux régimes de lumière** — le Seuil solaire et doré, la
Bibliothèque ténébreuse — qui recoupe exactement le découpage D11.

Décision technique qui en découle : **le Seuil, étant statique, aura son
éclairage précalculé en lightmaps** (baking hors ligne, chargé comme texture).
C'est ce qui rend atteignable en WebGL une qualité proche des rendus offline de
référence. La Bibliothèque, procédurale, ne peut pas être bakée : elle sera donc
sombre, avec très peu de sources dynamiques — ce qui est précisément le parti
pris artistique du film. La contrainte technique et l'intention esthétique
coïncident. Décidé le 2026-08-29.

## Ouvertes (à trancher avec l'utilisateur)

_Aucune. Toutes les décisions de cadrage sont prises._

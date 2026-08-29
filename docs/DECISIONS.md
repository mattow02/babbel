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

## Ouvertes (à trancher avec l'utilisateur)

- **O1** — Alphabet : 25 symboles (fidèle à Borges) ou 29 (a–z + espace +
  virgule + point, comme libraryofbabel.info, texte plus lisible) ?
- **O2** — Recherche inverse (« trouver où se trouve ce texte ») : dans le
  périmètre v1 ou plus tard ? Elle contraint fortement la bijection.
- **O3** — Navigation : première personne libre (pointer lock) ou déplacement
  par points d'intérêt (plus cinématographique, plus accessible, moins de
  mal des transports) ?
- **O4** — Direction artistique : quel registre ?
- **O5** — Vite ou Next.js ?
- **O6** — Mobile : cible v1 ou desktop d'abord ?

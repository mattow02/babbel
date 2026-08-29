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

## Ouvertes (à trancher avec l'utilisateur)

- **O2** — Recherche inverse (« trouver où se trouve ce texte ») : dans le
  périmètre v1 ou plus tard ? Elle contraint fortement la bijection.
- **O3'** — Schéma de contrôle exact de la première personne (voir D12).
- **O4'** — Direction artistique : référence = la vidéo « Le Vertige Infini de
  la Bibliothèque de Babel » (youtube.com/watch?v=J3JsyxABi0g). Non consultable
  par Claude (pas d'accès aux images). **En attente de captures d'écran.**
- **O6** — Mobile : cible v1 ou desktop d'abord ?

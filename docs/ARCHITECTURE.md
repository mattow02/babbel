# Architecture — Babbel

> Proposition d'architecture. À valider avant la première ligne de code applicatif.
> Version 0.1 — 2026-08-29

## 1. Principe directeur

**Rien n'est stocké. Tout est une fonction pure de l'adresse.**

```
adresse (hex, mur, étagère, volume, page) --[bijection]--> 3 200 caractères
```

Toute la conception découle de là :
- pas de base de données, pas d'API, pas de backend ;
- déploiement 100 % statique ;
- le navigateur du visiteur fait tout le travail ;
- une adresse est une URL partageable, et l'URL est la seule source de vérité.

## 2. Stack proposée

| Couche | Choix | Pourquoi |
|---|---|---|
| Build | **Vite** + TypeScript strict | zéro backend nécessaire, HMR rapide (crucial en 3D), build statique |
| UI | **React 19** | écosystème 3D, composants d'overlay |
| 3D | **three.js** via **@react-three/fiber** | déclaratif, se compose avec React, standard de fait |
| Helpers 3D | **@react-three/drei** | `<Text>` (troika), contrôles, LOD, perf monitor |
| Post-process | **@react-three/postprocessing** | bloom/vignette/grain : l'essentiel de l'esthétique |
| État | **zustand** | store hors-React pour la boucle de rendu (pas de re-render par frame) |
| Style overlay | **Tailwind v4** + CSS modules | overlay 2D uniquement |
| Calcul | **Web Worker** + **BigInt natif** | pas de GMP/WASM nécessaire |
| Tests | **Vitest** | le cœur (bijection) doit être testé, c'est du pur calcul |
| Qualité | ESLint + Prettier + `tsc --noEmit` en CI | |

**Alternative écartée : Next.js.** Aucun besoin de SSR ni d'API routes ; la
page est une expérience 3D client. Vite est plus simple et plus rapide ici.
(À rediscuter si on veut du SEO sur des pages éditoriales autour.)

## 3. Structure des dossiers

```
Babbel/
├── CLAUDE.md                  # contexte projet (lu automatiquement)
├── README.md
├── docs/
│   ├── RECHERCHE.md           # sources et faits établis
│   ├── ARCHITECTURE.md        # ce fichier
│   ├── ROADMAP.md             # phases et état d'avancement
│   └── DECISIONS.md           # ADR : chaque choix structurant + son pourquoi
├── public/
│   └── fonts/                 # .woff pour troika
└── src/
    ├── main.tsx
    ├── App.tsx
    │
    ├── core/                  # ❗ ZÉRO dépendance à React ou three.js
    │   ├── alphabet.ts        # jeu de caractères, encode/decode
    │   ├── address.ts         # type Address, sérialisation <-> URL
    │   ├── bijection.ts       # LCG inversible en BigInt (le cœur)
    │   ├── page.ts            # address -> page (3200 car.) et inverse
    │   ├── layout.ts          # constantes Borges (640 livres, 410 pages...)
    │   └── __tests__/         # tests unitaires : c'est ici que ça compte
    │
    ├── workers/
    │   ├── page.worker.ts     # génère les pages hors thread principal
    │   └── client.ts          # API promisifiée du worker + cache LRU
    │
    ├── scene/                 # tout le three.js
    │   ├── Library.tsx        # racine de la scène
    │   ├── hexagon/           # géométrie de la galerie
    │   │   ├── Hexagon.tsx
    │   │   ├── Shelves.tsx    # InstancedMesh des 640 livres
    │   │   └── Corridor.tsx
    │   ├── book/
    │   │   ├── BookMesh.tsx
    │   │   └── OpenBook.tsx   # livre ouvert + <Text> troika
    │   ├── streaming/
    │   │   ├── ChunkManager.ts# charge/décharge les hexagones voisins
    │   │   └── pool.ts        # pool d'objets recyclés
    │   ├── lighting/
    │   ├── materials/
    │   └── effects/           # post-processing
    │
    ├── controls/
    │   ├── usePlayerControls.ts  # déplacement (pointer lock / clavier)
    │   └── useCameraModes.ts     # marche / lecture / transition
    │
    ├── ui/                    # overlay 2D (HTML par-dessus le canvas)
    │   ├── Reader.tsx         # interface de lecture d'un livre
    │   ├── AddressBar.tsx     # adresse courante, copiable
    │   ├── Search.tsx         # recherche par texte (bijection inverse)
    │   └── Loader.tsx
    │
    ├── store/
    │   └── useLibraryStore.ts # zustand : adresse courante, mode, livre ouvert
    │
    └── styles/
```

### La règle structurante
`core/` est du **TypeScript pur, testable, sans aucune dépendance**.
On doit pouvoir lancer `vitest` dessus sans navigateur ni GPU.
Si le rendu 3D change complètement, `core/` ne bouge pas d'une ligne.

## 4. Le modèle de données

```ts
// src/core/address.ts
type Address = {
  hex: bigint      // identifiant de galerie (arbitrairement grand)
  wall: 0|1|2|3    // 4 murs porteurs
  shelf: 0..4      // 5 étagères
  volume: 0..31    // 32 livres
  page: 1..410
}
```
Sérialisation URL : `/hex/{hex}/{wall}/{shelf}/{volume}/{page}`
=> partageable, bookmarkable, et l'app se restaure entièrement depuis l'URL.

## 5. Le cœur : la bijection

```
index de page (BigInt)  <--LCG inversible-->  entier < 25^3200
                                                     |
                                        écriture en base 25
                                                     |
                                            3 200 caractères
```

- `m` > 25^3200, `a` et `c` selon Hull–Dobell, `a⁻¹` par Euclide étendu.
- Couche XOR/décalages réversible par-dessus, pour casser les motifs du LCG.
- **Test de non-régression obligatoire** : `inverse(forward(x)) === x` sur un
  grand échantillon aléatoire. Si ce test casse, tout le projet est faux.

## 6. Boucle de rendu et budget

Budget par frame à 60 fps = **16,6 ms**. Discipline :
- 0 allocation dans `useFrame` (pas de `new Vector3()` par frame) ;
- 0 `setState` React par frame (on passe par zustand / refs) ;
- draw calls sous ~100 : instancing systématique ;
- `dpr` plafonné (1.5 desktop, 1 mobile) ;
- un `<Perf>` (drei) actif en dev, toujours.

## 7. Stratégie de LOD (le point de performance décisif)

| Distance | Livre | Texte |
|---|---|---|
| Galerie voisine | InstancedMesh, géométrie boîte | aucun |
| Étagère devant soi | idem + tranche texturée | texture procédurale (aucun calcul) |
| Livre pris en main | mesh dédié | aucun |
| Livre ouvert | mesh dédié + pages | **troika SDF, texte réellement généré** |

**Une seule page de texte réel existe à la fois.** C'est ce qui rend le projet
viable : l'infini n'est jamais calculé, seulement suggéré.

## 8. Ordre de développement (pourquoi cet ordre)

On construit du **plus contraint vers le plus libre** :
1. le cœur mathématique (contrainte absolue, non négociable) ;
2. la génération asynchrone (contrainte de performance) ;
3. la lecture 2D (valide que le contenu est juste, sans 3D) ;
4. la galerie 3D (contrainte de rendu) ;
5. la navigation et le streaming (contrainte de mémoire) ;
6. l'esthétique et l'ambiance (le seul espace vraiment libre).

Faire l'inverse (commencer par la 3D jolie) mènerait à tout refaire.

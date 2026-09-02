# Architecture : Babbel

> Proposition d'architecture. À valider avant la première ligne de code applicatif.
> Version 0.1 : 2026-08-29

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
| Build | **Vite** + TypeScript strict | zéro backend nécessaire, HMR rapide, build statique |
| UI | **React 19** | tout le site, scènes comprises |
| Dessin | **SVG** calculé en React | le trait est net à toute résolution, chaque volume est un noeud cliquable |
| Perspective | maths pures, `vue2d/perspective.ts` | testable sans navigateur : 640 tranches, 640 adresses |
| État | **zustand** | store hors-React, une seule source de vérité |
| Style | **CSS** dans `src/ui/styles.css` | le site tient en un fichier |
| Calcul | **Web Worker** + **BigInt natif** | pas de GMP/WASM nécessaire |
| Tests | **Vitest** | le cœur (bijection) doit être testé, c'est du pur calcul |
| Qualité | ESLint + Prettier + `tsc --noEmit` en CI | |

**Stack confirmée le 2026-08-29.** Next.js écarté : aucun besoin de SSR ni
d'API routes, l'expérience est entièrement cliente.

**Revue le 2026-09-03 (décision D62).** three.js, @react-three/fiber, drei et
postprocessing ont été retirés : le moteur 3D pesait 1,1 Mo sur 1,3, et une
illustration dessinée rendait mieux. Les scènes sont désormais du SVG calculé.
Le site entier tient en 232 Ko. La couche `core/` n'a pas bougé d'une ligne,
ce qui était exactement le pari de la règle structurante ci-dessous.

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
└── src/
    ├── main.tsx
    ├── App.tsx
    │
    ├── core/                  # ❗ ZÉRO dépendance à React
    │   ├── alphabet.ts        # jeu de caractères, encode/decode
    │   ├── address.ts         # type Address, sérialisation <-> URL
    │   ├── bijection.ts       # LCG inversible en BigInt (le cœur)
    │   ├── page.ts            # address -> page (3200 car.) et inverse
    │   ├── layout.ts          # constantes Borges (640 livres, 410 pages...)
    │   └── __tests__/         # tests unitaires : c'est ici que ça compte
    │
    ├── workers/
    │   ├── page.worker.ts     # génère les pages hors thread principal
    │   ├── protocol.ts        # le contrat entre les deux threads
    │   ├── engine.ts          # worker réel / calcul direct de repli / injectable
    │   ├── cache.ts           # LRU générique
    │   ├── neighbourhood.ts   # quelles pages précharger, dans quel ordre
    │   └── client.ts          # PageLibrary : peek / read / prefetch
    │
    ├── vue2d/                 # les scènes dessinées
    │   ├── perspective.ts     # ❗ maths pures : la galerie en fuite centrale
    │   ├── couleurs.ts        # palette des dos, usure déterministe par adresse
    │   ├── hash.ts            # bruit non affine (D32)
    │   ├── etages.ts          # galerie = étage x 25^800 + colonne (D43)
    │   ├── Galerie.tsx        # l'hexagone : 640 tranches cliquables, puits, lampe
    │   └── Seuil.tsx          # la scène d'arrivée
    ├── reader/                # le lecteur de page
    ├── search/                # la recherche par texte
    └── styles/
```

### La règle structurante
`core/` est du **TypeScript pur, testable, sans aucune dépendance**.
On doit pouvoir lancer `vitest` dessus sans navigateur ni GPU.
Si le rendu change complètement, `core/` ne bouge pas d'une ligne. **C'est
arrivé** : le moteur 3D a été supprimé le 2026-09-03 et `core/` n'a pas bougé.

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
3. la lecture (valide que le contenu est juste, sans décor) ;
4. la galerie (contrainte de rendu) ;
5. la navigation ;
6. l'esthétique et l'ambiance (le seul espace vraiment libre).

Faire l'inverse mènerait à tout refaire. La suite l'a montré à l'envers : le
rendu a été refait de fond en comble sans qu'une ligne du cœur ne change.


## 9. Les deux mondes (décision D11)

Le projet contient deux natures de scène qu'il ne faut jamais confondre, ni dans
le code ni dans le budget de performance.

| | **Le Seuil** (`scene/threshold/`) | **La Bibliothèque** (`scene/hexagon/`) |
|---|---|---|
| Nature | authorée à la main, finie | procédurale, infinie |
| Contenu | extérieur, dôme, marches, entrée unique, grand hall, cube flottant | galeries hexagonales, 640 livres chacune |
| Chargement | une fois, à l'arrivée | streaming permanent par chunks |
| Budget | généreux : scène unique, jamais dupliquée. On peut y mettre des matériaux coûteux, de la géométrie détaillée, un éclairage travaillé | serré : instancing obligatoire, LOD, pool d'objets |
| Rôle | le morceau de bravoure esthétique, la première impression | le vertige, l'infini, la lecture |

La séquence d'arrivée est le premier contact du visiteur avec le site : c'est
là que se joue l'impression esthétique. Elle a le droit d'être chère, parce
qu'elle est unique et qu'on la quitte ensuite.

### Parcours d'arrivée
```
extérieur (on voit le dôme) → montée des marches → franchissement de l'entrée
unique → grand hall, le cube flotte au centre → descente/entrée dans les galeries
```
Chaque transition est une occasion de composition. Le passage du Seuil à la
Bibliothèque est aussi le moment naturel pour précharger les premiers chunks.

## 10. Navigation (décision D12, schéma à trancher)

Première personne retenue, ZQSD écarté. Le schéma doit satisfaire :
- **une seule main, une souris ou un trackpad** : c'est un site web, pas un jeu ;
- **aucun apprentissage** : le visiteur comprend en trois secondes ;
- **transposable au tactile** sans réécrire la logique ;
- **peu de mal des transports** : accélérations douces, pas de secousses,
  FOV modéré (55–65°), respect de `prefers-reduced-motion`.

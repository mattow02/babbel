# Babbel — La Bibliothèque de Babel en 3D

> Fichier de contexte projet. Chargé automatiquement quand Claude est ouvert
> depuis `~/projets/Babbel`. À tenir à jour à chaque session notable.

## Comment fonctionne ce fichier
Claude Code charge, en cumulant :
1. `~/.claude/CLAUDE.md` — global, toutes machines/projets ;
2. **ce fichier**, `~/projets/Babbel/CLAUDE.md` — projet, chargé dès que le
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
| `docs/DECISIONS.md` | Chaque choix structurant + son pourquoi (ADR) |

**Avant toute session de dev : lire ROADMAP.md pour savoir où on en est.**

## Les 3 faits techniques à ne jamais oublier

1. **25^1 312 000 livres.** Rien n'est stockable. Tout est une fonction pure
   de l'adresse. Il n'y a pas de base de données, il n'y en aura jamais.
2. **La bijection opère à l'échelle de la page** (3 200 caractères ≈ 14,9 kbits
   en BigInt), pas du livre (6,1 Mbits, trop lourd).
3. **Le facteur limitant en 3D est le nombre de draw calls**, pas les polygones.
   InstancedMesh partout, streaming par chunks, une seule page de texte réel
   existante à la fois.

## Disciplines de dev
- `src/core/` est du TypeScript pur : **aucune** dépendance à React ou three.js.
  Testable sans navigateur. Si le rendu change, le cœur ne bouge pas.
- Tout calcul dans un Web Worker. Le thread de rendu ne calcule jamais.
- Zéro allocation et zéro `setState` React dans `useFrame`.
- Le test `inverse(forward(x)) === x` est le test le plus important du projet.
  S'il casse, tout est faux.
- Mesurer avant d'optimiser : `<Perf>` de drei actif en dev.

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

## Ressources
- **Vidéo de référence** : « Le Vertige Infini de la Bibliothèque de Babel »
  <https://www.youtube.com/watch?v=J3JsyxABi0g>
  ⚠️ Claude ne peut pas voir les images d'une vidéo YouTube. La direction
  artistique s'appuiera sur des **captures d'écran** fournies par l'utilisateur.
- [ ] Captures d'écran de la vidéo (en attente)

## Journal
- **2026-08-29** — Création du projet. Phase 0 : recherche faite (Borges,
  algorithme de libraryofbabel.info, limites navigateur), architecture et
  roadmap rédigées. En attente des arbitrages `docs/DECISIONS.md` § ouvertes.
  Aucun code applicatif écrit à ce stade, volontairement.
  Arbitrages rendus dans la foulée : D9 à D12 (voir DECISIONS.md).

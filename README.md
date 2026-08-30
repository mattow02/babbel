# Babbel

La Bibliothèque de Babel de Borges, visitable en 3D dans le navigateur.

Chaque livre — 410 pages, 40 lignes, 80 caractères, 25 symboles — est généré à
la volée par une bijection déterministe entre une adresse dans la bibliothèque
et son contenu. Rien n'est stocké : 25^1 312 000 livres ne tiennent nulle part.

## Ce que c'est, techniquement

- **Aucun serveur, aucune base de données.** 25^1 312 000 livres ne tiennent
  nulle part : le contenu est une fonction pure de l'adresse.
- **Bijection inversible** entre l'adresse d'une page et son texte, ce qui
  permet aussi l'inverse : écrire une phrase et calculer *où* elle se trouve.
- **Rien n'est téléchargé** : ni texture, ni police, ni son. Le ciel, la
  poussière et l'ambiance sonore sont synthétisés dans le navigateur.
- **L'adresse vit dans le fragment de l'URL**, qui n'est jamais envoyé au
  serveur : l'hébergeur ne peut donc pas savoir ce que vous lisez.

## Démarrer

```sh
npm install
npm run dev       # développement
npm run check     # types + lint + 207 tests
npm run build     # produit dist/
```

## Déployer

Le site est **entièrement statique**. Il suffit de servir `dist/`.

Aucune réécriture de route n'est nécessaire : l'adresse d'une page vit dans le
fragment de l'URL (voir [décision D20](docs/DECISIONS.md)), et un fragment ne
quitte jamais le navigateur. N'importe quel hébergeur statique convient —
Vercel, Netlify, Cloudflare Pages, GitHub Pages, un simple `nginx`.

```sh
npm run build && npx vercel deploy --prod dist
```

`vercel.json` ne fait qu'une chose : mettre en cache les fichiers versionnés.

**État : phase 7.** Voir [`docs/ROADMAP.md`](docs/ROADMAP.md).

## Documentation
- [Recherche](docs/RECHERCHE.md) — les faits et leurs sources
- [Architecture](docs/ARCHITECTURE.md) — stack et structure
- [Roadmap](docs/ROADMAP.md) — les phases
- [Décisions](docs/DECISIONS.md) — les choix et leurs raisons

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

/**
 * Configuration de test separee de celle de Vite, volontairement.
 *
 * Le coeur (src/core) est du TypeScript pur : il se teste sans navigateur,
 * sans DOM et sans le moindre plugin de rendu. Garder les deux configurations
 * distinctes rend cette independance visible, et evite d'avoir a faire
 * cohabiter les types de Vite et ceux de Vitest.
 *
 * L'environnement par defaut reste `node` : la tres grande majorite des tests
 * porte sur de la logique pure et n'a aucune raison de payer un DOM. Les
 * quelques fichiers qui montent des composants demandent `jsdom` par une
 * annotation en tete de fichier.
 */
export default defineConfig({
  plugins: [react()],
  test: {
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    environment: 'node',
    globals: false,
    restoreMocks: true,
    /*
     * Le delai par defaut de cinq secondes est trop court ici.
     *
     * Deux tests sont VOLONTAIREMENT lourds : deux mille allers-retours de la
     * bijection sur des entiers de 14 861 bits, et deux cent mille echantillons
     * de bruit brun. Ils durent plusieurs secondes meme sur une machine au
     * repos, et les voir echouer parce que le disque etait occupe n'apprend
     * rien a personne.
     */
    testTimeout: 30_000,
  },
})

import { defineConfig } from 'vitest/config'

/**
 * Configuration de test separee de celle de Vite, volontairement.
 *
 * Le coeur (src/core) est du TypeScript pur : il se teste sans navigateur,
 * sans DOM et sans le moindre plugin de rendu. Garder les deux configurations
 * distinctes rend cette independance visible, et evite d'avoir a faire
 * cohabiter les types de Vite et ceux de Vitest.
 */
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
})

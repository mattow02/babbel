/**
 * Publier la bibliotheque sous cobaalt.app/babel.
 *
 * Le site est entierement statique : le plus simple est de le construire avec
 * la bonne base et de deposer le resultat dans le dossier public de Cobaalt,
 * qui le sert tel quel.
 *
 * Le resultat est donc versionne chez Cobaalt, ce qui contredit la regle
 * habituelle de ne jamais versionner ce qui se reconstruit. C'est assume : le
 * gain est qu'un seul deploiement met les deux en ligne, et le cout est borne
 * a un megaoctet et demi. Ce script existe pour que ce dossier ne soit jamais
 * un depot mysterieux : une commande le refait a l'identique.
 *
 *   npm run publier
 */
import { spawnSync } from 'node:child_process'
import { cp, rm, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'

const CIBLE = process.env.COBAALT ?? '../cobaalt/web/public/babel'

if (!existsSync(new URL(`${CIBLE}/..`, import.meta.url).pathname) && !existsSync(`${CIBLE}/..`)) {
  console.error(`Le dossier public de Cobaalt est introuvable : ${CIBLE}`)
  console.error('Preciser son chemin avec COBAALT=... npm run publier')
  process.exit(1)
}

const build = spawnSync('./node_modules/.bin/vite', ['build', '--base=/babel/'], { stdio: 'inherit' })
if (build.status !== 0) process.exit(build.status ?? 1)

await rm(CIBLE, { recursive: true, force: true })
await mkdir(CIBLE, { recursive: true })
await cp('dist', CIBLE, { recursive: true })
console.log(`Depose dans ${CIBLE}. Il reste a commiter cobaalt-web.`)

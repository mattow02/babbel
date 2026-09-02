/**
 * Les directions visuelles, rendues par le moteur lui-meme.
 *
 * On ne dessine pas une intention pour la coder ensuite : on regle le rendu et
 * on le photographie. Ce qui est choisi est donc, par construction, ce que le
 * site sait faire.
 *
 *   npm run variantes
 */
import { chromium } from 'playwright-core'
import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const PORT = 4321
const SORTIE = 'docs/captures/variantes'
const LARGEUR = 1200
const HAUTEUR = 700
const CHEMINS = [process.env.CHROME_PATH, '/usr/bin/google-chrome', '/usr/bin/chromium'].filter(Boolean)
const attendre = (ms) => new Promise((r) => setTimeout(r, ms))

async function servir() {
  const s = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' })
  for (let i = 0; i < 40; i += 1) {
    try { if ((await fetch(`http://localhost:${PORT}/`)).ok) return s } catch { /* pas encore */ }
    await attendre(250)
  }
  s.kill(); throw new Error('vite preview n a pas demarre')
}

async function main() {
  const executablePath = CHEMINS.find(Boolean)
  const serveur = await servir()
  await mkdir(SORTIE, { recursive: true })
  const vue = process.argv[3] ?? 'galerie'
  const rangs = process.argv[2] ? [Number(process.argv[2])] : [0, 1, 2, 3, 4]
  const releve = []

  for (const rang of rangs) {
    const navigateur = await chromium.launch({ executablePath, args: ['--disable-dev-shm-usage'] })
    const page = await navigateur.newPage({
      viewport: { width: LARGEUR, height: HAUTEUR },
      reducedMotion: 'no-preference',
    })
    page.setDefaultTimeout(45000)
    try {
      await page.goto(`http://localhost:${PORT}/?sonde&look=${rang}`, { waitUntil: 'load' })
      await page.getByRole('button', { name: 'entrer' }).click()
      await page.waitForFunction(() => Boolean(window.__babbelVues), null, { timeout: 60000 })
      const v = (await page.evaluate(() => window.__babbelVues())).find((x) => x.nom === vue)
      await page.evaluate((s) => window.__babbelStage(s), v.stage)
      await attendre(1500)
      await page.evaluate(() => window.__babbelStep(10))
      if (v.position) {
        await page.evaluate((a) => window.__babbelPlace(a[0], a[1], a[2]), [v.position.x, v.position.z, v.yaw])
        await page.evaluate(() => window.__babbelStep(10))
      }
      await attendre(400)
      await page.evaluate(() => window.__babbelStep(20))
      const png = await page.evaluate((c) => window.__babbelImage(c), LARGEUR)
      await writeFile(join(SORTIE, `${rang}-${vue}.png`), Buffer.from(png.split(',')[1], 'base64'))
      const b = await page.evaluate(() => window.__babbelBench(20))
      releve.push({ rang, appels: b.calls })
      console.log(`${rang} : ${b.calls} appels de rendu`)
    } catch (e) {
      console.log(`${rang} : ECHEC ${String(e.message).split('\n')[0]}`)
    } finally {
      await Promise.race([navigateur.close().catch(() => {}), attendre(12000)])
      await attendre(1500)
    }
  }
  serveur.kill()
  console.log(`\n${releve.length} variantes dans ${SORTIE}/`)
}

main().catch((e) => { console.error(e.message); process.exit(1) })

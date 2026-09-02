/**
 * Les captures de reference.
 *
 * Juger un rendu sur des images prises a la main ne prouve rien : deux
 * captures ne cadrent jamais pareil, et l'ecart mesure entre deux versions
 * finit par mesurer le cadrage. Ce script rejoue toujours les memes points de
 * vue, dans le meme ordre, et ecrit a cote des images les nombres qui
 * permettent de comparer (voir docs/PLAN-ESTHETIQUE.md).
 *
 * Il ne decide de rien : la liste des vues, la mesure et les criteres vivent
 * dans le code teste (`scene/vues.ts`, `mesure/photometrie.ts`) et sont lus
 * depuis la page. Un script qui tiendrait sa propre copie finirait par avoir
 * raison contre le projet.
 *
 * Usage :
 *   npm run captures
 *   CHROME_PATH=/usr/bin/chromium npm run captures
 */
import { chromium } from 'playwright-core'
import { spawn } from 'node:child_process'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const PORT = 4319
const SORTIE = 'docs/captures/reference'
const LARGEUR = 1600
const HAUTEUR = 900

/** Chrome n'est pas telecharge par le projet : on utilise celui de la machine. */
const CHEMINS = [
  process.env.CHROME_PATH,
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean)

async function attendre(ms) {
  await new Promise((r) => setTimeout(r, ms))
}

async function servir() {
  const serveur = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], {
    stdio: 'ignore',
  })
  for (let essai = 0; essai < 40; essai += 1) {
    try {
      const r = await fetch(`http://localhost:${PORT}/`)
      if (r.ok) return serveur
    } catch {
      /* pas encore la */
    }
    await attendre(250)
  }
  serveur.kill()
  throw new Error('vite preview n a pas demarre : lancer `npm run build` d abord ?')
}

async function main() {
  const executablePath = CHEMINS.find(Boolean)
  const serveur = await servir()

  /*
   * Une page neuve par vue.
   *
   * Enchainer les vues dans le meme onglet paraissait economique, et c'etait
   * faux : le passage du hall a la bibliotheque remonte toute la scene, les
   * textures de la vue precedente survivent, et l'onglet finit par rendre
   * l'ame au milieu de la serie. Une mesure doit etre independante de celle
   * qui la precede, sinon elle mesure aussi l'historique.
   */
  const preparer = async () => {
    /*
     * Un navigateur neuf, pas seulement un onglet neuf.
     *
     * Chrome ne garde qu'une poignee de contextes WebGL vivants et les
     * recycle paresseusement : a la quatrieme vue de la serie, la scene
     * n'obtenait plus de contexte et l'onglet restait muet. Relancer coute
     * quelques secondes par vue, et rend la serie insensible a ce qui la
     * precede.
     */
    const navigateur = await chromium.launch({
      executablePath,
      /*
       * Chrome ecrit ses tampons de rendu dans /dev/shm, dont la taille est
       * souvent bridee. Une scene 3D en remplit vite la place, et le moteur
       * de rendu se fait tuer sans un mot : la page « se ferme » au milieu de
       * la serie. Cette option le fait passer par des fichiers ordinaires.
       */
      args: ['--disable-dev-shm-usage'],
    })
    const page = await navigateur.newPage({
      viewport: { width: LARGEUR, height: HAUTEUR },
      deviceScaleFactor: 1,
    })
    page.setDefaultTimeout(45000)
    await page.goto(`http://localhost:${PORT}/?sonde`, { waitUntil: 'load' })
    /*
     * La sonde vit DANS le canevas : elle n'existe qu'une fois la 3D montee,
     * et la 3D n'est montee qu'une fois l'ecran d'entree franchi. C'est voulu
     * (le son demande un geste), et il faut donc franchir cet ecran.
     */
    await page.getByRole('button', { name: 'entrer' }).click()
    await page.waitForFunction(() => Boolean(window.__babbelVues), null, { timeout: 60000 })
    return { navigateur, page }
  }

  const premiere = await preparer()
  const vues = await premiere.page.evaluate(() => window.__babbelVues())
  await premiere.navigateur.close()

  await mkdir(SORTIE, { recursive: true })
  const releve = { date: new Date().toISOString(), largeur: LARGEUR, hauteur: HAUTEUR, vues: {} }
  let manquants = 0

  const filtre = process.argv[2]
  for (const vue of vues.filter((v) => v.nom === filtre)) {
    const { navigateur, page } = await preparer()
    try {
      await page.evaluate((v) => window.__babbelStage(v.stage), vue)
      // Le changement de lieu monte la scene ; le placement ne peut se faire
      // qu'une fois la camera de ce lieu en place.
      await attendre(900)
      if (vue.position) {
        await page.evaluate((v) => {
          window.__babbelPlace(v.position.x, v.position.z, v.yaw)
        }, vue)
        /*
         * Une image au moins avant de faire quoi que ce soit d'autre : la
         * camera ne prend sa nouvelle orientation qu'au rendu suivant, et un
         * tir de reticule lance avant partirait dans l'ancienne direction.
         */
        await page.evaluate(() => window.__babbelStep(3))
        if (process.env.BAVARD) {
          const c = await page.evaluate(() => window.__babbelBench(2).camera)
          console.log(`  [${vue.nom}] demande x=${vue.position.x} z=${vue.position.z} cap=${vue.yaw} -> camera ${JSON.stringify(c.position)}`)
        }
      }
      /*
       * On avance par petites bouffees, avec de vraies pauses entre.
       *
       * Soixante images d'affilee dans une seule evaluation font planter
       * l'onglet des qu'un livre est ouvert : le fil principal ne rend jamais
       * la main, ni au worker qui compose la page, ni au ramasse-miettes.
       */
      if (vue.livre) {
        /*
         * Le volume s'ouvre APRES que la scene est montee et le visiteur
         * pose. Demande en meme temps que le changement de lieu, l'ouverture
         * partait dans le vide : la galerie n'existait pas encore, et la
         * capture montrait l'etagere au lieu du livre.
         */
        /*
         * On insiste, en balayant tres legerement.
         *
         * Deux raisons, et les deux sont reelles : la camera ne prend son
         * orientation qu'au rendu suivant, donc un tir immediat part de
         * l'ancienne direction ; et un rayon perpendiculaire passe entre deux
         * volumes sans rien toucher. Quelques degres d'ecart suffisent, et la
         * capture ne montre pas la difference.
         */
        let ouvert = false
        for (let essai = 0; essai < 10 && !ouvert; essai += 1) {
          const devers = ((essai % 2 === 0 ? 1 : -1) * Math.ceil(essai / 2) * 0.05)
          await page.evaluate(
            (a) => window.__babbelPlace(a[0], a[1], a[2]),
            [vue.position.x, vue.position.z, vue.yaw + devers],
          )
          await page.evaluate(() => window.__babbelStep(5))
          await page.evaluate(() => window.__babbelInteragir())
          ouvert = await page.evaluate(() => Boolean(window.__babbelEtat().opened))
        }
        if (!ouvert) throw new Error('le reticule n a ouvert aucun volume')
        await attendre(6000)
      } else {
        for (let i = 0; i < 6; i += 1) {
          await page.evaluate(() => window.__babbelStep(10))
          await attendre(250)
        }
      }

      const png = await page.evaluate((c) => window.__babbelImage(c), LARGEUR)
      await writeFile(join(SORTIE, `${vue.nom}.png`), Buffer.from(png.split(',')[1], 'base64'))
      const bench = await page.evaluate(() => window.__babbelBench(20))
      const controle = await page.evaluate((nom) => window.__babbelControle(nom), vue.nom)

      releve.vues[vue.nom] = { pourquoi: vue.pourquoi, bench, ...controle }
      manquants += controle?.manques.length ?? 0

      const m = controle.mesure
      const etat = controle.manques.length ? `✗ ${controle.manques.join(' ; ')}` : '✓'
      console.log(
        `${vue.nom.padEnd(9)} ${bench.msParImage.toFixed(2)} ms  ${String(bench.calls).padStart(3)} appels  ` +
          `p95=${m.p95.toFixed(3)} contraste=${m.contraste.toFixed(1)}:1 variation=${m.variationLocale.toFixed(3)}  ${etat}`,
      )
    } catch (erreur) {
      // Une vue qui refuse de se poser ne doit pas emporter la serie.
      const cause = String(erreur.message).split('\n')[0]
      console.log(`${vue.nom.padEnd(9)} ECHEC : ${cause}`)
      releve.vues[vue.nom] = { pourquoi: vue.pourquoi, echec: cause }
    } finally {
      /*
       * On attend vraiment la fermeture, puis on laisse le systeme reprendre
       * ses ressources. Enchainer sans cela laissait des moteurs de rendu
       * derriere nous, et la quatrieme vue de la serie n'obtenait plus de
       * contexte 3D.
       */
      await Promise.race([navigateur.close().catch(() => {}), attendre(15000)])
      await attendre(1500)
    }
  }

  serveur.kill()
  await writeFile(join(SORTIE, `.mesure-${filtre}.json`), `${JSON.stringify(releve.vues, null, 2)}\n`)
  if (manquants > 0) process.exitCode = 0
}

/**
 * L'orchestrateur : une vue par processus.
 *
 * Un navigateur pilote ne rend pas toutes ses ressources en se fermant. A la
 * quatrieme vue de la serie, la scene n'obtenait plus de contexte 3D et
 * l'onglet mourait sans un mot. Relancer le processus entier est la seule
 * isolation qui tienne, et une mesure qui depend de celle d'avant n'en est
 * pas une.
 */
async function orchestrer() {
  const serveur = await servir()
  const executablePath = CHEMINS.find(Boolean)
  const navigateur = await chromium.launch({ executablePath, args: ['--disable-dev-shm-usage'] })
  const page = await navigateur.newPage({ viewport: { width: LARGEUR, height: HAUTEUR } })
  await page.goto(`http://localhost:${PORT}/?sonde`, { waitUntil: 'load' })
  await page.getByRole('button', { name: 'entrer' }).click()
  await page.waitForFunction(() => Boolean(window.__babbelVues), null, { timeout: 60000 })
  const noms = (await page.evaluate(() => window.__babbelVues())).map((v) => v.nom)
  await navigateur.close()
  serveur.kill()
  await attendre(1500)

  await mkdir(SORTIE, { recursive: true })
  const releve = { date: new Date().toISOString(), largeur: LARGEUR, hauteur: HAUTEUR, vues: {} }

  const avecObjectif = new Set(
    (await readFile(new URL('../src/scene/vues.ts', import.meta.url), 'utf8'))
      .split('nom: ')
      .filter((bloc) => bloc.includes('objectif:'))
      .map((bloc) => bloc.slice(1, bloc.indexOf("'", 1))),
  )

  for (const nom of noms) {
    let obtenu = false
    // Une reprise, et une seule : le moteur de rendu d une machine chargee
    // meurt parfois sans raison tenant au projet. Deux echecs de suite, en
    // revanche, disent quelque chose.
    // On ne s y reprend a deux fois que pour les vues qui portent un critere
    // de sortie : ce sont les seules dont l absence rendrait le releve
    // inutilisable, et chaque reprise coute une minute.
    const essais = avecObjectif.has(nom) ? 2 : 1
    for (let essai = 0; essai < essais && !obtenu; essai += 1) {
      if (essai > 0) await attendre(6000)
      await new Promise((resoudre) => {
        const enfant = spawn(process.execPath, [process.argv[1], nom], { stdio: 'inherit' })
        enfant.on('exit', resoudre)
      })
      try {
        const brut = await readFile(join(SORTIE, `.mesure-${nom}.json`), 'utf8')
        const lu = JSON.parse(brut)
        await rm(join(SORTIE, `.mesure-${nom}.json`), { force: true })
        if (!lu[nom]?.echec) {
          Object.assign(releve.vues, lu)
          obtenu = true
        }
      } catch {
        /* on retentera */
      }
    }
    if (!obtenu) releve.vues[nom] = { echec: 'le moteur de rendu n a pas tenu' }
    await attendre(2500)
  }

  await writeFile(join(SORTIE, 'mesures.json'), `${JSON.stringify(releve, null, 2)}\n`)
  const manquants = Object.values(releve.vues).reduce((n, v) => n + (v.manques?.length ?? 0), 0)
  const echecs = Object.values(releve.vues).filter((v) => v.echec).length
  console.log(`\n${noms.length} vues dans ${SORTIE}/`)
  if (echecs) console.log(`${echecs} vue(s) n ont pas pu etre mesurees.`)
  if (manquants) console.log(`${manquants} critere(s) non atteint(s). C est la liste de travail.`)
}

const demandee = process.argv[2]

;(demandee ? main() : orchestrer()).catch((erreur) => {
  console.error(erreur.message)
  process.exit(1)
})

import { describe, expect, it } from 'vitest'
import type { Address } from '../../core/index.ts'
import { pageAt } from '../../core/index.ts'
import { PageLibrary } from '../client.ts'
import { createInlineEngine, type PageEngine } from '../engine.ts'
import { readingNeighbourhood } from '../neighbourhood.ts'

const AT = (page: number): Address => ({ hexagon: 123n, wall: 0, shelf: 1, volume: 2, page })

/** Un moteur factice : compte les appels et differe la reponse, comme un vrai worker. */
function createSpyEngine(): PageEngine & { calls: Address[]; settle: () => Promise<void> } {
  const calls: Address[] = []
  const engine = {
    calls,
    compute(address: Address) {
      calls.push(address)
      return new Promise<string>((resolve) => {
        setTimeout(() => resolve(`page:${address.page}`), 0)
      })
    },
    locate(text: string) {
      return Promise.resolve({ hexagon: BigInt(text.length), wall: 0, shelf: 0, volume: 0, page: 1 })
    },
    dispose() {},
    async settle() {
      await new Promise((resolve) => setTimeout(resolve, 5))
    },
  }
  return engine
}

describe('PageLibrary', () => {
  it('rend le texte du moteur', async () => {
    const library = new PageLibrary({ engine: createSpyEngine() })
    await expect(library.read(AT(1))).resolves.toBe('page:1')
  })

  it('ne genere jamais deux fois la meme page', async () => {
    const engine = createSpyEngine()
    const library = new PageLibrary({ engine })
    await library.read(AT(7))
    await library.read(AT(7))
    await library.read(AT(7))
    expect(engine.calls).toHaveLength(1)
    expect(library.stats.hits).toBe(2)
  })

  it('mutualise deux demandes simultanees sur la meme page', async () => {
    const engine = createSpyEngine()
    const library = new PageLibrary({ engine })
    const [a, b] = await Promise.all([library.read(AT(9)), library.read(AT(9))])
    expect(a).toBe(b)
    expect(engine.calls).toHaveLength(1)
  })

  it('peek ne declenche rien et nattend jamais', async () => {
    const engine = createSpyEngine()
    const library = new PageLibrary({ engine })
    expect(library.peek(AT(3))).toBeUndefined()
    expect(engine.calls).toHaveLength(0)
    await library.read(AT(3))
    expect(library.peek(AT(3))).toBe('page:3')
  })

  it('precharge les voisines sans quon ait a les attendre', async () => {
    const engine = createSpyEngine()
    const library = new PageLibrary({ engine })
    library.prefetch(readingNeighbourhood(AT(50), 2))
    await engine.settle()
    expect(library.peek(AT(51))).toBe('page:51')
    expect(library.peek(AT(49))).toBe('page:49')
    expect(library.peek(AT(52))).toBe('page:52')
  })

  it('ne recharge pas ce qui est deja en cache ou en vol', async () => {
    const engine = createSpyEngine()
    const library = new PageLibrary({ engine })
    await library.read(AT(11))
    library.prefetch([AT(11), AT(11), AT(12)])
    await engine.settle()
    expect(engine.calls.map((a) => a.page)).toEqual([11, 12])
  })

  it('evince les pages les plus anciennes une fois le cache plein', async () => {
    const engine = createSpyEngine()
    const library = new PageLibrary({ engine, capacity: 3 })
    for (const page of [1, 2, 3, 4]) await library.read(AT(page))
    expect(library.peek(AT(1))).toBeUndefined()
    expect(library.peek(AT(4))).toBe('page:4')
    expect(library.stats.evictions).toBe(1)
  })

  it('refuse de travailler apres dispose', async () => {
    const library = new PageLibrary({ engine: createSpyEngine() })
    library.dispose()
    await expect(library.read(AT(1))).rejects.toThrow('liberee')
    expect(library.peek(AT(1))).toBeUndefined()
    library.dispose() // idempotent
  })

  it('laisse remonter lechec du moteur', async () => {
    const failing: PageEngine = {
      compute: () => Promise.reject(new Error('worker mort')),
      locate: () => Promise.reject(new Error('worker mort')),
      dispose() {},
    }
    const library = new PageLibrary({ engine: failing })
    await expect(library.read(AT(1))).rejects.toThrow('worker mort')
    // Un echec ne doit rien laisser de coince en vol.
    expect(library.stats.inFlight).toBe(0)
  })

  it('avale silencieusement lechec dun prechargement', async () => {
    const failing: PageEngine = {
      compute: () => Promise.reject(new Error('worker mort')),
      locate: () => Promise.reject(new Error('worker mort')),
      dispose() {},
    }
    const library = new PageLibrary({ engine: failing })
    library.prefetch([AT(1), AT(2)])
    await new Promise((resolve) => setTimeout(resolve, 5))
    expect(library.stats.inFlight).toBe(0)
  })

  it('produit bien le vrai texte de Borges avec le moteur direct', async () => {
    const library = new PageLibrary({ engine: createInlineEngine() })
    await expect(library.read(AT(42))).resolves.toBe(pageAt(AT(42)))
  })
})

describe('la recherche', () => {
  it('passe par le moteur, jamais par le thread appelant', async () => {
    const library = new PageLibrary({ engine: createInlineEngine() })
    const adresse = await library.locate('la bibliotheque est totale.')
    await expect(library.read(adresse)).resolves.toBe(pageAt(adresse))
  })

  it('retrouve exactement la page quon vient de lire', async () => {
    const library = new PageLibrary({ engine: createInlineEngine() })
    const texte = await library.read(AT(77))
    await expect(library.locate(texte)).resolves.toEqual(AT(77))
  })

  it('refuse de travailler apres dispose', async () => {
    const library = new PageLibrary({ engine: createInlineEngine() })
    library.dispose()
    await expect(library.locate('a')).rejects.toThrow('liberee')
  })
})

describe('critere de sortie de la phase 2', () => {
  it('tourner 100 pages ne coute presque rien au thread appelant', async () => {
    // On ne peut pas compter des images dans Node. On mesure l'equivalent
    // exact de la garantie recherchee : le temps SYNCHRONE passe sur le thread
    // appelant pendant 100 tournages de page. Tout le calcul reel se fait dans
    // le moteur, donc ailleurs.
    const engine = createSpyEngine()
    const library = new PageLibrary({ engine })

    let blocking = 0
    for (let page = 1; page <= 100; page += 1) {
      const address = AT(page)
      const start = performance.now()
      library.peek(address)
      void library.read(address)
      library.prefetch(readingNeighbourhood(address, 2))
      blocking += performance.now() - start
      await engine.settle()
    }

    /*
     * Le budget d'UNE image est de 16,6 ms.
     *
     * Sur une machine au repos, les cent tournages reunis en coutent moins de
     * trois, mais ce test partage son processeur avec tout ce qui tourne a
     * cote, et un seuil au millieme d'une image ne mesurerait plus que le bruit
     * de la machine. On garde donc une marge franche : ce qu'on veut prouver,
     * c'est qu'un tournage de page coute une fraction de milliseconde au thread
     * qui dessine, pas qu'il en coute exactement 0,028.
     */
    expect(blocking / 100).toBeLessThan(0.5)
    expect(blocking).toBeLessThan(50)
  })

  it('lire un livre a la suite : le lecteur trouve la page 99 fois sur 100', async () => {
    const engine = createSpyEngine()
    const library = new PageLibrary({ engine })
    for (let page = 1; page <= 100; page += 1) {
      await library.read(AT(page))
      library.prefetch(readingNeighbourhood(AT(page), 2))
      await engine.settle()
    }
    // Seule la toute premiere page est demandee avant d'avoir ete prechargee.
    // (`misses` compte aussi les prechargements, dont c'est le role de manquer :
    // la mesure qui parle du confort du lecteur, c'est `hits`.)
    expect(library.stats.hits).toBeGreaterThanOrEqual(99)
    expect(library.stats.generated).toBeLessThanOrEqual(103)
  })

  it('le moteur reel genere 100 pages en moins dune seconde', async () => {
    const library = new PageLibrary({ engine: createInlineEngine(), capacity: 200 })
    const start = performance.now()
    for (let page = 1; page <= 100; page += 1) await library.read(AT(page))
    const elapsed = performance.now() - start
    expect(library.stats.generated).toBe(100)
    expect(elapsed).toBeLessThan(1000)
  })
})

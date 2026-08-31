/**
 * La bibliotheque vue du thread principal.
 *
 * Trois services, et rien d'autre :
 *   - `peek`     lecture SYNCHRONE depuis le cache, pour la boucle de rendu ;
 *   - `read`     lecture asynchrone, qui declenche la generation si besoin ;
 *   - `prefetch` demande a l'avance ce dont on aura besoin dans un instant.
 *
 * ------------------------------------------------------------------------
 * POURQUOI `peek` EXISTE
 *
 * C'est la methode la plus importante du fichier, et la moins evidente.
 *
 * Une boucle de rendu ne peut pas attendre : elle a 16,6 ms pour dessiner une
 * image, et `await` n'a aucun sens a l'interieur. La bonne facon d'utiliser
 * cette classe depuis la 3D est donc :
 *
 *     const texte = bibliotheque.peek(adresse)   // jamais d'attente
 *     if (texte) afficher(texte)
 *     else       afficher(placeholder)            // et laisser `read` travailler
 *
 * Le cache n'est pas une optimisation ici, c'est le mecanisme qui rend
 * l'affichage possible sans jamais bloquer.
 */

import { locationOf, type Address } from '../core/index.ts'
import { LruCache } from './cache.ts'
import { createDefaultEngine, type PageEngine } from './engine.ts'

/**
 * Capacite par defaut, en pages.
 *
 * Une page fait 3 200 caracteres, soit environ 6,4 ko en memoire. 128 pages
 * pesent donc a peu pres 820 ko : de quoi couvrir tout un livre parcouru en
 * avant et en arriere, pour une empreinte negligeable.
 */
export const DEFAULT_CAPACITY = 128

/** Nombre maximal de generations laissees en vol simultanement. */
const MAX_IN_FLIGHT = 16

export interface PageLibraryOptions {
  /** D'ou viennent les pages. Par defaut : un worker si l'environnement en a un. */
  readonly engine?: PageEngine
  /** Taille du cache, en pages. */
  readonly capacity?: number
}

export interface PageLibraryStats {
  readonly hits: number
  readonly misses: number
  readonly evictions: number
  readonly size: number
  readonly inFlight: number
  readonly generated: number
}

/**
 * Cle de cache : le numero d'emplacement lui-meme, en BigInt.
 *
 * Surtout pas sa representation textuelle. `peek` est appele a chaque image,
 * et convertir un entier de 14 861 bits en base 36 coute 0,14 ms — soit pres
 * de 1 % du budget d'une image, pour une simple recherche dans un cache.
 * `Map` compare les BigInt par valeur : la cle brute est 300 fois plus rapide,
 * et le code est plus court.
 */
function keyOf(address: Address): bigint {
  return locationOf(address)
}

export class PageLibrary {
  #engine: PageEngine
  #cache: LruCache<bigint, string>
  #inFlight = new Map<bigint, Promise<string>>()
  #generated = 0
  #disposed = false
  #listeners = new Set<() => void>()

  constructor(options: PageLibraryOptions = {}) {
    this.#engine = options.engine ?? createDefaultEngine()
    this.#cache = new LruCache(options.capacity ?? DEFAULT_CAPACITY)
  }

  /**
   * Le texte s'il est deja la, `undefined` sinon. Ne declenche rien, n'attend
   * jamais. C'est la methode a appeler depuis `useFrame`.
   */
  peek(address: Address): string | undefined {
    return this.#cache.peek(keyOf(address))
  }

  /**
   * Prevenir quand le cache change.
   *
   * Le cache est un etat mutable exterieur a React. Le lire pendant le rendu
   * « marche » tant que le rendu n'est pas interrompu — mais rien ne le
   * garantit. Un abonnement permet a React de le lire correctement, via
   * `useSyncExternalStore`, et de rester coherent s'il reprend un rendu.
   *
   * @returns de quoi se desabonner.
   */
  subscribe(listener: () => void): () => void {
    this.#listeners.add(listener)
    return () => {
      this.#listeners.delete(listener)
    }
  }

  #notifier(): void {
    for (const listener of this.#listeners) listener()
  }

  /**
   * Le texte, en le generant au besoin.
   *
   * Deux demandes simultanees sur la meme page partagent la meme promesse :
   * on ne calcule jamais deux fois ce qui est deja en route.
   */
  read(address: Address): Promise<string> {
    if (this.#disposed) return Promise.reject(new Error('Bibliotheque liberee.'))
    const key = keyOf(address)

    const cached = this.#cache.get(key)
    if (cached !== undefined) return Promise.resolve(cached)

    const running = this.#inFlight.get(key)
    if (running) return running

    const promise = this.#engine
      .compute(address)
      .then((text) => {
        this.#cache.set(key, text)
        this.#generated += 1
        this.#notifier()
        return text
      })
      .finally(() => {
        this.#inFlight.delete(key)
      })

    this.#inFlight.set(key, promise)
    return promise
  }

  /**
   * Demande des pages a l'avance, sans attendre ni faire remonter les erreurs.
   *
   * Plafonne a MAX_IN_FLIGHT : quand on tourne les pages vite, il vaut mieux
   * abandonner un prechargement devenu inutile que d'engorger le worker
   * derriere une file de demandes perimees.
   */
  prefetch(addresses: Iterable<Address>): void {
    if (this.#disposed) return
    for (const address of addresses) {
      if (this.#inFlight.size >= MAX_IN_FLIGHT) return
      const key = keyOf(address)
      if (this.#cache.has(key) || this.#inFlight.has(key)) continue
      void this.read(address).catch(() => {
        // Un prechargement rate n'est pas une erreur : la page sera simplement
        // regeneree si on finit vraiment par la demander.
      })
    }
  }

  /**
   * Ou se trouve ce texte.
   *
   * L'autre sens de la bijection (D14). Le resultat n'est pas mis en cache :
   * on ne cherche pas deux fois la meme chose, et le calcul coute moins d'une
   * milliseconde.
   */
  locate(text: string): Promise<Address> {
    if (this.#disposed) return Promise.reject(new Error('Bibliotheque liberee.'))
    return this.#engine.locate(text)
  }

  /** Vide le cache sans liberer le moteur. */
  clear(): void {
    this.#cache.clear()
    this.#notifier()
  }

  dispose(): void {
    if (this.#disposed) return
    this.#disposed = true
    this.#inFlight.clear()
    this.#cache.clear()
    this.#listeners.clear()
    this.#engine.dispose()
  }

  get stats(): PageLibraryStats {
    return { ...this.#cache.stats, inFlight: this.#inFlight.size, generated: this.#generated }
  }
}

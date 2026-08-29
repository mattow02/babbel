/**
 * Un cache LRU minimal.
 *
 * `Map` conserve l'ordre d'insertion : reinserer une cle la remet en queue, et
 * la premiere cle iterable est donc toujours la moins recemment utilisee. Tout
 * le LRU tient dans cette propriete, sans liste chainee ni structure annexe.
 *
 * Pourquoi ici plutot que dans core/ : ce n'est pas de la logique metier, c'est
 * une commodite de la couche de generation. `core/` reste pur (decision D8).
 */
export class LruCache<K, V> {
  readonly capacity: number
  #entries = new Map<K, V>()
  #hits = 0
  #misses = 0
  #evictions = 0

  constructor(capacity: number) {
    if (!Number.isInteger(capacity) || capacity < 1) {
      throw new RangeError(`La capacite doit etre un entier positif, recu ${capacity}.`)
    }
    this.capacity = capacity
  }

  /** Lit une valeur et la marque comme recemment utilisee. */
  get(key: K): V | undefined {
    const value = this.#entries.get(key)
    if (value === undefined) {
      this.#misses += 1
      return undefined
    }
    this.#hits += 1
    this.#entries.delete(key)
    this.#entries.set(key, value)
    return value
  }

  /** Consulte sans modifier l'ordre ni les compteurs. */
  peek(key: K): V | undefined {
    return this.#entries.get(key)
  }

  has(key: K): boolean {
    return this.#entries.has(key)
  }

  /** Range une valeur, en evincant la plus ancienne si le cache est plein. */
  set(key: K, value: V): void {
    if (this.#entries.has(key)) {
      this.#entries.delete(key)
    } else if (this.#entries.size >= this.capacity) {
      const oldest = this.#entries.keys().next()
      if (!oldest.done) {
        this.#entries.delete(oldest.value)
        this.#evictions += 1
      }
    }
    this.#entries.set(key, value)
  }

  clear(): void {
    this.#entries.clear()
  }

  get size(): number {
    return this.#entries.size
  }

  get stats(): { hits: number; misses: number; evictions: number; size: number } {
    return { hits: this.#hits, misses: this.#misses, evictions: this.#evictions, size: this.size }
  }
}

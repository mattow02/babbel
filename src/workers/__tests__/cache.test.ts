import { describe, expect, it } from 'vitest'
import { LruCache } from '../cache.ts'

describe('LruCache', () => {
  it('rend ce quon y a range', () => {
    const cache = new LruCache<string, number>(3)
    cache.set('a', 1)
    expect(cache.get('a')).toBe(1)
    expect(cache.get('inconnu')).toBeUndefined()
  })

  it('evince la cle la moins recemment utilisee', () => {
    const cache = new LruCache<string, number>(2)
    cache.set('a', 1)
    cache.set('b', 2)
    cache.set('c', 3)
    expect(cache.has('a')).toBe(false)
    expect(cache.has('b')).toBe(true)
    expect(cache.has('c')).toBe(true)
    expect(cache.stats.evictions).toBe(1)
  })

  it('une lecture protege une cle de leviction', () => {
    const cache = new LruCache<string, number>(2)
    cache.set('a', 1)
    cache.set('b', 2)
    cache.get('a') // 'a' redevient la plus recente
    cache.set('c', 3)
    expect(cache.has('a')).toBe(true)
    expect(cache.has('b')).toBe(false)
  })

  it('peek ne change ni lordre ni les compteurs', () => {
    const cache = new LruCache<string, number>(2)
    cache.set('a', 1)
    cache.set('b', 2)
    cache.peek('a')
    cache.set('c', 3)
    expect(cache.has('a')).toBe(false) // peek n'a pas protege 'a'
    expect(cache.stats.hits).toBe(0)
    expect(cache.stats.misses).toBe(0)
  })

  it('reecrire une cle ne la duplique pas et la rajeunit', () => {
    const cache = new LruCache<string, number>(2)
    cache.set('a', 1)
    cache.set('b', 2)
    cache.set('a', 10)
    expect(cache.size).toBe(2)
    cache.set('c', 3)
    expect(cache.get('a')).toBe(10)
    expect(cache.has('b')).toBe(false)
  })

  it('compte les succes et les echecs', () => {
    const cache = new LruCache<string, number>(2)
    cache.set('a', 1)
    cache.get('a')
    cache.get('b')
    expect(cache.stats).toMatchObject({ hits: 1, misses: 1, size: 1 })
  })

  it('refuse une capacite absurde', () => {
    expect(() => new LruCache(0)).toThrow(RangeError)
    expect(() => new LruCache(-1)).toThrow(RangeError)
    expect(() => new LruCache(1.5)).toThrow(RangeError)
  })
})

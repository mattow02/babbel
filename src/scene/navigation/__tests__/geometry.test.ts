import { describe, expect, it } from 'vitest'
import {
  CORRIDOR_WIDTH,
  GALLERY_PITCH,
  HEXAGON_APOTHEM,
} from '../../dimensions.ts'
import {
  AXIS,
  LATERAL,
  along,
  insideHexagon,
  insideLibrary,
  lateral,
  rebase,
  slide,
  type Point2,
} from '../geometry.ts'

const MARGE = 0.3
const ORIGINE: Point2 = { x: 0, z: 0 }

/** Un point a `u` le long de l'axe et `v` de cote. */
const at = (u: number, v: number): Point2 => ({
  x: AXIS.x * u + LATERAL.x * v,
  z: AXIS.z * u + LATERAL.z * v,
})

describe('le repere', () => {
  it('a deux axes unitaires et perpendiculaires', () => {
    expect(Math.hypot(AXIS.x, AXIS.z)).toBeCloseTo(1, 12)
    expect(Math.hypot(LATERAL.x, LATERAL.z)).toBeCloseTo(1, 12)
    expect(AXIS.x * LATERAL.x + AXIS.z * LATERAL.z).toBeCloseTo(0, 12)
  })

  it('lit correctement avancee et ecart', () => {
    const p = at(3.4, -1.1)
    expect(along(p)).toBeCloseTo(3.4, 10)
    expect(lateral(p)).toBeCloseTo(-1.1, 10)
  })
})

describe('la salle', () => {
  it('accepte le centre', () => {
    expect(insideHexagon(ORIGINE, MARGE)).toBe(true)
  })

  it('refuse au-dela des murs, dans les six directions', () => {
    for (let side = 0; side < 6; side += 1) {
      const angle = (Math.PI / 3) * side + Math.PI / 6
      const dehors = { x: Math.cos(angle) * (HEXAGON_APOTHEM + 0.1), z: Math.sin(angle) * (HEXAGON_APOTHEM + 0.1) }
      expect(insideHexagon(dehors, MARGE)).toBe(false)
    }
  })

  it('garde la marge demandee par rapport aux murs', () => {
    const angle = Math.PI / 6
    const juste = { x: Math.cos(angle) * (HEXAGON_APOTHEM - MARGE - 0.01), z: Math.sin(angle) * (HEXAGON_APOTHEM - MARGE - 0.01) }
    const trop = { x: Math.cos(angle) * (HEXAGON_APOTHEM - MARGE + 0.01), z: Math.sin(angle) * (HEXAGON_APOTHEM - MARGE + 0.01) }
    expect(insideHexagon(juste, MARGE)).toBe(true)
    expect(insideHexagon(trop, MARGE)).toBe(false)
  })
})

describe('la bibliotheque', () => {
  it('accepte le couloir, etroit et aligne', () => {
    const milieuDuCouloir = (HEXAGON_APOTHEM + GALLERY_PITCH / 2) / 2
    expect(insideLibrary(at(milieuDuCouloir, 0), MARGE)).toBe(true)
    expect(insideLibrary(at(milieuDuCouloir, CORRIDOR_WIDTH / 2 - MARGE - 0.01), MARGE)).toBe(true)
    expect(insideLibrary(at(milieuDuCouloir, CORRIDOR_WIDTH / 2 - MARGE + 0.05), MARGE)).toBe(false)
  })

  it('accepte la galerie voisine et celle d apres', () => {
    for (const k of [-2, -1, 0, 1, 2]) {
      expect(insideLibrary(at(k * GALLERY_PITCH, 0), MARGE)).toBe(true)
    }
  })

  it('refuse de sortir lateralement au niveau dune galerie', () => {
    expect(insideLibrary(at(0, HEXAGON_APOTHEM + 0.5), MARGE)).toBe(false)
  })

  it('laisse un chemin continu dune galerie a la suivante', () => {
    // On echantillonne finement tout le trajet : aucun trou ne doit exister,
    // sinon le visiteur resterait bloque au milieu du couloir.
    for (let i = 0; i <= 400; i += 1) {
      const u = (i / 400) * GALLERY_PITCH
      expect(insideLibrary(at(u, 0), MARGE)).toBe(true)
    }
  })
})

describe('le glissement le long des murs', () => {
  it('laisse passer un pas qui reste a linterieur', () => {
    const from = ORIGINE
    const to = at(0.4, 0.2)
    expect(slide(from, to, MARGE)).toEqual(to)
  })

  it('longe le mur au lieu de sy coller net', () => {
    // On avance dans le couloir en poussant aussi sur le cote : l'avancee doit
    // passer, l'ecart lateral doit etre absorbe par le mur.
    const from = at(HEXAGON_APOTHEM + 0.3, 0)
    const to = at(HEXAGON_APOTHEM + 0.5, 3)
    const apres = slide(from, to, MARGE)
    expect(along(apres)).toBeCloseTo(along(to), 6)
    expect(Math.abs(lateral(apres))).toBeLessThan(CORRIDOR_WIDTH / 2)
  })

  it('ne bouge pas du tout quand aucune direction ne passe', () => {
    const from = at(0, HEXAGON_APOTHEM - MARGE - 0.02)
    const to = at(0, HEXAGON_APOTHEM + 5)
    expect(slide(from, to, MARGE)).toEqual(from)
  })

  it('ne laisse jamais sortir, sur mille pas au hasard', () => {
    let position: Point2 = ORIGINE
    let graine = 12345
    const suivant = (): number => {
      graine = (graine * 1103515245 + 12345) % 2147483648
      return graine / 2147483648 - 0.5
    }
    for (let pas = 0; pas < 1000; pas += 1) {
      const cible: Point2 = { x: position.x + suivant() * 0.9, z: position.z + suivant() * 0.9 }
      position = slide(position, cible, MARGE)
      expect(insideLibrary(position, MARGE - 1e-9)).toBe(true)
    }
  })
})

describe('lorigine flottante', () => {
  it('ne bouge rien tant quon reste dans sa galerie', () => {
    expect(rebase(at(1.2, 0.3)).shift).toBe(0)
  })

  it('change de galerie une fois le couloir franchi', () => {
    expect(rebase(at(GALLERY_PITCH, 0)).shift).toBe(1)
    expect(rebase(at(-GALLERY_PITCH, 0)).shift).toBe(-1)
    expect(rebase(at(2 * GALLERY_PITCH, 0)).shift).toBe(2)
  })

  it('ramene toujours la position pres de zero', () => {
    for (const k of [1, -1, 5, -12]) {
      const { shift, position } = rebase(at(k * GALLERY_PITCH + 0.7, -0.4))
      expect(shift).toBe(k)
      expect(along(position)).toBeCloseTo(0.7, 8)
      expect(lateral(position)).toBeCloseTo(-0.4, 8)
    }
  })

  it('empeche les coordonnees de deriver, meme apres cent mille galeries', () => {
    // C'est tout l'interet : sans recentrage, on perdrait toute precision
    // bien avant d'avoir parcouru une fraction des 10^4468 galeries.
    let position: Point2 = ORIGINE
    let hexagone = 0n
    for (let pas = 0; pas < 100000; pas += 1) {
      position = { x: position.x + AXIS.x * 0.6, z: position.z + AXIS.z * 0.6 }
      const r = rebase(position)
      if (r.shift !== 0) {
        hexagone += BigInt(r.shift)
        position = r.position
      }
    }
    expect(hexagone).toBeGreaterThan(10000n)
    expect(Math.hypot(position.x, position.z)).toBeLessThan(GALLERY_PITCH)
  })
})

import { describe, expect, it } from 'vitest'
import {
  GALLERY_PITCH,
  HEXAGON_APOTHEM,
  PASSAGE_LENGTH,
  STAIRWELL_RADIUS,
  VESTIBULE_SIZE,
} from '../../dimensions.ts'
import type { Box } from '../../instancing.ts'
import { AXIS, LATERAL, insideLibrary, type Point2 } from '../../navigation/geometry.ts'
import { stoneBoxes, woodBoxes } from '../parts.ts'
import { stairBoxes } from '../stairs.ts'

const MARGE = 0.32
const YEUX = 1.55

/** Un point repere par (avancee, ecart) le long de l'axe des couloirs. */
const at = (u: number, v: number): Point2 => ({
  x: AXIS.x * u + LATERAL.x * v,
  z: AXIS.z * u + LATERAL.z * v,
})

/**
 * Le point est-il DANS cette boite ?
 *
 * On ramene le point dans le repere de la boite : rotation inverse autour de
 * la verticale, puis on compare aux demi-dimensions.
 */
function insideBox(point: { x: number; y: number; z: number }, box: Box): boolean {
  const dx = point.x - box.x
  const dz = point.z - box.z
  const cos = Math.cos(-box.rotY)
  const sin = Math.sin(-box.rotY)
  // Rotation inverse : l'inverse d'une rotation d'angle a est celle de -a.
  const lx = dx * cos + dz * sin
  const lz = -dx * sin + dz * cos
  return (
    Math.abs(lx) <= box.sx / 2 &&
    Math.abs(lz) <= box.sz / 2 &&
    Math.abs(point.y - box.y) <= box.sy / 2
  )
}

/** Ce qui porte : murs, dalles, boiseries. */
const MACONNERIE = [...stoneBoxes(), ...woodBoxes()]
/** Tout, escalier compris. */
const TOUT = [...MACONNERIE, ...stairBoxes()]

describe('la maconnerie', () => {
  it('est bien la', () => {
    expect(stoneBoxes().length).toBeGreaterThan(20)
    expect(woodBoxes().length).toBeGreaterThan(20)
    expect(stairBoxes().length).toBeGreaterThan(20)
  })

  it('compte tout ce qui est pose', () => {
    expect(TOUT.length).toBe(MACONNERIE.length + stairBoxes().length)
  })

  it('ne pose jamais de boite dune taille nulle ou negative', () => {
    for (const box of TOUT) {
      expect(box.sx).toBeGreaterThan(0)
      expect(box.sy).toBeGreaterThan(0)
      expect(box.sz).toBeGreaterThan(0)
      expect(Number.isFinite(box.x)).toBe(true)
      expect(Number.isFinite(box.y)).toBe(true)
      expect(Number.isFinite(box.z)).toBe(true)
    }
  })

  /**
   * LE test de ce fichier.
   *
   * Les collisions (navigation/geometry.ts) et la construction (parts.ts) sont
   * deux descriptions independantes du meme lieu. Rien ne garantit qu'elles
   * s'accordent, sauf de les confronter. Un mur pose la ou l'on a le droit de
   * marcher est invisible a la lecture du code et se paye par un visiteur
   * encastre dans la pierre.
   */
  it('ne dresse jamais un mur la ou lon a le droit de marcher', () => {
    const fautes: string[] = []

    const verifier = (u: number, v: number): void => {
      const sol = at(u, v)
      if (!insideLibrary(sol, MARGE)) return
      // On teste a hauteur de genou ET a hauteur d'oeil : un linteau bas
      // passerait au-dessus du premier test.
      for (const y of [0.5, YEUX]) {
        for (const box of MACONNERIE) {
          if (insideBox({ x: sol.x, y, z: sol.z }, box)) {
            fautes.push(`u=${u.toFixed(2)} v=${v.toFixed(2)} y=${y}`)
            return
          }
        }
      }
    }

    // Toute la salle, tout le passage, tout le vestibule.
    for (let u = -HEXAGON_APOTHEM; u <= GALLERY_PITCH / 2 + 0.01; u += 0.12) {
      for (let v = -VESTIBULE_SIZE / 2; v <= VESTIBULE_SIZE / 2; v += 0.12) {
        verifier(u, v)
      }
    }

    expect(fautes.slice(0, 8)).toEqual([])
  })

  it('laisse le passage ouvert entre la salle et le vestibule', () => {
    // On avance sur l'axe : rien ne doit barrer la route a hauteur d'homme.
    for (let u = HEXAGON_APOTHEM + 0.1; u < HEXAGON_APOTHEM + PASSAGE_LENGTH; u += 0.05) {
      const p = at(u, 0)
      for (const box of MACONNERIE) {
        expect(insideBox({ x: p.x, y: YEUX, z: p.z }, box)).toBe(false)
      }
    }
  })

  it('ouvre bien la tremie : ni sol ni plafond au-dessus du puits', () => {
    const centre = GALLERY_PITCH / 2
    const p = at(centre, 0)
    /*
     * On ne regarde que la MACONNERIE : l'escalier, lui, traverse la tremie de
     * part en part : c'est sa raison d'etre. Ce qu'on verifie, c'est qu'aucune
     * dalle ne rebouche le puits.
     */
    for (const y of [-0.09, 3.09]) {
      for (const box of MACONNERIE) {
        expect(insideBox({ x: p.x, y, z: p.z }, box)).toBe(false)
      }
    }
  })

  it('borne la tremie : le sol reprend des quon sort du puits', () => {
    // Juste au-dela du rayon du puits, il doit y avoir de quoi poser le pied.
    const centre = GALLERY_PITCH / 2
    let trouve = 0
    for (let i = 0; i < 24; i += 1) {
      const angle = (i / 24) * Math.PI * 2
      const r = STAIRWELL_RADIUS + 0.35
      const p = at(centre + Math.cos(angle) * r, Math.sin(angle) * r)
      const surDuSol = MACONNERIE.some((box) => insideBox({ x: p.x, y: -0.09, z: p.z }, box))
      if (surDuSol) trouve += 1
    }
    expect(trouve).toBe(24)
  })
})

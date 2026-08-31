import { describe, expect, it } from 'vitest'
import {
  AISLE_OUTER_X,
  NAVE_END_Z,
  NAVE_ENTRY_Z,
  PILLAR_COUNT,
  PILLAR_RADIUS,
  PILLAR_X,
  SPAWN_Z,
  STAIR_FOOT_Z,
  STAIR_RUN,
  STAIR_STEPS,
  STAIR_X,
  TRIBUNE_BACK_Z,
  TRIBUNE_FRONT_Z,
  TRIBUNE_INNER_X,
  TRIBUNE_Y,
} from '../dimensions.ts'
import { STEP_MAX, floorFor, hallFloors, insideHall, pillars, slideInHall, stairSteps, tribuneSlabs } from '../layout.ts'

describe('la nef', () => {
  it('borde l allee de deux files de piliers, symetriques', () => {
    const files = pillars()
    expect(files).toHaveLength(PILLAR_COUNT * 2)
    const gauche = files.filter((p) => p.x < 0)
    const droite = files.filter((p) => p.x > 0)
    expect(gauche).toHaveLength(droite.length)
    for (const pilier of gauche) {
      expect(droite.some((autre) => autre.z === pilier.z && autre.x === -pilier.x)).toBe(true)
    }
  })

  it('laisse l allee centrale entierement libre', () => {
    for (const pilier of pillars()) {
      expect(Math.abs(pilier.x)).toBe(PILLAR_X)
    }
  })

  it('tient les piliers a l interieur du hall', () => {
    for (const pilier of pillars()) {
      expect(pilier.z).toBeLessThan(NAVE_ENTRY_Z)
      expect(pilier.z).toBeGreaterThan(NAVE_END_Z)
    }
  })
})

describe('les escaliers lateraux', () => {
  it('montent exactement au niveau des tribunes', () => {
    const marches = stairSteps()
    expect(marches).toHaveLength(STAIR_STEPS * 2)
    const plusHaute = Math.max(...marches.map((m) => m.sy))
    expect(plusHaute).toBeCloseTo(TRIBUNE_Y, 6)
  })

  it('debouchent sur le bord avant de la tribune', () => {
    expect(STAIR_FOOT_Z - STAIR_STEPS * STAIR_RUN).toBeCloseTo(TRIBUNE_FRONT_Z, 6)
  })

  it('restent dans les bas-cotes, jamais dans l allee', () => {
    for (const marche of stairSteps()) {
      expect(Math.abs(marche.x) - marche.sx / 2).toBeGreaterThan(PILLAR_X + PILLAR_RADIUS)
      expect(Math.abs(marche.x) + marche.sx / 2).toBeLessThanOrEqual(AISLE_OUTER_X)
    }
  })

  it('font monter d une marche a la fois, jamais d un bond', () => {
    let precedente = 0
    for (let z = STAIR_FOOT_Z; z >= TRIBUNE_FRONT_Z; z -= 0.05) {
      const sol = floorFor({ x: STAIR_X, z }, precedente)
      expect(sol).not.toBeNull()
      expect(Math.abs((sol as number) - precedente)).toBeLessThanOrEqual(STEP_MAX)
      precedente = sol as number
    }
    expect(precedente).toBeCloseTo(TRIBUNE_Y, 6)
  })
})

describe('les tribunes', () => {
  it('sont portees par une dalle et bordees d une balustrade', () => {
    const dalles = tribuneSlabs()
    expect(dalles).toHaveLength(4)
    for (const dalle of dalles) {
      expect(dalle.y).toBeGreaterThan(TRIBUNE_Y - 1)
    }
  })

  it('superposent deux sols au-dessus du bas-cote', () => {
    const sols = hallFloors({ x: (TRIBUNE_INNER_X + AISLE_OUTER_X) / 2, z: -20 })
    expect(sols).toEqual([0, TRIBUNE_Y])
  })

  it('ne laissent pas tomber dans la nef par-dessus la balustrade', () => {
    const surLaTribune = { x: TRIBUNE_INNER_X + 0.5, z: -20 }
    const parDessusLeVide = { x: TRIBUNE_INNER_X - 4, z: -20 }
    expect(insideHall(surLaTribune, 0.3, TRIBUNE_Y)).toBe(true)
    expect(insideHall(parDessusLeVide, 0.3, TRIBUNE_Y)).toBe(false)
    const apres = slideInHall(surLaTribune, parDessusLeVide, 0.3, TRIBUNE_Y)
    expect(apres.x).toBeGreaterThanOrEqual(TRIBUNE_INNER_X)
  })

  it('laissent marcher SOUS elles, dans le bas-cote', () => {
    const dessous = { x: (TRIBUNE_INNER_X + AISLE_OUTER_X) / 2, z: -20 }
    expect(insideHall(dessous, 0.3, 0)).toBe(true)
    expect(floorFor(dessous, 0)).toBe(0)
  })

  it('couvrent le fond de la nef, pas son entree', () => {
    expect(TRIBUNE_BACK_Z).toBeLessThan(TRIBUNE_FRONT_Z)
    expect(TRIBUNE_FRONT_Z).toBeLessThan(SPAWN_Z)
  })
})

describe('marcher dans le hall', () => {
  it('depose le visiteur sur un sol, juste apres le portail', () => {
    expect(insideHall({ x: 0, z: SPAWN_Z }, 0.32, 0)).toBe(true)
  })

  it('laisse descendre toute l allee centrale sans rien toucher', () => {
    for (let z = SPAWN_Z; z > NAVE_END_Z + 1; z -= 0.5) {
      expect(insideHall({ x: 0, z }, 0.32, 0)).toBe(true)
    }
  })

  it('ne laisse pas sortir par le portail ni traverser les murs', () => {
    expect(insideHall({ x: 0, z: NAVE_ENTRY_Z + 1 }, 0.32, 0)).toBe(false)
    expect(insideHall({ x: AISLE_OUTER_X + 1, z: 0 }, 0.32, 0)).toBe(false)
    expect(insideHall({ x: 0, z: NAVE_END_Z - 1 }, 0.32, 0)).toBe(false)
  })

  it('ne traverse pas un pilier, mais le longe', () => {
    const pilier = pillars()[0]
    if (!pilier) throw new Error('aucun pilier')
    const devant = { x: pilier.x, z: pilier.z + 3 }
    const derriere = { x: pilier.x, z: pilier.z - 3 }
    expect(insideHall({ x: pilier.x, z: pilier.z }, 0.32, 0)).toBe(false)
    const apres = slideInHall(devant, derriere, 0.32, 0)
    // On ne reste pas plante, et l'on n'a pas traverse.
    expect(apres).not.toEqual(devant)
    const dx = apres.x - pilier.x
    const dz = apres.z - pilier.z
    expect(Math.hypot(dx, dz)).toBeGreaterThanOrEqual(PILLAR_RADIUS)
  })

  it('passe entre deux piliers pour rejoindre le bas-cote', () => {
    const files = pillars()
    const premier = files[0]
    const second = files[2]
    if (!premier || !second) throw new Error('file trop courte')
    const milieu = (premier.z + second.z) / 2
    expect(insideHall({ x: PILLAR_X, z: milieu }, 0.32, 0)).toBe(true)
  })
})

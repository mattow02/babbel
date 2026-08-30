import {
  DRONE,
  FADE,
  MASTER_GAIN,
  NOISE_CUTOFF,
  NOISE_GAIN,
  NOISE_SECONDS,
  brownNoise,
} from './voices.ts'

/**
 * L'ambiance sonore, synthetisee dans le navigateur.
 *
 * Comme les livres, le son n'est pas stocke : il est calcule. Aucun fichier a
 * telecharger, quelques kilo-octets de code, et une rumeur qui ne boucle
 * jamais tout a fait puisque les battements des voix sont incommensurables.
 *
 * Regles respectees :
 *   - rien ne demarre avant un geste du visiteur (politique des navigateurs,
 *     et simple politesse) ;
 *   - tout se coupe et se libere proprement.
 */
export class Ambience {
  #context: AudioContext | null = null
  #master: GainNode | null = null
  #muted = false

  /** Demarre le son. A appeler depuis un geste de l'utilisateur. */
  async start(): Promise<void> {
    if (this.#context) return
    const Contexte: typeof AudioContext | undefined =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Contexte) return

    const context = new Contexte()
    if (context.state === 'suspended') await context.resume()

    const master = context.createGain()
    master.gain.value = 0
    master.connect(context.destination)

    for (const voice of DRONE) {
      const oscillator = context.createOscillator()
      oscillator.type = 'sine'
      oscillator.frequency.value = voice.frequency
      oscillator.detune.value = voice.detune

      // Chaque voix respire a son propre rythme. Comme les periodes ne sont
      // pas commensurables, l'ensemble ne se repete jamais exactement.
      const gain = context.createGain()
      gain.gain.value = voice.gain
      const souffle = context.createOscillator()
      souffle.frequency.value = 1 / voice.breath
      const profondeur = context.createGain()
      profondeur.gain.value = voice.gain * 0.55
      souffle.connect(profondeur).connect(gain.gain)

      oscillator.connect(gain).connect(master)
      oscillator.start()
      souffle.start()
    }

    // Le souffle : un bruit brun filtre, qui donne le volume d'air.
    const longueur = Math.floor(context.sampleRate * NOISE_SECONDS)
    const tampon = context.createBuffer(1, longueur, context.sampleRate)
    tampon.copyToChannel(brownNoise(longueur), 0)
    const source = context.createBufferSource()
    source.buffer = tampon
    source.loop = true
    const filtre = context.createBiquadFilter()
    filtre.type = 'lowpass'
    filtre.frequency.value = NOISE_CUTOFF
    const gainBruit = context.createGain()
    gainBruit.gain.value = NOISE_GAIN
    source.connect(filtre).connect(gainBruit).connect(master)
    source.start()

    master.gain.linearRampToValueAtTime(MASTER_GAIN, context.currentTime + FADE)

    this.#context = context
    this.#master = master
  }

  get running(): boolean {
    return this.#context !== null && !this.#muted
  }

  /** Coupe ou remet le son, en fondu. */
  setMuted(muted: boolean): void {
    this.#muted = muted
    const context = this.#context
    const master = this.#master
    if (!context || !master) return
    master.gain.cancelScheduledValues(context.currentTime)
    master.gain.setValueAtTime(master.gain.value, context.currentTime)
    master.gain.linearRampToValueAtTime(muted ? 0 : MASTER_GAIN, context.currentTime + 0.6)
  }

  /** Libere tout. */
  async dispose(): Promise<void> {
    const context = this.#context
    this.#context = null
    this.#master = null
    if (context) await context.close()
  }
}

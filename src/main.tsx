/**
 * Point d'entree.
 *
 * Phase 3 : un lecteur en HTML nu, sans 3D. Son role est de valider que le
 * contenu est juste et que la navigation tient, avant d'engager quoi que ce
 * soit de couteux en rendu. La galerie hexagonale arrive en phase 4.
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App.tsx'
import './ui/styles.css'

const container = document.querySelector('#root')
if (container) {
  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

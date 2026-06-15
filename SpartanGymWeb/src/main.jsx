import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { aplicarTemaGuardado, leerConfiguracionGuardada } from './utils/tema'

aplicarTemaGuardado()

if (window.matchMedia) {
  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
    const configuracionGuardada = leerConfiguracionGuardada()

    if (!configuracionGuardada.theme || configuracionGuardada.theme === 'system') {
      aplicarTemaGuardado()
    }
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

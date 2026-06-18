import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { aplicarTemaGuardado, iniciarSincronizacionTemaSistema } from './utils/tema'
import { aplicarApariencia } from './utils/configuracionApp'

aplicarTemaGuardado()
aplicarApariencia()
iniciarSincronizacionTemaSistema()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

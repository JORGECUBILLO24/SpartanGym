import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { aplicarTemaGuardado, iniciarSincronizacionTemaSistema } from './utils/tema'
import { aplicarApariencia, sincronizarConfiguracionRemota } from './utils/configuracionApp'

aplicarTemaGuardado()
aplicarApariencia()
iniciarSincronizacionTemaSistema()
sincronizarConfiguracionRemota()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

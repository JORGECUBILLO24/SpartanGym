import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const storedSettings = (() => {
  try {
    return JSON.parse(localStorage.getItem('spartanGym.settings') || '{}')
  } catch {
    return {}
  }
})()

document.documentElement.dataset.theme = storedSettings.theme === 'light' ? 'light' : 'dark'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

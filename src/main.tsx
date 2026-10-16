import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// ── Service Worker (PWA) ───────────────────────────────────────────────────
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({
      onNeedRefresh() {
        console.info('[Klock Academia SW] Nueva versión disponible.')
      },
      onOfflineReady() {
        console.info('[Klock Academia SW] App lista para funcionar sin conexión.')
      },
    })
  }).catch(() => { /* modo dev sin SW */ })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

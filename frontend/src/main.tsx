import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './auth/AuthContext'
import './index.css'
import axios from 'axios'

// Usar URL relativa para aprovechar la configuración del proxy de Vite
axios.defaults.baseURL = ''

import { registerSW } from 'virtual:pwa-register'

const originalAddEventListener = EventTarget.prototype.addEventListener;
EventTarget.prototype.addEventListener = function(type, listener, options) {
  if (type === 'touchstart' || type === 'touchmove' || type === 'wheel') {
    const passiveOptions = options === undefined ? {} : 
      typeof options === 'object' ? options : { capture: options };

    if (passiveOptions.passive === undefined) {
      passiveOptions.passive = false;
    }

    return originalAddEventListener.call(this, type, listener, passiveOptions);
  }
  return originalAddEventListener.call(this, type, listener, options);
};


const updateSW = registerSW({
  intervalMS: 24 * 60 * 60 * 1000,
  onNeedRefresh() {
    // La notificación de nueva versión ha sido desactivada según requerimiento
    console.log('Nueva versión disponible, pero la notificación está desactivada');
    
    // Actualiza automáticamente en segundo plano sin mostrar notificación
    updateSW(true);
  },
  onOfflineReady() {
    console.log('App lista para usar sin conexión');
    // Toast notification removed as per requirement
  }
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)

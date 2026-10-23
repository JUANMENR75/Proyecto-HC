// Este archivo ha sido reemplazado por el Service Worker generado por vite-plugin-pwa
// El contenido original ha sido preservado en pwabuilder-sw.js.bak para referencia

console.log('This Service Worker (pwabuilder-sw.js) has been disabled to prevent conflicts with vite-plugin-pwa');

// Servicio de trabajo inactivo para prevenir errores 404
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', () => {
  self.clients.claim();
});

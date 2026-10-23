// Este archivo ha sido reemplazado por el Service Worker generado por vite-plugin-pwa
// El contenido original ha sido preservado en pwabuilder-windows10.js.bak para referencia

console.log('This Windows-specific Service Worker (pwabuilder-windows10.js) has been disabled to prevent conflicts with vite-plugin-pwa');

// No-op service worker para prevenir errores 404
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', () => {
  self.clients.claim();
});

// Solo maneja las solicitudes de protocolo específicas de Windows que no entren en conflicto con el Service Worker principal.
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Solo maneja URL de protocolo ms para la integración de Windows
  if (url.protocol === 'ms-protocol:') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response('Windows Protocol Handler', {
          headers: { 'Content-Type': 'text/plain' }
        });
      })
    );
  }
  //Deja que el Service Worker principal maneje todas las demás solicitudes
});

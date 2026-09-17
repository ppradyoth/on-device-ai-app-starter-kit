const CACHE_NAME = 'on-device-ai-shell-v3'

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (
    request.method !== 'GET' ||
    new URL(request.url).origin !== self.location.origin ||
    new URL(request.url).pathname === '/sw.js'
  )
    return
  event.respondWith(
    caches.match(request).then(async (cached) => {
      if (cached) return cached
      const response = await fetch(request)
      if (response.ok) {
        const copy = response.clone()
        await caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
      }
      return response
    }),
  )
})

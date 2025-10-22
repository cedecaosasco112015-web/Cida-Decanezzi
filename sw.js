const MEDIA_CACHE = 'emarkezbooks-media-v1';

// Listen for messages from the client to download and cache media
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'DOWNLOAD') {
    const { url } = event.data.payload;
    // Prevent the service worker from terminating until the cache operation is complete
    event.waitUntil(
      caches.open(MEDIA_CACHE).then((cache) => {
        // Fetch the resource and add it to the cache
        return fetch(url).then((response) => {
          if (!response.ok) {
            throw new Error('Network response was not ok for ' + url);
          }
          console.log(`[SW] Caching new resource: ${url}`);
          return cache.put(url, response);
        });
      }).catch(err => {
          console.error('[SW] Failed to cache:', url, err);
      })
    );
  }

  if (event.data && event.data.type === 'DELETE') {
      const { url } = event.data.payload;
      event.waitUntil(
          caches.open(MEDIA_CACHE).then(cache => {
              console.log(`[SW] Deleting resource: ${url}`);
              return cache.delete(url);
          })
      );
  }
});

// Intercept fetch requests to serve from cache if available
self.addEventListener('fetch', (event) => {
  // We only want to handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);

  // Apply a cache-first strategy for media files from soundhelix.com
  // In a real app, this would match your media CDN's origin.
  if (url.origin === 'https://www.soundhelix.com') {
      event.respondWith(
          caches.open(MEDIA_CACHE).then((cache) => {
              // Try to find a response in the cache that matches the request
              return cache.match(event.request).then((cachedResponse) => {
                  // If a cached response is found, return it
                  if (cachedResponse) {
                      console.log(`[SW] Serving from cache: ${event.request.url}`);
                      return cachedResponse;
                  }
                  // If not found in cache, fetch it from the network
                  console.log(`[SW] Fetching from network: ${event.request.url}`);
                  return fetch(event.request);
              });
          })
      );
  }
});

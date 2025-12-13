/**
 * Custom Service Worker for PizaGame PWA
 * Handles game resource caching and offline support
 */

const GAME_CACHE_NAME = "game-resources-v1";
const RUFFLE_CACHE_NAME = "ruffle-player-v1";

/**
 * Handle game caching requests from the client
 */
self.addEventListener("message", event => {
  if (event.data && event.data.type === "CACHE_GAME") {
    handleGameCaching(event);
  }
});

/**
 * Cache a game and its resources
 */
async function handleGameCaching(event) {
  const { gameUrl, gameId, slug } = event.data;
  const port = event.ports[0];

  try {
    const cache = await caches.open(GAME_CACHE_NAME);

    // Fetch and cache the main game URL
    // Use no-cors mode to cache cross-origin resources
    const response = await fetch(gameUrl, {
      mode: "no-cors",
      credentials: "omit"
    });

    // Cache the response
    await cache.put(gameUrl, response.clone());

    // Try to estimate the size (will be 0 for opaque responses)
    const blob = await response.blob();
    const size = blob.size;

    // Send success message back
    port.postMessage({
      success: true,
      gameId,
      slug,
      size: size > 0 ? size : undefined
    });
  } catch (error) {
    console.error("Failed to cache game:", error);

    // Send error message back
    port.postMessage({
      success: false,
      gameId,
      slug,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

/**
 * Fetch event handler with offline fallback
 */
self.addEventListener("fetch", event => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle game resource requests
  if (shouldCacheGameResource(url)) {
    event.respondWith(
      caches.match(request).then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }

        // Fetch from network with no-cors for cross-origin
        return fetch(request, {
          mode: url.origin === self.location.origin ? "cors" : "no-cors"
        })
          .then(response => {
            // Cache the fetched resource
            const responseClone = response.clone();
            caches.open(GAME_CACHE_NAME).then(cache => {
              cache.put(request, responseClone);
            });
            return response;
          })
          .catch(() => {
            // Return a fallback response if offline
            return new Response("Offline - Resource not cached", {
              status: 503,
              statusText: "Service Unavailable"
            });
          });
      })
    );
  }

  // Handle Ruffle player requests
  if (url.href.includes("ruffle") || url.href.includes("@ruffle-rs")) {
    event.respondWith(
      caches.match(request).then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request).then(response => {
          // Cache Ruffle player for offline use
          const responseClone = response.clone();
          caches.open(RUFFLE_CACHE_NAME).then(cache => {
            cache.put(request, responseClone);
          });
          return response;
        });
      })
    );
  }
});

/**
 * Determine if a URL should be cached as a game resource
 */
function shouldCacheGameResource(url) {
  // Check if the URL is in our game cache
  // This is a simple heuristic - you might want to make this more sophisticated
  const gameHostPatterns = [
    "html5games.com",
    "iogames.space",
    "gameforge.com",
    "github.io",
    "vseigru.net"
    // "pizagame.com" // Self - handled by Workbox
    // Add more game hosting patterns as needed
  ];

  return gameHostPatterns.some(pattern => url.hostname.includes(pattern));
}

/**
 * Activation event - cleanup old caches
 */
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Delete old versions of our caches
          if (
            (cacheName.startsWith("game-resources-") &&
              cacheName !== GAME_CACHE_NAME) ||
            (cacheName.startsWith("ruffle-player-") &&
              cacheName !== RUFFLE_CACHE_NAME)
          ) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

/**
 * ============================================================================
 * PizaGame Service Worker - 游戏资源离线支持
 * ============================================================================
 *
 * 用途：拦截网络请求，提供离线游戏支持
 *
 * 工作原理：
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │                    Service Worker 请求处理流程                           │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │                                                                         │
 * │  浏览器发起请求                                                          │
 * │       │                                                                 │
 * │       ↓                                                                 │
 * │  ┌──────────────────────────────────────────┐                          │
 * │  │ Service Worker 拦截                       │                          │
 * │  └──────────────────────────────────────────┘                          │
 * │       │                                                                 │
 * │       ├─── 是 Ruffle 资源？ ──→ 缓存优先策略                             │
 * │       │                                                                 │
 * │       ├─── 是跨域游戏资源？                                              │
 * │       │         │                                                       │
 * │       │         ├─── 在线：网络优先，同时更新缓存                         │
 * │       │         │                                                       │
 * │       │         └─── 离线：从缓存返回                                    │
 * │       │                                                                 │
 * │       └─── 其他请求 ──→ 正常处理（由 Workbox 管理）                       │
 * │                                                                         │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * 缓存策略：
 * - game-resources-v2: 游戏资源（按原始 URL 存储）
 * - ruffle-player-v1: Ruffle Flash 播放器
 *
 * ============================================================================
 */

// ============================================================================
// 常量定义
// ============================================================================

/** 游戏资源缓存名称 */
const GAME_CACHE_NAME = "game-resources-v2";

/** Ruffle 播放器缓存名称 */
const RUFFLE_CACHE_NAME = "ruffle-player-v1";

// ============================================================================
// Fetch 事件处理
// ============================================================================

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // ========================================
  // 1. 缓存游戏虚拟路径
  // ========================================
  // 策略：直接从 Cache Storage 返回
  // 这是离线缓存游戏的入口，通过虚拟路径 /__cached__/{slug}/...

  if (url.pathname.startsWith("/__cached__/")) {
    event.respondWith(handleCachedGameRequest(request));
    return;
  }

  // ========================================
  // 2. Ruffle Flash 播放器资源
  // ========================================
  // 策略：缓存优先
  // Ruffle 资源很少变化，优先使用缓存提高加载速度

  if (url.href.includes("ruffle") || url.href.includes("@ruffle-rs")) {
    event.respondWith(handleRuffleRequest(request));
    return;
  }

  // ========================================
  // 3. 跨域游戏资源
  // ========================================
  // 策略：Stale-While-Revalidate（缓存优先，后台更新）
  // 离线时使用缓存，在线时优先使用缓存但后台更新

  const isCrossOrigin = url.origin !== self.location.origin;
  const isGoogleFonts =
    url.hostname === "fonts.googleapis.com" ||
    url.hostname === "fonts.gstatic.com";

  // 过滤非 HTTP 协议请求（如 chrome-extension://），避免 Cache API 报错
  if (url.protocol.startsWith("http") && isCrossOrigin && !isGoogleFonts) {
    event.respondWith(handleGameResourceRequest(request, url));
    return;
  }

  // ========================================
  // 4. 游戏资源 API
  // ========================================
  // /api/game-resource/* 请求直接走网络

  if (url.pathname.startsWith("/api/game-resource/")) {
    event.respondWith(handleGameResourceApiRequest(request));
    return;
  }

  // ========================================
  // 5. 其他请求
  // ========================================
  // 由 Workbox（nuxt PWA 模块）处理
});

// ============================================================================
// 请求处理函数
// ============================================================================

/**
 * 处理缓存游戏请求（虚拟路径）
 *
 * 策略：仅从缓存返回
 * - /__cached__/{slug}/... 路径的请求直接从 Cache Storage 返回
 * - 这些资源在缓存时已经以虚拟路径为 key 存储
 * - 不会尝试网络请求（因为虚拟路径不对应真实 URL）
 *
 * @param {Request} request - 请求对象
 * @returns {Promise<Response>} - 缓存的响应或 404
 */
async function handleCachedGameRequest(request) {
  const cache = await caches.open(GAME_CACHE_NAME);
  let cachedResponse = await cache.match(request);

  // 如果未命中且 URL 以 /index.html 结尾，尝试去掉 index.html 再匹配
  // 这是为了处理目录索引的情况（存储为 /file/ 但请求为 /file/index.html）
  if (!cachedResponse && request.url.endsWith("/index.html")) {
    const urlWithoutIndex = request.url.replace(/\/index\.html$/, "/");
    cachedResponse = await cache.match(urlWithoutIndex);
  }

  if (cachedResponse) {
    console.log("[SW] Cached game resource hit:", request.url);
    return cachedResponse;
  }

  // 缓存未命中 - 返回友好的 404 错误
  console.warn("[SW] Cached game resource miss:", request.url);
  return new Response(
    "Resource not found in offline cache. Please re-download the game.",
    {
      status: 404,
      statusText: "Not Found",
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    }
  );
}

/**
 * 处理 Ruffle 播放器请求
 *
 * 策略：缓存优先
 * - 先检查缓存
 * - 缓存不存在则请求网络并缓存响应
 */
async function handleRuffleRequest(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const response = await fetch(request);

    // 缓存成功的响应
    if (response.ok) {
      const responseClone = response.clone();
      const cache = await caches.open(RUFFLE_CACHE_NAME);
      cache.put(request, responseClone);
    }

    return response;
  } catch (error) {
    console.error("[SW] Failed to fetch Ruffle resource:", error);
    return new Response("Ruffle resource not available", {
      status: 503,
      statusText: "Service Unavailable",
    });
  }
}

/**
 * 处理游戏资源请求
 *
 * 策略：Stale-While-Revalidate
 * - 优先返回缓存（快速响应）
 * - 在线时后台更新缓存
 * - 离线时完全依赖缓存
 *
 * 注意：Cache API 只支持 GET 请求，HEAD 等其他方法直接走网络
 */
async function handleGameResourceRequest(request, url) {
  // 确保只处理 HTTP/HTTPS 协议
  // 浏览器插件注入的资源（chrome-extension://）不支持 Cache API
  if (!url.protocol.startsWith("http")) {
    return fetch(request);
  }

  // Cache API 只支持 GET 请求，其他方法（如 HEAD）直接走网络
  const isGetRequest = request.method === "GET";

  if (!isGetRequest) {
    // HEAD 请求等直接走网络，不尝试缓存
    try {
      return await fetch(request);
    } catch (error) {
      console.error("[SW] Non-GET request failed:", url.href, request.method);
      return new Response("Request failed", {
        status: 503,
        statusText: "Service Unavailable",
      });
    }
  }

  const cache = await caches.open(GAME_CACHE_NAME);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    // 有缓存 - 立即返回，但在线时后台更新
    if (navigator.onLine) {
      // 后台更新（不阻塞响应）
      fetch(request)
        .then((freshResponse) => {
          if (freshResponse.ok) {
            cache.put(request, freshResponse.clone());
          }
        })
        .catch(() => {
          // 网络错误，忽略（已有缓存）
        });
    }

    return cachedResponse;
  }

  // 无缓存 - 请求网络
  try {
    const response = await fetch(request);

    // 缓存所有成功的响应
    if (response.ok) {
      const responseClone = response.clone();
      cache.put(request, responseClone);
    }

    return response;
  } catch (error) {
    // 离线且无缓存
    console.error("[SW] Fetch failed for game resource:", url.href);
    return new Response("Offline - Resource not cached", {
      status: 503,
      statusText: "Service Unavailable",
    });
  }
}

/**
 * 处理游戏资源 API 请求
 *
 * /api/game-resource/* 请求直接走网络
 * 这些是从 R2 获取资源的请求
 */
async function handleGameResourceApiRequest(request) {
  try {
    return await fetch(request);
  } catch (error) {
    return new Response("Resource API not available", {
      status: 503,
      statusText: "Service Unavailable",
    });
  }
}

// ============================================================================
// 消息处理
// ============================================================================

/**
 * 处理来自主线程的消息
 *
 * 支持的消息类型：
 * - CACHE_GAME_RESOURCE: 手动缓存单个资源
 */
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "CACHE_GAME_RESOURCE") {
    handleDirectCaching(event);
  }
});

/**
 * 处理直接缓存请求
 *
 * 允许主线程直接将资源数据存入缓存
 */
async function handleDirectCaching(event) {
  const { url, responseData, contentType } = event.data;
  const port = event.ports[0];

  try {
    const cache = await caches.open(GAME_CACHE_NAME);

    // 从提供的数据创建 Response
    const response = new Response(responseData, {
      headers: {
        "Content-Type": contentType || "application/octet-stream",
      },
    });

    await cache.put(url, response);

    port?.postMessage({
      success: true,
      url,
    });
  } catch (error) {
    console.error("[SW] Failed to cache resource:", error);
    port?.postMessage({
      success: false,
      url,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

// ============================================================================
// 生命周期事件
// ============================================================================

/**
 * 激活事件 - 清理旧缓存
 *
 * 当 Service Worker 激活时，删除旧版本的缓存
 */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // 删除旧版本的游戏资源缓存
          const isOldGameCache =
            cacheName.startsWith("game-resources-") &&
            cacheName !== GAME_CACHE_NAME;

          // 删除旧版本的 Ruffle 缓存
          const isOldRuffleCache =
            cacheName.startsWith("ruffle-player-") &&
            cacheName !== RUFFLE_CACHE_NAME;

          if (isOldGameCache || isOldRuffleCache) {
            console.log("[SW] Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

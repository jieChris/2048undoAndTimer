const CACHE_NAME = "horse-theme-assets-v1";
const HORSE_ASSET_PATHS = [
  "/images/horse/%E9%A9%AC.png",
  "/images/horse/%E9%A9%AC%E5%A4%B4.png",
  "/images/horse/%E6%88%98%E9%A9%AC.png"
];

async function precacheHorseAssets() {
  const cache = await caches.open(CACHE_NAME);
  for (let i = 0; i < HORSE_ASSET_PATHS.length; i += 1) {
    const path = HORSE_ASSET_PATHS[i];
    try {
      const req = new Request(path, { cache: "reload" });
      const res = await fetch(req);
      if (res && res.ok) {
        await cache.put(path, res.clone());
      }
    } catch (e) {
      // Ignore single-asset failures to avoid blocking SW install.
    }
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      await precacheHorseAssets();
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names.map((name) => {
          if (name !== CACHE_NAME && name.indexOf("horse-theme-assets-") === 0) {
            return caches.delete(name);
          }
          return Promise.resolve();
        })
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  let url;
  try {
    url = new URL(req.url);
  } catch (e) {
    return;
  }

  if (url.origin !== self.location.origin) return;
  if (HORSE_ASSET_PATHS.indexOf(url.pathname) === -1) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(url.pathname);
      if (cached) return cached;

      const response = await fetch(req);
      if (response && response.ok) {
        cache.put(url.pathname, response.clone());
      }
      return response;
    })()
  );
});

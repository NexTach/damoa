// Minimal offline shell: network-first for navigations, cache fallback.
const CACHE = "damoa-v1";
const SHARE_CACHE = "damoa-share";
const APP_SHELL = ["/", "/lab/personae"];

// Web Share Target: stash the shared payload, then redirect into the app
// (which reads it from SHARE_CACHE to pre-fill the composer).
async function handleShare(request) {
  try {
    const form = await request.formData();
    const meta = {
      title: form.get("title") || "",
      text: form.get("text") || "",
      url: form.get("url") || "",
    };
    const cache = await caches.open(SHARE_CACHE);
    await cache.put(
      "shared-meta",
      new Response(JSON.stringify(meta), {
        headers: { "content-type": "application/json" },
      }),
    );
    const file = form.get("shared");
    if (file && typeof file !== "string" && file.size) {
      await cache.put(
        "shared-file",
        new Response(file, {
          headers: {
            "content-type": file.type || "application/octet-stream",
            "x-filename": encodeURIComponent(file.name || "shared"),
          },
        }),
      );
    } else {
      await cache.delete("shared-file");
    }
  } catch {
    // fall through to the redirect regardless
  }
  return Response.redirect("/lab/personae?share-target=1", 303);
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(APP_SHELL).catch(() => {})),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== CACHE && k !== SHARE_CACHE)
            .map((k) => caches.delete(k)),
        ),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Intercept the share-target POST before the GET-only guard below.
  if (
    request.method === "POST" &&
    url.origin === self.location.origin &&
    url.pathname === "/lab/personae/share"
  ) {
    event.respondWith(handleShare(request));
    return;
  }

  if (request.method !== "GET") return;
  // Only handle same-origin requests; never cache API calls.
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request).then((r) => r || caches.match("/"))),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((res) => {
          if (res.ok && res.type === "basic") {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
          }
          return res;
        }),
    ),
  );
});

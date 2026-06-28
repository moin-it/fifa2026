// ⚠️ Version bump করলেই পুরনো ইনস্টল করা PWA আপনাআপনি update হবে
const CACHE = 'fifa26-v10';
const ASSETS = [
  '/fifa2026/',
  '/fifa2026/index.html',
  '/fifa2026/manifest.json',
  '/fifa2026/scores.json',
  '/fifa2026/icon-192.png',
  '/fifa2026/icon-512.png'
];

self.addEventListener('install', e => {
  // নতুন SW এলে সাথে সাথে activate হবে — waiting skip করবে
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).catch(() => {})
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    Promise.all([
      // পুরনো cache মুছে ফেলো
      caches.keys().then(keys =>
        Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
      ),
      // সব open client কে নতুন SW দিয়ে নিয়ন্ত্রণ নাও
      self.clients.claim()
    ])
  );
  // সব open tab কে reload করতে বলো (নতুন content পাবে)
  self.clients.matchAll({ type: 'window' }).then(clients => {
    clients.forEach(client => {
      client.postMessage({ type: 'SW_UPDATED' });
    });
  });
});

// Main page থেকে SKIP_WAITING message এলেও কাজ করবে
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);

  // ============================================================
  // scores.json — NEVER CACHE, always network-first with fallback
  // ============================================================
  if (url.pathname.endsWith('scores.json')) {
    e.respondWith(
      fetch(e.request, { cache: 'no-store' })
        .then(res => {
          // Fresh response পেলে cache-এ রাখব না, কিন্তু return করব
          return res;
        })
        .catch(() => {
          // Network fail হলে cache থেকে দেখো (last resort)
          return caches.match(e.request).then(cached => {
            if (cached) return cached;
            return new Response('{"scores":{},"lastUpdated":"","note":"offline"}', {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            });
          });
        })
    );
    return;
  }

  // ============================================================
  // Score API calls — NEVER CACHE
  // ============================================================
  const NEVER_CACHE_HOSTS = [
    'football-data.org',
    'thesportsdb.com',
    'googleapis.com',
    'googletagmanager.com',
    'api-football.com',
    'zafronix.com',
    'youtube.com',
    'tsports.com.bd',
    'toffee.live',
    'bioscopeplus.com',
    'myrobi.com'
  ];

  if (NEVER_CACHE_HOSTS.some(h => url.hostname.includes(h))) {
    e.respondWith(
      fetch(e.request, { cache: 'no-store' })
        .catch(() => new Response('', { status: 503 }))
    );
    return;
  }

  // ============================================================
  // index.html — network-first (always get latest version)
  // ============================================================
  if (url.pathname.endsWith('index.html') || url.pathname === '/fifa2026/' || url.pathname === '/fifa2026') {
    e.respondWith(
      fetch(e.request, { cache: 'no-store' })
        .then(res => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
          }
          return res;
        })
        .catch(() => {
          return caches.match(e.request).then(cached => cached || new Response('Offline', { status: 503 }));
        })
    );
    return;
  }

  // ============================================================
  // বাকি সব: cache-first, background update
  // ============================================================
  e.respondWith(
    caches.match(e.request).then(cached => {
      const fetchPromise = fetch(e.request).then(res => {
        if (res && res.status === 200 && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});

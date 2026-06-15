// ⚠️ Version bump করলেই পুরনো ইনস্টল করা PWA আপনাআপনি update হবে
const CACHE = 'fifa26-v7';
const ASSETS = [
  '/fifa2026/',
  '/fifa2026/index.html',
  '/fifa2026/manifest.json',
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

  // Score API calls ক্যাশ করব না — সবসময় network থেকে নেব
  if (url.hostname.includes('football-data.org') ||
      url.hostname.includes('thesportsdb.com') ||
      url.hostname.includes('googleapis.com') ||
      url.hostname.includes('googletagmanager.com') ||
      url.hostname.includes('api-football.com') ||
      url.hostname.includes('zafronix.com') ||
      url.hostname.includes('youtube.com') ||
      url.hostname.includes('tsports.com.bd') ||
      url.hostname.includes('toffee.live') ||
      url.hostname.includes('bioscopeplus.com')) {
    e.respondWith(fetch(e.request).catch(() => new Response('', { status: 503 })));
    return;
  }

  // বাকি সব: cache-first, background update
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
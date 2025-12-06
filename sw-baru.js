const CACHE_NAME = 'mlu-glass-v1'; // Ganti nama versi jika ada update besar
const FILES_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './mlu-logo.png'
];

// 1. INSTALL: Simpan file penting ke memori HP
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Paksa aktif langsung
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('SW: Caching App Shell...');
      return cache.addAll(FILES_TO_CACHE);
    })
  );
});

// 2. ACTIVATE: Hapus cache versi lama (bersih-bersih)
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('SW: Hapus cache lama', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
});

// 3. FETCH: Strategi "Network First, Fallback Cache" (Anti White Screen)
// Coba ambil internet dulu (biar data update), kalau gagal baru ambil cache.
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Jangan cache request ke Google Maps/Firebase/API (biar selalu realtime)
  if (req.url.includes('firebase') || req.url.includes('google') || req.url.includes('api')) {
    return; 
  }

  // Untuk file aplikasi (HTML, Gambar)
  event.respondWith(
    fetch(req)
      .catch(() => {
        // Jika internet mati (Offline), ambil dari cache
        return caches.match(req).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // JURUS TERAKHIR: Kalau file diminta gak ada, kasih index.html (biar gak blank)
          return caches.match('./index.html');
        });
      })
  );
});

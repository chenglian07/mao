// Service Worker - PWA 离线支持
const CACHE_NAME = 'meowguard-v1';
const OFFLINE_URL = '/';

// 安装阶段
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/static/css/style.css',
        '/static/js/main.js',
        '/static/manifest.json'
      ]);
    })
  );
  self.skipWaiting();
});

// 激活阶段
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      );
    })
  );
  return self.clients.claim();
});

// 请求处理
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondUntil(
      fetch(event.request)
        .catch(() => caches.match(OFFLINE_URL))
    );
  } else {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          return response || fetch(event.request);
        })
    );
  }
});
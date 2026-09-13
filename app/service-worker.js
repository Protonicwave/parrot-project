// Owns offline availability. The shell is precached at install, the tracks are
// cached only when the farmer actually presses play on one.

const shellCache = 'sunflower-shell-v2';
const trackCache = 'sunflower-tracks-v1';

const shell = [
  './',
  'index.html',
  'manifest.webmanifest',
  'assets/icon.svg',
  'assets/styles/app.css',
  'assets/locales/ne.json',
  'assets/locales/en.json',
  'assets/tracks/manifest.json',
  'src/main.js',
  'src/core/numerals.js',
  'src/core/rotation.js',
  'src/core/schedule.js',
  'src/core/settings.js',
  'src/core/session.js',
  'src/platform/clock.js',
  'src/platform/player.js',
  'src/platform/store.js',
  'src/ui/render.js',
  'src/ui/settings.js',
  'src/ui/strings.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(shellCache).then((cache) => cache.addAll(shell)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(
        names
          .filter((name) => name !== shellCache && name !== trackCache)
          .map((name) => caches.delete(name)),
      ))
      .then(() => self.clients.claim()),
  );
});

// Media elements ask for byte ranges. A range response cannot be stored, so the
// whole track is fetched once and the full body is served every time: the app
// never seeks, so nothing is lost by ignoring the range.
async function track(request) {
  const cache = await caches.open(trackCache);
  const stored = await cache.match(request.url);
  if (stored) return stored;
  const response = await fetch(request.url);
  if (response.ok) await cache.put(request.url, response.clone());
  return response;
}

async function shellFirst(request) {
  const stored = await caches.match(request, { ignoreSearch: true });
  if (stored) return stored;
  return fetch(request);
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  if (request.url.includes('/assets/tracks/') && request.url.endsWith('.mp3')) {
    event.respondWith(track(request));
    return;
  }
  event.respondWith(shellFirst(request));
});

// Offline support: everything the film, the lyrics and the mates need is stored on the device at first visit.
// The big download files (film/) are left out; they are only fetched when someone taps Download.
const CACHE = 'wybm-20261029-0940';
const ASSETS = [
"./",
"index.html",
"manifest.webmanifest",
"lied.mp3",
"apple-touch-icon.png",
"favicon-32.png",
"favicon.ico",
"icon-192.png",
"icon-512.png",
"img/01-outback-nacht.jpg",
"img/02-sydney.jpg",
"img/03-blue-mountains.jpg",
"img/04-outback-weg.jpg",
"img/05-touringcar-binnen.jpg",
"img/06-touringcar-nacht.jpg",
"img/07-cradle-mountain.jpg",
"img/08-wineglass-bay.jpg",
"img/09-bos-nacht.jpg",
"img/10-halls-gap.jpg",
"img/11-twelve-apostles.jpg",
"img/12-uluru.jpg",
"img/adrie.webp",
"img/anne.webp",
"img/barbecue.webp",
"img/betty.webp",
"img/bijl.webp",
"img/boef.webp",
"img/chauffeuse-staand.webp",
"img/chauffeuse-stuur.webp",
"img/chauffeuse-twee-vingers.webp",
"img/chauffeuse-verhaal.webp",
"img/chauffeuse-woeshaa.webp",
"img/coby.webp",
"img/dick.webp",
"img/dirk.webp",
"img/ed.webp",
"img/els.webp",
"img/erik.webp",
"img/geert.webp",
"img/gemma.webp",
"img/gijsje.webp",
"img/henk.webp",
"img/john.webp",
"img/kameel-beledigd.webp",
"img/kameel-blij.webp",
"img/kangoeroe-liggend.webp",
"img/kangoeroe-springend.webp",
"img/kangoeroe-staand.webp",
"img/kees.webp",
"img/keutels.webp",
"img/koala-slaapt.webp",
"img/koala-wakker.webp",
"img/lisette.webp",
"img/lucie.webp",
"img/lut.webp",
"img/martin-gids.webp",
"img/martin-hawaii.webp",
"img/martin-hoofd-lach.webp",
"img/martin-hoofd-schater.webp",
"img/martin-hoofd-schreeuw.webp",
"img/martin-hoofd-schrik.webp",
"img/martin-lijf.webp",
"img/minibus-aanhanger-wiel.webp",
"img/minibus-aanhanger.webp",
"img/nellie.webp",
"img/pearce-bijl-omhoog.webp",
"img/pearce-sluipend.webp",
"img/pearce-volle-buik.webp",
"img/poster.jpg",
"img/robbert.webp",
"img/tanja.webp",
"img/touringcar-wiel.webp",
"img/touringcar.webp",
"img/william.webp",
"img/wombat.webp",
"fonts/bangers-latin-400-normal.woff2",
"fonts/nunito-latin-400-italic.woff2",
"fonts/nunito-latin-400-normal.woff2",
"fonts/nunito-latin-700-normal.woff2",
"fonts/nunito-latin-800-normal.woff2"
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('wybm-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

// the song: iPhones ask for it in pieces (Range requests), so answer those from the stored copy
async function ranged(req){
  const c = await caches.open(CACHE);
  const hit = await c.match('lied.mp3');
  if (!hit) return fetch(req);
  const buf = await hit.arrayBuffer(), size = buf.byteLength;
  const m = /bytes=(\d*)-(\d*)/.exec(req.headers.get('range') || '');
  if (!m) return new Response(buf, { headers: { 'Content-Type': 'audio/mpeg', 'Content-Length': String(size), 'Accept-Ranges': 'bytes' } });
  let start = m[1] === '' ? Math.max(0, size - (+m[2] || 0)) : +m[1];
  let end = m[1] === '' || m[2] === '' ? size - 1 : Math.min(+m[2], size - 1);
  if (start >= size) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } });
  return new Response(buf.slice(start, end + 1), { status: 206, headers: {
    'Content-Type': 'audio/mpeg', 'Content-Length': String(end - start + 1), 'Content-Range': `bytes ${start}-${end}/${size}`, 'Accept-Ranges': 'bytes' } });
}

self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin || url.pathname.includes('/film/')) return;
  if (url.pathname.endsWith('/lied.mp3')) { e.respondWith(ranged(req)); return; }
  // the page itself: try the network first so updates arrive, fall back to the stored copy when offline
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put('index.html', copy)); return r; })
      .catch(() => caches.match('index.html')));
    return;
  }
  // pictures, fonts and icons: from the device, otherwise from the network
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req)));
});

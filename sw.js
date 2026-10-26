// Appli hors ligne minimale : les pages du site d'abord depuis le réseau (pour avoir les mises à jour), sinon depuis la copie.
// Les données (Supabase) et les tuiles de carte ne passent pas par ici.
const CACHE = "atlas-v14";
const COQUILLE = ["./", "index.html", "sb.js", "micro.js", "extras.js", "fichiers.js", "exports.js", "config.js", "manifest.webmanifest", "logo2.svg", "logo2-192.png", "vendor/leaflet.js", "vendor/leaflet.css", "vendor/supabase.js"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(COQUILLE))); self.skipWaiting(); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((k) => Promise.all(k.filter((n) => n !== CACHE).map((n) => caches.delete(n))))); self.clients.claim(); });
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return;
  e.respondWith(fetch(e.request).then((r) => { const copie = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copie)); return r; })
    .catch(() => caches.match(e.request).then((r) => r || caches.match("index.html"))));
});

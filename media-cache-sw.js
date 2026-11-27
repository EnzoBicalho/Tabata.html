const MEDIA_CACHE='portfolio-media-v1';
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil((async()=>{const names=await caches.keys();await Promise.all(names.filter(name=>name.startsWith('portfolio-media-')&&name!==MEDIA_CACHE).map(name=>caches.delete(name)));await self.clients.claim();})()));
self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url);
  // The live Spotify widget manages its own short cache. Never pin it in the media cache.
  if(url.hostname==='spotify-recently-played.jeffreyca.workers.dev'||url.pathname.startsWith('/api/spotify/'))return;
  if(request.method!=='GET'||request.headers.has('range')||!/^https?:$/.test(url.protocol)||!(request.destination==='image'||/\.(png|jpe?g|webp|avif|gif|svg|glb|gltf|bin|hdr|ktx2?)(\?|$)/i.test(url.pathname)))return;
  const replaceablePhoto=url.origin===self.location.origin&&(url.pathname.endsWith('/assets/minhaimagem.png')||/\/assets\/enzo\/(portrait\.webp|depth\.png)$/.test(url.pathname));
  const refresh=(async()=>{const response=await fetch(replaceablePhoto?new Request(request,{cache:'no-cache'}):request);if(response.ok||response.type==='opaque'){const cache=await caches.open(MEDIA_CACHE);await cache.put(request,response.clone());}return response;})();
  // A fresh server response updates replaced photos in the background; cached media
  // stays immediately usable on subsequent visits and during connection loss.
  event.waitUntil(refresh.catch(()=>{}));
  event.respondWith((async()=>{const cache=await caches.open(MEDIA_CACHE),cached=await cache.match(request);if(replaceablePhoto){try{return await refresh;}catch(error){if(cached)return cached;throw error;}}return cached||refresh;})());
});

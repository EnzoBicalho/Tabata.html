const MEDIA_CACHE='portfolio-media-v1';
const decodedImages=new Map();

async function prepareCache(){
  if(!('caches'in window))return null;
  if('serviceWorker'in navigator&&isSecureContext){
    try{await navigator.serviceWorker.register(new URL('./media-cache-sw.js',import.meta.url),{scope:'./',updateViaCache:'none'});await Promise.race([navigator.serviceWorker.ready,new Promise(resolve=>setTimeout(resolve,5000))]);}catch(error){console.warn('Media worker unavailable; asset cache retained.',error);}
  }
  try{return await caches.open(MEDIA_CACHE);}catch{return null;}
}

export function startAssetLoader(){
  const root=document.querySelector('#preloader');if(!root)return{track:promise=>promise};
  const started=performance.now(),tasks=[],cacheReady=prepareCache();
  document.body.classList.add('preloader-active');root.setAttribute('aria-hidden','false');
  const progress=document.createElement('div');progress.className='preloader__progress';
  progress.innerHTML='<div class="preloader__progress-line"><span></span></div><p role="status">Preparando imagens e 3D <span>0%</span></p><button type="button" hidden>Tentar novamente</button>';
  root.querySelector('.preloader__content').append(progress);
  const bar=progress.querySelector('.preloader__progress-line span'),label=progress.querySelector('p'),retry=progress.querySelector('button');
  let sealed=false,finished=false;
  function update(){const complete=tasks.filter(t=>t.status==='ready').length,total=tasks.length||1,percent=Math.floor(complete/total*100);bar.style.transform=`scaleX(${percent/100})`;label.innerHTML=`Preparando imagens e 3D <span>${percent}%</span>`;root.dataset.loaded=complete;root.dataset.total=tasks.length;}
  async function finish(){if(finished||!sealed||tasks.some(t=>t.status==='loading'))return;
    const failed=tasks.filter(t=>t.status==='failed');
    if(failed.length){label.textContent=`${failed.length} recurso(s) não carregaram.`;retry.hidden=false;root.dataset.loadState='error';return;}
    finished=true;await new Promise(resolve=>setTimeout(resolve,Math.max(0,1500-(performance.now()-started))));
    root.dataset.loadState='ready';document.documentElement.dataset.assetsReady='true';
    root.classList.add('is-hidden');root.setAttribute('aria-hidden','true');
    document.dispatchEvent(new CustomEvent('portfolio-assets-ready'));
    let completed=false;
    const complete=()=>{if(completed)return;completed=true;root.removeEventListener('transitionend',onEnd);document.body.classList.remove('preloader-active');document.documentElement.dataset.loadingComplete='true';root.remove();document.dispatchEvent(new CustomEvent('portfolio-loading-complete'));};
    const onEnd=event=>{if(event.target===root&&(event.propertyName==='transform'||matchMedia('(prefers-reduced-motion:reduce)').matches))complete();};
    root.addEventListener('transitionend',onEnd);
    const seconds=value=>value.trim().endsWith('ms')?parseFloat(value)/1000:parseFloat(value)||0;
    const style=getComputedStyle(root),duration=Math.max(...style.transitionDuration.split(',').map(seconds)),delay=Math.max(...style.transitionDelay.split(',').map(seconds));
    setTimeout(complete,(duration+delay)*1000+80);
  }
  function run(task){task.status='loading';update();task.promise=Promise.resolve().then(task.load).then(()=>{task.status='ready';},error=>{task.status='failed';task.error=String(error);console.warn('Asset preparation failed:',task.label,error);}).finally(()=>{update();finish();});return task.promise;}
  function track(label,promiseOrLoad){const task={label,status:'loading',load:typeof promiseOrLoad==='function'?promiseOrLoad:()=>promiseOrLoad};tasks.push(task);return run(task);}
  retry.addEventListener('click',()=>{retry.disabled=true;retry.textContent='Recarregando…';location.reload();});
  const urls=new Set();
  const add=value=>{if(!value||value.startsWith('data:')||value.startsWith('blob:'))return;try{urls.add(new URL(value,document.baseURI).href);}catch{}};
  const pageImages=[...document.images].filter(image=>!image.hasAttribute('data-live-image'));pageImages.forEach(image=>{image.loading='eager';add(image.currentSrc||image.getAttribute('src'));});
  document.querySelectorAll('link[rel~="icon"]').forEach(icon=>add(icon.href));
  document.querySelectorAll('[data-cloud-src],[data-preload-asset]').forEach(el=>add(el.dataset.cloudSrc||el.dataset.preloadAsset));
  for(const file of ['assets/enzo/portrait.webp','assets/enzo/depth.png'])add(file);
  async function cacheAsset(url){const cache=await cacheReady;if(!cache)return;
    try{const cached=await cache.match(url);if(cached)return;let response;
      try{response=await fetch(url,{mode:new URL(url).origin===location.origin?'same-origin':'cors',cache:'default'});}catch(error){if(new URL(url).origin===location.origin)throw error;response=await fetch(url,{mode:'no-cors'});}
      if(!response.ok&&response.type!=='opaque')throw Error(`HTTP ${response.status}`);
      await cache.put(url,response);
    }catch(error){console.warn('Persistent cache unavailable for',url,error);}
  }
  async function imageAsset(url){await cacheAsset(url);const image=new Image();image.decoding='async';
    await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Image load timed out')),30000);image.onload=()=>{clearTimeout(timer);resolve();};image.onerror=()=>{clearTimeout(timer);reject(Error('Image unavailable: '+url));};image.src=url;});
    await image.decode();decodedImages.set(url,image);
  }
  urls.forEach(url=>track(url,()=>/\.(glb|gltf|bin|hdr|ktx2?)(\?|$)/i.test(url)?cacheAsset(url):imageAsset(url)));
  track('Decoded document images',()=>Promise.all(pageImages.map(image=>image.decode())));
  track('Fonts',()=>document.fonts?.ready||Promise.resolve());
  root.dataset.loadState='loading';
  // Module initializers below register their GPU work during this same task.
  setTimeout(()=>{sealed=true;finish();},0);
  return{track,get state(){return tasks.map(({label,status,error})=>({label,status,error}));}};
}

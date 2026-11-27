// Exact Syne ExtraBold (800) glyph outlines, converted from the OFL font.
const viewBox="70 -640 2374 640";
const outlines=["M320 -270V-190H1080V0H70V-640H1078V-450H320V-370H940V-270Z","M1364 -151V0H1110V-151Z","M1404 0V-640H2034Q2228 -640 2320.0 -602.0Q2412 -564 2412 -470Q2412 -410 2372.5 -378.0Q2333 -346 2259.5 -333.5Q2186 -321 2083 -318L2091 -326Q2166 -326 2230.0 -322.0Q2294 -318 2342.0 -304.0Q2390 -290 2417.0 -261.0Q2444 -232 2444 -181Q2444 -119 2400.0 -79.0Q2356 -39 2275.0 -19.5Q2194 0 2084 0ZM1654 -188H2084Q2137 -188 2160.5 -198.0Q2184 -208 2184 -230Q2184 -245 2173.5 -254.0Q2163 -263 2141.0 -267.5Q2119 -272 2084 -272H1654ZM1654 -368H2042Q2095 -368 2118.5 -378.0Q2142 -388 2142 -410Q2142 -433 2118.5 -442.5Q2095 -452 2042 -452H1654Z"];

/** The mark is outside the loading curtain so it can land on the hero. */
export function createPreloaderMark({root,gsap,onProgress}){
 const logo=document.createElement('div');logo.className='preloader-mark';logo.setAttribute('aria-hidden','true');
 // Separate contours prevent the B's inner counters from flashing ahead of the pen.
 const contours=outlines.flatMap(d=>d.match(/M[^M]+/g));
 logo.innerHTML='<svg xmlns="http://www.w3.org/2000/svg" viewBox="'+viewBox+'" fill="none" aria-hidden="true"><g data-mark-fill fill="currentColor" opacity="0">'+outlines.map(d=>'<path d="'+d+'"/>').join('')+'</g><g data-mark-strokes fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round">'+contours.map(d=>'<path d="'+d+'"/>').join('')+'</g></svg>';
 document.body.append(logo);
 const fill=logo.querySelector('[data-mark-fill]'),strokes=logo.querySelector('[data-mark-strokes]');
 const paths=[...strokes.querySelectorAll('path')],lengths=paths.map(p=>p.getTotalLength()),total=lengths.reduce((a,b)=>a+b,0),drawing={value:0};
 const startedAt=performance.now(),minimumDrawMs=1500,reduced=matchMedia('(prefers-reduced-motion:reduce)');
 let timeline,disposed=false,targetProgress=0,travelMark;
 paths.forEach((p,i)=>{p.style.strokeDasharray=lengths[i];p.style.strokeDashoffset=lengths[i];});
 function paint(){let cursor=drawing.value*total;paths.forEach((p,i)=>{p.style.strokeDashoffset=String(lengths[i]-Math.max(0,Math.min(lengths[i],cursor)));cursor-=lengths[i];});logo.dataset.progress=drawing.value.toFixed(3);onProgress?.(drawing.value);}
 // One ticker follows real readiness, with a short presentation window on cache
 // hits. Progress never outruns the assets and no tween is restarted per asset.
 function updateDrawing(){const cap=reduced.matches?1:Math.min(1,(performance.now()-startedAt)/minimumDrawMs),value=Math.min(targetProgress,cap);if(value===drawing.value)return;drawing.value=value;paint();}
 function setProgress(value){if(disposed||value<=targetProgress)return;targetProgress=Math.min(1,value);updateDrawing();}
 gsap.ticker.add(updateDrawing);
 function prepareText(){
  travelMark=document.querySelector('.lh-mark');
  // Move the actual hero text to the SVG, then animate that same element home.
  // This removes the SVG/text handoff from the end of the journey entirely.
  gsap.set(travelMark,{x:0,y:0,scale:1,transformOrigin:'50% 50%'});
  const box=travelMark.getBoundingClientRect(),style=getComputedStyle(travelMark),size=parseFloat(style.fontSize),line=parseFloat(style.lineHeight),from=logo.getBoundingClientRect();
  const originX=box.left+box.width/2,originY=box.top+box.height/2;
  const glyphX=box.left+.07*size+2.374*size/2,glyphY=box.top+(line-1.2*size)/2+.605*size;
  const scale=from.width/(2.374*size);
  const x=from.left+from.width/2-originX-(glyphX-originX)*scale,y=from.top+from.height/2-originY-(glyphY-originY)*scale;
  gsap.set(travelMark,{x,y,scale,autoAlpha:0,force3D:true});
  document.body.classList.add('preloader-text-active');root.dataset.loadState='text';
 }
 function finish(onExit){return new Promise(resolve=>{
  targetProgress=1;updateDrawing();gsap.ticker.remove(updateDrawing);
  const reduce=reduced.matches;
  const remaining=reduce?0:Math.max(0,(startedAt+minimumDrawMs-performance.now())/1000);
  root.dataset.loadState='drawing';
  timeline=gsap.timeline({onComplete:()=>{document.documentElement.dataset.preloaderMarkLanded='true';dispose();resolve();}})
   .to(drawing,{value:1,duration:remaining,ease:'none',onUpdate:paint})
   .to(fill,{opacity:1,duration:reduce?0:.2,ease:'sine.inOut'})
   .to(strokes,{opacity:0,duration:reduce?0:.2,ease:'sine.out'},'<')
   .call(prepareText)
   .to(logo,{autoAlpha:0,duration:reduce?0:.12,ease:'none'})
   .to(document.querySelector('.lh-mark'),{autoAlpha:1,duration:reduce?0:.12,ease:'none'},'<')
   .call(()=>{root.dataset.loadState='departing';onExit();})
   .to(document.querySelector('.lh-mark'),{x:0,y:0,scale:1,duration:reduce?.15:.95,ease:'sine.inOut',force3D:true});
 });}
 function dispose(){if(disposed)return;disposed=true;gsap.ticker.remove(updateDrawing);logo.remove();}
 window.addEventListener('pagehide',()=>{timeline?.kill();dispose();},{once:true});
 paint();return{setProgress,finish,dispose};
}

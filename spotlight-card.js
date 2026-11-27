// Adapted directly from the user's SpotlightCard, without introducing React.
const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
const NOISE="url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";
const falloff=(color,softness)=>{
  const soft=clamp(softness,0,1),core=(1-soft)**1.5*.85;
  const stop=(alpha,at)=>`color-mix(in srgb, ${color} ${(alpha*100).toFixed(2)}%, transparent) ${(at*100).toFixed(2)}%`;
  const list=[stop(1,0)];
  for(let i=0;i<=14;i++){
    const t=core+(1-core)*i/14,g=(t-core)/(1-core),smooth=1-g*g*(3-2*g),glow=Math.exp(-4.6*g*g)*(1-g**6);
    list.push(stop(smooth+(glow-smooth)*soft,t));
  }
  return list.join(', ');
};
export function initSpotlightCard(root){
  root.classList.add('spotlight-card');
  const layers=['light','grain','border','edge'].map(name=>{const span=document.createElement('span');span.className='spotlight-card__'+name;span.setAttribute('aria-hidden','true');return span;});
  const [light,noise,border,edge]=layers;noise.style.backgroundImage=NOISE;root.prepend(light,noise);root.append(border,edge);
  const s={shape:'circle',fill:falloff('#ffffff',.7),edge:falloff('#ffffff',1),size:240,intensity:.15,borderGlow:.6,proximity:80,smoothing:.3,ambient:false,flare:true,grain:0};
  const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
  const state={x:0,y:0,presence:0,flare:0,time:Math.random()*60,pressed:false,visible:true};
  const pointer={x:0,y:0,active:false},drawn={light:'',edge:'',noise:''};
  let focus=null,raf=0,last=0,alive=true;
  function gradient(size,x,y,stops){return `radial-gradient(circle ${size.toFixed(1)}px at ${x.toFixed(1)}px ${y.toFixed(1)}px, ${stops})`;}
  function paint(){
    const size=s.size*(1+.2*state.flare),boost=1+.7*state.flare;
    const fill=gradient(size,state.x,state.y,s.fill),rim=gradient(size*.6,state.x,state.y,s.edge);
    if(fill!==drawn.light){drawn.light=fill;light.style.background=fill;}
    if(rim!==drawn.edge){drawn.edge=rim;edge.style.background=rim;}
    light.style.opacity=String(Math.min(1,state.presence*s.intensity*boost));
    edge.style.opacity=String(Math.min(1,state.presence*s.borderGlow*boost));
    const grainy=s.grain>0?gradient(size,state.x,state.y,'#000 0%, transparent 100%'):'none';
    if(grainy!==drawn.noise){drawn.noise=grainy;noise.style.webkitMaskImage=grainy;noise.style.maskImage=grainy;}
    noise.style.opacity=String(state.presence*s.grain);
  }
  function tick(now){
    raf=0;if(!alive)return;
    const dt=Math.min(.05,Math.max(.001,(now-last)/1000));last=now;
    const rect=root.getBoundingClientRect();let tx=state.x,ty=state.y,target=0;
    if(focus&&root.contains(focus)){
      const box=focus.getBoundingClientRect();tx=box.left+box.width/2-rect.left;ty=box.top+box.height/2-rect.top;target=1;
    }else if(pointer.active){
      tx=pointer.x-rect.left;ty=pointer.y-rect.top;
      const gap=Math.hypot(Math.max(0,-tx,tx-rect.width),Math.max(0,-ty,ty-rect.height));
      if(gap===0)target=1;else if(s.proximity>0)target=Math.max(0,1-gap/s.proximity)**2;
    }
    if(state.presence<.02&&target>0&&!s.ambient){state.x=tx;state.y=ty;}
    const follow=reduce||s.smoothing===0?1:1-Math.exp(-dt/(.015+s.smoothing*.22));
    state.x+=(tx-state.x)*follow;state.y+=(ty-state.y)*follow;
    const fade=reduce?1:1-Math.exp(-dt/(target>state.presence?.1:.32));
    state.presence+=(target-state.presence)*fade;
    if(Math.abs(target-state.presence)<.002)state.presence=target;
    const press=state.pressed&&s.flare&&!reduce?1:0;
    state.flare+=(press-state.flare)*(1-Math.exp(-dt/(press?.05:.28)));
    if(Math.abs(press-state.flare)<.002)state.flare=press;
    paint();
    const moving=Math.abs(tx-state.x)>.1||Math.abs(ty-state.y)>.1;
    if(moving||state.presence!==target||state.flare!==press)raf=requestAnimationFrame(tick);
  }
  function wake(){if(raf||!alive)return;last=performance.now();raf=requestAnimationFrame(tick);}
  const onMove=event=>{pointer.x=event.clientX;pointer.y=event.clientY;pointer.active=true;if(state.presence>0||s.proximity>0||root.contains(event.target))wake();};
  const onOut=event=>{if(event.relatedTarget)return;pointer.active=false;wake();};
  const onDown=event=>{pointer.x=event.clientX;pointer.y=event.clientY;pointer.active=true;state.pressed=true;wake();};
  const onUp=event=>{if(event.pointerType!=='mouse')pointer.active=false;if(!state.pressed&&event.pointerType==='mouse')return;state.pressed=false;wake();};
  const onFocusIn=event=>{if(!(event.target instanceof Element)||!event.target.matches(':focus-visible'))return;focus=event.target;wake();};
  const onFocusOut=event=>{if(root.contains(event.relatedTarget))return;focus=null;wake();};
  const onScroll=()=>{if(pointer.active||state.presence>0)wake();};
  const observer=new IntersectionObserver(entries=>{state.visible=entries.some(entry=>entry.isIntersecting);if(state.visible)wake();});observer.observe(root);
  window.addEventListener('pointermove',onMove);window.addEventListener('pointerup',onUp);window.addEventListener('pointercancel',onUp);
  window.addEventListener('scroll',onScroll,{capture:true,passive:true});document.addEventListener('pointerout',onOut);
  root.addEventListener('pointerdown',onDown);root.addEventListener('focusin',onFocusIn);root.addEventListener('focusout',onFocusOut);wake();
  const api={get state(){return {...state,active:Boolean(raf)};},dispose(){
    alive=false;cancelAnimationFrame(raf);observer.disconnect();
    window.removeEventListener('pointermove',onMove);window.removeEventListener('pointerup',onUp);window.removeEventListener('pointercancel',onUp);
    window.removeEventListener('scroll',onScroll,{capture:true});document.removeEventListener('pointerout',onOut);
    root.removeEventListener('pointerdown',onDown);root.removeEventListener('focusin',onFocusIn);root.removeEventListener('focusout',onFocusOut);
    layers.forEach(layer=>layer.remove());root.classList.remove('spotlight-card');delete root.spotlight;
  }};
  root.spotlight=api;return api;
}

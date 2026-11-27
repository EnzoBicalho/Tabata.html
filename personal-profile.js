import {initProfileCards} from './profile-cards.js?v=20261126-live-refresh-1';
export function initPersonalProfile({gsap,ScrollTrigger,preload=false}){
  const root=document.querySelector('.personal-profile');if(!root)return;
  const cards=initProfileCards({gsap});
  const poster=root.querySelector('.profile__poster'),tabs=[...root.querySelectorAll('[data-profile-mode]')],art=[...root.querySelectorAll('[data-profile-art]')];
  const reduced=matchMedia('(prefers-reduced-motion:reduce)'),fine=matchMedia('(hover:hover) and (pointer:fine)'),abort=new AbortController(),{signal}=abort;
  let mode='design',transition,entrance,visible=false,motion,disposed=false;
  let photo,photoReady;
  function loadPhoto(){if(photoReady)return photoReady;photoObserver.disconnect();return photoReady=import('./profile-photo.js?v=20261127-fit-2').then(({initProfilePhoto})=>initProfilePhoto({poster,gsap})).then(api=>{if(disposed)api?.dispose();else photo=api;return api;}).catch(error=>{poster.dataset.photoRenderer='fallback';console.warn('Profile photo initialization failed.',error);});}
  const photoObserver=new IntersectionObserver(([entry])=>{if(entry.isIntersecting)loadPhoto();},{rootMargin:'350px 0px'});
  const ready=preload?loadPhoto():Promise.resolve();if(!preload)photoObserver.observe(poster);
  const copy={pt:{label:'POR TRÁS DOS PROJETOS',hello:'Prazer, eu sou o',statement:'Um olhar criativo.<br>Mais de uma forma de fazer.',bio:'Conecto design, desenvolvimento e edição para transformar ideias em experiências digitais com personalidade.',process:'Da primeira referência ao último ajuste, meu trabalho passa pela imagem, pelo código e pelo movimento.',contact:'Vamos criar algo juntos',visualNote:'Três linguagens. A mesma assinatura.',design:'Identidade, direção de arte e interfaces.',code:'Sites que conectam forma e função.',motion:'Edição, ritmo e narrativas visuais.',codeTitle:'Código',motionTitle:'Movimento',availability:'Aberto a novos projetos'},en:{label:'BEHIND THE PROJECTS',hello:"Hi, I'm",statement:'A creative perspective.<br>More than one way to create.',bio:'I connect design, development and editing to turn ideas into digital experiences with personality.',process:'From the first reference to the final adjustment, my work moves through imagery, code and motion.',contact:"Let's create something together",visualNote:'Three languages. One signature.',design:'Identity, art direction and interfaces.',code:'Websites connecting form and function.',motion:'Editing, rhythm and visual narratives.',codeTitle:'Code',motionTitle:'Motion',availability:'Open to new projects'}};
  const notes={pt:{design:'Forma com intenção.',code:'Ideias que funcionam.',motion:'O ritmo faz a diferença.'},en:{design:'Form with purpose.',code:'Ideas that work.',motion:'Rhythm makes the difference.'}};
  function language(){const lang=document.documentElement.lang==='en'?'en':'pt';root.querySelectorAll('[data-profile-text]').forEach(el=>{const key=el.dataset.profileText;if(key!=='posterNote')el.innerHTML=copy[lang][key];});root.querySelector('[data-profile-text="posterNote"]').textContent=notes[lang][mode];root.querySelector('.profile__edition').textContent=String(tabs.findIndex(t=>t.dataset.profileMode===mode)+1).padStart(2,'0')+' / '+({design:'DESIGN',code:'CODE',motion:'MOTION'}[mode]);root.querySelector('[role=tablist]').setAttribute('aria-label',lang==='en'?'Creative disciplines':'Áreas criativas');}
  document.addEventListener('portfolio-language-change',language,{signal});language();
  const path=root.querySelector('[data-motion-path]'),dot=root.querySelector('[data-motion-dot]'),travel={t:0};
  const length=path.getTotalLength();motion=gsap.fromTo(travel,{t:0},{t:1,duration:2.6,ease:'power2.inOut',repeat:-1,yoyo:true,paused:true,onUpdate(){const p=path.getPointAtLength(travel.t*length);dot.setAttribute('cx',p.x);dot.setAttribute('cy',p.y);}});
  function syncMotion(){if(mode==='motion'&&visible&&!reduced.matches&&!document.hidden)motion.play();else motion.pause();}
  function draw(group){group.querySelectorAll('[data-profile-stroke]').forEach(line=>{const length=line.getTotalLength();gsap.fromTo(line,{strokeDasharray:length,strokeDashoffset:reduced.matches?0:length},{strokeDashoffset:0,duration:reduced.matches?0:1.1,ease:'power2.inOut',delay:.12});});}
  function choose(next){if(disposed||next===mode)return;const outgoing=art.find(el=>el.dataset.profileArt===mode),incoming=art.find(el=>el.dataset.profileArt===next);mode=next;transition?.kill();
    tabs.forEach(tab=>{const selected=tab.dataset.profileMode===mode;tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1;});poster.setAttribute('aria-labelledby','profile-tab-'+mode);language();
    if(reduced.matches){gsap.set(art,{autoAlpha:0,y:0,scale:1});gsap.set(incoming,{autoAlpha:1});}
    else{transition=gsap.timeline().to(art.filter(el=>el!==incoming),{autoAlpha:0,y:-12,duration:.25,ease:'power2.in'}).fromTo(incoming,{autoAlpha:0,y:18,scale:.98},{autoAlpha:1,y:0,scale:1,duration:.65,ease:'power3.out'},.15);draw(incoming);}
    syncMotion();root.dataset.discipline=mode;
  }
  tabs.forEach((tab,index)=>{tab.addEventListener('click',()=>choose(tab.dataset.profileMode),{signal});tab.addEventListener('keydown',event=>{let next;if(['ArrowRight','ArrowDown'].includes(event.key))next=(index+1)%tabs.length;else if(['ArrowLeft','ArrowUp'].includes(event.key))next=(index+tabs.length-1)%tabs.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=tabs.length-1;else return;event.preventDefault();tabs[next].focus();choose(tabs[next].dataset.profileMode);},{signal});});
  function reveal(){if(entrance||reduced.matches)return;entrance=gsap.timeline({defaults:{ease:'power3.out'}})
    .set(root.querySelectorAll('.profile__name>span'),{overflow:'hidden'},0)
    .from(root.querySelectorAll('.profile__name>span>span'),{yPercent:110,duration:1.15,stagger:.12},0)
    .from(root.querySelectorAll('.profile__hello,.profile__statement,.profile__bio,.profile__contact'),{autoAlpha:0,y:22,duration:.8,stagger:.1},.25)
    .from(poster,{clipPath:'inset(100% 0 0 0)',y:30,duration:1.15,ease:'power3.inOut'},.1)
    .from(root.querySelector('.profile__visual-note'),{autoAlpha:0,y:10,duration:.6},.9)
    .set(root.querySelectorAll('.profile__name>span'),{overflow:'visible'},1.27);draw(art[0]);root.dataset.revealed='true';}
  const trigger=ScrollTrigger.create({trigger:root,start:'top 68%',once:true,onEnter:reveal});
  const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;syncMotion();},{threshold:0});observer.observe(root);
  const tiltX=gsap.quickTo(poster,'rotationX',{duration:.65,ease:'power3.out'}),tiltY=gsap.quickTo(poster,'rotationY',{duration:.65,ease:'power3.out'});
  poster.addEventListener('pointermove',event=>{if(!fine.matches||reduced.matches||event.pointerType==='touch')return;const b=poster.getBoundingClientRect();tiltX(-(event.clientY-b.top-b.height/2)/b.height*5);tiltY((event.clientX-b.left-b.width/2)/b.width*6);},{signal});poster.addEventListener('pointerleave',()=>{tiltX(0);tiltY(0);},{signal});
  document.addEventListener('visibilitychange',syncMotion,{signal});reduced.addEventListener('change',()=>{if(reduced.matches){entrance?.progress(1);transition?.progress(1);gsap.set(poster,{rotationX:0,rotationY:0});root.querySelectorAll('[data-profile-stroke]').forEach(el=>gsap.set(el,{strokeDashoffset:0}));}syncMotion();},{signal});
  function dispose(){cards?.dispose();disposed=true;abort.abort();observer.disconnect();photoObserver.disconnect();photo?.dispose();trigger.kill();entrance?.kill();transition?.kill();motion.kill();tiltX.tween.kill();tiltY.tween.kill();gsap.killTweensOf(root.querySelectorAll('[data-profile-stroke]'));}
  window.addEventListener('pagehide',e=>{if(!e.persisted)dispose();},{signal});root.profile={ready,choose,dispose,get mode(){return mode;}};root.dataset.discipline='design';return root.profile;
}

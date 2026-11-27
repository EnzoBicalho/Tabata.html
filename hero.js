import * as THREE from 'three';
import {HeroFluid} from './hero-fluid.js';
import {createHeroSubjects,addStudioLights} from './hero-subjects.js?v=20261127-quality-2';
import {fullscreenVertex,noiseFragment,compositeFragment,flowColorFragment} from './hero-shaders.js?v=20261127-alpha-2';
import {initHeroHeader} from './hero-header.js?v=20261126-pill-1';

export async function initHero({gsap,ScrollTrigger,lenis,reduceMotion=false}){
  const root=document.querySelector('.lando-hero');if(!root)return;
  const abort=new AbortController(),{signal}=abort;
  let introTimeline;
  const disposeHeader=initHeroHeader({root,gsap,reduceMotion,signal,beforeTransition:()=>introTimeline?.progress(1)});
  const canvas=root.querySelector('.lh-canvas'),surface=root.querySelector('.lh-surface');
  const heading=root.querySelector('.lh-hero-name');
  const nameObserver=new ResizeObserver(()=>fitName());
  function fitName(){heading.style.fontSize='100px';const measured=heading.querySelector('.lh-name-first').offsetWidth+heading.querySelector('.lh-name-last').offsetWidth;if(measured)heading.style.fontSize=(100*root.clientWidth*.48/measured)+'px';}
  await document.fonts.load('100px "RekovaMarove"','ENZO BICALHO');fitName();nameObserver.observe(root);
  window.addEventListener('pagehide',()=>nameObserver.disconnect(),{signal});
  const touchButton=root.querySelector('[data-hero-touch]');
  const mark=document.querySelector('.lh-mark'),card=root.querySelector('.lh-card'),touch=root.querySelector('.lh-touch');
  const firstName=heading.querySelector('.lh-name-first'),lastName=heading.querySelector('.lh-name-last');
  if(!reduceMotion){gsap.set(mark,{y:0,autoAlpha:0});gsap.set(card,{x:-180,autoAlpha:0});gsap.set(touch,{x:-48,autoAlpha:0});gsap.set(firstName,{x:-root.clientWidth*.5,autoAlpha:0});gsap.set(lastName,{x:root.clientWidth*.5,autoAlpha:0});}
  function enterChrome(timeline){gsap.set(mark,{y:0,autoAlpha:1});timeline.to(card,{x:0,autoAlpha:1,duration:.9,ease:'power3.out'},.2).to(touch,{x:0,autoAlpha:1,duration:.8,ease:'power3.out'},.25).to(firstName,{x:0,autoAlpha:1,duration:1.1,ease:'power3.out'},.12).to(lastName,{x:0,autoAlpha:1,duration:1.1,ease:'power3.out'},.12);}
  function afterLoading(callback){if(document.documentElement.dataset.loadingComplete==='true'||!document.querySelector('#preloader'))callback();else document.addEventListener('portfolio-loading-complete',callback,{signal,once:true});}
  let renderer;
  try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});}
  catch(error){root.dataset.renderer='fallback';console.warn('Hero: WebGL unavailable; showing fallback.',error);if(!reduceMotion)gsap.set(root.querySelector('.lh-fallback img'),{yPercent:110});afterLoading(()=>{if(reduceMotion)return;introTimeline=gsap.timeline();introTimeline.fromTo(root.querySelector('.lh-fallback img'),{yPercent:110},{yPercent:0,duration:1.25,ease:'power3.out'},0);enterChrome(introTimeline);});window.addEventListener('pagehide',()=>{introTimeline?.kill();disposeHeader();abort.abort();},{once:true});return;}
  const pixelRatio=Math.min(Math.max(devicePixelRatio||1,1.5),2);renderer.setPixelRatio(pixelRatio);renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.NoToneMapping;renderer.autoClear=false;
  renderer.setClearColor(0x000000,0);
  // Keep actual HTML typography between the animated background and portrait.
  // Both visual passes use the original WebGL context; no text is rasterized.
  const background=document.createElement('canvas');background.className='lh-background';background.setAttribute('aria-hidden','true');surface.prepend(background);
  const backgroundContext=background.getContext('2d',{alpha:false,desynchronized:true});
  const scene=new THREE.Scene(),alternate=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(15,1,.1,1000);
  let subjects;
  try{subjects=await createHeroSubjects();}catch(error){renderer.dispose();root.dataset.renderer='fallback';throw error;}
  const {portrait,blueprint,blueprintMaterial,wireMaterial,hitPortrait,disposeAssets}=subjects;
  scene.add(portrait);alternate.add(blueprint);addStudioLights(scene);
  const quadScene=new THREE.Scene(),quadCamera=new THREE.Camera(),quadGeometry=new THREE.PlaneGeometry(2,2);
  const quad=new THREE.Mesh(quadGeometry);quad.frustumCulled=false;quadScene.add(quad);
  const target=()=>new THREE.WebGLRenderTarget(1,1,{samples:4,depthBuffer:true});
  const portraitTarget=target(),blueprintTarget=target(),noiseTarget=target(),flowTarget=target();

  const point=new THREE.Vector2(),smooth=new THREE.Vector2(),previousPoint=new THREE.Vector2();
  const flowPoint=new THREE.Vector2(),fluidPointer=new THREE.Vector2(),idle=new THREE.Vector2();
  const noise=new THREE.ShaderMaterial({vertexShader:fullscreenVertex,fragmentShader:noiseFragment,
    uniforms:{uAspect:{value:1},uTime:{value:0},uMouseCoords:{value:smooth},uMousePace:{value:0},uReveal:{value:0}},
    depthTest:false,depthWrite:false});noise.name='Hero contour field';
  const uniforms={tDefaultDiffuse:{value:portraitTarget.texture},tBlueprint:{value:blueprintTarget.texture},
    uCompositionLayer:{value:0},
    tBackgroundNoise:{value:noiseTarget.texture},tCursorEffect:{value:flowTarget.texture},uReveal:{value:0},
    uBlueprintReveal:{value:0},uFilter:{value:0},uCursorIntensity:{value:1},uHover:{value:0},
    uColorHover:{value:new THREE.Vector3(.824,1,0)},uBackgroundOnly:{value:0},
    uBackgroundColor:{value:new THREE.Color(getComputedStyle(root).getPropertyValue('--hero-bg').trim()||'#080a0d')}};
  const composite=new THREE.ShaderMaterial({vertexShader:fullscreenVertex,fragmentShader:compositeFragment,
    uniforms,depthTest:false,depthWrite:false,premultipliedAlpha:true});composite.name='Hero composite';
  const fluid=new HeroFluid(renderer,root.clientWidth,root.clientHeight);
  const flowColor=new THREE.ShaderMaterial({vertexShader:fullscreenVertex,fragmentShader:flowColorFragment,
    uniforms:{velocity:{value:fluid.texture}},depthTest:false,depthWrite:false});
  const state={reveal:reduceMotion?1:0,entrance:reduceMotion?1:0,blueprint:0,attenuation:1,scroll:0,pace:0};
  let width=0,height=0,mobile=false,visible=true,locked=false,disposed=false,lost=false;
  let frame=0,last=performance.now(),origin=last,lastMove=last,idleStart=last+2666.6667,flowAccumulator=0;
  let started=false,hoverTween,attenuationTween,scrollTrigger;
  const idleProgress={x:0,y:0};
  const idleTimeline=gsap.timeline({paused:true,repeat:-1,repeatDelay:3})
    .fromTo(idleProgress,{x:0},{x:1,duration:2.5,ease:'power1.inOut'},0)
    .fromTo(idleProgress,{y:0},{y:1,duration:2.5,ease:'none'},0)
    .to(idleProgress,{x:0,duration:2.5,ease:'power1.inOut'},4)
    .to(idleProgress,{y:0,duration:2.5,ease:'none'},4);
  function resize(){
    const w=Math.round(root.clientWidth),h=Math.round(root.clientHeight);if(w===width&&h===height)return;
    width=w;height=h;mobile=w<=768;renderer.setSize(w,h,false);
    background.width=Math.round(w*pixelRatio);background.height=Math.round(h*pixelRatio);
    if(!mobile&&locked)unlock();
    camera.aspect=w/h;camera.position.z=mobile?3.75:3;camera.updateProjectionMatrix();
    positionPortrait();
    blueprint.position.copy(portrait.position);
    for(const t of [portraitTarget,blueprintTarget,noiseTarget,flowTarget])t.setSize(Math.round(w*pixelRatio),Math.round(h*pixelRatio));
    renderer.setRenderTarget(flowTarget);renderer.setClearColor(0xffffff,1);renderer.clear();renderer.setClearColor(0,0);
    fluid.resize(w,h);noise.uniforms.uAspect.value=w/h;
  }
  const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(root);resize();
  function portraitBase(){return mobile?(subjects.restY?.mobile??-.05):(subjects.restY?.desktop??0);}
  function positionPortrait(){const base=portraitBase(),travel=Math.tan(THREE.MathUtils.degToRad(camera.fov*.5))*camera.position.z+.65;portrait.position.y=base-travel*(1-state.entrance);blueprint.position.copy(portrait.position);}
  function renderQuad(material,renderTarget){quad.material=material;renderer.setRenderTarget(renderTarget);renderer.clear();renderer.render(quadScene,quadCamera);}
  function renderComposite(){
    uniforms.uCompositionLayer.value=1;renderQuad(composite,null);
    backgroundContext.drawImage(canvas,0,0,background.width,background.height);
    uniforms.uCompositionLayer.value=2;renderQuad(composite,null);
  }
  function renderSubject(subject,targetScene,renderTarget){
    renderer.setRenderTarget(renderTarget);renderer.clear();renderer.render(targetScene,camera);
  }
  function setPointer(event){
    if(!started||state.entrance<.999||!visible||reduceMotion||event.pointerType==='touch'&&!locked)return;
    const b=canvas.getBoundingClientRect();
    // Reference fluid listener runs before the global pointer normalizer.
    fluidPointer.copy(point);
    point.set((event.clientX-b.left)/b.width*2-1,1-(event.clientY-b.top)/b.height*2);
    lastMove=performance.now();idleStart=lastMove+2000;idleTimeline.pause();
  }
  // The fixed header sits outside the section. Keep following the pointer over
  // that overlay as well, so leaving a reveal control never freezes the portrait.
  window.addEventListener('pointermove',setPointer,{signal,passive:true});
  root.addEventListener('pointerleave',()=>{idleStart=performance.now()+2000;},{signal});
  function revealBlueprint(value){
    hoverTween?.kill();attenuationTween?.kill();
    const duration=reduceMotion?0:value?1.5:1;
    hoverTween=gsap.to(state,{blueprint:value,duration,ease:'expo.inOut',overwrite:'auto'});
    attenuationTween=gsap.to(state,{attenuation:1-value,duration,ease:'power1.inOut',overwrite:'auto'});
  }
  const alternateButton=root.querySelector('[data-hero-contact]');
  alternateButton.addEventListener('pointerenter',()=>revealBlueprint(1),{signal});
  alternateButton.addEventListener('pointerleave',()=>revealBlueprint(0),{signal});
  alternateButton.addEventListener('focus',()=>revealBlueprint(1),{signal});
  alternateButton.addEventListener('blur',()=>revealBlueprint(0),{signal});
  let clickStart;
  canvas.addEventListener('pointerdown',event=>{clickStart={x:event.clientX,y:event.clientY};},{signal,passive:true});
  function about(){if(locked)unlock();if(lenis)lenis.scrollTo('#world',{duration:reduceMotion?0:1.25});else document.querySelector('#world')?.scrollIntoView({behavior:reduceMotion?'instant':'smooth'});}
  canvas.addEventListener('click',event=>{if(locked||clickStart&&Math.hypot(event.clientX-clickStart.x,event.clientY-clickStart.y)>10)return;const b=canvas.getBoundingClientRect(),point=new THREE.Vector2((event.clientX-b.left)/b.width*2-1,1-(event.clientY-b.top)/b.height*2);if(hitPortrait(point,camera))about();},{signal});
  canvas.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();about();}},{signal});
  function syncLanguage(){
    const en=document.documentElement.lang==='en';
    root.querySelector('[data-hero-touch-label]').textContent=locked?(en?'BACK TO SCROLL':'VOLTAR À ROLAGEM'):(en?'TAP TO EXPLORE':'TOQUE PARA EXPLORAR');
    touchButton.setAttribute('aria-label',en?'Toggle touch interaction':'Alternar interação por toque');
  }
  document.addEventListener('portfolio-language-change',syncLanguage,{signal});syncLanguage();
  function unlock(){locked=false;canvas.classList.remove('is-touch-locked');touchButton.setAttribute('aria-pressed','false');syncLanguage();lenis?.start();}
  touchButton.addEventListener('click',()=>{
    if(locked){unlock();return;}
    locked=true;canvas.classList.add('is-touch-locked');touchButton.setAttribute('aria-pressed','true');
    syncLanguage();lenis?.stop();
  },{signal});
  root.addEventListener('touchmove',(event)=>{if(locked)event.preventDefault();},{signal,passive:false});
  root.addEventListener('keydown',(event)=>{if(event.key==='Escape'){unlock();revealBlueprint(0);}},{signal});
  const observer=new IntersectionObserver(([entry])=>{
    visible=entry.isIntersecting;
    if(!visible&&locked)unlock();
  },{threshold:[0,.25,.5,1]});observer.observe(root);

  if(!reduceMotion){
    function shrinkHero(self){
      state.scroll=self.progress;
      const eased=gsap.parseEase('power1.inOut')(self.progress);
      surface.style.transform=`scale(${1-eased*.16})`;
      surface.style.borderRadius=`${eased*32}px`;
    }
    scrollTrigger=ScrollTrigger.create({trigger:root,start:'top top',end:'bottom top',
      onUpdate:shrinkHero,onRefresh:shrinkHero});
  }

  function start(){
    if(started||disposed)return;started=true;
    origin=performance.now();lastMove=origin;idleStart=origin+2666.6667;idleTimeline.pause(0);fluid.reset();
    renderer.setRenderTarget(flowTarget);renderer.setClearColor(0xffffff,1);renderer.clear();renderer.setClearColor(0,0);renderer.setRenderTarget(null);
    root.dataset.entrance='playing';
    if(!reduceMotion){introTimeline=gsap.timeline({onComplete:()=>{root.dataset.entrance='complete';}}).to(state,{entrance:1,duration:1.25,ease:'power3.out'},0).to(state,{reveal:1,duration:1.1,ease:'power1.inOut'},0);enterChrome(introTimeline);}
    else root.dataset.entrance='complete';
    root.classList.add('is-ready');root.dataset.renderer='webgl';
  }
  // Start only once the loading surface has finished leaving the viewport.
  afterLoading(start);
  function draw(now){
    frame=requestAnimationFrame(draw);
    const dt=Math.min((now-last)/1000,1/30);last=now;
    // GPU assets have already been warmed once; leave the GPU idle while the
    // preloader draws and travels, then resume for the portrait entrance.
    if(disposed||lost||document.hidden||!visible||!started)return;
    const elapsed=(now-origin)/1000;
    positionPortrait();
    if(!reduceMotion&&started){
      // Reference passes seconds×100 to MathUtils.damp: λ=.025 → 2.5/s.
      const follow=1-Math.exp(-2.5*dt);
      smooth.lerp(point,follow);
      const pace=point.distanceTo(previousPoint);previousPoint.copy(point);
      noise.uniforms.uMousePace.value=state.pace*4;
      state.pace+=(pace-state.pace)*(1-Math.exp(-dt));
      if(now>=idleStart){
        if(idleTimeline.paused())idleTimeline.restart();
        idle.set(-Math.cos(idleProgress.x*Math.PI*4)*.75,Math.cos(idleProgress.y*Math.PI)*.5);
        flowPoint.copy(idle);
      }else flowPoint.copy(fluidPointer);
      flowAccumulator+=dt;
      portrait.rotation.y=smooth.x*.075*state.attenuation;
      portrait.rotation.x=mobile?0:-smooth.y*.075*state.attenuation*(1-state.scroll);
      blueprint.rotation.copy(portrait.rotation);
      camera.position.x=smooth.x*.02*state.attenuation;
      camera.position.y=mobile?0:-smooth.y*.02*state.attenuation*(1-state.scroll);
      camera.position.z=mobile?3.75:3;
      wireMaterial.uniforms.uTime.value=Math.max(0,elapsed-.05);
      noise.uniforms.uTime.value=Math.max(0,elapsed-1/30);
    }
    uniforms.uReveal.value=noise.uniforms.uReveal.value=state.reveal;
    uniforms.uBlueprintReveal.value=state.blueprint;

    renderSubject(portrait,scene,portraitTarget);renderSubject(blueprint,alternate,blueprintTarget);
    renderComposite();
    // Reference composites the previous simulation frame, then computes the next.
    renderQuad(noise,noiseTarget);
    if(!reduceMotion&&flowAccumulator>=1/60){
      fluid.update(flowPoint);renderQuad(flowColor,flowTarget);flowAccumulator%=1/60;
    }
  }
  canvas.addEventListener('webglcontextlost',(event)=>{event.preventDefault();lost=true;root.classList.remove('is-ready');root.dataset.renderer='fallback';if(locked)unlock();},{signal});
  canvas.addEventListener('webglcontextrestored',()=>{lost=false;fluid.reset();root.classList.add('is-ready');root.dataset.renderer='webgl';},{signal});
  frame=requestAnimationFrame(draw);
  function dispose(){
    if(disposed)return;disposed=true;cancelAnimationFrame(frame);abort.abort();observer.disconnect();resizeObserver.disconnect();introTimeline?.kill();
    if(locked)unlock();document.body.classList.remove('hero-in-view');scrollTrigger?.kill();
    disposeHeader();
    idleTimeline.kill();hoverTween?.kill();attenuationTween?.kill();gsap.killTweensOf(state);
    gsap.killTweensOf(uniforms.uCursorIntensity);
    const geometries=new Set(),materials=new Set(),textures=new Set();
    for(const s of [scene,alternate])s.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)materials.add(o.material);});
    for(const m of materials){for(const v of Object.values(m))if(v?.isTexture)textures.add(v);m.dispose();}
    for(const g of geometries)g.dispose();for(const t of textures)t.dispose();disposeAssets();
    background.remove();fluid.dispose();portraitTarget.dispose();blueprintTarget.dispose();noiseTarget.dispose();flowTarget.dispose();quadGeometry.dispose();noise.dispose();flowColor.dispose();composite.dispose();renderer.dispose();
  }
  window.addEventListener('pagehide',(event)=>{if(!event.persisted)dispose();},{signal});
  // Read-only state supports regression capture and inspection without production UI.
  await Promise.all([renderer.compileAsync(scene,camera),renderer.compileAsync(alternate,camera)]);
  // Warm the final mesh pose once while covered, including texture and buffer
  // uploads; then return it below the viewport before the loader can disappear.
  portrait.position.y=portraitBase();blueprint.position.copy(portrait.position);
  renderSubject(portrait,scene,portraitTarget);renderSubject(blueprint,alternate,blueprintTarget);
  fluid.update(new THREE.Vector2());renderQuad(flowColor,flowTarget);positionPortrait();
  renderSubject(portrait,scene,portraitTarget);renderSubject(blueprint,alternate,blueprintTarget);renderComposite();
  root.classList.add('is-ready');root.dataset.heroAssets='ready';root.hero={dispose,get state(){return {...state,portraitY:portrait.position.y,pointer:smooth.toArray(),renderer:renderer.info.render};}};
  return root.hero;
}

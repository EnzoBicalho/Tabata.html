import * as THREE from 'three';
import {HeroFluid} from './hero-fluid.js';
import {fullscreenVertex,simplex} from './hero-shaders.js';

const fragment=/* glsl */`
${simplex}
varying vec2 vUv;
uniform sampler2D tPhoto,tFlow;
uniform float uAspect,uImageAspect,uReveal,uTime,uMotion;
uniform vec2 uOrigin;
void main(){
 vec2 p=vUv*vec2(uAspect,1.);
 vec2 origin=uOrigin*vec2(uAspect,1.);
 vec2 velocity=texture2D(tFlow,vUv).xy;
 vec2 flow=clamp(velocity,vec2(-1.),vec2(1.));
 float noise=snoise(vec3(p*4.2+flow*.35,uTime*.3));
 float radius=uReveal*(length(vec2(uAspect,1.))+.3);
 float field=distance(p,origin)+noise*.11*uMotion+length(flow)*.035;
 float mask=(1.-smoothstep(radius-.045,radius+.045,field))*smoothstep(0.,.03,uReveal);
 vec2 displaySize=uImageAspect>uAspect?vec2(.8,.8*uAspect/uImageAspect):vec2(.8*uImageAspect/uAspect,.8);
 vec2 ripple=flow*.045*uMotion;
 ripple+=sin(vec2(p.y,p.x)*21.+uTime*2.)*min(length(velocity),1.)*.003*uMotion;
 vec2 uv=(vUv-.5+ripple)/displaySize+.5;
 float inside=step(0.,uv.x)*step(uv.x,1.)*step(0.,uv.y)*step(uv.y,1.);
 vec4 photo=texture2D(tPhoto,clamp(uv,vec2(.001),vec2(.999)));
 // A fine moving lip follows the organic reveal; the portrait remains undimmed.
 float lip=(1.-smoothstep(.0,.022,abs(field-radius)))*.12*uMotion;
 gl_FragColor=vec4(photo.rgb+vec3(lip*.35,lip*.48,lip*.65),photo.a*mask*inside);
 #include <colorspace_fragment>
}`;

export async function initProfilePhoto({poster,gsap}){
  const stage=poster.querySelector('.profile__art-stage'),image=stage.querySelector('.profile__photo'),button=poster.querySelector('.profile__photo-toggle');
  const reduced=matchMedia('(prefers-reduced-motion:reduce)'),abort=new AbortController(),{signal}=abort;
  let renderer,fluid,material,geometry,texture,frame=0,tween,visible=false,hovered=false,pinned=false,disposed=false,lost=false;
  let width=0,height=0,last=performance.now(),lastMove=last,lastActive=last;
  const point=new THREE.Vector2(),fluidPoint=new THREE.Vector2(),origin=new THREE.Vector2(.5,.5),state={reveal:0};
  const canvas=document.createElement('canvas');canvas.className='profile__photo-canvas';canvas.setAttribute('aria-hidden','true');
  function language(){button.setAttribute('aria-label',document.documentElement.lang==='en'?(pinned?'Hide profile photo':'Show profile photo'):(pinned?'Ocultar foto de perfil':'Mostrar foto de perfil'));}
  function syncPinned(){poster.classList.toggle('is-photo-pinned',pinned);button.setAttribute('aria-pressed',String(pinned));language();}
  document.addEventListener('portfolio-language-change',language,{signal});language();
  try{await image.decode();}catch(error){poster.dataset.photoRenderer='unavailable';button.disabled=true;abort.abort();return{dispose(){}};}
  if(!image.naturalWidth)return{dispose(){}};
  try{
    renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:false,powerPreference:'low-power'});
    renderer.setClearColor(0,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.autoClear=false;
    texture=new THREE.Texture(image);texture.colorSpace=THREE.SRGBColorSpace;texture.minFilter=THREE.LinearFilter;texture.needsUpdate=true;
    fluid=new HeroFluid(renderer,Math.max(stage.clientWidth,1),Math.max(stage.clientHeight,1));
    material=new THREE.ShaderMaterial({vertexShader:fullscreenVertex,fragmentShader:fragment,transparent:true,depthTest:false,depthWrite:false,
      uniforms:{tPhoto:{value:texture},tFlow:{value:fluid.texture},uAspect:{value:1},uImageAspect:{value:image.naturalWidth/image.naturalHeight},uReveal:{value:0},uTime:{value:0},uOrigin:{value:origin},uMotion:{value:reduced.matches?0:1}}});
    stage.append(canvas);poster.dataset.photoRenderer='webgl';
  }catch(error){renderer?.dispose();texture?.dispose();fluid?.dispose();poster.dataset.photoRenderer='fallback';console.warn('Profile photo: fluid rendering unavailable; photo retained.',error);}
  const scene=new THREE.Scene(),camera=new THREE.Camera();
  if(material){geometry=new THREE.PlaneGeometry(2,2);const quad=new THREE.Mesh(geometry,material);quad.frustumCulled=false;scene.add(quad);}
  function resize(){const w=stage.clientWidth,h=stage.clientHeight;if(!w||!h||w===width&&h===height)return;width=w;height=h;
    if(renderer&&material){renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.setSize(w,h,false);material.uniforms.uAspect.value=w/h;fluid.resize(w,h);}wake();}
  function draw(now){frame=0;if(disposed||!visible||document.hidden||lost||!material)return;
    const dt=Math.min((now-last)/1000,.04);last=now;
    if(!reduced.matches){fluid.update(fluidPoint);material.uniforms.uTime.value+=dt;}
    material.uniforms.uReveal.value=state.reveal;renderer.setRenderTarget(null);renderer.clear();renderer.render(scene,camera);
    if(tween?.isActive()||state.reveal>.001&&now-lastMove<2200||now-lastActive<900)frame=requestAnimationFrame(draw);
  }
  function wake(){if(!frame&&material&&visible&&!disposed&&!document.hidden&&!lost){last=performance.now();frame=requestAnimationFrame(draw);}}
  function target(value){if(disposed)return;lastActive=performance.now();poster.dataset.photoState=value?'revealing':'hiding';tween?.kill();
    if(!material){poster.classList.toggle('is-photo-pinned',!!value);return;}
    tween=gsap.to(state,{reveal:value,duration:reduced.matches?0:value?1.05:.75,ease:'power2.inOut',onUpdate:wake,onComplete:()=>{poster.dataset.photoState=value?'shown':'hidden';wake();}});wake();}
  function setPoint(event){const b=stage.getBoundingClientRect(),x=THREE.MathUtils.clamp((event.clientX-b.left)/b.width,0,1),y=THREE.MathUtils.clamp(1-(event.clientY-b.top)/b.height,0,1);fluidPoint.copy(point);point.set(x*2-1,y*2-1);lastMove=performance.now();return{x,y};}
  poster.addEventListener('pointerenter',event=>{if(event.pointerType==='touch')return;hovered=true;const p=setPoint(event);origin.set(p.x,p.y);fluidPoint.copy(point);fluid?.previous.copy(point);target(1);},{signal});
  poster.addEventListener('pointermove',event=>{if(event.pointerType==='touch'||!hovered)return;setPoint(event);wake();},{signal,passive:true});
  poster.addEventListener('pointerleave',event=>{if(event.pointerType==='touch')return;hovered=false;if(!pinned&&!poster.matches(':focus-within'))target(0);},{signal});
  poster.addEventListener('focusin',()=>{origin.set(.5,.5);target(1);},{signal});
  poster.addEventListener('focusout',event=>{if(!poster.contains(event.relatedTarget)&&!hovered&&!pinned)target(0);},{signal});
  button.addEventListener('click',()=>{pinned=!pinned;syncPinned();origin.set(.5,.5);target(pinned?1:0);},{signal});
  let touchStart;
  poster.addEventListener('pointerdown',event=>{if(event.pointerType==='touch')touchStart={x:event.clientX,y:event.clientY};},{signal,passive:true});
  poster.addEventListener('pointerup',event=>{if(event.pointerType!=='touch'||!touchStart||button.contains(event.target))return;if(Math.hypot(event.clientX-touchStart.x,event.clientY-touchStart.y)<10){pinned=!pinned;syncPinned();const p=setPoint(event);origin.set(p.x,p.y);target(pinned?1:0);}touchStart=null;},{signal,passive:true});
  poster.addEventListener('pointercancel',()=>{touchStart=null;},{signal});
  const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(stage);
  const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(visible){resize();wake();}else{cancelAnimationFrame(frame);frame=0;hovered=false;if(!pinned){tween?.kill();state.reveal=0;poster.dataset.photoState='hidden';}}},{threshold:0});observer.observe(stage);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else wake();},{signal});
  reduced.addEventListener('change',()=>{if(material)material.uniforms.uMotion.value=reduced.matches?0:1;if(reduced.matches){tween?.progress(1);fluid?.reset();}wake();},{signal});
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();lost=true;poster.dataset.photoRenderer='fallback';cancelAnimationFrame(frame);frame=0;},{signal});
  canvas.addEventListener('webglcontextrestored',()=>{lost=false;fluid.reset();poster.dataset.photoRenderer='webgl';wake();},{signal});
  hovered=matchMedia('(hover:hover)').matches&&poster.matches(':hover');if(hovered)target(1);resize();
  function dispose(){if(disposed)return;disposed=true;abort.abort();observer.disconnect();resizeObserver.disconnect();cancelAnimationFrame(frame);tween?.kill();fluid?.dispose();material?.dispose();geometry?.dispose();texture?.dispose();renderer?.dispose();canvas.remove();}
  window.addEventListener('pagehide',event=>{if(!event.persisted)dispose();},{signal});
  if(material&&!lost){fluid.update(new THREE.Vector2());renderer.setRenderTarget(null);renderer.clear();renderer.render(scene,camera);await renderer.compileAsync(scene,camera);}
  const api={dispose,get state(){return{reveal:state.reveal,visible,pinned,hovered,point:point.toArray(),frameActive:!!frame,renderer:poster.dataset.photoRenderer};}};poster.photo=api;return api;
}

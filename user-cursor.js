// Independent vanilla-JS implementation of the public User Cursor behavior.
// Exact damped-spring integration keeps the feel consistent at different frame rates.
function spring(stiffness,damping,mass){
  const d=Math.sqrt(damping*damping-4*mass*stiffness);
  return {r1:(-damping+d)/(2*mass),r2:(-damping-d)/(2*mass)};
}
const pointerSpring=spring(380,32,.6),labelSpring=spring(220,26,.7),rotationSpring=spring(100,18,.8);
function axis(value=0){return {value,velocity:0};}
function step(state,target,dt,config){
  const y=state.value-target,{r1,r2}=config,a=(state.velocity-r2*y)/(r1-r2),b=y-a;
  const e1=Math.exp(r1*dt),e2=Math.exp(r2*dt);
  state.value=target+a*e1+b*e2;state.velocity=r1*a*e1+r2*b*e2;
  if(Math.abs(state.value-target)<.005&&Math.abs(state.velocity)<.01){state.value=target;state.velocity=0;}
}
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const nativeSelector='input,textarea,select,iframe,[contenteditable]:not([contenteditable="false"]),[data-native-cursor]';

export function initUserCursor(){
  const root=document.querySelector('.user-cursor');if(!root)return;
  const arrow=root.querySelector('.user-cursor__arrow'),label=root.querySelector('.user-cursor__label'),pill=root.querySelector('.user-cursor__pill');
  const dot=document.createElement('span');dot.className='user-cursor__dot';root.append(dot);
  const fine=matchMedia('(hover: hover) and (pointer: fine)'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const abort=new AbortController(),{signal}=abort;
  const p={x:axis(),y:axis(),angle:axis(-14),scale:axis(1)},l={x:axis(),y:axis(),angle:axis(),scale:axis(1)},offset={x:axis(25.2),y:axis(11.6)};
  const dotPoint={x:axis(),y:axis()};
  let targetX=0,targetY=0,mouseX=0,mouseY=0,controlled=false,angle=-14,labelAngle=0,pressed=false,visible=false,initialized=false,frame=0,last=0,disposed=false;
  let returning=false,returnElapsed=0,returnFrom={x:0,y:0,lx:0,ly:0};
  let pillWidth=pill.getBoundingClientRect().width,pillHeight=pill.getBoundingClientRect().height;
  const resize=new ResizeObserver(()=>{pillWidth=pill.getBoundingClientRect().width;pillHeight=pill.getBoundingClientRect().height;});resize.observe(pill);
  function finishReturn(){returning=false;root.classList.remove('is-returning');if(!controlled)root.classList.remove('is-agent-mode');}
  function hide(){finishReturn();visible=false;pressed=false;root.classList.remove('is-visible');document.body.classList.remove('has-custom-cursor');cancelAnimationFrame(frame);frame=0;last=0;initialized=false;}
  function render(){
    arrow.style.transform=`translate3d(${p.x.value}px,${p.y.value}px,0) rotate(${p.angle.value}deg) scale(${p.scale.value})`;
    label.style.transform=`translate3d(${l.x.value}px,${l.y.value}px,0) rotate(${l.angle.value}deg) scale(${l.scale.value})`;
    pill.style.transform=`translate(${offset.x.value}px,${offset.y.value}px)`;
    dot.style.transform=`translate3d(${dotPoint.x.value}px,${dotPoint.y.value}px,0) scale(${pressed?.8:1})`;
  }
  function advance(now){
    const dt=Math.min(last?(now-last)/1000:1/60,.05);last=now;
    const xOffset=targetX+25.2+pillWidth>innerWidth-8?-pillWidth-12:25.2;
    const yOffset=targetY+11.6+pillHeight>innerHeight-8?-pillHeight-10:11.6;
    const scale=pressed ? .92 : 1;
    if(controlled||returning){
      if(reduced.matches){dotPoint.x.value=mouseX;dotPoint.y.value=mouseY;}
      else{step(dotPoint.x,mouseX,dt,pointerSpring);step(dotPoint.y,mouseY,dt,pointerSpring);}
    }
    if(reduced.matches){
      p.x.value=l.x.value=targetX;p.y.value=l.y.value=targetY;p.angle.value=-14;l.angle.value=0;
      p.scale.value=l.scale.value=scale;offset.x.value=xOffset;offset.y.value=yOffset;
    }else{
      step(p.x,targetX,dt,pointerSpring);step(p.y,targetY,dt,pointerSpring);
      step(l.x,targetX,dt,labelSpring);step(l.y,targetY,dt,labelSpring);
      const moving=Math.hypot(p.x.velocity,p.y.velocity)>35;
      const direction=moving?Math.atan2(p.y.velocity,p.x.velocity)*180/Math.PI+135:-14;
      angle=((direction+180)%360+360)%360-180;
      labelAngle=clamp(l.y.velocity*.02,-8,8);
      step(p.angle,angle,dt,rotationSpring);step(l.angle,labelAngle,dt,rotationSpring);
      step(p.scale,scale,dt,pointerSpring);step(l.scale,scale,dt,labelSpring);
      step(offset.x,xOffset,dt,labelSpring);step(offset.y,yOffset,dt,labelSpring);
    }
    if(returning){
      returnElapsed+=dt;
      const t=clamp(returnElapsed/.65,0,1),eased=t*t*(3-2*t);
      p.x.value=returnFrom.x+(dotPoint.x.value-returnFrom.x)*eased;
      p.y.value=returnFrom.y+(dotPoint.y.value-returnFrom.y)*eased;
      l.x.value=returnFrom.lx+(dotPoint.x.value-returnFrom.lx)*eased;
      l.y.value=returnFrom.ly+(dotPoint.y.value-returnFrom.ly)*eased;
      for(const s of [p.x,p.y,l.x,l.y])s.velocity=0;
      root.style.setProperty('--return-dot',String(1-eased));
      root.style.setProperty('--return-arrow',String(clamp(t*5,0,1)));
      root.style.setProperty('--return-label',String(clamp((t-.4)/.6,0,1)));
      if(t===1||reduced.matches)finishReturn();
    }
    const unsettled=Math.abs(p.x.value-targetX)+Math.abs(p.y.value-targetY)+Math.abs(l.x.value-targetX)+Math.abs(l.y.value-targetY)
      +Math.abs(p.angle.value-angle)+Math.abs(l.angle.value-labelAngle)+100*(Math.abs(p.scale.value-scale)+Math.abs(l.scale.value-scale))
      +Math.abs(offset.x.value-xOffset)+Math.abs(offset.y.value-yOffset);
    const dotUnsettled=controlled||returning?Math.abs(dotPoint.x.value-mouseX)+Math.abs(dotPoint.y.value-mouseY):0;
    return returning||!reduced.matches&&unsettled+dotUnsettled>.015;
  }
  function tick(now){frame=0;if(!visible||disposed)return;const active=advance(now);render();if(active)frame=requestAnimationFrame(tick);}
  function wake(){if(!frame){if(!last)last=performance.now();frame=requestAnimationFrame(tick);}}
  function move(event){
    mouseX=event.clientX;mouseY=event.clientY;
    if(controlled){
      if(!fine.matches||event.pointerType==='touch'||event.target.closest?.(nativeSelector)){hide();return;}
      visible=true;root.classList.add('is-visible');document.body.classList.add('has-custom-cursor');wake();return;
    }
    if(!fine.matches||event.pointerType==='touch'||event.target.closest?.(nativeSelector)){hide();return;}
    if(initialized&&visible)advance(performance.now());
    targetX=event.clientX;targetY=event.clientY;
    if(!initialized){
      p.x.value=l.x.value=targetX;p.y.value=l.y.value=targetY;
      for(const s of [p.x,p.y,l.x,l.y])s.velocity=0;
      angle=p.angle.value=-14;labelAngle=l.angle.value=0;
      p.angle.velocity=l.angle.velocity=p.scale.velocity=l.scale.velocity=0;p.scale.value=l.scale.value=1;
      offset.x.value=targetX+25.2+pillWidth>innerWidth-8?-pillWidth-12:25.2;
      offset.y.value=targetY+11.6+pillHeight>innerHeight-8?-pillHeight-10:11.6;
      offset.x.velocity=offset.y.velocity=0;initialized=true;render();
    }
    visible=true;root.classList.add('is-visible');document.body.classList.add('has-custom-cursor');wake();
  }
  window.addEventListener('pointermove',move,{signal,passive:true});
  window.addEventListener('pointerdown',event=>{if(event.pointerType==='touch'){hide();return;}if(visible){advance(performance.now());pressed=true;wake();}},{signal,passive:true});
  window.addEventListener('pointerup',()=>{if(visible)advance(performance.now());pressed=false;if(visible)wake();},{signal,passive:true});
  window.addEventListener('pointercancel',hide,{signal});document.documentElement.addEventListener('pointerleave',hide,{signal});
  window.addEventListener('blur',hide,{signal});document.addEventListener('visibilitychange',()=>{if(document.hidden)hide();},{signal});
  fine.addEventListener('change',()=>{if(!fine.matches)hide();},{signal});reduced.addEventListener('change',()=>{if(visible)wake();},{signal});
  function dispose(){if(disposed)return;disposed=true;hide();abort.abort();resize.disconnect();}
  window.addEventListener('pagehide',event=>{if(!event.persisted)dispose();},{signal});
  root.cursor={dispose,
    hold(x,y){
      if(!fine.matches)return false;
      finishReturn();
      if(!controlled){dotPoint.x.value=mouseX;dotPoint.y.value=mouseY;dotPoint.x.velocity=dotPoint.y.velocity=0;}
      controlled=true;pressed=false;targetX=x;targetY=y;
      if(!initialized){p.x.value=l.x.value=mouseX||x;p.y.value=l.y.value=mouseY||y;initialized=true;}
      visible=true;root.classList.remove('is-delegated');root.classList.add('is-visible','is-agent-mode');
      document.body.classList.add('has-custom-cursor');wake();return true;
    },
    delegate(){if(controlled)root.classList.add('is-delegated');},
    release(){if(!controlled)return;controlled=false;
      const target=document.elementFromPoint(mouseX,mouseY);
      if(visible&&initialized&&!disposed&&fine.matches&&!reduced.matches&&!document.hidden&&target&&!target.closest?.(nativeSelector)){
        returning=true;returnElapsed=0;returnFrom={x:p.x.value,y:p.y.value,lx:l.x.value,ly:l.y.value};
        targetX=mouseX;targetY=mouseY;pressed=false;
        root.style.setProperty('--return-dot','1');root.style.setProperty('--return-arrow','0');root.style.setProperty('--return-label','0');
        root.classList.remove('is-delegated');root.classList.add('is-returning','is-agent-mode','is-visible');
        document.body.classList.add('has-custom-cursor');wake();return;
      }
      root.classList.remove('is-delegated','is-agent-mode');hide();
      if(disposed)return;
      if(target)move({clientX:mouseX,clientY:mouseY,target,pointerType:'mouse'});
    },
    get state(){return {visible,pressed,controlled,returning,dot:[dotPoint.x.value,dotPoint.y.value],pointer:[p.x.value,p.y.value],label:[l.x.value,l.y.value],angle:p.angle.value,scale:p.scale.value};}};
  root.dataset.ready='true';
  return root.cursor;
}

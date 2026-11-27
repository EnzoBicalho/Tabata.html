// A local, decorative collaboration scene. No agents or external requests run.
export function initAIWorkflow({gsap,ScrollTrigger,cursor}){
  const root=document.querySelector('.ai-workflow');if(!root)return;
  const scene=root.querySelector('.ai-workflow__scene'),layer=root.querySelector('.ai-workflow__agents');
  const cursorRoot=document.querySelector('.user-cursor');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),fine=matchMedia('(hover:hover) and (pointer:fine)');
  const abort=new AbortController(),{signal}=abort;
  const agents=[['Claude','estrutura','#c07954'],['Codex','interface','#5869ee'],['Atlas','visual','#648f78']].map(([name,task,color])=>{
    const el=document.createElement('div');el.className='ai-agent';el.style.setProperty('--agent-color',color);
    el.innerHTML=cursorRoot.querySelector('svg').outerHTML+`<span class="ai-agent__label">${name}<small>${task}</small></span>`;
    el.querySelector('path').setAttribute('fill',color);layer.append(el);return el;
  });
  const plan=root.querySelector('.ai-workflow__task--plan'),code=root.querySelector('.ai-workflow__task--code'),visual=root.querySelector('.ai-workflow__task--visual');
  const cards=[plan,code,visual],rotations=[0,0,0];
  const prompts={plan:root.querySelector('[data-ai-prompt="plan"]'),site:root.querySelector('[data-ai-prompt="site"]'),visual:root.querySelector('[data-ai-prompt="visual"]')};
  const results=root.querySelectorAll('.ai-terminal__result'),word=root.querySelector('.ai-mini-site__word'),selection=root.querySelector('.ai-mini-site__selection'),swatch=root.querySelector('.ai-mini-site__green');
  const palette=root.querySelector('.ai-color-picker'),colorControl=root.querySelector('.ai-mini-site__color-control'),colorChip=colorControl.querySelector('i'),hex=palette.querySelector('.ai-color-picker__value b');
  let entry,work,active=false,disposed=false;
  const texts={pt:{heading:'Minha visão.<br><span>Mais possibilidades.</span>',copy:['Uso inteligência artificial para explorar ideias, resolver desafios e acelerar projetos.','A direção criativa é minha. A IA amplia o que eu consigo construir.'],status:'TRÊS AGENTES. UMA DIREÇÃO.'},en:{heading:'My vision.<br><span>More possibilities.</span>',copy:['I use artificial intelligence to explore ideas, solve challenges and accelerate projects.','The creative direction is mine. AI expands what I can build.'],status:'THREE AGENTS. ONE DIRECTION.'}};
  function language(){const en=document.documentElement.lang==='en',t=texts[en?'en':'pt'];root.querySelector('h2').innerHTML=t.heading;root.querySelectorAll('.ai-workflow__copy p').forEach((p,i)=>p.textContent=t.copy[i]);root.querySelector('.ai-workflow__eyebrow').textContent=en?'E.B / AUGMENTED INTELLIGENCE':'E.B / INTELIGÊNCIA AMPLIADA';root.querySelector('.ai-workflow__bottom span').textContent=en?'LESS REPETITION. MORE CREATION.':'MENOS REPETIÇÃO. MAIS CRIAÇÃO.';}
  function translateDetails(){
    const en=document.documentElement.lang==='en';
    word.firstChild.textContent=en?'Make it happen.':'Faça acontecer.';
    code.querySelector('.ai-mini-site__page>small').textContent=en?'IDEAS IN MOTION':'IDEIAS EM MOVIMENTO';
    code.querySelector('.ai-mini-site__page>p').textContent=en?'A new perspective for every idea.':'Uma nova perspectiva para cada ideia.';
    results[0].textContent=en?'↳ Structure organized.':'↳ Estrutura organizada.';
    results[1].textContent=en?'↳ Motion refined.':'↳ Movimento refinado.';
    prompts.plan.dataset.placeholder=en?'Try "Plan this page"':'Tente "Planeje esta página"';
    prompts.visual.dataset.placeholder=en?'Try "Refine this motion"':'Tente "Refine este movimento"';
    root.querySelector('.ai-workflow__bottom span:last-child').textContent=en?'01 — 03 / COLLABORATION IN MOTION':'01 — 03 / COLABORAÇÃO EM MOVIMENTO';
    scene.setAttribute('aria-label',en?'Visual demonstration of three agents collaborating on a project':'Demonstração visual de três agentes colaborando em um projeto');
  }
  document.addEventListener('portfolio-language-change',()=>{language();translateDetails();if(active){stop();start();}},{signal});language();translateDetails();
  function point(el,fx=.5,fy=.5){const a=el.getBoundingClientRect(),b=scene.getBoundingClientRect();return{x:a.left-b.left+a.width*fx,y:a.top-b.top+a.height*fy};}
  function resetDemo(){Object.values(prompts).forEach(el=>el.textContent='');results.forEach(el=>{el.textContent='';el.dataset.status='idle';});gsap.set(results,{opacity:0});gsap.set(word,{color:'#f4f4ed'});gsap.set(selection,{clipPath:'inset(0 100% 0 0)',opacity:1});gsap.set(swatch,{outlineColor:'transparent'});gsap.set(palette,{autoAlpha:0,scale:.92,y:6});gsap.set(colorChip,{backgroundColor:'#f4f4ed'});hex.textContent='#F4F4ED';root.dataset.preview='idle';root.dataset.palette='closed';}
  function promptCopy(){return document.documentElement.lang==='en'?{plan:'Organize the structure of this page.',visual:'Refine the motion of these elements.',site:'Change the heading to green.'}:{plan:'Organize a estrutura desta página.',visual:'Refine o movimento destes elementos.',site:'Mude o título para verde.'};}
  function stop(){entry?.kill();work?.kill();active=false;root.dataset.agents='idle';cursor?.release();gsap.set(agents,{autoAlpha:0});gsap.set(cards,{x:0,y:0,rotation:i=>rotations[i]});resetDemo();}
  function playWork(){
    if(!active)return;
    root.dataset.agents='working';
    const anchors=cards.map(el=>point(el,.65,.75)),copy=promptCopy();
    const textStart=point(word,0,.75),textEnd=point(word,1,.75),controlPoint=point(colorControl);
    resetDemo();
    work=gsap.timeline({repeat:-1,repeatDelay:.8,onRepeat:resetDemo,defaults:{ease:'power2.inOut'}});
    function type(key,start,duration){const progress={n:0};work.fromTo(progress,{n:0},{n:copy[key].length,duration,ease:'none',onUpdate:()=>{prompts[key].textContent=copy[key].slice(0,Math.floor(progress.n));}},start);}
    const en=document.documentElement.lang==='en';
    function think(index,start,duration,label,done,frames){
      const timer={seconds:0},line=results[index];
      work.fromTo(timer,{seconds:0},{seconds:duration,duration,ease:'none',immediateRender:false,
        onStart:()=>{line.dataset.status='thinking';gsap.set(line,{opacity:1});},
        onUpdate:()=>{line.textContent=`${frames[Math.floor(timer.seconds*6)%frames.length]} ${label}… (${timer.seconds.toFixed(1)}s)`;},
        onComplete:()=>{line.dataset.status='complete';line.textContent=`↳ ${done} · ${duration.toFixed(1)}s`;}
      },start);
    }
    type('plan',.2,2.7);type('site',.6,2.1);type('visual',1.1,2.9);
    think(0,3.15,2.8,en?'Thinking':'Pensando',en?'Structure ready':'Estrutura pronta',['✳','✴','✻','✽']);
    think(1,4.2,4.1,en?'Refining ideas':'Refinando ideias',en?'Motion refined':'Movimento refinado',['◇','◈','◆','◈']);
    work.to(agents[1],{...textStart,duration:.75},3.05)
      .call(()=>{root.dataset.preview='selecting';},[],3.8)
      .to(agents[1],{scale:.85,duration:.15},3.8)
      .to(selection,{clipPath:'inset(0 0% 0 0)',duration:1.05,ease:'none'},3.95)
      .to(agents[1],{...textEnd,duration:1.05,ease:'none'},3.95)
      .to(agents[1],{scale:1,duration:.15},5)
      .to(agents[1],{...controlPoint,duration:.7},5.45)
      .to(agents[1],{scale:.82,duration:.13},6.15)
      .call(()=>{root.dataset.palette='open';root.dataset.preview='palette';},[],6.28)
      .to(palette,{autoAlpha:1,scale:1,y:0,duration:.25,ease:'power2.out'},6.28)
      .to(agents[1],{scale:1,duration:.2},6.3)
      .to(agents[1],{x:()=>point(swatch).x,y:()=>point(swatch).y,duration:.6},6.68)
      .to(agents[1],{scale:.82,duration:.14},7.28)
      .to(swatch,{outlineColor:'#94c7a5',duration:.2},7.42)
      .to(word,{color:'#94c7a5',duration:.45},7.42)
      .to(colorChip,{backgroundColor:'#94c7a5',duration:.3},7.42)
      .call(()=>{hex.textContent='#94C7A5';},[],7.42)
      .to(agents[1],{scale:1,duration:.2},7.45)
      .call(()=>{root.dataset.preview='colored';},[],7.87)
      .to(selection,{opacity:0,duration:.3},8)
      .to(palette,{autoAlpha:0,scale:.96,y:4,duration:.2},8.8)
      .call(()=>{root.dataset.palette='closed';},[],9)
      .to(agents[0],{x:anchors[0].x+8,y:anchors[0].y-10,duration:1.2},3.2)
      .to(agents[2],{x:anchors[2].x+10,y:anchors[2].y-8,duration:1.2},4.3)
      .to(agents,{x:i=>anchors[i].x,y:i=>anchors[i].y,duration:.9},9.6);
  }
  function start(){
    if(active||disposed)return;active=true;root.dataset.agents='gathering';
    const bounds=scene.getBoundingClientRect(),origin={x:bounds.width*.5,y:bounds.height*.5};
    gsap.set(agents,{...origin,scale:1,autoAlpha:0});
    if(reduced.matches){root.dataset.agents='static';cards.forEach((el,i)=>gsap.set(agents[i],{...point(el,.75,.65),autoAlpha:1}));const copy=promptCopy();Object.keys(prompts).forEach(key=>prompts[key].textContent=copy[key]);translateDetails();results.forEach(el=>el.dataset.status='complete');gsap.set(results,{opacity:1});gsap.set(word,{color:'#94c7a5'});gsap.set(colorChip,{backgroundColor:'#94c7a5'});return;}
    const held=fine.matches&&cursor?.hold(bounds.left+origin.x,bounds.top+origin.y);
    entry=gsap.timeline();
    const destinations=cards.map(el=>point(el,.65,.75));
    entry.to({},{duration:held?1:.25}).call(()=>{if(held)cursor.delegate();root.dataset.agents='splitting';})
      .to(agents,{autoAlpha:1,duration:.3,stagger:.08})
      .to(agents,{x:i=>destinations[i].x,y:i=>destinations[i].y,duration:1.35,ease:'power2.inOut',stagger:.12},'-=.25')
      .call(playWork);
  }
  const trigger=ScrollTrigger.create({trigger:root,start:'top 15%',end:'bottom 35%',onEnter:start,onEnterBack:start,onLeave:stop,onLeaveBack:stop,
    onUpdate(){if(active&&root.dataset.agents==='gathering'&&fine.matches&&!reduced.matches){const b=scene.getBoundingClientRect();cursor?.hold(b.left+b.width/2,b.top+b.height/2);}}});
  let timer;const resize=new ResizeObserver(()=>{clearTimeout(timer);timer=setTimeout(()=>{if(active){stop();start();}},150);});resize.observe(scene);
  reduced.addEventListener('change',()=>{if(active){stop();start();}},{signal});
  fine.addEventListener('change',()=>{if(active){stop();start();}},{signal});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){entry?.pause();work?.pause();}else{entry?.resume();work?.resume();}},{signal});
  function dispose(){disposed=true;stop();trigger.kill();resize.disconnect();clearTimeout(timer);abort.abort();agents.forEach(el=>el.remove());}
  window.addEventListener('pagehide',e=>{if(!e.persisted)dispose();},{signal});
  root.workflow={dispose,get active(){return active;}};
}

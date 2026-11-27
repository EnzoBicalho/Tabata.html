// Timings, layers and item choreography from the user-supplied StaggeredMenu.
export function initStaggeredMenu({gsap,lenis,reduceMotion}){
 const root=document.querySelector('.staggered-menu-wrapper'),button=document.querySelector('#staggered-menu-toggle');
 const panelRef={current:root.querySelector('.staggered-menu-panel')},preLayerElsRef={current:[...root.querySelectorAll('.sm-prelayer')]};
 const openTlRef={current:null},closeTweenRef={current:null},itemEntranceTweenRef={current:null};
 const position='right',panel=panelRef.current,layers=preLayerElsRef.current,icon=button.querySelector('.sm-icon'),inner=button.querySelector('.sm-toggle-textInner');
 let open=false,iconTween,textTween,priorOverflow='';
 const main=document.querySelector('main');
 gsap.set([panel,...layers],{xPercent:100,opacity:1});gsap.set(root.querySelector('.sm-prelayers'),{opacity:1});
 gsap.set(button.querySelector('.sm-icon-line-v'),{rotate:90});panel.inert=true;
 const buildOpenTimeline=()=>{
    const panel = panelRef.current;
    const layers = preLayerElsRef.current;
    if (!panel) return null;

    openTlRef.current?.kill();
    if (closeTweenRef.current) {
      closeTweenRef.current.kill();
      closeTweenRef.current = null;
    }
    itemEntranceTweenRef.current?.kill();

    const itemEls = Array.from(panel.querySelectorAll('.sm-panel-itemLabel'));
    const numberEls = Array.from(panel.querySelectorAll('.sm-panel-list[data-numbering] .sm-panel-item'));
    const socialTitle = panel.querySelector('.sm-socials-title');
    const socialLinks = Array.from(panel.querySelectorAll('.sm-socials-link'));

    const offscreen = position === 'left' ? -100 : 100;
    const layerStates = layers.map(el => ({ el, start: offscreen }));
    const panelStart = offscreen;

    if (itemEls.length) {
      gsap.set(itemEls, { yPercent: 140, rotate: 10 });
    }
    if (numberEls.length) {
      gsap.set(numberEls, { '--sm-num-opacity': 0 });
    }
    if (socialTitle) {
      gsap.set(socialTitle, { opacity: 0 });
    }
    if (socialLinks.length) {
      gsap.set(socialLinks, { y: 25, opacity: 0 });
    }

    const tl = gsap.timeline({ paused: true });

    layerStates.forEach((ls, i) => {
      tl.fromTo(ls.el, { xPercent: ls.start }, { xPercent: 0, duration: 0.5, ease: 'power4.out' }, i * 0.07);
    });
    const lastTime = layerStates.length ? (layerStates.length - 1) * 0.07 : 0;
    const panelInsertTime = lastTime + (layerStates.length ? 0.08 : 0);
    const panelDuration = 0.65;
    tl.fromTo(
      panel,
      { xPercent: panelStart },
      { xPercent: 0, duration: panelDuration, ease: 'power4.out' },
      panelInsertTime
    );

    if (itemEls.length) {
      const itemsStartRatio = 0.15;
      const itemsStart = panelInsertTime + panelDuration * itemsStartRatio;
      tl.to(
        itemEls,
        {
          yPercent: 0,
          rotate: 0,
          duration: 1,
          ease: 'power4.out',
          stagger: { each: 0.1, from: 'start' }
        },
        itemsStart
      );
      if (numberEls.length) {
        tl.to(
          numberEls,
          {
            duration: 0.6,
            ease: 'power2.out',
            '--sm-num-opacity': 1,
            stagger: { each: 0.08, from: 'start' }
          },
          itemsStart + 0.1
        );
      }
    }

    if (socialTitle || socialLinks.length) {
      const socialsStart = panelInsertTime + panelDuration * 0.4;
      if (socialTitle) {
        tl.to(
          socialTitle,
          {
            opacity: 1,
            duration: 0.5,
            ease: 'power2.out'
          },
          socialsStart
        );
      }
      if (socialLinks.length) {
        tl.to(
          socialLinks,
          {
            y: 0,
            opacity: 1,
            duration: 0.55,
            ease: 'power3.out',
            stagger: { each: 0.08, from: 'start' },
            onComplete: () => {
              gsap.set(socialLinks, { clearProps: 'opacity' });
            }
          },
          socialsStart + 0.04
        );
      }
    }

    openTlRef.current = tl;
    return tl;
};
 function animateButton(opening){
  iconTween?.kill();textTween?.kill();
  const close=document.documentElement.lang==='en'?'Close':'Fechar';
  const current=opening?'Menu':close,target=opening?close:'Menu',seq=[current];let last=current;
  for(let i=0;i<3;i++){last=last==='Menu'?close:'Menu';seq.push(last);}if(last!==target)seq.push(target);seq.push(target);
  inner.replaceChildren(...seq.map(text=>{const el=document.createElement('span');el.className='sm-toggle-line';el.textContent=text;return el;}));
  gsap.set(inner,{yPercent:0});
  iconTween=gsap.to(icon,{rotate:opening?225:0,duration:reduceMotion?0:opening?.8:.35,ease:opening?'power4.out':'power3.inOut',overwrite:'auto'});
  textTween=gsap.to(inner,{yPercent:-((seq.length-1)/seq.length)*100,duration:reduceMotion?0:.5+seq.length*.07,ease:'power4.out'});
 }
 function setOpen(next,{focusButton=false}={}){
  if(next===open)return;open=next;button.setAttribute('aria-expanded',String(open));button.setAttribute('aria-label',open?'Fechar menu':'Abrir menu');
  root.toggleAttribute('data-open',open);document.body.classList.toggle('staggered-menu-open',open);panel.setAttribute('aria-hidden',String(!open));panel.inert=!open;main.inert=open;
  animateButton(open);
  if(open){
   priorOverflow=document.body.style.overflow;document.body.style.overflow='hidden';lenis.stop();root.classList.add('is-visible');
   const tl=buildOpenTimeline();if(reduceMotion)tl.progress(1);else tl.play(0);
  }else{
   openTlRef.current?.kill();closeTweenRef.current?.kill();document.body.style.overflow=priorOverflow;lenis.start();
   closeTweenRef.current=gsap.to([...layers,panel],{xPercent:100,duration:reduceMotion?0:.32,ease:'power3.in',overwrite:'auto',onComplete:()=>{if(!open)root.classList.remove('is-visible');}});
   if(focusButton)button.focus({preventScroll:true});
  }
 }
 button.addEventListener('click',()=>setOpen(!open));
 panel.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>setOpen(false)));
 document.addEventListener('pointerdown',e=>{if(open&&!panel.contains(e.target)&&!document.querySelector('.site-header').contains(e.target))setOpen(false);});
 document.addEventListener('keydown',e=>{
  if(!open)return;if(e.key==='Escape'){e.preventDefault();setOpen(false,{focusButton:true});return;}
  if(e.key==='Tab'){
   const focusable=[button,document.querySelector('#language-toggle'),...panel.querySelectorAll('a[href]')],first=focusable[0],last=focusable.at(-1);
   if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
  }
 });
 root.menu={open:()=>setOpen(true),close:()=>setOpen(false),get timeline(){return openTlRef.current;},get isOpen(){return open;}};
}

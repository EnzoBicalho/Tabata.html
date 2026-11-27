import {initSpotlightCard} from './spotlight-card.js?v=20261126-1';

const copy={
  pt:{
    statement:'Crio experiências digitais onde design, tecnologia e criatividade se encontram.',
    servicesLabel:'SERVIÇOS',servicesEyebrow:'DA IDEIA À ENTREGA',servicesTitle:'Boas ideias.<br>Bem <em>construídas.</em>',
    servicesCopy:'Design, código e movimento. Três formas de dar vida a uma ideia, com atenção a cada detalhe.',
    webTitle:'Sites &<br>experiências',webCopy:'Interfaces com personalidade, navegação clara e movimento na medida certa. Feitas para funcionar bem em qualquer tela.',
    designTitle:'Design &<br>direção de arte',designCopy:'Uma linguagem visual que conecta identidade e interface. Da primeira referência a um sistema que faz sentido como um todo.',
    motionTitle:'Edição &<br>movimento',motionCopy:'Imagens que encontram ritmo. Edição e motion para transformar uma mensagem em uma história que prende o olhar.',
    serviceCta:'Vamos conversar',serviceNote:'Um projeto pode conectar as três áreas. A direção é sempre a sua ideia.',
    contactLabel:'CONTATO',availability:'Aberto a novos projetos',contactKicker:'A PRÓXIMA IDEIA PODE SER A SUA.',
    contactLine1:'Vamos dar forma',contactLine2:'à próxima ideia.',contactCopy:'Um site, uma identidade ou uma história em movimento. Me conta o que você tem em mente e a gente começa por aí.',
    contactPanel:'VAMOS CONVERSAR',contactOther:'Outros canais de contato',backToTop:'Voltar ao início',copy:'Copiar e-mail',copied:'E-mail copiado',copyFailed:'Não foi possível copiar. Use o link acima.',
    details:{web:['Sites responsivos','Interfaces','Interações'],design:['Identidade visual','UI / UX','Direção de arte'],motion:['Edição de vídeo','Motion design','Narrativa visual']}
  },
  en:{
    statement:'I build digital experiences where design, technology and creativity intersect.',
    servicesLabel:'SERVICES',servicesEyebrow:'FROM IDEA TO DELIVERY',servicesTitle:'Good ideas.<br>Well <em>crafted.</em>',
    servicesCopy:'Design, code and motion. Three ways to bring an idea to life, with care in every detail.',
    webTitle:'Websites &<br>experiences',webCopy:'Interfaces with personality, clear navigation and purposeful motion. Built to work beautifully on every screen.',
    designTitle:'Design &<br>art direction',designCopy:'A visual language that connects identity and interface. From the first reference to a system that works as a whole.',
    motionTitle:'Editing &<br>motion',motionCopy:'Images that find their rhythm. Editing and motion that turn a message into a story worth watching.',
    serviceCta:"Let's talk",serviceNote:'One project can connect all three disciplines. Your idea always sets the direction.',
    contactLabel:'CONTACT',availability:'Open to new projects',contactKicker:'THE NEXT IDEA COULD BE YOURS.',
    contactLine1:"Let's give shape",contactLine2:'to your next idea.',contactCopy:"A website, an identity or a story in motion. Tell me what you have in mind, and we'll take it from there.",
    contactPanel:"LET'S TALK",contactOther:'More ways to get in touch',backToTop:'Back to the top',copy:'Copy email',copied:'Email copied',copyFailed:'Could not copy. Use the email link above.',
    details:{web:['Responsive websites','Interfaces','Interactions'],design:['Visual identity','UI / UX','Art direction'],motion:['Video editing','Motion design','Visual storytelling']}
  }
};

export function initPortfolioSections({gsap,ScrollTrigger}){
  const interlude=document.querySelector('.interlude'),services=document.querySelector('.expertise'),contact=document.querySelector('.reachout');
  if(!interlude||!services||!contact)return;
  const abort=new AbortController(),{signal}=abort,media=gsap.matchMedia();
  const text=interlude.querySelector('[data-statement]'),cards=[...services.querySelectorAll('.expertise__card')];
  const spotlights=cards.map(initSpotlightCard),observers=[],animations=[];
  let statementTween,refreshFrame=0,copyTimer=0,copyState='copy',languageCode;
  const lang=()=>document.documentElement.lang==='en'?'en':'pt';
  function rebuildStatement(reduced){
    statementTween?.scrollTrigger?.kill();statementTween?.kill();text.replaceChildren();
    const sentence=copy[lang()].statement;text.setAttribute('aria-label',sentence);
    const words=sentence.split(' ').map((word,index)=>{
      if(index)text.append(document.createTextNode(' '));
      const clip=document.createElement('span'),span=document.createElement('span');clip.className='interlude__clip';clip.setAttribute('aria-hidden','true');span.className='interlude__word';span.textContent=word;span.style.setProperty('--reveal',reduced?'112%':'0%');
      if(['design','technology','creativity','tecnologia','criatividade'].includes(word.replace(/[,.]/g,'')))span.classList.add('is-accent');
      clip.append(span);text.append(clip);return span;
    });
    if(reduced){gsap.set(words,{'--reveal':'112%'});return;}
    // A soft reading edge passes through each word without moving the baseline
    // or blurring the letterforms. Overlap keeps the sweep continuous at spaces.
    statementTween=gsap.fromTo(words,{'--reveal':'0%'},{'--reveal':'112%',duration:1,stagger:.7,ease:'none',scrollTrigger:{trigger:text,start:'top 80%',end:'bottom 48%',scrub:.3,invalidateOnRefresh:true}});
  }
  function updateLanguage(){
    const locale=lang(),c=copy[locale];languageCode=locale;
    document.querySelectorAll('[data-section-text]').forEach(el=>{const value=c[el.dataset.sectionText];if(value!==undefined)el.innerHTML=value;});
    services.querySelectorAll('[data-service-details]').forEach(list=>{list.replaceChildren(...c.details[list.dataset.serviceDetails].map(value=>{const item=document.createElement('li');item.textContent=value;return item;}));});
    contact.querySelector('[data-copy-email-label]').textContent=c[copyState];
    rebuildStatement(matchMedia('(prefers-reduced-motion:reduce)').matches);
    cancelAnimationFrame(refreshFrame);refreshFrame=requestAnimationFrame(()=>ScrollTrigger.refresh());
  }
  function enterOnView(root,elements,reduced,make){
    if(reduced){gsap.set(elements,{autoAlpha:1,y:0,clearProps:'transform,clipPath'});return;}
    gsap.set(elements,{autoAlpha:0,y:26});
    const observer=new IntersectionObserver(entries=>{if(!entries.some(entry=>entry.isIntersecting))return;observer.disconnect();animations.push(make());},{threshold:.12});
    observer.observe(root);observers.push(observer);
  }
  document.addEventListener('portfolio-language-change',updateLanguage,{signal});updateLanguage();
  media.add({reduced:'(prefers-reduced-motion:reduce)',normal:'(prefers-reduced-motion:no-preference)'},ctx=>{
    const reduced=ctx.conditions.reduced;
    rebuildStatement(reduced);
    const serviceIntro=[services.querySelector('.expertise__title'),services.querySelector('.expertise__description')];
    enterOnView(services,serviceIntro,reduced,()=>gsap.to(serviceIntro,{autoAlpha:1,y:0,duration:.9,stagger:.12,ease:'power3.out'}));
    cards.forEach(card=>{
      enterOnView(card,[card],reduced,()=>{
        const timeline=gsap.timeline().to(card,{autoAlpha:1,y:0,duration:.85,ease:'power3.out'});
        card.querySelectorAll('[data-service-stroke]').forEach(group=>{
          const shapes=group.matches('g')?[...group.children]:[group];
          shapes.forEach(shape=>{if(!shape.getTotalLength)return;const length=shape.getTotalLength();timeline.fromTo(shape,{strokeDasharray:length,strokeDashoffset:length},{strokeDashoffset:0,duration:1.1,ease:'power2.inOut'},.12);});
        });return timeline;
      });
    });
    const contactElements=[contact.querySelector('.reachout__intro'),contact.querySelector('.reachout__panel')];
    enterOnView(contact,contactElements,reduced,()=>gsap.timeline().to(contactElements,{autoAlpha:1,y:0,duration:1,stagger:.15,ease:'power3.out'}));
    return()=>{observers.splice(0).forEach(observer=>observer.disconnect());animations.splice(0).forEach(tween=>tween.kill());};
  });
  cards.forEach(card=>{
    const float=card.querySelector('[data-service-float]'),playhead=card.querySelector('[data-service-playhead]');
    function hover(active){if(matchMedia('(prefers-reduced-motion:reduce)').matches)return;gsap.to(float,{y:active?-7:0,duration:.6,ease:'power3.out',overwrite:'auto'});if(playhead)gsap.to(playhead,{x:active?78:0,duration:1.1,ease:'power2.inOut',overwrite:'auto'});}
    card.addEventListener('pointerenter',()=>hover(true),{signal});card.addEventListener('pointerleave',()=>hover(false),{signal});
    card.addEventListener('focusin',()=>hover(true),{signal});card.addEventListener('focusout',event=>{if(!card.contains(event.relatedTarget))hover(false);},{signal});
  });
  contact.querySelector('[data-copy-email]').addEventListener('click',async()=>{
    clearTimeout(copyTimer);
    try{await navigator.clipboard.writeText('enzobicalhocontato@gmail.com');copyState='copied';}catch{copyState='copyFailed';}
    contact.querySelector('[data-copy-email-label]').textContent=copy[lang()][copyState];
    copyTimer=setTimeout(()=>{copyState='copy';contact.querySelector('[data-copy-email-label]').textContent=copy[lang()].copy;},2500);
  },{signal});
  contact.querySelector('[data-copyright-year]').textContent=new Date().getFullYear();
  function dispose(){abort.abort();media.revert();statementTween?.scrollTrigger?.kill();statementTween?.kill();cancelAnimationFrame(refreshFrame);clearTimeout(copyTimer);observers.forEach(observer=>observer.disconnect());animations.forEach(tween=>tween.kill());spotlights.forEach(spotlight=>spotlight.dispose());gsap.killTweensOf(services.querySelectorAll('[data-service-float],[data-service-playhead]'));}
  window.addEventListener('pagehide',event=>{if(!event.persisted)dispose();},{signal});
  interlude.statement={get text(){return copy[lang()].statement;},get tween(){return statementTween;}};
  return {dispose};
}

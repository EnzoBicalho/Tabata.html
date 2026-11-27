/** Section entry starts a timed sequence; scroll position never scrubs its progress. */
export function initHeroHeader({root,gsap,reduceMotion,signal,beforeTransition}){
  const header=document.querySelector('.site-header'),mark=document.querySelector('.lh-mark');
  const brand=header.querySelector('.brand'),markDot=mark.querySelector('span');
  const originalColor=getComputedStyle(mark).color,originalDotColor=getComputedStyle(markDot).color;
  const geometryProps='width,height,left,right,top,marginLeft,marginRight,borderRadius,transform,transformOrigin';
  let inHero=null,wantedHero=true,running=false,timeline,disposed=false;
  const controls=()=>[...header.querySelectorAll('.pill-nav__bar')].filter(el=>getComputedStyle(el).display!=='none');
  const textBox=el=>{const range=document.createRange();range.selectNodeContents(el);return range.getBoundingClientRect();};
  gsap.killTweensOf(header);gsap.set(header,{clearProps:'transform'});
  gsap.set(mark,{xPercent:-50,x:0,y:0,scale:1,transformOrigin:'50% 50%'});
  document.body.classList.add('hero-header-managed');

  function setStage(stage){header.dataset.heroHeaderState=stage;}
  function fullGeometry(){gsap.set(header,{clearProps:geometryProps});}
  function layout(){
    const box=header.getBoundingClientRect(),logo=textBox(brand),source=textBox(mark),origin=mark.getBoundingClientRect();
    const scale=logo.width/source.width,ox=origin.x+origin.width/2,oy=origin.y+origin.height/2;
    return {box,circleLeft:logo.x+logo.width/2-box.height/2,
      x:logo.x+logo.width/2-ox-(source.x+source.width/2-ox)*scale,
      y:logo.y+logo.height/2-oy-(source.y+source.height/2-oy)*scale,scale};
  }
  function circleGeometry(l){
    // Animate one fixed surface's dimensions so glass blur, border and corner
    // radii keep their original appearance instead of being stretched by scaleX.
    gsap.set(header,{left:l.circleLeft,right:'auto',top:l.box.top,width:l.box.height,height:l.box.height,
      marginLeft:0,marginRight:0,borderRadius:9999});
  }
  function settle(hero){
    inHero=hero;running=false;header.classList.remove('is-morphing');fullGeometry();
    gsap.set(header,{autoAlpha:hero?0:1});gsap.set(brand,{autoAlpha:hero?0:1});
    gsap.set(controls(),{autoAlpha:hero?0:1,y:0});
    if(hero){gsap.set(mark,{autoAlpha:1,x:0,y:0,scale:1,color:originalColor});gsap.set(markDot,{color:originalDotColor});}
    else gsap.set(mark,{autoAlpha:0});
    header.inert=hero;mark.inert=!hero;setStage(hero?'hero':'header');
    if(wantedHero!==hero)animate(wantedHero);
  }
  function animate(hero){
    if(disposed||running||hero===inHero)return;
    beforeTransition?.();
    if(reduceMotion){settle(hero);return;}
    running=true;header.inert=true;mark.inert=true;header.classList.add('is-morphing');
    fullGeometry();
    // Measure the center pose before each trip, including after viewport changes.
    gsap.set(mark,{x:0,y:0,scale:1});
    const l=layout(),buttons=controls();
    timeline=gsap.timeline({onComplete:()=>settle(hero)});
    if(!hero){
      setStage('moving-logo');gsap.set(mark,{autoAlpha:1});
      gsap.set(brand,{autoAlpha:0});gsap.set(buttons,{autoAlpha:0,y:7});
      gsap.set(header,{autoAlpha:0});circleGeometry(l);
      timeline.to(mark,{x:l.x,y:l.y,scale:l.scale,color:getComputedStyle(brand).color,duration:.6,ease:'power3.inOut'},0)
        .to(markDot,{color:getComputedStyle(brand.querySelector('span')).color,duration:.6,ease:'power3.inOut'},0)
        .call(()=>setStage('circle'),null,.6)
        .to(header,{autoAlpha:1,duration:.22,ease:'power2.out'},.6)
        .call(()=>setStage('expanding'),null,.82)
        .to(header,{left:l.box.left,width:l.box.width,duration:.72,ease:'power3.inOut'},.82)
        .set(brand,{autoAlpha:1},1.54).set(mark,{autoAlpha:0},1.54)
        .call(()=>setStage('controls'),null,1.54)
        .to(buttons,{autoAlpha:1,y:0,duration:.32,stagger:.055,ease:'power2.out'},1.54);
    }else{
      setStage('hiding-controls');gsap.set(mark,{autoAlpha:0,x:l.x,y:l.y,scale:l.scale,color:getComputedStyle(brand).color});
      gsap.set(markDot,{color:getComputedStyle(brand.querySelector('span')).color});
      // Freeze the full rectangle before contracting it into the same circle.
      gsap.set(header,{left:l.box.left,right:'auto',top:l.box.top,width:l.box.width,height:l.box.height,marginLeft:0,marginRight:0,borderRadius:9999});
      timeline.to(buttons,{autoAlpha:0,y:7,duration:.18,stagger:.025,ease:'power1.out'},0)
        .set(brand,{autoAlpha:0},.24).set(mark,{autoAlpha:1},.24)
        .call(()=>setStage('contracting'),null,.24)
        .to(header,{left:l.circleLeft,width:l.box.height,duration:.55,ease:'power3.inOut'},.24)
        .to(header,{autoAlpha:0,duration:.18,ease:'power1.out'},.79)
        .call(()=>setStage('centering-logo'),null,.97)
        .to(mark,{x:0,y:0,scale:1,color:originalColor,duration:.6,ease:'power3.inOut'},.97)
        .to(markDot,{color:originalDotColor,duration:.6,ease:'power3.inOut'},.97);
    }
  }
  function updateSection(){
    wantedHero=root.getBoundingClientRect().bottom>0;
    document.body.classList.toggle('hero-in-view',wantedHero);
    if(inHero===null)settle(wantedHero);
    else if(!running)animate(wantedHero);
    // A boundary crossed mid-animation is queued; the current sequence finishes.
  }
  window.addEventListener('scroll',updateSection,{signal,passive:true});
  window.addEventListener('resize',updateSection,{signal,passive:true});updateSection();
  return()=>{
    disposed=true;timeline?.kill();header.classList.remove('is-morphing');header.inert=false;mark.inert=true;
    delete header.dataset.heroHeaderState;document.body.classList.remove('hero-header-managed');
    fullGeometry();gsap.set([header,brand,...controls()],{clearProps:'opacity,visibility,transform'});
    gsap.set(mark,{clearProps:'opacity,visibility,transform,color'});gsap.set(markDot,{clearProps:'color'});
  };
}

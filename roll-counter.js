// Vanilla adaptation of the user-supplied CountUp: Roll / Compact / In-View.
const CELL=1.2,DURATION=1.1,STAGGER=.07;
const UNITS=[[1e12,'T'],[1e9,'B'],[1e6,'M'],[1e3,'K']];
const clamp=value=>Math.min(1,Math.max(0,value));
const mod10=value=>((value%10)+10)%10;
const smooth=(a,b,value)=>{const t=clamp((value-a)/(b-a));return t*t*(3-2*t);};
let serial=0;
export function rollEase(progress){
  const x=clamp(progress);let low=0,high=1,t=x;
  for(let i=0;i<24;i++){const v=3*(1-t)**2*t*.33+3*(1-t)*t*t*.68+t*t*t;if(v<x)low=t;else high=t;t=(low+high)/2;}
  return x===0?0:x===1?1:1-(1-t)**3;
}

export function experienceYears(now=new Date()){
  const parts=Object.fromEntries(new Intl.DateTimeFormat('en',{timeZone:'America/Sao_Paulo',year:'numeric',month:'numeric',day:'numeric'}).formatToParts(now).map(part=>[part.type,part.value]));
  const month=Number(parts.month),day=Number(parts.day);
  return Math.max(0,Number(parts.year)-2024-(month<12||(month===12&&day<16)?1:0));
}

function buildRoll(from,to){
  const [size,label]=UNITS.find(([size])=>Math.abs(to)>=size*.9995)||[1,''];
  const digits=label?(Math.abs(to)/size<100?1:0):0;
  const split=value=>{const [int,frac='']=(Math.abs(value)/size).toFixed(digits).split('.');return{int,frac};};
  const a=split(from),b=split(to),slots=[],columns=[];
  const digitAt=(parts,place)=>place<0?Number(parts.frac[-place-1]):parts.int.length-1-place>=0?Number(parts.int[parts.int.length-1-place]):null;
  for(let place=Math.max(a.int.length,b.int.length)-1;place>=-digits;place--){
    if(place===-1)slots.push({char:'.'});
    const start=digitAt(a,place),end=digitAt(b,place),column={index:columns.length,place,from:start??0,to:end??0,enter:start===null,leave:end===null};
    columns.push(column);slots.push(column);
  }
  const up=to>=from;
  columns.forEach((column,index)=>{
    const rank=columns.length-1-index,base=up?mod10(column.to-column.from):-mod10(column.from-column.to);
    const turns=Math.min(Math.floor(Math.abs(to-from)/(size*10**(column.place+1))),Math.max(0,3-rank));
    column.delta=base+(up?10:-10)*turns;
  });
  return{slots,columns,label};
}

export function createRollCounter(element,{gsap,reduced,signal,to=null}){
  const uid='profile-count-'+(++serial);let value=0,target=null,started=false,inView=false,tween,render=()=>{},complete=false;
  element.classList.add('profile-number-roll');element.setAttribute('role','img');
  function mount(from,to){
    const model=buildRoll(from,to),ns='http://www.w3.org/2000/svg';
    const content=document.createElement('span');content.className='profile-roll__content';content.setAttribute('aria-hidden','true');
    const svg=document.createElementNS(ns,'svg');svg.setAttribute('width','0');svg.setAttribute('height','0');svg.setAttribute('aria-hidden','true');svg.style.position='absolute';
    const defs=document.createElementNS(ns,'defs');svg.append(defs);
    model.slots.forEach(slot=>{
      const box=document.createElement('span');box.className='profile-roll__viewport';content.append(box);
      if(slot.char!==undefined){box.textContent=slot.char;return;}
      const strip=document.createElement('span');strip.className='profile-roll__strip';box.append(strip);
      const cells=[-1,0,1,2].map(offset=>{const cell=document.createElement('span');cell.textContent=String(mod10(slot.from+offset));strip.append(cell);return cell;});
      const filter=document.createElementNS(ns,'filter');filter.id=uid+'-'+slot.index;
      for(const [key,val]of Object.entries({x:'-20%',y:'-50%',width:'140%',height:'200%','color-interpolation-filters':'sRGB'}))filter.setAttribute(key,val);
      const blur=document.createElementNS(ns,'feGaussianBlur');blur.setAttribute('stdDeviation','0 0');filter.append(blur);defs.append(filter);
      Object.assign(slot,{box,strip,cells,blur,filterId:filter.id});
      if(slot.enter){box.style.width='0px';box.style.opacity='0';}
    });
    if(model.label){const unit=document.createElement('span');unit.className='profile-roll__viewport';unit.textContent=model.label;content.append(unit);}
    element.replaceChildren(content,svg);element.setAttribute('aria-label',String(to));element.dataset.target=String(to);
    const stagger=model.columns.length>1?Math.min(STAGGER,DURATION*.4/(model.columns.length-1)):0;
    const span=Math.max(.001,DURATION-stagger*(model.columns.length-1));
    render=time=>{
      const cell=CELL*parseFloat(getComputedStyle(element).fontSize);
      model.columns.forEach((column,index)=>{
        const u=clamp((time-index*stagger)/span),pos=column.from+column.delta*rollEase(u),base=Math.floor(pos);
        column.cells.forEach((node,offset)=>node.textContent=String(mod10(base+offset-1)));
        column.strip.style.transform=`translateY(${(-(1+pos-base)*CELL).toFixed(4)}em)`;
        const u0=Math.max(0,u-.004),u1=Math.min(1,u+.004);
        const speed=u1>u0?Math.abs(column.delta)*Math.abs(rollEase(u1)-rollEase(u0))/(u1-u0)/span:0;
        const sigma=u>0&&u<1?Math.min(cell*.05,speed*cell/600):0;
        column.blur.setAttribute('stdDeviation',`0 ${sigma.toFixed(2)}`);column.strip.style.filter=sigma>.2?`url(#${column.filterId})`:'';
        if(column.enter||column.leave){
          const presence=column.enter?smooth(0,.45,u):1-smooth(.55,1,u);
          column.box.style.width=column.enter&&u>=1?'':(presence*column.strip.scrollWidth).toFixed(2)+'px';
          column.box.style.opacity=column.enter&&u>=1?'':String(presence);
        }
      });
      value=from+(to-from)*rollEase(clamp(time/DURATION));
    };
    render(0);
  }
  function play(){
    if(target===null)return;started=true;complete=false;element.dataset.started='true';element.dataset.complete='false';
    if(reduced.matches){render(Infinity);complete=true;element.dataset.complete='true';return;}
    const state={time:0};tween=gsap.to(state,{time:DURATION,duration:DURATION,ease:'none',onUpdate:()=>render(state.time),onComplete:()=>{render(Infinity);complete=true;element.dataset.complete='true';}});
  }
  function setValue(next){
    if(!Number.isFinite(next)||next<0||next===target)return;
    tween?.kill();target=next;mount(started?value:0,next);if(inView)play();
  }
  const observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){inView=true;if(!started&&target!==null)play();observer.disconnect();}},{threshold:0});observer.observe(element);
  reduced.addEventListener('change',()=>{if(reduced.matches&&started){tween?.progress(1);render(Infinity);complete=true;element.dataset.complete='true';}},{signal});
  if(to!==null)setValue(to);
  return{setValue,dispose(){observer.disconnect();tween?.kill();},get started(){return started;},get complete(){return complete;},get duration(){return DURATION;},get tween(){return tween;},get target(){return target;}};
}

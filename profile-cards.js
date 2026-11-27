import {createRollCounter,experienceYears} from './roll-counter.js?v=20261126-1';
import {initSpotlightCard} from './spotlight-card.js?v=20261126-1';

export function initProfileCards({gsap}){
  const root=document.querySelector('.profile-cards');if(!root)return;
  const abort=new AbortController(),{signal}=abort,reduced=matchMedia('(prefers-reduced-motion:reduce)');
  const spotlights=[...root.querySelectorAll('.profile-card')].map(initSpotlightCard);
  const counter=root.querySelector('[data-experience-count]');let visible=false,timer,disposed=false;
  const experience=createRollCounter(counter,{gsap,reduced,signal,to:experienceYears()});
  const contributions=createRollCounter(root.querySelector('[data-github-total]'),{gsap,reduced,signal});
  const activeDays=createRollCounter(root.querySelector('[data-github-active]'),{gsap,reduced,signal});
  const widget=root.querySelector('[data-spotify-widget]'),widgetImage=widget?.querySelector('img');
  let spotify={status:widget?'widget':'loading',tracks:[]},github,widgetMinute=-1,widgetTracks=[],widgetNow=false;
  const compact=matchMedia('(max-width:700px)');
  const lang=()=>document.documentElement.lang==='en'?'en':'pt';
  const copy={pt:{experience:'Tempo de prática',since:'Desde 16/12/2024',years:'anos',craft:'Criando sites',craftNote:'Do primeiro layout ao último detalhe.',recent:'Últimas no Spotify',recentNote:'As 3 últimas reproduções',disconnected:'Meu histórico entra aqui assim que eu conectar o Spotify.',waiting:'Aguardando conexão',unavailable:'Não foi possível atualizar agora.',noTracks:'Ainda não há reproduções recentes.',loading:'Carregando histórico…',github:'Atividade no GitHub',contributions:'contribuições',activeDays:'dias ativos',year:'Calendário do último ano',less:'Menos',more:'Mais',saved:'Última consulta salva',updated:'Atualizado',connect:'Conectar Spotify',today:'Hoje',yesterday:'Ontem'},en:{experience:'Time in practice',since:'Since Dec 16, 2024',years:'years',craft:'Building websites',craftNote:'From the first layout to the final detail.',recent:'Latest on Spotify',recentNote:'The last 3 plays',disconnected:'My history will appear here when I connect Spotify.',waiting:'Waiting for connection',unavailable:'Could not refresh right now.',noTracks:'No recent plays yet.',loading:'Loading listening history…',github:'GitHub activity',contributions:'contributions',activeDays:'active days',year:'Past year contribution calendar',less:'Less',more:'More',saved:'Last saved update',updated:'Updated',connect:'Connect Spotify',today:'Today',yesterday:'Yesterday'}};
  const text=key=>copy[lang()][key];
  const local=['localhost','127.0.0.1'].includes(location.hostname);
  const connect=root.querySelector('[data-spotify-connect]');connect.hidden=Boolean(widget)||!local;

  function relativeTime(value){
    const date=new Date(value);if(!Number.isFinite(date.getTime()))return '';
    return new Intl.DateTimeFormat(lang()==='pt'?'pt-BR':'en',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}).format(date);
  }
  function safeURL(value,hosts){try{const url=new URL(value);return url.protocol==='https:'&&hosts.some(host=>url.hostname===host)?url.href:null;}catch{return null;}}
  function renderSpotify(){
    const list=root.querySelector('[data-spotify-tracks]'),status=root.querySelector('[data-spotify-status]');list.replaceChildren();
    root.querySelector('[data-spotify-card]').dataset.status=spotify.status;
    if(widget){
      list.hidden=!widgetTracks.length;list.classList.toggle('profile-tracks--widget',Boolean(widgetTracks.length));connect.hidden=true;
      root.querySelector('[data-spotify-card]').classList.toggle('has-compact-tracks',Boolean(widgetTracks.length));
      widgetTracks.forEach(track=>{
        const url=safeURL(track.url,['open.spotify.com']);if(!url)return;
        const li=document.createElement('li'),a=document.createElement('a'),title=document.createElement('strong'),artist=document.createElement('span');
        a.className='profile-widget-track';a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.title=track.title+' — '+track.artist;title.textContent=track.title;artist.textContent=track.artist;
        if(track.nowPlaying){const badge=document.createElement('small');badge.className='profile-widget-track__now';badge.textContent=lang()==='pt'?'Tocando agora':'Playing now';a.append(badge);}
        a.append(title,artist);li.append(a);list.append(li);
      });
      status.textContent=spotify.status==='unavailable'?text('unavailable'):widgetNow?(lang()==='pt'?'Tocando agora · músicas recentes':'Playing now · recent tracks'):text('recentNote');
      root.querySelector('[data-spotify-card]').toggleAttribute('data-now-playing',widgetNow);
      widgetImage.alt=lang()==='pt'?'Atividade de Enzo no Spotify: música atual e reproduções recentes':'Enzo’s Spotify activity: current track and recent plays';
      widget.setAttribute('aria-label',lang()==='pt'?'Abrir o perfil de Enzo no Spotify':'Open Enzo’s Spotify profile');
      return;
    }
    connect.hidden=!local||spotify.status==='connected';
    if(spotify.status==='connected'){
      status.textContent=spotify.tracks.length?text('recentNote'):text('noTracks');
      spotify.tracks.slice(0,3).forEach((track,index)=>{
        const li=document.createElement('li'),link=document.createElement('a');link.className='profile-track';
        const url=safeURL(track.url,['open.spotify.com']);if(url){link.href=url;link.target='_blank';link.rel='noopener noreferrer';}
        const art=document.createElement('span');art.className='profile-track__art';
        const image=safeURL(track.image,['i.scdn.co','image-cdn-ak.spotifycdn.com','image-cdn-fa.spotifycdn.com']);
        if(image){const img=new Image();img.src=image;img.alt='';img.width=40;img.height=40;img.loading='lazy';art.append(img);}else art.textContent='♪';
        const info=document.createElement('span');info.className='profile-track__info';const title=document.createElement('strong'),artist=document.createElement('span');title.textContent=track.title;artist.textContent=track.artist;info.append(title,artist);
        const time=document.createElement('time');time.dateTime=track.playedAt;time.textContent=relativeTime(track.playedAt);time.title=time.textContent;
        link.append(art,info,time);li.append(link);list.append(li);
      });
    }else{
      status.textContent=text(spotify.status==='loading'?'loading':spotify.status==='unavailable'?'unavailable':'disconnected');
      for(let i=0;i<3;i++){const li=document.createElement('li');li.className='profile-track profile-track--empty';const n=document.createElement('span');n.className='profile-track__art';n.textContent=String(i+1).padStart(2,'0');const label=document.createElement('span');label.className='profile-track__placeholder';label.textContent=i===0?text(spotify.status==='unavailable'?'unavailable':'waiting'):'—';li.append(n,label);list.append(li);}
    }
  }
  function renderGithub(){
    if(!github)return;
    const grid=root.querySelector('[data-github-grid]');grid.replaceChildren();
    contributions.setValue(github.total);
    activeDays.setValue(github.activeDays);
    const formatter=new Intl.DateTimeFormat(lang()==='pt'?'pt-BR':'en',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'});
    const first=new Date(github.days[0].date+'T00:00:00Z').getUTCDay();
    for(let i=0;i<first;i++){const pad=document.createElement('span');pad.className='profile-calendar__pad';grid.append(pad);}
    github.days.forEach(day=>{const cell=document.createElement('span');cell.className='profile-calendar__day';cell.dataset.level=day.level;cell.title=`${formatter.format(new Date(day.date+'T00:00:00Z'))}: ${day.count} ${text('contributions')}`;grid.append(cell);});
    grid.style.setProperty('--weeks',Math.ceil((first+github.days.length)/7));
    grid.setAttribute('aria-label',`${github.total} ${text('contributions')}, ${github.activeDays} ${text('activeDays')}. ${text('year')}.`);
    const updated=root.querySelector('[data-github-updated]');updated.textContent=`${text(github.stale?'saved':'updated')} ${relativeTime(github.updatedAt)}`;updated.dateTime=github.updatedAt;
  }
  function refreshExperience(){experience.setValue(experienceYears());const label=root.querySelector('[data-card-text="years"]');if(label)label.textContent=experience.target===1?(lang()==='pt'?'ano':'year'):text('years');}
  function language(){root.querySelectorAll('[data-card-text]').forEach(el=>el.textContent=text(el.dataset.cardText));refreshExperience();renderSpotify();renderGithub();}
  document.addEventListener('portfolio-language-change',language,{signal});language();
  let fetching=false;
  compact.addEventListener('change',()=>{if(visible)refresh();},{signal});
  widgetImage?.addEventListener('load',()=>{const recover=spotify.status!=='widget'||widget.hidden;spotify={status:'widget',tracks:[]};widget.hidden=false;if(recover)renderSpotify();},{signal});
  widgetImage?.addEventListener('error',()=>{spotify={status:'unavailable',tracks:[]};widget.hidden=true;renderSpotify();},{signal});
  async function refresh(){
    if(fetching||disposed)return;refreshExperience();fetching=true;
    if(widget){
      const minute=Math.floor(Date.now()/5000);let liveServer=false,changed=false;
      try{const response=await fetch('/api/spotify/widget-tracks',{signal,cache:'no-store'});if(response.ok){const data=await response.json();if(Array.isArray(data.tracks)&&data.tracks.length){const tracks=data.tracks.slice(0,3),now=Boolean(data.nowPlaying);changed=JSON.stringify(tracks)!==JSON.stringify(widgetTracks)||now!==widgetNow;widgetTracks=tracks;widgetNow=now;liveServer=true;if(changed)renderSpotify();}}}catch{}
      if(disposed){fetching=false;return;}
      if(changed||widgetMinute===-1||spotify.status==='unavailable'||!liveServer&&minute!==widgetMinute){
        widgetMinute=minute;widgetImage.src=liveServer?'/api/spotify/widget.svg?refresh='+minute:widgetImage.dataset.src+'&refresh='+minute;
      }
      fetching=false;return;
    }
    try{
      const response=await fetch('/api/spotify/recent',{signal,cache:'no-store'});if(!response.ok){const error=new Error();error.staticHost=response.status===404;throw error;}const data=await response.json();if(!['connected','disconnected'].includes(data.status)||!Array.isArray(data.tracks))throw new Error();spotify=data;
    }catch(error){if(!disposed)spotify={status:error.staticHost?'disconnected':'unavailable',tracks:[]};}
    if(!disposed)renderSpotify();fetching=false;
  }
  async function loadGithub(){
    try{
      let data;try{const response=await fetch('/api/github/contributions',{signal,cache:'no-store'});if(!response.ok)throw new Error();data=await response.json();}catch{const response=await fetch('data/github-contributions.json',{signal,cache:'no-cache'});if(!response.ok)throw new Error();data={...await response.json(),stale:true};}
      if(!Array.isArray(data.days)||!data.days.length||!Number.isFinite(data.total)||!Number.isFinite(data.activeDays))throw new Error();
      if(!disposed){github=data;renderGithub();}
    }catch{if(!disposed)root.querySelector('[data-github-updated]').textContent=text('unavailable');}
  }
  let loaded=false;
  function schedule(){clearInterval(timer);if(visible&&!document.hidden){if(!loaded){loaded=true;loadGithub();}refresh();timer=setInterval(refresh,widget?5000:60000);}}
  const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;schedule();},{rootMargin:'200px'});observer.observe(root);
  document.addEventListener('visibilitychange',schedule,{signal});
  window.addEventListener('focus',()=>{if(visible&&!document.hidden)refresh();},{signal});
  window.addEventListener('online',()=>{if(visible&&!document.hidden)refresh();},{signal});
  function dispose(){disposed=true;abort.abort();observer.disconnect();experience.dispose();contributions.dispose();activeDays.dispose();spotlights.forEach(spotlight=>spotlight.dispose());clearInterval(timer);}
  window.addEventListener('pagehide',e=>{if(!e.persisted)dispose();},{signal});
  root.cards={dispose,refresh,get counter(){return experience;},get counters(){return {experience,contributions,activeDays};},get github(){return github;},get spotify(){return spotify;}};return root.cards;
}

const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');

/** Parse the public calendar GitHub renders on the owner's profile. */
function parseContributions(html,username){
  const tips=new Map();
  for(const match of html.matchAll(/<tool-tip\b([^>]*)>([\s\S]*?)<\/tool-tip>/g)){
    const id=/\bfor="([^"]+)"/.exec(match[1])?.[1];
    const text=match[2].replace(/<[^>]+>/g,'').trim();
    if(id)tips.set(id,/^No contributions/.test(text)?0:Number(text.match(/^([\d,]+) contribution/)?.[1].replaceAll(',','')));
  }
  const days=[];
  for(const match of html.matchAll(/<td\b([^>]*\bdata-date="[^"]+"[^>]*)>/g)){
    const attr=name=>new RegExp(`\\b${name}="([^"]+)"`).exec(match[1])?.[1];
    const date=attr('data-date'),level=Number(attr('data-level')),count=tips.get(attr('id'));
    if(/^\d{4}-\d{2}-\d{2}$/.test(date)&&Number.isFinite(count)&&level>=0&&level<=4)days.push({date,count,level});
  }
  days.sort((a,b)=>a.date.localeCompare(b.date));
  if(days.length<350)throw new Error('GitHub calendar could not be read.');
  const today=new Date().toLocaleDateString('en-CA',{timeZone:'America/Sao_Paulo'});
  const elapsed=days.filter(day=>day.date<=today);
  return {username,source:`https://github.com/${username}`,updatedAt:new Date().toISOString(),total:elapsed.reduce((n,d)=>n+d.count,0),activeDays:elapsed.filter(d=>d.count>0).length,days:elapsed};
}

function createProfileData({root,env=process.env,fetcher=fetch}){
  const username='bicas777',snapshot=path.join(root,'data/github-contributions.json');
  const privateDir=path.join(root,'.local'),tokenFile=path.join(privateDir,'spotify-token.json');
  let github,githubPending,tracksCache,tracksPending,token,tokenPending,widgetCache,widgetPending;
  try{github=JSON.parse(fs.readFileSync(snapshot,'utf8'));}catch{}
  try{token=JSON.parse(fs.readFileSync(tokenFile,'utf8'));}catch{}
  const configured=()=>Boolean(env.SPOTIFY_CLIENT_ID&&env.SPOTIFY_CLIENT_SECRET&&env.SPOTIFY_REDIRECT_URI);
  const json=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));};
  const local=req=>['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress)&&/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(req.headers.host||'');
  const saveToken=data=>{
    token={access_token:data.access_token,refresh_token:data.refresh_token||token?.refresh_token,expires_at:Date.now()+data.expires_in*1000};
    fs.mkdirSync(privateDir,{recursive:true});fs.writeFileSync(tokenFile,JSON.stringify(token),{mode:0o600});
  };
  async function exchange(params){
    const response=await fetcher('https://accounts.spotify.com/api/token',{method:'POST',headers:{Authorization:'Basic '+Buffer.from(env.SPOTIFY_CLIENT_ID+':'+env.SPOTIFY_CLIENT_SECRET).toString('base64'),'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(params),signal:AbortSignal.timeout(12000)});
    if(!response.ok)throw new Error('Spotify authorization failed.');
    saveToken(await response.json());return token.access_token;
  }
  async function accessToken(){
    if(token?.access_token&&token.expires_at>Date.now()+60000)return token.access_token;
    if(!token?.refresh_token)throw new Error('Spotify needs connection.');
    if(!tokenPending)tokenPending=exchange({grant_type:'refresh_token',refresh_token:token.refresh_token}).finally(()=>tokenPending=null);
    return tokenPending;
  }
  async function contributions(){
    if(github&&Date.now()-Date.parse(github.updatedAt)<3600000)return github;
    if(!githubPending)githubPending=(async()=>{
      const response=await fetcher(`https://github.com/users/${username}/contributions`,{headers:{'User-Agent':'Enzo-Portfolio','Accept-Language':'en-US'},signal:AbortSignal.timeout(12000)});
      if(!response.ok)throw new Error('GitHub unavailable.');
      github=parseContributions(await response.text(),username);fs.mkdirSync(path.dirname(snapshot),{recursive:true});fs.writeFileSync(snapshot,JSON.stringify(github));return github;
    })().finally(()=>githubPending=null);
    try{return await githubPending;}catch(error){if(github)return {...github,stale:true};throw error;}
  }
  async function recentlyPlayed(){
    if(!configured()||!token?.refresh_token)return {status:'disconnected',tracks:[]};
    if(tracksCache&&Date.now()-tracksCache.fetchedAt<60000)return tracksCache.data;
    if(!tracksPending)tracksPending=(async()=>{
      let access=await accessToken();
      const request=()=>fetcher('https://api.spotify.com/v1/me/player/recently-played?limit=3',{headers:{Authorization:`Bearer ${access}`},signal:AbortSignal.timeout(12000)});
      let response=await request();
      if(response.status===401){token.expires_at=0;access=await accessToken();response=await request();}
      if(!response.ok)throw new Error('Spotify is temporarily unavailable.');
      const data=await response.json();
      const tracks=(data.items||[]).slice(0,3).map(({track,played_at})=>({title:track.name,artist:track.artists.map(a=>a.name).join(', '),url:track.external_urls.spotify,image:track.album.images.at(-1)?.url||null,playedAt:played_at}));
      const result={status:'connected',updatedAt:new Date().toISOString(),tracks};tracksCache={fetchedAt:Date.now(),data:result};return result;
    })().finally(()=>tracksPending=null);
    return tracksPending;
  }
  const oauthStates=new Map();
  async function publicWidgetTracks(){
    if(widgetCache&&Date.now()-widgetCache.time<5000)return widgetCache.data;
    if(!widgetPending)widgetPending=(async()=>{
      const fresh=Math.floor(Date.now()/5000);
      const response=await fetcher('https://spotify-recently-played.jeffreyca.workers.dev/svg?user=oy44kgfehl954oiaj5qfmheez&count=3&width=400&theme=transparent&header=0&profile=off&now_playing=1&time=0&text_color=dce5eb&artist_color=7e91a1&meta_color=61798d&accent_color=0000ff&refresh='+fresh,{signal:AbortSignal.timeout(12000),cache:'no-store',headers:{'Cache-Control':'no-cache'}});
      if(!response.ok)throw Error('Widget unavailable');
      const svg=await response.text(),tracks=[];
      const decode=value=>value.replace(/<[^>]*>/g,'').replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi,(_,entity)=>entity[0]==='#'?String.fromCodePoint(entity[1].toLowerCase()==='x'?parseInt(entity.slice(2),16):Number(entity.slice(1))):({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'"}[entity]||''));
      for(const match of svg.matchAll(/<a\b[^>]*href="(https:\/\/open\.spotify\.com\/track\/[^"?#]+)"[^>]*>\s*<text\b[^>]*>([\s\S]*?)<\/text>\s*<\/a>/g)){
        const tail=svg.slice(match.index+match[0].length),artist=/^\s*<\/g>\s*<text\b[^>]*>([\s\S]*?)<\/text>/.exec(tail)?.[1];
        if(artist!==undefined)tracks.push({title:decode(match[2]),artist:decode(artist),url:match[1],nowPlaying:tracks.length===0&&/aria-label="Listening now on Spotify:/.test(svg)});
      }
      if(!tracks.length)throw Error('Widget layout changed');
      const data={tracks:tracks.slice(0,3),nowPlaying:Boolean(tracks[0]?.nowPlaying),updatedAt:new Date().toISOString()};widgetCache={time:Date.now(),data,svg};return data;
    })().finally(()=>widgetPending=null);
    return widgetPending;
  }
  async function handle(req,res,url){
    if(!url.pathname.startsWith('/api/'))return false;
    if(req.method!=='GET'){json(res,405,{error:'Method not allowed'});return true;}
    if(url.pathname==='/api/github/contributions'){
      try{json(res,200,await contributions());}catch{json(res,503,{status:'unavailable'});}return true;
    }
    if(url.pathname==='/api/spotify/recent'){
      try{json(res,200,await recentlyPlayed());}catch{json(res,503,{status:'unavailable',tracks:[]});}return true;
    }
    if(url.pathname==='/api/spotify/widget-tracks'){
      try{json(res,200,await publicWidgetTracks());}catch{json(res,503,{tracks:[]});}return true;
    }
    if(url.pathname==='/api/spotify/widget.svg'){
      try{
        await publicWidgetTracks();
        res.writeHead(200,{'Content-Type':'image/svg+xml; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; img-src data:; style-src 'unsafe-inline'"});res.end(widgetCache.svg);
      }catch{res.writeHead(503,{'Cache-Control':'no-store'});res.end();}return true;
    }
    if(['/api/spotify/connect','/api/spotify/callback'].includes(url.pathname)){
      // Connecting the portfolio owner's account is a local administrative action.
      // Public visitors only see the sanitized /recent response.
      if(!local(req)){json(res,403,{error:'Connect from the local server.'});return true;}
      if(!configured()){
        res.writeHead(503,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});
        res.end('<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Conectar Spotify</title><body style="background:#030609;color:#dbe9ee;font:16px/1.8 system-ui;max-width:650px;margin:12vh auto;padding:24px"><h1>Conectar meu Spotify</h1><p>O card está pronto. Falta configurar seu aplicativo para autorizar a leitura das últimas músicas.</p><ol><li>Crie um aplicativo no <a style="color:#9caeff" href="https://developer.spotify.com/dashboard" target="_blank" rel="noopener noreferrer">Spotify Developer Dashboard</a>.</li><li>Cadastre a Redirect URI <code>http://127.0.0.1:5173/api/spotify/callback</code>.</li><li>Preencha o arquivo local <code>.env</code> seguindo o <code>INTEGRATIONS.md</code> do projeto e reinicie o servidor.</li></ol><p>Depois, abra esta página novamente para autorizar sua conta.</p><a style="color:#9caeff" href="/#world">← Voltar ao site</a></body></html>');return true;
      }
      if(url.pathname.endsWith('/connect')){
        const callback=new URL(env.SPOTIFY_REDIRECT_URI);
        if(req.headers.host!==callback.host){
          res.writeHead(302,{Location:callback.origin+'/api/spotify/connect','Cache-Control':'no-store'});res.end();return true;
        }
        for(const [key,entry]of oauthStates)if(entry.expires<Date.now())oauthStates.delete(key);
        const state=crypto.randomBytes(32).toString('hex');oauthStates.set(state,{expires:Date.now()+600000});
        const params=new URLSearchParams({client_id:env.SPOTIFY_CLIENT_ID,response_type:'code',redirect_uri:env.SPOTIFY_REDIRECT_URI,scope:'user-read-recently-played',state});
        res.writeHead(302,{Location:'https://accounts.spotify.com/authorize?'+params,'Set-Cookie':`spotify_state=${state}; HttpOnly; SameSite=Lax; Path=/api/spotify; Max-Age=600`,'Cache-Control':'no-store'});res.end();return true;
      }
      const state=url.searchParams.get('state'),stored=oauthStates.get(state);
      const cookie=/(?:^|;\s*)spotify_state=([a-f0-9]+)/.exec(req.headers.cookie||'')?.[1];
      oauthStates.delete(state);
      if(!state||cookie!==state||!stored||stored.expires<Date.now()||!url.searchParams.get('code')){json(res,400,{error:'Invalid or expired Spotify authorization. Try connecting again.'});return true;}
      try{
        await exchange({grant_type:'authorization_code',code:url.searchParams.get('code'),redirect_uri:env.SPOTIFY_REDIRECT_URI});tracksCache=null;
        res.writeHead(302,{Location:'/#world','Set-Cookie':'spotify_state=; HttpOnly; SameSite=Lax; Path=/api/spotify; Max-Age=0','Cache-Control':'no-store'});res.end();
      }catch{json(res,502,{error:'Spotify authorization failed. Try again.'});}return true;
    }
    json(res,404,{error:'Not found'});return true;
  }
  return {handle,contributions,recentlyPlayed};
}
module.exports={createProfileData,parseContributions};

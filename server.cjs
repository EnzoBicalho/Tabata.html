const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=__dirname;
// No build tooling is required. Private integration settings stay server-side.
try{for(const line of fs.readFileSync(path.join(root,'.env'),'utf8').split(/\r?\n/)){
  const match=/^([A-Z_][A-Z_0-9]*)\s*=\s*(.*)$/.exec(line.trim());
  if(match&&!process.env[match[1]])process.env[match[1]]=match[2].replace(/^(['"])(.*)\1$/,'$2');
}}catch{}
const {createProfileData}=require('./profile-data.cjs');
const profile=createProfileData({root});
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.ico':'image/x-icon','.mp4':'video/mp4','.woff2':'font/woff2','.ttf':'font/ttf','.otf':'font/otf','.glb':'model/gltf-binary','.gltf':'model/gltf+json','.bin':'application/octet-stream','.hdr':'application/octet-stream'};
const server=http.createServer(async(req,res)=>{
  let url;try{url=new URL(req.url,'http://127.0.0.1');}catch{res.writeHead(400).end();return;}
  try{
    if(await profile.handle(req,res,url))return;
    if(!['GET','HEAD'].includes(req.method)){res.writeHead(405).end();return;}
    const pathname=decodeURIComponent(url.pathname);
    const filename=path.resolve(root,'.'+pathname+(pathname.endsWith('/')?'index.html':''));
    const relative=path.relative(root,filename);
    if(relative.startsWith('..')||path.isAbsolute(relative)||relative.split(/[\\/]/).some(part=>part.startsWith('.'))||!mime[path.extname(filename).toLowerCase()]){res.writeHead(404).end();return;}
    const stat=await fs.promises.stat(filename).catch(()=>null);
    if(!stat?.isFile()){res.writeHead(404).end();return;}
    const headers={'Content-Type':mime[path.extname(filename).toLowerCase()],'Cache-Control':'no-store','Accept-Ranges':'bytes','X-Content-Type-Options':'nosniff'};
    if(req.headers.range){
      const match=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range);
      const start=match?Number(match[1]):NaN,end=match?Math.min(match[2]?Number(match[2]):stat.size-1,stat.size-1):NaN;
      if(!Number.isFinite(start)||start>end){res.writeHead(416,{'Content-Range':`bytes */${stat.size}`}).end();return;}
      res.writeHead(206,{...headers,'Content-Range':`bytes ${start}-${end}/${stat.size}`,'Content-Length':end-start+1});if(req.method==='HEAD')res.end();else fs.createReadStream(filename,{start,end}).pipe(res);return;
    }
    res.writeHead(200,{...headers,'Content-Length':stat.size});if(req.method==='HEAD')res.end();else fs.createReadStream(filename).pipe(res);
  }catch{if(!res.headersSent)res.writeHead(500);res.end();}
});
const port=Number(process.env.PORT||process.argv[2]||5173);
server.listen(port,process.env.HOST||'127.0.0.1',()=>console.log(`Portfolio: http://127.0.0.1:${port}`));

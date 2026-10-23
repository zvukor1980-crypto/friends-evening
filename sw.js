const V='friends-v4';
const core=()=>fetch('assets.json',{cache:'no-store'}).then(r=>r.json());
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(core().then(a=>caches.open(V).then(c=>c.addAll([...new Set(['./',...a.core,'assets.json'])]))))});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!=V).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener('message',e=>{if(e.data!=='precache-all')return;e.waitUntil(caches.open(V).then(async c=>{const a=await (await c.match('assets.json')).json();for(const u of a.vids){const full=new URL(u,self.registration.scope).href;if(!(await c.match(full))){try{const r=await fetch(full);if(r.ok)await c.put(full,r)}catch(_){}}}}))});
async function ranged(req,res){const rg=req.headers.get('range');if(!rg)return res;const b=await res.blob(),m=/bytes=(\d*)-(\d*)/.exec(rg),sz=b.size;let s=m[1]?+m[1]:0,en=m[2]?+m[2]:sz-1;if(!m[1]&&m[2]){s=sz-+m[2];en=sz-1}en=Math.min(en,sz-1);
 return new Response(b.slice(s,en+1),{status:206,headers:{'Content-Type':res.headers.get('Content-Type')||'video/mp4','Content-Range':`bytes ${s}-${en}/${sz}`,'Content-Length':en-s+1,'Accept-Ranges':'bytes'}})}
self.addEventListener('fetch',e=>{const q=e.request;if(q.method!=='GET')return;const u=new URL(q.url);if(u.origin!==location.origin)return;
 e.respondWith((async()=>{const c=await caches.open(V);const k=u.origin+u.pathname;let r=await c.match(k)||(u.pathname.endsWith('/')?await c.match(k+'index.html'):null);
  if(r)return q.headers.has('range')?ranged(q,r):r;
  try{const n=await fetch(q);if(n.ok&&n.status===200&&!q.headers.has('range'))c.put(k,n.clone());return n}catch(_){return (await c.match(u.origin+self.registration.scope.replace(location.origin,'')))||Response.error()}})())});

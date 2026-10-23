(async()=>{const st=document.getElementById('st');if(!('caches' in window)){st.textContent='';return}
 const a=await (await fetch('assets.json')).json(),all=[...a.core,...a.vids];
 const tick=async()=>{let n=0;const c=await caches.open('friends-v3');for(const u of all)if(await c.match(new URL(u,location.href).href))n++;st.textContent=n>=all.length?'✓ Всё сохранено — работает без интернета':`Сохранение для офлайна: ${n}/${all.length} (не закрывайте, нужен интернет)`;if(n<all.length)setTimeout(tick,3000)};tick()})();

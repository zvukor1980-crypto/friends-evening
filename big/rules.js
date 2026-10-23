const Rules=(()=>{
const W=typeof module!=='undefined'?require('./world.js'):World,ids=Object.keys(W.quests);
const chapterOf=q=>W.chapters.findIndex(c=>c.goals.includes(q))+1;
function fresh(){return {version:2,chapter:1,room:'living',done:[],inventory:[],relations:Array(10).fill(0),side:Array(10).fill(0),talked:[],visited:['living'],inspected:[],flags:{archive:[],albumOpened:false,wired:false,calendar:false,weather:null},attempts:{},care:0,wit:0,hints:0,seconds:0,photoChoice:0,puzzles:{},ending:null,toast:null,created:Date.now(),updated:Date.now()}}
const has=(s,q)=>s.done.includes(q),ready=(s,q)=>ids.includes(q)&&!has(s,q)&&chapterOf(q)===s.chapter&&(W.quests[q].requires||[]).every(p=>has(s,p));
const add=(a,v)=>{if(v&&!a.includes(v))a.push(v)},result=(ok,message,extra={})=>({ok,message,...extra});
function touch(s){s.updated=Date.now()}
function finish(s,q){if(has(s,q))return;add(s.done,q);add(s.inventory,W.quests[q].reward);if(q==='film'){add(s.inventory,'cable');add(s.inventory,'lens')}if(W.chapters[s.chapter-1].goals.every(id=>has(s,id))&&s.chapter<6)s.chapter++;touch(s)}
function people(s){return W.rooms[s.room].people}
function move(s,room){if(!W.rooms[room]||W.rooms[room].unlock>s.chapter)return result(false,'Эта комната откроется в следующей главе.');s.room=room;add(s.visited,room);touch(s);return result(true,W.rooms[room].name)}
function inspect(s,object){const room=W.rooms[s.room];if(!room.spots.some(p=>p[0]===object))return result(false,'Здесь нет такого предмета.');add(s.inspected,s.room+'.'+object);const found=[];if(s.room==='study'&&object==='calendar')s.flags.calendar=true;W.cast.forEach((p,i)=>{if(s.side[i]===1&&p.where===s.room&&p.object===object){s.side[i]=2;add(s.inventory,p.want);found.push(p.want)}});touch(s);return result(true,found.length?'Найдена вещь для личной истории.':'Ты осмотрел это место.',{found})}
function accept(s,i){if(!people(s).includes(i)||s.side[i]!==0)return result(false,'Сначала поговори с героиней в её комнате.');s.side[i]=1;touch(s);return result(true,W.cast[i].request)}
function give(s,i,item){if(!people(s).includes(i)||s.side[i]!==2||W.cast[i].want!==item||!s.inventory.includes(item))return result(false,'Эта вещь сейчас не нужна для данного разговора.');s.inventory=s.inventory.filter(v=>v!==item);s.side[i]=3;s.relations[i]=Math.min(10,s.relations[i]+3);s.care++;touch(s);return result(true,W.cast[i].after,{memory:i})}
function talk(s,i,tone){if(!people(s).includes(i)||!['kind','wit'].includes(tone))return result(false,'Выбери собеседницу в текущей комнате.');const key=s.chapter+':'+i,first=!s.talked.includes(key);if(first){s.talked.push(key);s.relations[i]=Math.min(10,s.relations[i]+(tone==='kind'?2:1));s[tone==='kind'?'care':'wit']++;}if(s.chapter===6&&ready(s,'greetings')&&W.cast.every((_,p)=>s.talked.includes('6:'+p)))finish(s,'greetings');touch(s);return result(true,tone==='kind'?'Она заметно расслабляется. Разговору не пришлось быть полезным, чтобы оказаться важным.':'Вы смеётесь. Шутка не решила задачу, зато помогла снова почувствовать себя одной компанией.',{first})}
const same=(a,b)=>Array.isArray(a)&&a.length===b.length&&a.every((v,i)=>v===b[i]);
function solve(s,q,payload){if(!ready(s,q))return result(false,'Задание пока недоступно или уже выполнено.');const def=W.quests[q];if(s.room!==def.room)return result(false,'Вернись в комнату, где выполняется это задание.');let valid=false;
switch(q){
 case 'letter':valid=[0,1].includes(payload);break;
 case 'keys':valid=payload==='pocket'&&s.inspected.includes('hall.coat');break;
 case 'album':valid=s.flags.albumOpened&&same(payload,[0,1,2,3,4,5,6,7,8]);break;
 case 'coffee':valid=same(payload,['cup','espresso','milk','cinnamon']);break;
 case 'roles':valid=same(payload,[1,2,7]);break;
 case 'safe':valid=String(payload)==='1930';break;
 case 'film':valid=Array.isArray(payload)&&payload.length===3&&same([...payload].sort(),['cable','film','lens']);break;
 case 'projector':valid=s.flags.wired&&same(payload,[true,false,true]);break;
 case 'gallery':valid=same(payload,[2016,2018,2021,2026]);break;
 case 'terrace':valid=Array.isArray(payload)&&same([...payload].sort(),['cover','light','plants']);break;
 case 'cake':valid=same(payload,['form','mix','berries','oven','decorate']);break;
 case 'seats':valid=same(payload,[1,0,2,3,4]);break;
 case 'weather':valid=['outside','inside'].includes(payload);if(valid)s.flags.weather=payload;break;
 case 'screen':valid=payload==='screened';break;
 case 'toast':valid=[0,1,2].includes(payload);if(valid){s.toast=payload;const memories=s.side.filter(v=>v===3).length,strong=s.relations.filter(v=>v>=5).length;s.ending=memories>=6&&strong>=6&&has(s,'archive')?'home':payload===1?'archive':payload===2?'future':'together';}break;
 default:return result(false,'Это задание выполняется с помощью предметов или разговоров.');
}
if(!valid){s.attempts[q]=(s.attempts[q]||0)+1;touch(s);return result(false,'Пока не сходится. Сверься с подсказкой — можно попробовать снова без штрафа.');}finish(s,q);return result(true,def.after||'Большой вечер состоялся.',{completed:q,chapter:s.chapter,ending:s.ending})}
function use(s,item,q){if(!s.inventory.includes(item)||!ready(s,q)||s.room!==W.quests[q].room)return result(false,'Сначала выбери подходящий предмет и найди место его применения.');if(q==='album'&&item==='key'){s.flags.albumOpened=true;touch(s);return result(true,'Ящик открыт. Теперь можно собрать фотографию.',{puzzle:q})}if(q==='projector'&&item==='cable'){s.flags.wired=true;touch(s);return result(true,'Кабель установлен. Проверь переключатели.',{puzzle:q})}if(q==='poster'&&item==='photo'){finish(s,q);return result(true,W.quests[q].after,{completed:q})}if(q==='archive'&&['photo','letter','restoredFilm'].includes(item)){if(s.flags.archive.includes(item))return result(false,'Эта часть уже закреплена на доске.');s.flags.archive.push(item);if(s.flags.archive.length===3){finish(s,q);return result(true,W.quests[q].after,{completed:q})}touch(s);return result(true,'Часть архива размещена: '+s.flags.archive.length+' из 3.')}return result(false,'Подумай, где эта вещь действительно пригодится. Предмет остаётся у тебя.')}
function achievements(s){const a=[];if(s.visited.length===8)a.push('Знаток дома');if(has(s,'coffee')&&!s.attempts.coffee)a.push('Первая чашка');if(s.side.filter(v=>v===3).length>=5)a.push('Внимательный сосед');if(s.side.every(v=>v===3))a.push('Десять личных историй');if(has(s,'archive'))a.push('Хранитель памяти');if(s.done.length===18)a.push('Большой вечер');if(s.ending==='home')a.push('Дом, который мы выбрали');return a}
function load(value){try{const s=typeof value==='string'?JSON.parse(value):JSON.parse(JSON.stringify(value));if(!s||s.version!==2||!Number.isInteger(s.chapter)||s.chapter<1||s.chapter>6||!W.rooms[s.room]||W.rooms[s.room].unlock>s.chapter)return null;for(const [key,allowed,max]of [['done',ids,18],['inventory',Object.keys(W.itemNames),40],['visited',Object.keys(W.rooms),8]])if(!Array.isArray(s[key])||s[key].length>max||new Set(s[key]).size!==s[key].length||s[key].some(x=>!allowed.includes(x)))return null;
for(const [field,max]of [['relations',10],['side',3]])if(!Array.isArray(s[field])||s[field].length!==10||s[field].some(x=>!Number.isInteger(x)||x<0||x>max))return null;
if(!Array.isArray(s.talked)||s.talked.length>60||new Set(s.talked).size!==s.talked.length||s.talked.some(x=>typeof x!=='string'||!/^([1-6]):([0-9])$/.test(x)))return null;
if(!Array.isArray(s.inspected)||s.inspected.length>32||s.inspected.some(x=>typeof x!=='string'||!Object.entries(W.rooms).some(([r,v])=>v.spots.some(p=>r+'.'+p[0]===x))))return null;
if(!s.flags||!Array.isArray(s.flags.archive)||s.flags.archive.length>3||new Set(s.flags.archive).size!==s.flags.archive.length||s.flags.archive.some(v=>!['photo','letter','restoredFilm'].includes(v))||!['outside','inside',null].includes(s.flags.weather))return null;
for(const k of ['albumOpened','wired','calendar'])if(typeof s.flags[k]!=='boolean')return null;
for(const k of ['care','wit','hints','seconds','created','updated'])if(typeof s[k]!=='number'||!Number.isFinite(s[k])||s[k]<0)return null;
if(s.care>100||s.wit>100||s.hints>10000||s.seconds>1e8)return null;
if(!s.attempts||typeof s.attempts!=='object'||Object.keys(s.attempts).some(q=>!ids.includes(q)||!Number.isInteger(s.attempts[q])||s.attempts[q]<0||s.attempts[q]>1e6))return null;
if(![null,'home','archive','future','together'].includes(s.ending)||![null,0,1,2].includes(s.toast))return null;
for(let c=1;c<s.chapter;c++)if(!W.chapters[c-1].goals.every(q=>has(s,q)))return null;
if(s.done.some(q=>chapterOf(q)>s.chapter||(W.quests[q].requires||[]).some(p=>!has(s,p))))return null;
if(s.ending&&!has(s,'toast'))return null;
if(!Number.isInteger(s.photoChoice)||s.photoChoice<0||s.photoChoice>9)return null;
if(!s.puzzles||typeof s.puzzles!=='object'||Array.isArray(s.puzzles)||Object.keys(s.puzzles).length>12)return null;
const choices={album:[0,1,2,3,4,5,6,7,8],coffee:['cup','espresso','milk','cinnamon','sugar','water'],roles:[1,2,7],film:['film','cable','lens','book','clock','scissors'],projector:[true,false],gallery:[2016,2018,2021,2026],terrace:['light','cover','plants','banner','sweets','statue'],cake:['form','mix','berries','oven','decorate'],seats:[0,1,2,3,4]};
for(const [q,v]of Object.entries(s.puzzles)){if(q==='safe'){if(typeof v!=='string'||!/^\d{0,4}$/.test(v))return null;continue;}if(!choices[q]||!Array.isArray(v)||v.length>12||v.some(x=>!choices[q].includes(x)))return null;if(q==='projector'){if(v.length!==3)return null;}else if(new Set(v).size!==v.length)return null;if(['album','roles','gallery','seats'].includes(q)&&v.length!==choices[q].length)return null;}
return s;}catch{return null}}
return {fresh,ready,has,chapterOf,people,move,inspect,accept,give,talk,solve,use,achievements,load};
})();
if(typeof module!=='undefined')module.exports=Rules;

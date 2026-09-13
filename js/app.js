const BUILD = 5;
const $ = id => document.getElementById(id);
const fmt = n => n.toLocaleString('ru-RU');
const rnd = (a,b) => a + Math.random()*(b-a);
const pick = a => a[Math.floor(Math.random()*a.length)];
const gift = id => GIFTS.find(g=>g.id===id);
const uid = () => Date.now().toString(36)+Math.random().toString(36).slice(2,7);

const DEF = () => ({
  balance:ECO.START_BALANCE, xp:0, inv:[], battles:[],
  stats:{opened:0,spent:0,won:0,best:0,upgrades:0,upWins:0,battles:0,bWins:0,sells:0,buys:0},
  qp:{}, qc:[], ac:[], daily:{last:'',streak:0}, promo:[], refs:0,
  sound:true, fair:false, seed:uid()+uid()
});
let S = load();
function load(){
  try{
    const s=JSON.parse(localStorage.getItem('cashbanni_v2'));
    if(!s) return DEF();
    const def=DEF(); const out=Object.assign(def,s);
    out.stats=Object.assign(def.stats,s.stats||{});
    out.daily=Object.assign(def.daily,s.daily||{});
    out.inv=(Array.isArray(s.inv)?s.inv:[]).filter(i=>i&&i.gid&&GIFTS.some(g=>g.id===i.gid));
    out.inv.forEach(i=>{ if(!i.uid) i.uid=uid(); });
    return out;
  }catch(e){ return DEF(); }
}
function save(){ localStorage.setItem('cashbanni_v2', JSON.stringify(S)); }
function validInv(){ return S.inv.filter(i=>i&&i.gid&&gift(i.gid)); }

let upFrom=null, upTo=null, curCase=null, spinning=false, upBusy=false;
const IMG = {};

// ---------- TELEGRAM WEB APP ----------
const TG = (window.Telegram && window.Telegram.WebApp) || null;
if (TG) {
  try {
    TG.ready(); TG.expand();
    if (TG.setHeaderColor) TG.setHeaderColor('#06061a');
    if (TG.setBackgroundColor) TG.setBackgroundColor('#06061a');
    const u = TG.initDataUnsafe && TG.initDataUnsafe.user;
    if (u) S.tgName = u.first_name || null;
  } catch (e) {}
}
function haptic(kind){
  try{
    if (!TG || !TG.HapticFeedback) return;
    if (kind==='success') TG.HapticFeedback.notificationOccurred('success');
    else if (kind==='error') TG.HapticFeedback.notificationOccurred('error');
    else TG.HapticFeedback.impactOccurred('light');
  }catch(e){}
}

// ---------- РЕАЛЬНЫЕ TG ПОДАРКИ ----------
async function loadTgs(url){
  const res=await fetch(url);
  if(!res.ok) throw new Error('http '+res.status);
  const buf=await res.arrayBuffer();
  if(window.DecompressionStream){
    const stream=new Blob([buf]).stream().pipeThrough(new DecompressionStream('gzip'));
    return JSON.parse(await new Response(stream).text());
  }
  return JSON.parse(new TextDecoder().decode(buf));
}
async function buildGiftImages(){
  if(!window.lottie) return;
  let ok=0;
  for(const g of GIFTS){
    try{
      const data=await loadTgs(g.tgs);
      const div=document.createElement('div');
      div.style.cssText='width:96px;height:96px;position:fixed;left:-9999px;top:0';
      document.body.appendChild(div);
      const anim=lottie.loadAnimation({animationData:data,renderer:'canvas',loop:false,autoplay:false,container:div});
      await new Promise(r=>anim.addEventListener('DOMLoaded',r,{once:true}));
      anim.goToAndStop(Math.floor((anim.totalFrames||30)/2),true);
      const c=div.querySelector('canvas');
      if(c){ IMG[g.id]=c.toDataURL('image/png'); ok++; }
      anim.destroy(); div.remove();
    }catch(e){}
  }
  if(ok){ toast('✅ Подарки TG: '+ok+'/'+GIFTS.length,'good'); renderAll(); }
}

// ---------- ЗВУК + ВИБРАЦИЯ ----------
let AC;
function beep(f,d,t,v){
  d=d||0.08; t=t||'square'; v=v||0.12;
  if(!S.sound) return;
  try{
    AC = AC || new (window.AudioContext||window.webkitAudioContext)();
    const o=AC.createOscillator(), g=AC.createGain();
    o.type=t; o.frequency.value=f; g.gain.value=v;
    o.connect(g); g.connect(AC.destination); o.start();
    g.gain.exponentialRampToValueAtTime(0.001, AC.currentTime+d);
    o.stop(AC.currentTime+d);
  }catch(e){}
}
const sfx={
  click:()=>{beep(600,.05,'triangle',.07); haptic('light');},
  tick:()=>beep(800+Math.random()*400,.03,'square',.04),
  win:()=>{beep(523,.1);setTimeout(()=>beep(659,.1),100);setTimeout(()=>beep(784,.2),200); haptic('success');},
  lose:()=>{beep(180,.35,'sawtooth',.1); haptic('error');},
  legend:()=>{[523,659,784,1046,1318,1568].forEach((f,i)=>setTimeout(()=>beep(f,.16,'triangle',.12),i*90)); haptic('success');}
};

const cv=$('confetti'), cx=cv.getContext('2d'); let parts=[];
function sizeCv(){ cv.width=innerWidth; cv.height=innerHeight; }
sizeCv(); addEventListener('resize',sizeCv);
function confetti(n){
  n=n||140;
  const cols=['#a855f7','#ec4899','#fbbf24','#22c55e','#60a5fa'];
  for(let i=0;i<n;i++) parts.push({x:innerWidth/2,y:innerHeight/3,vx:rnd(-7,7),vy:rnd(-11,-3),s:rnd(4,9),c:pick(cols),r:rnd(0,6),vr:rnd(-.2,.2)});
}
(function loop(){
  cx.clearRect(0,0,cv.width,cv.height);
  parts=parts.filter(p=>p.y<cv.height+20);
  parts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.25;p.r+=p.vr;
    cx.save();cx.translate(p.x,p.y);cx.rotate(p.r);cx.fillStyle=p.c;cx.fillRect(-p.s/2,-p.s/2,p.s,p.s);cx.restore();});
  requestAnimationFrame(loop);
})();

function toast(msg,type){
  const d=document.createElement('div'); d.className='toast '+(type||''); d.innerHTML=msg;
  $('toasts').appendChild(d); setTimeout(()=>d.classList.add('out'),2600); setTimeout(()=>d.remove(),3100);
}
function gImg(g,cls){
  cls=cls||'gimg';
  return IMG[g.id] ? '<img class="'+cls+'" src="'+IMG[g.id]+'" alt="'+g.name+'">' : '<span class="emoji">'+g.emoji+'</span>';
}
function levelInfo(){ let lvl=1,need=500; while(S.xp>=need){lvl++;need+=lvl*500;} const prev=need-lvl*500; return {lvl:lvl,prog:(S.xp-prev)/(need-prev)}; }
function renderHeader(){
  $('balanceValue').textContent=fmt(S.balance);
  const li=levelInfo(); $('lvlFill').style.width=(li.prog*100)+'%';
  $('dailyBtn').classList.toggle('done', S.daily.last===new Date().toDateString());
  $('invCount').textContent=validInv().length;
  const ready=QUESTS.filter(q=>!S.qc.includes(q.id)&&(S.qp[q.type]||0)>=q.target).length;
  $('questBadge').textContent=ready; $('questBadge').classList.toggle('hide',!ready);
}

function renderFeed(){
  let h='';
  for(let i=0;i<16;i++){ const g=pick(GIFTS);
    h+='<div class="feed-item" style="border-color:'+RAR[g.rarity].color+'55">'+gImg(g,'f-img')+'<span>'+g.name+'</span><span class="f-price">⭐'+g.price+'</span></div>'; }
  $('feedTrack').innerHTML=h+h;
}
setInterval(renderFeed,50000);

// ---------- НАВИГАЦИЯ (низ + шапка) ----------
function activateTab(t){
  sfx.click();
  document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active', b.dataset.tab===t));
  document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
  const sec=$('sec-'+t); if(sec) sec.classList.add('active');
  renderSection(t);
  scrollTo({top:0,behavior:'smooth'});
}
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>activateTab(b.dataset.tab));
function renderSection(t){
  if(t==='cases') renderCases();
  else if(t==='inventory') renderInventory();
  else if(t==='market') renderMarket();
  else if(t==='quests') renderQuests();
  else if(t==='top') renderTop();
  else if(t==='profile') renderProfile();
  else if(t==='battles') renderBattles();
  else if(t==='upgrade') renderUpgrade();
}
function renderAll(){ renderHeader(); renderFeed(); renderSection(document.querySelector('.section.active').id.replace('sec-','')); }
function gotoCases(){ activateTab('cases'); }

// ---------- КОЛЕСО ----------
function setWheel(el,segs){
  let acc=0;
  const stops=segs.map(s=>{const f=acc;acc+=s.pct;return s.color+' '+f+'% '+acc+'%';});
  el.style.background='conic-gradient('+stops.join(',')+')';
}
function spinWheel(el,segs,winIndex,cb){
  let start=0;
  const zones=segs.map(s=>{const z=[start,start+s.pct];start+=s.pct;return z;});
  const a=zones[winIndex][0], b=zones[winIndex][1];
  const t=(a+(b-a)*rnd(0.15,0.85))*3.6;
  const R=5*360+(360-t);
  el.style.transition='none'; el.style.transform='rotate(0deg)'; void el.offsetWidth;
  el.style.transition='transform 4s cubic-bezier(.12,.8,.2,1)';
  el.style.transform='rotate('+R+'deg)';
  let n=0; const ti=setInterval(()=>{sfx.tick(); if(++n>26) clearInterval(ti);},150);
  setTimeout(cb,4100);
}

// ---------- КЕЙСЫ ----------
function caseArt(c){
  const col=CASE_COLORS[c.rarity];
  return '<div class="case-art" style="--c0:'+col[0]+';--c1:'+col[1]+';--c2:'+col[2]+';--glow:'+RAR[c.rarity].glow+'">'+
    '<div class="bow"></div><div class="lid"></div><div class="body"></div>'+
    '<div class="rv"></div><div class="rh"></div><div class="em">'+c.em+'</div></div>';
}
function renderCases(){
  $('casesStat').textContent='Открыто: '+S.stats.opened;
  $('casesGrid').innerHTML=CASES.map(c=>
    '<div class="case-card" style="--glow:'+RAR[c.rarity].glow+'" onclick="openCaseModal(\''+c.id+'\')">'+
    '<div class="rt" style="background:'+RAR[c.rarity].color+';color:'+RAR[c.rarity].color+'"></div>'+
    caseArt(c)+
    '<div class="name">'+c.name+'</div>'+
    '<div class="price">⭐ '+fmt(c.price)+'</div></div>').join('');
}
function rollDrop(c){ let r=Math.random(),acc=0; for(const d of c.drops){acc+=d[1]; if(r<=acc) return gift(d[0]);} return gift(c.drops[0][0]); }
function resetRoulette(){
  const st=$('rouletteStrip');
  st.classList.remove('spinning'); st.style.transition='none'; st.style.transform='translateX(0)'; st.innerHTML='';
  $('rouletteBox').style.display='block';
  $('multiResults').classList.remove('active'); $('multiResults').innerHTML='';
}
function openCaseModal(id){
  sfx.click(); curCase=CASES.find(c=>c.id===id);
  $('cmTitle').textContent=curCase.name+' · ⭐'+curCase.price;
  $('p1').textContent=fmt(curCase.price); $('p3').textContent=fmt(curCase.price*3); $('p5').textContent=fmt(curCase.price*5);
  $('cmContents').innerHTML=curCase.drops.map(d=>{const g=gift(d[0]);return
    '<div class="c-item" style="border:1px solid '+RAR[g.rarity].color+'44">'+gImg(g)+'<div>'+g.name+'</div><div class="ch">'+(d[1]*100).toFixed(0)+'% · ⭐'+g.price+'</div></div>';}).join('');
  resetRoulette();
  $('caseModal').classList.add('active');
}
function closeCaseModal(){ if(!spinning) $('caseModal').classList.remove('active'); }
function spinOnce(g,dur){
  return new Promise(res=>{
    const st=$('rouletteStrip');
    st.classList.remove('spinning'); st.style.transition='none'; st.style.transform='translateX(0)'; st.innerHTML='';
    const winIdx=42;
    for(let i=0;i<50;i++){
      const it=(i===winIdx)?g:gift(pick(curCase.drops)[0]);
      const d=document.createElement('div');
      d.className='roulette-item'; d.style.background=RAR[it.rarity].color+'18';
      d.innerHTML=gImg(it)+'<span class="name">'+it.name+'</span>';
      st.appendChild(d);
    }
    const w=88, cw=$('rouletteBox').offsetWidth;
    const off=winIdx*w-cw/2+w/2+rnd(-26,26);
    let tk=0; const ti=setInterval(()=>{sfx.tick(); if(++tk>Math.floor(dur/140)) clearInterval(ti);},140);
    void st.offsetWidth;
    st.style.transition='transform '+dur+'ms cubic-bezier(.12,.8,.2,1)';
    requestAnimationFrame(()=>{ st.classList.add('spinning'); st.style.transform='translateX(-'+off+'px)'; });
    setTimeout(()=>{ clearInterval(ti); res(); }, dur+60);
  });
}
async function spin(n){
  if(spinning) return;
  const cost=curCase.price*n;
  if(S.balance<cost) return toast('Недостаточно Stars ⭐','bad');
  spinning=true; S.balance-=cost; S.stats.spent+=cost;
  save(); renderHeader();
  resetRoulette();
  $('multiResults').classList.add('active');
  const wins=[]; for(let i=0;i<n;i++) wins.push(rollDrop(curCase));
  const dur=(n===1)?4200:1500;
  for(let i=0;i<n;i++){
    const g=wins[i];
    await spinOnce(g,dur);
    S.inv.push({uid:uid(),gid:g.id});
    S.stats.opened++; S.stats.won+=g.price; S.xp+=Math.floor(curCase.price/5);
    if(g.price>S.stats.best) S.stats.best=g.price;
    $('multiResults').insertAdjacentHTML('beforeend', itemCard(g,true));
    if(g.rarity==='epic'||g.rarity==='legendary'){ sfx.legend(); confetti(150); toast('💎 ЭПИКА: '+g.name+'!','good'); }
    else sfx.win();
    qEvent('open',1); save(); renderHeader();
  }
  spinning=false;
  checkAch(); save();
}

// ---------- ИНВЕНТАРЬ (продажа по РЕАЛЬНОЙ цене) ----------
function itemCard(g,noActs){
  return '<div class="inv-item">'+
    '<div class="rt" style="background:'+RAR[g.rarity].color+'"></div>'+
    gImg(g)+'<div class="name">'+g.name+'</div><div class="price">⭐ '+fmt(g.price)+'</div>'+
    (noActs?'':'<div class="acts"><button class="mini-btn sell" onclick="sellItem(\''+g.uid+'\')">Продать ⭐'+g.price+'</button>'+
    '<button class="mini-btn up" onclick="toUpgrade(\''+g.uid+'\')">⚡</button></div>')+
    '</div>';
}
function renderInventory(){
  const items=validInv();
  const val=items.reduce((a,i)=>a+gift(i.gid).price,0);
  $('invValue').textContent='Предметов: '+items.length+' · Стоимость: ⭐'+fmt(val)+' · Продажа по реальной цене TG';
  $('inventoryGrid').innerHTML=items.length?items.map(i=>itemCard(Object.assign({},gift(i.gid),{uid:i.uid}))).join(''):'<div class="muted">Пусто. Открой кейс или купи в маркете! 📦</div>';
}
function sellItem(u){
  const idx=S.inv.findIndex(i=>i.uid===u); if(idx<0) return;
  const g=gift(S.inv[idx].gid); if(!g) return;
  const price=Math.floor(g.price*ECO.SELL_BACK);
  S.inv.splice(idx,1); S.balance+=price; S.stats.sells++;
  qEvent('sell'); sfx.win(); toast('Продано: '+g.name+' +⭐'+fmt(price),'good');
  save(); renderHeader(); renderInventory(); renderUpgrade(); checkAch();
}
function sellAll(){
  const items=validInv();
  if(!items.length) return;
  let t=0; items.forEach(i=>t+=Math.floor(gift(i.gid).price*ECO.SELL_BACK));
  if(!confirm('Продать всё за ⭐'+fmt(t)+'?')) return;
  S.stats.sells+=items.length; S.inv=[]; S.balance+=t;
  qEvent('sell'); sfx.win(); toast('Продано всё: +⭐'+fmt(t),'good');
  save(); renderHeader(); renderInventory(); renderUpgrade();
}
function toUpgrade(u){
  upFrom=S.inv.find(i=>i.uid===u)||null; upTo=null;
  activateTab('upgrade');
}

// ---------- АПГРЕЙД: ленты вместо модального пикера ----------
function upChanceVal(){ return (upFrom&&upTo)?Math.min(85,Math.max(3,Math.floor(gift(upFrom.gid).price/upTo.price*100))):0; }
function selFrom(u){ upFrom=S.inv.find(i=>i.uid===u)||null; upTo=null; sfx.click(); renderUpgrade(); }
function selTo(id){ upTo=gift(id)||null; sfx.click(); renderUpgrade(); }
function renderUpgrade(){
  const items=validInv();
  if(upFrom && !items.some(i=>i.uid===upFrom.uid)) upFrom=null;
  if(upTo && upFrom && upTo.price<=gift(upFrom.gid).price) upTo=null;
  // лента своих
  $('upMine').innerHTML = items.length ? items.map(i=>{const g=gift(i.gid);
    return '<button class="chip '+(upFrom&&upFrom.uid===i.uid?'sel':'')+'" onclick="selFrom(\''+i.uid+'\')">'+gImg(g)+'<div class="name">'+g.name+'</div><div class="price">⭐'+g.price+'</div></button>';}).join('')
    : '<button class="chip empty" onclick="gotoCases()">Инвентарь пуст — открыть кейс 🎁</button>';
  // лента целей
  const min=upFrom?gift(upFrom.gid).price:0;
  const targets=GIFTS.filter(g=>g.price>min).sort((a,b)=>a.price-b.price);
  $('upTarget').innerHTML = targets.length ? targets.map(g=>
    '<button class="chip '+(upTo&&upTo.id===g.id?'sel':'')+'" onclick="selTo(\''+g.id+'\')">'+gImg(g)+'<div class="name">'+g.name+'</div><div class="price">⭐'+g.price+'</div></button>').join('')
    : '<div class="chip empty">Нет целей дороже</div>';
  const ch=upChanceVal();
  $('upChance').textContent=ch+'%';
  setWheel($('upWheel'),[{pct:ch||2,color:'#22c55e'},{pct:100-(ch||2),color:'#2a2a4a'}]);
  $('upWheel').style.transition='none'; $('upWheel').style.transform='rotate(0deg)';
  $('upBtn').disabled=!(upFrom&&upTo)||upBusy;
}
$('upBtn').onclick=doUpgrade;
function doUpgrade(){
  if(!upFrom||!upTo||upBusy) return;
  upBusy=true; $('upBtn').disabled=true;
  const ch=upChanceVal(), win=Math.random()*100<ch;
  spinWheel($('upWheel'),[{pct:ch,color:'#22c55e'},{pct:100-ch,color:'#2a2a4a'}],win?0:1,()=>{
    S.stats.upgrades++;
    const idx=S.inv.findIndex(i=>i.uid===upFrom.uid);
    if(win){ S.inv[idx]={uid:uid(),gid:upTo.id}; S.stats.upWins++; S.stats.won+=upTo.price;
      sfx.win(); toast('⚡ Апгрейд успешен: '+upTo.name+'!','good');
      if(upTo.rarity==='legendary'){confetti(150);sfx.legend();}
      qEvent('upgrade_win');
    } else { if(idx>=0) S.inv.splice(idx,1); sfx.lose(); toast('💥 Не повезло...','bad'); }
    upFrom=null; upTo=null; upBusy=false;
    save(); renderHeader(); renderUpgrade(); renderInventory(); checkAch();
  });
}

// ---------- МАРКЕТ ----------
function dailyDiscount(){ return GIFTS[new Date().getDate()%GIFTS.length].id; }
function renderMarket(){
  const disc=dailyDiscount();
  const note=$('marketNote');
  if(note) note.innerHTML='Покупка и продажа — по <b>реальной цене TG</b> · Скидка дня на покупку −20%: <b style="color:var(--ok)">'+gift(disc).name+'</b>';
  $('marketGrid').innerHTML=GIFTS.map(g=>{
    const p=disc===g.id?Math.floor(g.price*ECO.DISCOUNT):g.price;
    const owned=validInv().filter(i=>i.gid===g.id).length;
    return '<div class="inv-item mkt">'+
      '<div class="rt" style="background:'+RAR[g.rarity].color+'"></div>'+
      (owned?'<div class="owned">×'+owned+'</div>':'')+
      gImg(g)+'<div class="name">'+g.name+'</div>'+
      '<div class="price">'+(disc===g.id?'<s>⭐'+g.price+'</s> ':'')+'⭐'+p+'</div>'+
      '<div class="acts"><button class="mini-btn sell" onclick="buyGift(\''+g.id+'\','+p+')">Купить</button></div>'+
      '</div>';}).join('');
}
function buyGift(id,p){
  if(S.balance<p) return toast('Недостаточно Stars','bad');
  S.balance-=p; S.stats.spent+=p; S.inv.push({uid:uid(),gid:id}); S.stats.buys++;
  qEvent('buy'); sfx.win(); toast('Куплено: '+gift(id).name+' за ⭐'+p,'good');
  save(); renderHeader(); renderMarket(); renderInventory(); renderUpgrade(); checkAch();
}

// ---------- БАТТЛЫ ----------
function genBattles(){ S.battles=[]; [25,50,100,250].forEach(b=>S.battles.push({id:uid(),host:pick(BOTS),bet:b})); }
function renderBattles(){
  if(!S.battles.length) genBattles();
  $('battlesList').innerHTML=S.battles.map(b=>
    '<div class="battle-row"><div class="info"><b>@'+b.host+'</b><span class="muted">1 на 1 · колесо 50/50</span></div>'+
    '<div class="bet">⭐'+fmt(b.bet)+'</div>'+
    '<button class="btn btn-primary" onclick="joinBattle(\''+b.id+'\')">Войти</button></div>').join('');
}
function createBattle(){
  const bet=parseInt(prompt('Твоя ставка (Stars):','50')); if(!bet||bet<10) return;
  if(S.balance<bet) return toast('Недостаточно Stars','bad');
  S.balance-=bet; save(); renderHeader(); runBattle(pick(BOTS),bet);
}
function joinBattle(id){
  const b=S.battles.find(x=>x.id===id); if(!b) return;
  if(S.balance<b.bet) return toast('Недостаточно Stars','bad');
  S.balance-=b.bet; S.battles=S.battles.filter(x=>x.id!==id);
  save(); renderHeader(); runBattle(b.host,b.bet);
}
function runBattle(host,bet){
  $('battlePot').textContent=fmt(bet*2);
  $('battlePlayers').innerHTML=
    '<div class="b-player" id="bp1"><span class="emoji">😎</span><b>'+(S.tgName||'Ты')+'</b></div>'+
    '<div class="b-player" id="bp2"><span class="emoji">🤖</span><b>@'+host+'</b></div>';
  $('battleLog').textContent='Крутим колесо...';
  $('battleModal').classList.add('active');
  setWheel($('bWheel'),[{pct:50,color:'#a855f7'},{pct:50,color:'#ec4899'}]);
  const youWin=Math.random()<0.5;
  spinWheel($('bWheel'),[{pct:50,color:'#a855f7'},{pct:50,color:'#ec4899'}],youWin?0:1,()=>{
    $('bp'+(youWin?1:2)).classList.add('win');
    S.stats.battles++;
    if(youWin){ S.balance+=bet*2; S.stats.bWins++; S.stats.won+=bet*2;
      $('battleLog').textContent='🎉 ПОБЕДА! +⭐'+fmt(bet*2); sfx.win(); confetti(100); qEvent('battle_win'); }
    else { $('battleLog').textContent='💥 Поражение...'; sfx.lose(); }
    save(); renderHeader(); checkAch();
  });
}
function closeBattle(){ $('battleModal').classList.remove('active'); renderBattles(); }

// ---------- КВЕСТЫ / АЧИВКИ ----------
function qEvent(t,n){ S.qp[t]=(S.qp[t]||0)+(n||1); save(); renderHeader(); }
function renderQuests(){
  $('questsList').innerHTML=QUESTS.map(q=>{
    const p=Math.min(S.qp[q.type]||0,q.target), done=p>=q.target, cl=S.qc.includes(q.id);
    return '<div class="quests-row"><div class="q-head"><span>'+q.name+'</span><span class="muted">'+p+'/'+q.target+'</span></div>'+
      '<div class="q-bar"><div class="q-fill" style="width:'+(p/q.target*100)+'%"></div></div>'+
      '<button class="q-claim" '+(done&&!cl?'':'disabled')+' onclick="claimQuest(\''+q.id+'\')">'+(cl?'✅ Получено':'Забрать ⭐'+q.reward)+'</button></div>';}).join('');
  $('achList').innerHTML=ACHS.map(a=>{const d=a.cond(S);return
    '<div class="ach '+(d?'done':'locked')+'"><span class="emoji">'+a.emoji+'</span><div><b>'+a.name+'</b><div class="muted small">'+(d?'Выполнено ✅':'Не выполнено')+'</div></div></div>';}).join('');
}
function claimQuest(id){
  const q=QUESTS.find(x=>x.id===id);
  if(S.qc.includes(id)||(S.qp[q.type]||0)<q.target) return;
  S.qc.push(id); S.balance+=q.reward; sfx.win(); toast('📜 Квест: +⭐'+q.reward,'good');
  save(); renderHeader(); renderQuests();
}
function checkAch(){ ACHS.forEach(a=>{ if(!S.ac.includes(a.id)&&a.cond(S)){ S.ac.push(a.id); toast('🏅 Достижение: '+a.name+'!','good'); confetti(60);} }); save(); }

// ---------- ТОП / ПРОФИЛЬ ----------
function renderTop(){
  const rows=BOTS.map(b=>({name:b,won:Math.floor(rnd(500,9000))}));
  rows.push({name:(S.tgName||'ТЫ'),won:S.stats.won,me:true}); rows.sort((a,b)=>b.won-a.won);
  $('topList').innerHTML=rows.map((r,i)=>
    '<div class="top-row '+(r.me?'me':'')+'"><div class="pos">'+(i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1)+'</div>'+
    '<b>'+(r.me?'😎 ':'@')+r.name+'</b><div class="won">⭐'+fmt(r.won)+'</div></div>').join('');
}
function renderProfile(){
  const st=S.stats; const li=levelInfo();
  $('statsGrid').innerHTML=[['Уровень',li.lvl+' ур.'],['Открыто кейсов',st.opened],['Потрачено','⭐'+fmt(st.spent)],['Выиграно','⭐'+fmt(st.won)],
    ['Лучший дроп','⭐'+fmt(st.best)],['Апгрейдов',st.upWins+'/'+st.upgrades],['Баттлов',st.bWins+'/'+st.battles],
    ['Продаж',st.sells],['Покупок',st.buys],['Сборка','build '+BUILD]].map(x=>'<div class="stat-card"><b>'+x[1]+'</b><span>'+x[0]+'</span></div>').join('');
  $('refLink').value='https://t.me/CashBanniBot?start=ref_'+S.seed.slice(0,8);
  $('refStat').textContent='Приглашено: '+S.refs+' · Заработано: ⭐'+(S.refs*25);
  $('soundToggle').checked=S.sound; $('fairToggle').checked=S.fair;
  $('fairInfo').innerHTML=S.fair?'Seed: '+S.seed+'<br>Hash: '+hash(S.seed):'';
}
function hash(s){ let h=5381; for(let i=0;i<s.length;i++) h=((h<<5)+h+s.charCodeAt(i))>>>0; return h.toString(16); }
function applyPromo(){
  const c=$('promoInput').value.trim().toUpperCase();
  if(!PROMOS[c]) return toast('Неверный код','bad');
  if(S.promo.includes(c)) return toast('Уже использован','bad');
  S.promo.push(c); S.balance+=PROMOS[c]; sfx.win(); toast('🎟 Промокод: +⭐'+PROMOS[c],'good');
  $('promoInput').value=''; save(); renderHeader();
}
function copyRef(){ navigator.clipboard.writeText($('refLink').value); S.refs++; S.balance+=25;
  toast('🤝 Ссылка скопирована! +⭐25','good'); save(); renderHeader(); renderProfile(); }
function toggleSound(){ S.sound=$('soundToggle').checked; save(); }
function toggleFair(){ S.fair=$('fairToggle').checked; save(); renderProfile(); }
function resetAll(){ if(confirm('Сбросить весь прогресс?')){ localStorage.removeItem('cashbanni_v2'); location.reload(); } }

// ---------- ДЕЙЛИК ----------
function claimDaily(){
  const today=new Date().toDateString();
  if(S.daily.last===today) return toast('Уже забрал сегодня!','bad');
  const y=new Date(Date.now()-864e5).toDateString();
  S.daily.streak=S.daily.last===y?S.daily.streak+1:1; S.daily.last=today;
  const r=Math.min(ECO.DAILY_CAP, ECO.DAILY_BASE+S.daily.streak*ECO.DAILY_STEP);
  S.balance+=r; sfx.win(); confetti(60);
  toast('🎁 Дейлик: +⭐'+r+' (серия '+S.daily.streak+' дн.)','good'); save(); renderHeader();
}
function addStars(){ S.balance+=100; sfx.click(); toast('⭐ +100 (демо)'); save(); renderHeader(); }

// ---------- ФОН ----------
(function(){ const cols=['#a855f7','#ec4899','#3b82f6','#f59e0b'];
  for(let i=0;i<6;i++){ const d=document.createElement('div'); d.className='bubble';
    const s=rnd(200,420); d.style.width=d.style.height=s+'px';
    d.style.left=rnd(0,100)+'%'; d.style.top=rnd(0,100)+'%';
    d.style.background=pick(cols); d.style.animationDelay=rnd(0,8)+'s';
    $('bubbles').appendChild(d); } })();

// ---------- СТАРТ ----------
if(S.inv.length!==validInv().length){ S.inv=validInv(); save(); }
renderHeader(); renderCases(); renderFeed();
if(!S.battles.length) genBattles();
save(); buildGiftImages();
setTimeout(()=>toast('Cash Banni · build '+BUILD),400);

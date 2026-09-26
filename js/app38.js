const BUILD = 67;

// ===== v68: aggressive cache-bust reload =====
(function(){
  var stored=localStorage.getItem('cashbanni_build');
  if(stored && stored!==String(BUILD)){
    localStorage.setItem('cashbanni_build', String(BUILD));
    location.replace(location.pathname+'?v='+BUILD+'&t='+Date.now());
    return;
  }
  if(!stored) localStorage.setItem('cashbanni_build', String(BUILD));
})();

const $ = id => document.getElementById(id);
const setT = (id,v) => { const e=$(id); if(e) e.textContent=v; };
const setH = (id,v) => { const e=$(id); if(e) e.innerHTML=v; };
const fmt = n => (Number(n)||0).toLocaleString('ru-RU');
const rnd = (a,b) => a + Math.random()*(b-a);
const pick = a => a[Math.floor(Math.random()*a.length)];
const gift = id => GIFTS.find(g=>g.id===id);
const uid = () => Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const SUB_REWARD = 10;
const PAY_PRESETS = [1,5,10,25,50,100,250,500];
const STRIP_W = 132;

const DEF = () => ({
  balance:ECO.START_BALANCE, xp:0, inv:[],
  stats:{opened:0,spent:0,won:0,best:0,upgrades:0,upWins:0,battles:0,bWins:0,sells:0,buys:0,crashWins:0,mines:0,minesW:0,plinko:0,plinkoW:0},
  qp:{}, qc:[], ac:[], promo:[], refs:0, freeLast:0, subDone:false, tgId:null, migrated:false, createdAt:null,
  sound:true, fair:false, seed:uid()+uid(), serverMode:false, isAdmin:false
});
let S = load();
function load(){
  try{
    const s=JSON.parse(localStorage.getItem('cashbanni_v2'));
    if(!s) return DEF();
    const def=DEF(); const out=Object.assign(def,s);
    out.stats=Object.assign(def.stats,s.stats||{});
    if(out.sound===undefined||out.sound===null) out.sound=true;
    out.inv=(Array.isArray(s.inv)?s.inv:[]).filter(i=>i&&i.gid&&GIFTS.some(g=>g.id===i.gid));
    out.inv.forEach(i=>{ if(!i.uid) i.uid=uid(); });
    return out;
  }catch(e){ return DEF(); }
}
function saveLocal(){ localStorage.setItem('cashbanni_v2', JSON.stringify(S)); }
let saveTimer=null;
function apiSave(){ if(!S.serverMode)return; clearTimeout(saveTimer);
  saveTimer=setTimeout(()=>{ api("/api/save",{method:"POST",body:JSON.stringify({balance:S.balance,inv:S.inv,stats:S.stats,xp:S.xp})}); },300); }
function save(){ saveLocal(); if(S.serverMode){ clearTimeout(saveTimer); api("/api/save",{method:"POST",body:JSON.stringify({balance:S.balance,inv:S.inv,stats:S.stats,xp:S.xp})}); } }

const TG = (window.Telegram && window.Telegram.WebApp) || null;
let FS_MODE = false;
function applySafe(){
  let top = 0;
  try{ if(TG&&TG.safeAreaInset&&TG.safeAreaInset.top) top = TG.safeAreaInset.top||0; }catch(e){}
  if (TG && TG.initData) top = Math.max(top, 52) + 16;
  if (FS_MODE) top = Math.max(top, 60) + 12;
  document.documentElement.style.setProperty('--sat', top+'px');
  let bot = 0;
  try{ if(TG&&TG.safeAreaInset&&TG.safeAreaInset.bottom) bot = TG.safeAreaInset.bottom||0; }catch(e){}
  document.documentElement.style.setProperty('--sab', bot+'px');
}
if (TG) { try {
  TG.ready(); TG.expand(); setTimeout(()=>{try{TG.expand()}catch(e){}},300);
  if (TG.initData) document.body.classList.add('tg');
  if (TG.requestFullscreen) { try{ const p=TG.requestFullscreen(); if(p&&p.then)p.then(()=>{FS_MODE=true;applySafe();}).catch(()=>{}); }catch(e){} }
  if (TG.setHeaderColor) TG.setHeaderColor('#06061a');
  if (TG.setBackgroundColor) TG.setBackgroundColor('#06061a');
  if (TG.onEvent){ TG.onEvent('safeAreaChanged',applySafe); TG.onEvent('viewportChanged',applySafe); }
  const u = TG.initDataUnsafe && TG.initDataUnsafe.user; if (u) S.tgName = u.first_name || null;
} catch (e) {} }
applySafe();

(function(){ try{
  const m = document.querySelector('meta[name="build"]');
  const pb = m ? m.content : '0';
  if (pb !== String(BUILD)) { const key='cb_reload_'+BUILD;
    if (!localStorage.getItem(key)) { localStorage.setItem(key,'1'); location.replace(location.pathname+'?cb='+BUILD+'&'+Date.now()); } }
}catch(e){} })();

function haptic(k){ try{ if(!TG||!TG.HapticFeedback)return;
  if(k==='success')TG.HapticFeedback.notificationOccurred('success');
  else if(k==='error')TG.HapticFeedback.notificationOccurred('error');
  else TG.HapticFeedback.impactOccurred('light'); }catch(e){} }

const API_BASE = "https://cashbanni-api-proxy2.vercel.app";
async function api(path, opts = {}) {
  try {
    const init = (TG && TG.initData) ? TG.initData : "";
    const res = await fetch(API_BASE + path, { ...opts, headers: { "Content-Type":"application/json", "X-Telegram-Init-Data": init } });
    if (!res.ok) return { error: "http " + res.status };
    return await res.json();
  } catch (e) { return { error: e.message }; }
}
async function apiR(path, opts, tries) {
  tries = tries===undefined ? 2 : tries;
  let r = await api(path, opts);
  if (r && r.error && tries > 0) { await new Promise(res=>setTimeout(res,1200)); r = await apiR(path, opts, tries-1); }
  return r;
}
async function refreshMe(){ const me=await apiR('/api/me');
  if(me&&me.tg_id){ S.balance=Number(me.balance)||0; S.inv=Array.isArray(me.inv)?me.inv:[];
    S.stats=Object.assign(DEF().stats, me.stats||{}); S.xp=Number(me.xp)||0;
    S.refs=me.ref_count||0; S.isAdmin=!!me.admin; S.createdAt=me.created_at||S.createdAt;
    S.serverMode=true; if(!S.tgName&&me.first_name)S.tgName=me.first_name; saveLocal(); renderHeader();
    try{ renderSection(activeTab()); }catch(e){} } }
async function apiPay(stars){
  const r=await api("/api/pay",{method:"POST",body:JSON.stringify({stars})});
  if(r.url && TG && TG.openInvoice){ modalClose('payModal');
    TG.openInvoice(r.url, st=>{ if(st==='paid'){ toast('✅ Оплата прошла! Stars зачислены','good'); sfx.win(); confetti(80); setTimeout(refreshMe,1200); } else toast('Оплата отменена','bad'); });
  } else if(r.url){ modalClose('payModal'); window.open(r.url); } else toast("Не удалось создать счёт","bad"); }
function validInv(){ return S.inv.filter(i=>i&&i.gid&&gift(i.gid)); }
function refreshInv(){ try{
  if($('sec-profile')&&$('sec-profile').classList.contains('active'))renderInventory();
  if($('sec-upgrade')&&$('sec-upgrade').classList.contains('active'))renderUpgrade(); }catch(e){} }

let upFrom=null, upTo=null, curCase=null, spinning=false, upBusy=false;
const IMG = {};
function modalOpen(id){ const e=$(id); if(e){e.classList.add('active'); document.body.classList.add('modal-open');} }
function modalClose(id){ const e=$(id); if(e)e.classList.remove('active');
  if(!document.querySelector('.modal-overlay.active')) document.body.classList.remove('modal-open'); }

let AC;
function beep(f,d,t,v){ d=d||0.08;t=t||'square';v=v||0.12; if(!S.sound)return;
  try{ AC=AC||new (window.AudioContext||window.webkitAudioContext)(); if(AC.state==='suspended') AC.resume();
    const o=AC.createOscillator(),g=AC.createGain(); o.type=t;o.frequency.value=f;g.gain.value=v;
    o.connect(g);g.connect(AC.destination);o.start(); g.gain.exponentialRampToValueAtTime(0.001,AC.currentTime+d); o.stop(AC.currentTime+d); }catch(e){} }
document.addEventListener('pointerdown',()=>{ if(S.sound){ try{ AC=AC||new (window.AudioContext||window.webkitAudioContext)(); if(AC.state==='suspended')AC.resume(); }catch(e){} } },{passive:true});
const sfx={ click:()=>{beep(600,.05,'triangle',.07);haptic('light');},
  tick:()=>beep(800+Math.random()*400,.03,'square',.04),
  win:()=>{beep(523,.1);setTimeout(()=>beep(659,.1),100);setTimeout(()=>beep(784,.2),200);haptic('success');},
  lose:()=>{beep(180,.35,'sawtooth',.1);haptic('error');},
  crash:()=>{beep(320,.5,'sawtooth',.14);setTimeout(()=>beep(240,.5,'sawtooth',.14),120);setTimeout(()=>beep(160,.7,'sawtooth',.16),260);setTimeout(()=>beep(90,.9,'square',.18),420);haptic('error');},
  legend:()=>{[523,659,784,1046,1318,1568].forEach((f,i)=>setTimeout(()=>beep(f,.16,'triangle',.2),i*90));haptic('success');} };

const cv=$('confetti'), cx=cv?cv.getContext('2d'):null; let parts=[];
function sizeCv(){ if(!cv)return; cv.width=innerWidth; cv.height=innerHeight; }
sizeCv(); addEventListener('resize',sizeCv);
function confetti(n){ return; n=n||140; const cols=['#a855f7','#ec4899','#fbbf24','#22c55e','#60a5fa'];
  for(let i=0;i<n;i++) parts.push({x:innerWidth/2,y:innerHeight/3,vx:rnd(-7,7),vy:rnd(-11,-3),s:rnd(4,9),c:pick(cols),r:rnd(0,6),vr:rnd(-.2,.2)}); }
(function loop(){ if(cx){ cx.clearRect(0,0,cv.width,cv.height);
  parts=parts.filter(p=>p.y<cv.height+20);
  parts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.25;p.r+=p.vr;
    cx.save();cx.translate(p.x,p.y);cx.rotate(p.r);cx.fillStyle=p.c;cx.fillRect(-p.s/2,-p.s/2,p.s,p.s);cx.restore();}); }
  requestAnimationFrame(loop); })();

function toast(msg,type){ const d=document.createElement('div'); d.className='toast '+(type||''); d.innerHTML=msg;
  $('toasts').appendChild(d); setTimeout(()=>d.classList.add('out'),2600); setTimeout(()=>d.remove(),3100); }
function gImg(g,cls){ cls=cls||'gimg';
  return IMG[g.id] ? '<img class="'+cls+'" src="'+IMG[g.id]+'" alt="'+g.name+'">' : '<span class="emoji">'+g.emoji+'</span>'; }
function levelInfo(){ let lvl=1,need=500; while(S.xp>=need){lvl++;need+=lvl*500;} const prev=need-lvl*500; return {lvl,prog:(S.xp-prev)/(need-prev)}; }
function renderHeader(){ setT('balanceValue',fmt(S.balance));
  const e=$('lvlFill'); if(e) e.style.width=(levelInfo().prog*100)+'%'; }

function activeTab(){ const a=document.querySelector('.section.active'); return a?a.id.replace('sec-',''):''; }
function activateTab(t){ sfx.click();
  document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===t));
  document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
  const sec=$('sec-'+t); if(sec) sec.classList.add('active');
  try{ renderSection(t); }catch(e){ console.error('render',t,e); try{ toast('ERR '+t+': '+e.message+' | '+String(e.stack).split(String.fromCharCode(10))[1],'bad'); }catch(_){} }
  scrollTo({top:0,behavior:'smooth'}); }
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>activateTab(b.dataset.tab));
function renderSection(t){
  if(t==='home') renderCases();
  else if(t==='profile'){ renderProfile(); renderInventory(); renderTop(); renderRank();
    if(S.serverMode) apiR('/api/me').then(me=>{ if(me&&me.tg_id){
      S.balance=Number(me.balance)||0; S.inv=Array.isArray(me.inv)?me.inv:[];
      S.stats=Object.assign(DEF().stats, me.stats||{}); S.xp=Number(me.xp)||0;
      S.refs=me.ref_count||0; S.isAdmin=!!me.admin; S.createdAt=me.created_at||S.createdAt;
      saveLocal(); renderHeader(); renderProfile(); renderInventory(); renderTop(); renderRank(); } }); }
  else if(t==='tasks') renderTasks();
  else if(t==='market') renderMarket();
  else if(t==='upgrade') renderUpgrade();
  else if(t==='battles') renderBattles();
  else if(t==='mines') renderMines(); }
function renderAll(){ try{ renderHeader(); const t=activeTab(); if(t) renderSection(t); }catch(e){} }
document.addEventListener('visibilitychange',()=>{ if(!document.hidden){ applySafe(); renderHeader();
  try{ const t=activeTab(); if(t) renderSection(t); }catch(e){} } });

function setWheel(el,segs){ if(!el)return; let acc=0;
  const stops=segs.map(s=>{const f=acc;acc+=s.pct;return s.color+' '+f+'% '+acc+'%';});
  el.style.background='conic-gradient('+stops.join(',')+')'; }
function spinWheel(el,segs,winIndex,cb){ if(!el)return cb&&cb(); let start=0;
  const zones=segs.map(s=>{const z=[start,start+s.pct];start+=s.pct;return z;});
  const a=zones[winIndex][0],b=zones[winIndex][1];
  const t=(a+(b-a)*rnd(0.15,0.85))*3.6, R=5*360+(360-t);
  el.style.transition='none'; el.style.transform='rotate(0deg)'; void el.offsetWidth;
  el.style.transition='transform 6.5s cubic-bezier(.1,.85,.15,1)'; el.style.transform='rotate('+R+'deg)';
  let n=0; const ti=setInterval(()=>{sfx.tick(); if(++n>44)clearInterval(ti);},150);
  setTimeout(cb,6700); }
async function checkSub(){ const r=await api('/api/check_sub'); return !!(r&&r.sub); }
function openChannel(){ try{ TG&&TG.openTelegramLink?TG.openTelegramLink(CHANNEL):window.open(CHANNEL); }catch(e){ window.open(CHANNEL); } }

function caseArt(c){ const col=CASE_COLORS[c.rarity]||CASE_COLORS.common;
  return '<div class="case-art" style="--c0:'+col[0]+';--c1:'+col[1]+';--c2:'+col[2]+';--glow:'+RAR[c.rarity].glow+'">'+
    '<div class="bow"></div><div class="lid"></div><div class="body"></div><div class="rv"></div><div class="rh"></div><div class="em">'+c.em+'</div></div>'; }
function freeReady(){ return Date.now()-(S.freeLast||0)>=FREE_CASE_COOLDOWN; }
function renderCases(){ setT('casesStat','Открыто: '+S.stats.opened);
  setH('casesGrid',CASES.map(c=>
    '<div class="case-card" style="--glow:'+RAR[c.rarity].glow+'" onclick="openCaseModal(\''+c.id+'\')">'+
    (c.free?'<div class="free-badge">'+(freeReady()?'ДОСТУПНО':'1/24Ч')+'</div>':'')+
    '<div class="rt" style="background:'+RAR[c.rarity].color+';color:'+RAR[c.rarity].color+'"></div>'+
    caseArt(c)+'<div class="name">'+c.name+'</div>'+
    '<div class="price">'+(c.id==='secret'?'🔐 ПО ПРОМОКОДУ':(c.price===0?'БЕСПЛАТНО':'⭐ '+fmt(c.price)))+'</div></div>').join('')); }
function buildStrip(strip,g){ strip.innerHTML=''; const winIdx=42;
  for(let i=0;i<50;i++){ const it=(i===winIdx)?g:gift(pick(curCase.drops)[0]);
    const d=document.createElement('div'); d.className='roulette-item'; d.style.background=RAR[it.rarity].color+'18';
    d.innerHTML=gImg(it)+'<span class="name">'+it.name+'</span>'; strip.appendChild(d); } }
function openCaseModal(id){ sfx.click(); curCase=CASES.find(c=>c.id===id);
  if(!curCase) return;
  if(curCase.free&&!freeReady()){ const h=Math.ceil((FREE_CASE_COOLDOWN-(Date.now()-S.freeLast))/36e5);
    return toast('⏳ Бесплатный кейс раз в 24 часа. Ещё '+h+' ч.','bad'); }
  setT('cmTitle',curCase.name);
  setT('p1',fmt(curCase.price)); setT('p3',fmt(curCase.price*3)); setT('p5',fmt(curCase.price*5));
  const b3=$('btnX3'),b5=$('btnX5');
  if(b3)b3.style.display=curCase.free?'none':''; if(b5)b5.style.display=curCase.free?'none':'';
  const m=document.querySelector('#caseModal .modal'); if(m) m.classList.remove('compact');
  setH('cmContents','<div class="cf-hero">'+caseArt(curCase)+
    '<div class="cf-hero-info"><b>'+curCase.name+'</b>'+
    '<div class="price">'+(curCase.price===0?'БЕСПЛАТНО':'⭐ '+fmt(curCase.price))+'</div>'+
    '<span class="muted">Состав и шансы выпада:</span></div></div>'+
    '<div class="contents">'+curCase.drops.map(d=>{const g=gift(d[0]);return
      '<div class="c-item" style="border:1px solid '+RAR[g.rarity].color+'55">'+
      '<div class="ch">'+(d[1]*100).toFixed(0)+'%</div>'+gImg(g)+
      '<div class="cname">'+g.name+'</div><div class="cprice">⭐'+g.price+'</div></div>';}).join('')+'</div>');
  const box=$('cfStrips'); box.innerHTML='';
  const prev=document.createElement('div'); prev.className='roulette-container preview';
  prev.innerHTML='<div class="preview-label">ПРЕВЬЮ</div><div class="roulette-pointer"></div><div class="roulette-strip"></div>';
  box.appendChild(prev); buildStrip(prev.querySelector('.roulette-strip'), gift(pick(curCase.drops)[0]));
  modalOpen('caseModal'); }
function closeCaseModal(){ if(spinning) return;
  const m=document.querySelector('#caseModal .modal'); if(m) m.classList.remove('compact');
  modalClose('caseModal'); }
function animateStrip(strip,dur){ return new Promise(res=>{
  const cw=strip.parentElement.offsetWidth;
  const tw=(strip.children[0]&&strip.children[0].offsetWidth)||STRIP_W; const off=42*tw-cw/2+tw/2+rnd(-30,30);
  strip.classList.remove('spinning'); strip.style.transition='none'; strip.style.transform='translateX(0)';
  void strip.offsetWidth;
  let tk=0; const ti=setInterval(()=>{sfx.tick(); if(++tk>Math.floor(dur/140))clearInterval(ti);},140);
  strip.style.transition='transform '+dur+'ms cubic-bezier(.12,.8,.2,1)';
  requestAnimationFrame(()=>{ strip.classList.add('spinning'); strip.style.transform='translateX(-'+off+'px)'; });
  setTimeout(()=>{ clearInterval(ti); res(); },dur+60); }); }
function sellWon(u){ const idx=S.inv.findIndex(i=>i.uid===u); if(idx<0)return;
  const g=gift(S.inv[idx].gid); if(!g)return;
  S.inv.splice(idx,1); S.balance+=g.price; S.stats.sells++;
  qEvent('sell'); sfx.win(); toast('Продано: '+g.name+' +⭐'+fmt(g.price),'good');
  save(); renderHeader(); refreshInv(); checkAch(); }
function keepWon(u){ sfx.click(); refreshInv(); }
async function spin(n){ if(spinning) return; spinning=true;
  toast('⏳ Обновление…',''); spinning=false; }

const MINES_RTP = 0.94;
const mines={active:false,bet:20,m:3,field:[],rev:[],picks:0,mult:1};
function minesFair(picks,m){ let f=1; for(let i=0;i<picks;i++) f*=(25-i)/(25-m-i); return f*MINES_RTP; }
function minesMinPicks(){ return mines.m===3?2:(mines.m===5?3:4); }
function minesBet(d){ if(mines.active)return; mines.bet=Math.max(5,mines.bet+d); syncMines(); sfx.click(); }
function minesSet(v){ if(mines.active)return; mines.bet=v; syncMines(); sfx.click(); }
function minesSetM(m){ if(mines.active)return; mines.m=m;
  document.querySelectorAll('#minesCount .mc').forEach(b=>b.classList.toggle('sel',+b.dataset.m===m));
  syncMines(); sfx.click(); }
function syncMines(){ setT('minesBetVal',mines.bet);
  const btn=$('minesBtn'); if(!btn)return;
  if(!mines.active){ btn.textContent='СТАРТ ⭐'+mines.bet; btn.className='btn crash-main-btn bet'; }
  else { const need=minesMinPicks();
    if(mines.picks<need){ btn.textContent='ОТКРОЙ ЕЩЁ '+(need-mines.picks); btn.className='btn crash-main-btn wait'; }
    else { const win=Math.floor(mines.bet*mines.mult); btn.textContent='ЗАБРАТЬ ⭐'+win; btn.className='btn crash-main-btn cash'; } }
  setT('minesMult','x'+mines.mult.toFixed(2));
  setT('minesProfit','Профит: ⭐'+(mines.active?Math.floor(mines.bet*mines.mult)-mines.bet:0)); }
function renderMines(){ const g=$('minesGrid'); if(!g)return;
  if(!g.children.length){ for(let i=0;i<25;i++){ const b=document.createElement('button');
      b.className='mine-tile'; b.dataset.i=i; b.onclick=()=>minePick(i); g.appendChild(b); } }
  document.querySelectorAll('#minesCount .mc').forEach(b=>{ b.onclick=()=>minesSetM(+b.dataset.m);
    b.classList.toggle('sel',+b.dataset.m===mines.m); });
  syncMines(); }
function minesAction(){ if(!mines.active) minesStart(); else { if(mines.picks>=minesMinPicks()) minesCash(); } }
function minesStart(){ if(mines.active)return;
  if(S.balance<mines.bet)return toast('Недостаточно Stars ⭐','bad');
  S.balance-=mines.bet; save(); renderHeader();
  mines.active=true; mines.picks=0; mines.mult=1; mines.rev=new Array(25).fill(false);
  mines.field=new Array(25).fill(0);
  let placed=0; while(placed<mines.m){ const r=Math.floor(Math.random()*25); if(!mines.field[r]){mines.field[r]=1;placed++;} }
  document.querySelectorAll('.mine-tile').forEach(t=>{t.className='mine-tile';t.textContent='';});
  sfx.click(); syncMines(); }
function minePick(i){ if(!mines.active||mines.rev[i])return;
  mines.rev[i]=true;
  const t=document.querySelector('.mine-tile[data-i="'+i+'"]');
  if(mines.field[i]){ t.classList.add('boom'); t.textContent='💣'; revealMines(); mines.active=false;
    S.stats.mines=(S.stats.mines||0)+1; sfx.crash(); toast('💥 Мина! −⭐'+mines.bet,'bad');
    save(); syncMines(); return; }
  t.classList.add('gem'); t.textContent='💎';
  mines.picks++; mines.mult=minesFair(mines.picks,mines.m);
  sfx.tick(); haptic('light');
  if(mines.picks>=25-mines.m){ minesCash(); return; }
  syncMines(); }
function revealMines(){ document.querySelectorAll('.mine-tile').forEach(t=>{ const i=+t.dataset.i;
  if(mines.field[i]&&!t.classList.contains('boom')){t.classList.add('mine-show');t.textContent='💣';}
  else if(!mines.field[i]&&!t.classList.contains('gem')){t.classList.add('safe-show');t.textContent='💎';} }); }
function minesCash(){ if(!mines.active||mines.picks<minesMinPicks())return;
  const win=Math.floor(mines.bet*mines.mult);
  S.balance+=win; S.stats.won+=win; S.stats.mines=(S.stats.mines||0)+1; S.stats.minesW=(S.stats.minesW||0)+1;
  mines.active=false; revealMines(); sfx.win(); if(mines.mult>=5)confetti(90);
  toast('✅ Забрал +⭐'+win+' (x'+mines.mult.toFixed(2)+')','good');
  save(); renderHeader(); syncMines(); checkAch(); }

function itemCard(g){ return '<div class="inv-item">'+
  '<div class="rt" style="background:'+RAR[g.rarity].color+'"></div>'+
  gImg(g)+'<div class="name">'+g.name+'</div><div class="price">⭐ '+fmt(g.price)+'</div>'+
  '<div class="acts"><button class="mini-btn gift" onclick="'+(g.rarity==='nft'?'requestNft':'withdrawItem')+'(\''+g.uid+'\')">'+(g.rarity==='nft'?'📨 Заявка':'🎁 Вывести')+'</button>'+
  '<button class="mini-btn sell" onclick="sellItem(\''+g.uid+'\')">Продать ⭐'+g.price+'</button>'+
  '<button class="mini-btn up" onclick="toUpgrade(\''+g.uid+'\')">⚡</button></div></div>'; }
function renderInventory(){ const items=validInv();
  const val=items.reduce((a,i)=>a+gift(i.gid).price,0);
  setT('invValue','Предметов: '+items.length+' · ⭐'+fmt(val));
  setH('inventoryGrid',items.length?items.map(i=>itemCard(Object.assign({},gift(i.gid),{uid:i.uid}))).join('')
    :'<div class="inv-empty"><div class="ie-ico">🎁</div><b>Портфель пуст</b><span>Открой первый кейс — подарки появятся здесь</span><button class="btn btn-primary" onclick="activateTab(\'home\')">К кейсам</button></div>'); }
function sellItem(u){ const idx=S.inv.findIndex(i=>i.uid===u); if(idx<0)return;
  const g=gift(S.inv[idx].gid); if(!g)return;
  S.inv.splice(idx,1); S.balance+=g.price; S.stats.sells++;
  qEvent('sell'); sfx.win(); toast('Продано: '+g.name+' +⭐'+fmt(g.price),'good');
  save(); renderHeader(); renderInventory(); renderUpgrade(); checkAch(); }
async function withdrawItem(u){
  const it=S.inv.find(i=>i.uid===u); if(!it)return;
  const g=gift(it.gid); if(!g)return;
  if(!confirm('🎁 Вывести «'+g.name+'» себе в Telegram?\nКомиссия 10% спишется с баланса. Лимит: 3 в день.'))return;
  toast('⏳ Отправляю подарок…','');
  const r=await api('/api/withdraw',{method:'POST',body:JSON.stringify({uid:u, price:g.price, emoji:g.emoji||''})});
  if(r.ok){ const idx=S.inv.findIndex(i=>i.uid===u); if(idx>=0)S.inv.splice(idx,1);
    sfx.win(); confetti(80);
    toast('🎁 Подарок отправлен! Комиссия ⭐'+(r.fee||0)+'. Осталось выводов: '+(r.left_today!==undefined?r.left_today:'—'),'good');
    save(); renderHeader(); renderInventory(); refreshInv();
  } else toast('❌ '+(r.error||'Не удалось вывести подарок'),'bad'); }
function sellAll(){ const items=validInv(); if(!items.length)return;
  let t=0; items.forEach(i=>t+=gift(i.gid).price);
  if(!confirm('Продать всё за ⭐'+fmt(t)+'?'))return;
  S.stats.sells+=items.length; S.inv=[]; S.balance+=t;
  qEvent('sell'); sfx.win(); toast('Продано всё: +⭐'+fmt(t),'good');
  save(); renderHeader(); renderInventory(); renderUpgrade(); }
function toUpgrade(u){ upFrom=S.inv.find(i=>i.uid===u)||null; upTo=null; activateTab('upgrade'); }

function upChanceVal(){ if(!(upFrom&&upTo))return 0;
  return Math.min(90, Math.max(2, Math.round(gift(upFrom.gid).price/upTo.price*100))); }
function selFrom(u){ upFrom=S.inv.find(i=>i.uid===u)||null; upTo=null; sfx.click(); renderUpgrade(); }
function selTo(id){ upTo=gift(id)||null; sfx.click(); renderUpgrade(); }
function renderUpgrade(){ const items=validInv();
  if(upFrom&&!items.some(i=>i.uid===upFrom.uid))upFrom=null;
  if(upTo&&upFrom&&upTo.price<=gift(upFrom.gid).price)upTo=null;
  setH('upMine',items.length?items.map(i=>{const g=gift(i.gid);
    return '<button class="chip '+(upFrom&&upFrom.uid===i.uid?'sel':'')+'" onclick="selFrom(\''+i.uid+'\')">'+gImg(g)+'<div class="name">'+g.name+'</div><div class="price">⭐'+g.price+'</div></button>';}).join('')
    :'<button class="chip empty" onclick="activateTab(\'home\')">Инвентарь пуст — открыть кейс 🎁</button>');
  const min=upFrom?gift(upFrom.gid).price:0;
  const targets=GIFTS.filter(g=>g.price>min).sort((a,b)=>a.price-b.price);
  setH('upTarget',targets.length?targets.map(g=>
    '<button class="chip '+(upTo&&upTo.id===g.id?'sel':'')+'" onclick="selTo(\''+g.id+'\')">'+gImg(g)+'<div class="name">'+g.name+'</div><div class="price">⭐'+g.price+'</div></button>').join('')
    :'<div class="chip empty">Нет целей дороже</div>');
  const ch=upChanceVal(); setT('upChance',ch+'%'); const wEl=$('upWheel'); if(wEl){ wEl.classList.toggle('hi',ch>=50); wEl.classList.toggle('mid',ch>=20&&ch<50); wEl.classList.toggle('low',ch<20); }
  const w=$('upWheel');
  if(upFrom&&upTo)setWheel(w,[{pct:ch,color:'#22c55e'},{pct:100-ch,color:'#2a2a4a'}]);
  else setWheel(w,[{pct:100,color:'#2a2a4a'}]);
  if(w){ w.style.transition='none'; w.style.transform='rotate(0deg)'; }
  const ub=$('upBtn'); if(ub) ub.disabled=!(upFrom&&upTo)||upBusy; }
const upBtnEl=$('upBtn'); if(upBtnEl) upBtnEl.onclick=doUpgrade;
function doUpgrade(){ if(!upFrom||!upTo||upBusy)return;
  upBusy=true; const ub=$('upBtn'); if(ub)ub.disabled=true;
  const ch=upChanceVal();
  api('/api/upgrade',{method:'POST',body:JSON.stringify({from:upFrom.uid,to:upTo.id})}).then(r=>{
    if(!r||r.error){ toast('❌ '+(r&&r.error||'ошибка'),'bad'); upBusy=false; if(ub)ub.disabled=false; return; }
    const win=r.win;
    spinWheel($('upWheel'),[{pct:ch,color:'#22c55e'},{pct:100-ch,color:'#2a2a4a'}],win?0:1,()=>{
      S.inv=r.inv; S.stats=Object.assign(DEF().stats,r.stats); if(r.xp!=null)S.xp=r.xp;
      if(win){ sfx.win(); toast('⚡ Апгрейд успешен: '+upTo.name+'!','good');
        if(upTo.rarity==='epic'||upTo.rarity==='nft'||upTo.rarity==='legendary'){confetti(150);sfx.legend();} qEvent('upgrade_win'); }
      else { sfx.crash(); toast('💥 Не повезло...','bad'); }
      upFrom=null;upTo=null;upBusy=false;
      saveLocal(); renderHeader(); renderUpgrade(); renderInventory(); checkAch(); });
  });
}


function renderTasks(){ const fr=freeReady();
  setT('freeCaseState',fr?'Доступен сейчас · 1 спин · подписка':'Следующий через '+Math.ceil((FREE_CASE_COOLDOWN-(Date.now()-S.freeLast))/36e5)+' ч.');
  const sb=$('subBtn');
  if(sb){ if(S.subDone){sb.textContent='✅ Награда получена';sb.disabled=true;sb.classList.add('pressed');}
    else {sb.textContent='Подписаться';sb.disabled=false;sb.classList.remove('pressed');} }
  setT('refCount',S.refs);
  renderQuests(); renderAchs(); }
async function doSub(){ openChannel();
  setTimeout(async()=>{ const r=await api('/api/check_sub');
    if(r&&r.sub&&!S.subDone){ S.subDone=true; sfx.win();
      toast('📢 Подписка подтверждена! Бесплатный кейс доступен','good');
      saveLocal(); renderHeader(); renderTasks(); renderProfile(); }
    else if(r&&r.sub){ S.subDone=true; toast('Подписка есть ✅','good'); renderProfile(); }
    else toast('Ты не подписан на канал','bad'); },2500); }
function renderQuests(){ setH('questsList',QUESTS.map(q=>{
  const p=Math.min(S.qp[q.type]||0,q.target),done=p>=q.target,cl=S.qc.includes(q.id);
  return '<div class="quests-row"><div class="q-head"><span>'+q.name+'</span><span class="muted">'+p+'/'+q.target+'</span></div>'+
    '<div class="q-bar"><div class="q-fill" style="width:'+(p/q.target*100)+'%"></div></div>'+
    '<button class="q-claim" '+(done&&!cl?'':'disabled')+' onclick="claimQuest(\''+q.id+'\')">'+(cl?'✅ Получено':'Забрать +'+(q.reward*10)+' XP')+'</button></div>';}).join('')); }
function renderAchs(){ setH('achList',ACHS.map(a=>{const d=a.cond(S);return
    '<div class="ach '+(d?'done':'locked')+'"><span class="emoji">'+a.emoji+'</span><div><b>'+a.name+'</b><div class="muted small">'+(d?'Выполнено ✅':'Не выполнено')+'</div></div></div>';}).join('')); }
function claimQuest(id){ const q=QUESTS.find(x=>x.id===id);
  if(S.qc.includes(id)||(S.qp[q.type]||0)<q.target)return;
  S.qc.push(id); S.xp+=q.reward*10; sfx.win(); toast('📜 Квест выполнен: +'+(q.reward*10)+' XP 🏅','good');
  saveLocal(); renderHeader(); renderTasks(); }
function qEvent(t,n){ S.qp[t]=(S.qp[t]||0)+(n||1); saveLocal(); renderHeader(); }
function checkAch(){ ACHS.forEach(a=>{ if(!S.ac.includes(a.id)&&a.cond(S)){S.ac.push(a.id);toast('🏅 Достижение: '+a.name+'!','good');confetti(60);} }); saveLocal(); }

function dailyDiscount(){ return GIFTS[3+new Date().getDate()%(GIFTS.length-3)].id; }
function renderMarket(){ const disc=dailyDiscount();
  const note=$('marketNote');
  if(note)note.innerHTML='Цены = реальные цены TG · Скидка дня −20%: <b style="color:var(--ok)">'+gift(disc).name+'</b>';
  setH('marketGrid',GIFTS.filter(g=>g.price>=15).map(g=>{
    const p=disc===g.id?Math.floor(g.price*ECO.DISCOUNT):g.price;
    const owned=validInv().filter(i=>i.gid===g.id).length;
    return '<div class="inv-item mkt"><div class="rt" style="background:'+RAR[g.rarity].color+'"></div>'+
      (owned?'<div class="owned">×'+owned+'</div>':'')+gImg(g)+'<div class="name">'+g.name+'</div>'+
      '<div class="price">'+(disc===g.id?'<s>⭐'+g.price+'</s> ':'')+'⭐'+p+'</div>'+
      '<div class="acts"><button class="mini-btn sell" onclick="buyGift(\''+g.id+'\','+p+')">Купить</button></div></div>';}).join('')); }
function buyGift(id,p){ if(S.balance<p)return toast('Недостаточно Stars','bad');
  S.balance-=p; S.stats.spent+=p; S.inv.push({uid:uid(),gid:id}); S.stats.buys++;
  qEvent('buy'); sfx.win(); toast('Куплено: '+gift(id).name+' за ⭐'+p,'good');
  save(); renderHeader(); renderMarket(); refreshInv(); checkAch(); }

function openPay(){ sfx.click();
  setH('payGrid',PAY_PRESETS.map(v=>'<div class="pay-chip" onclick="doPay('+v+')">⭐'+v+'</div>').join(''));
  modalOpen('payModal'); }
function doPay(stars){ apiPay(stars); }
function doPayCustom(){ const v=parseInt($('payCustom').value);
  if(!v||v<1||v>10000) return toast('Сумма от 1 до 10000','bad');
  apiPay(v); }

let battleWatch=null;
function stopBattleWatch(){ if(battleWatch){clearInterval(battleWatch); battleWatch=null;} }
function renderBattles(){ if(!S.serverMode){setH('battlesList','<div class="muted">Баттлы доступны в Telegram-версии.</div>');return;}
  apiR('/api/battles').then(r=>{ const list=(r&&r.battles)||[];
    setH('battlesList',list.length?list.map(b=>
      '<div class="battle-card"><div class="bc-top"><span class="bc-live">🔴 АКТИВЕН</span><div class="bet">⭐'+b.bet+'</div></div>'+
      '<div class="bc-mid"><div class="bc-player"><span class="emoji">🧑</span><b>'+(b.host_name||'Игрок')+'</b></div></div>'+
      '<button class="btn btn-primary" onclick="joinBattle(\''+b.id+'\')">Войти за ⭐'+b.bet+'</button></div>').join('')
      :'<div class="battle-empty"><span class="emoji">⚔️</span><b>Нет активных баттлов</b></div>'); }); }
function createBattle(){ if(!S.serverMode)return toast('Только в Telegram-версии','bad');
  const bet=parseInt(prompt('Твоя ставка (Stars):','50')); if(!bet||bet<10)return;
  if(S.balance<bet)return toast('Недостаточно Stars','bad');
  api('/api/battles/create',{method:'POST',body:JSON.stringify({bet})}).then(r=>{
    if(r.error)return toast(r.error,'bad');
    S.balance-=bet; save(); renderHeader(); renderBattles(); }); }
function joinBattle(id){ api('/api/battles/join',{method:'POST',body:JSON.stringify({id})}).then(r=>{
    if(r.error)return toast(r.error,'bad');
    S.balance-=r.bet; save(); renderHeader();
    toast(r.you_win?'🎉 Победа! +⭐'+(r.bet*2):'💥 Поражение', r.you_win?'good':'bad');
    if(r.you_win){sfx.win();confetti(80);} else sfx.lose();
    setTimeout(refreshMe,800); renderBattles(); }); }
function showMyResult(id){ toast('🎬 Результат сохранён в истории',''); }

function playerTitle(){ const st=S.stats||{};
  if((st.won||0)>=5000) return {t:'🐋 Кит',c:'gold'};
  if((st.opened||0)>=200) return {t:'👑 Легенда кейсов',c:'gold'};
  if((st.bWins||0)>=10) return {t:'⚔️ Гладиатор',c:'epic'};
  if((st.opened||0)>=100) return {t:'📦 Коллекционер',c:'epic'};
  if((st.won||0)>=1000) return {t:'⭐ Про',c:'rare'};
  if((st.opened||0)>=25) return {t:'🎮 Игрок',c:'rare'};
  return {t:'🌱 Новичок',c:'common'}; }
function ensureBanner(){ let b=$('connBanner');
  if(!b){ b=document.createElement('div'); b.id='connBanner'; b.className='conn-banner';
    const sec=$('sec-profile'); if(sec) sec.insertBefore(b, sec.firstChild); }
  return b; }
function renderProfile(){
  const st=Object.assign(DEF().stats, S.stats||{}); S.stats=st;
  const li=levelInfo();
  const b=ensureBanner();
  if(b){ if(S.serverMode) b.style.display='none';
    else { b.style.display='flex'; b.innerHTML='<span>⚠️ Нет соединения — кабинет в локальном режиме</span><button class="btn btn-secondary" onclick="retryConnect()">Повторить</button>'; } }
  setT('pName',S.tgName||'Игрок');
  const el=$('pName');
  if(el&&el.parentNode){ let bd=document.getElementById('ptitleBadge');
    if(!bd){ bd=document.createElement('span'); bd.id='ptitleBadge'; el.parentNode.insertBefore(bd, el.nextSibling); }
    const ti=playerTitle(); bd.className='ptitle '+ti.c; bd.textContent=ti.t; }
  setT('pAva',(S.tgName||'😎').charAt(0).toUpperCase());
  setT('myId',S.tgId||'—');
  setT('pReg',S.createdAt?new Date(S.createdAt).toLocaleDateString('ru-RU'):'—');
  let bad='';
  if(S.isAdmin)bad+='<span class="pbad gold">🛡 АДМИН</span>';
  if(S.subDone)bad+='<span class="pbad green">📢 Подписчик</span>';
  if(S.refs>0)bad+='<span class="pbad">🤝 '+S.refs+' рефов</span>';
  if(st.opened>=100)bad+='<span class="pbad gold">📦 100+ кейсов</span>';
  setH('pBadges',bad||'<span class="pbad">🌱 Новичок</span>');
  setT('subState',S.subDone?'Активна ✅':'Награда ⭐'+SUB_REWARD);
  setH('statsGrid',[['Уровень',li.lvl+' ур.'],['Кейсов',st.opened],['Потрачено','⭐'+fmt(st.spent)],['Выиграно','⭐'+fmt(st.won)],
    ['Лучший дроп','⭐'+fmt(st.best)],['Апгрейдов',st.upWins+'/'+st.upgrades],['Баттлов',st.bWins+'/'+st.battles],
    ['Crash побед',st.crashWins||0],['Mines',(st.minesW||0)+'/'+(st.mines||0)],['Plinko',(st.plinkoW||0)+'/'+(st.plinko||0)],
    ['Режим',S.serverMode?'🟢 онлайн':'⚪ локально'],['Сборка','build '+BUILD]].map(x=>'<div class="stat-card"><b>'+x[1]+'</b><span>'+x[0]+'</span></div>').join(''));
  const st1=$('soundToggle'); if(st1)st1.checked=S.sound;
  const st2=$('fairToggle'); if(st2)st2.checked=S.fair;
  setH('fairInfo',(S.isAdmin&&S.fair)?'Seed: '+S.seed+'<br>Hash: '+hash(S.seed):'');
  const ab=$('adminBlock');
  if(ab){ if(S.isAdmin){ ab.style.display='block'; renderAdmin(); } else ab.style.display='none'; } }
async function retryConnect(){ const b=$('connBanner');
  if(b) b.innerHTML='<span>⏳ Подключение…</span>';
  const me=await apiR('/api/me');
  if(me&&me.tg_id){ S.tgId=me.tg_id; S.balance=Number(me.balance)||0; S.inv=Array.isArray(me.inv)?me.inv:[];
    S.stats=Object.assign(DEF().stats, me.stats||{}); S.xp=Number(me.xp)||0;
    S.refs=me.ref_count||0; S.isAdmin=!!me.admin; S.serverMode=true; S.migrated=true;
    saveLocal(); renderHeader(); renderSection('profile'); toast('🟢 Подключено','good'); }
  else if(b) b.innerHTML='<span>⚠️ Нет соединения</span><button class="btn btn-secondary" onclick="retryConnect()">Повторить</button>'; }
function renderRank(){ const rc=$('rankCard'); if(!rc)return;
  if(!S.serverMode){ rc.innerHTML='<div class="ic-box gold"><svg class="ic"><use href="#i-trophy"/></svg></div><div><b>Твоё место: #1</b><span>Лидерборд живых — в Telegram</span></div>'; return; }
  apiR('/api/rank').then(r=>{ if(r.error)return;
    rc.innerHTML='<div class="ic-box gold"><svg class="ic"><use href="#i-trophy"/></svg></div>'+
      '<div><b>Твоё место: #'+r.rank+' из '+r.total+'</b><span>Выиграно: ⭐'+fmt(r.won)+'</span></div>'; }); }
function renderTop(){ const tl=$('topList'); if(!tl)return;
  if(!S.serverMode){ tl.innerHTML='<div class="top-row me"><div class="pos">🥇</div><b>😎 '+(S.tgName||'ТЫ')+'</b><div class="won">⭐'+fmt(S.stats.won)+'</div></div>'; return; }
  apiR('/api/top?limit=50').then(r=>{ const rows=(r&&r.rows)||[];
    if(!rows.length){tl.innerHTML='<div class="muted">Пока пусто — стань первым!</div>';return;}
    tl.innerHTML=rows.map((x,i)=>'<div class="top-row '+(x.me?'me':'')+'"><div class="pos">'+(i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1)+'</div><b>'+(x.tl||'')+' '+(x.me?'😎 ':'🧑 ')+x.name+'</b><div class="won">⭐'+fmt(x.won)+'</div></div>').join(''); }); }
function renderAdmin(){ api('/api/admin/stats').then(r=>{ if(r.error)return;
  setH('adminStats',[
    ['Игроков',r.total],['Новых 24ч',r.new24],['Актив 24ч',r.active24],['Ботов',r.bots],
    ['Балансы','⭐'+fmt(r.sumBalance)],['Потрачено','⭐'+fmt(r.sumSpent)],['Выиграно','⭐'+fmt(r.sumWon)],['Кейсов',r.sumOpened],
    ['Платежи',r.payments+' / ⭐'+fmt(r.payStars)],['Баттлов',r.battles],['Покупок',r.sumBuys],['Продаж',r.sumSells]
  ].map(x=>'<div class="stat-card"><b>'+x[1]+'</b><span>'+x[0]+'</span></div>').join(''));
  const co=r.caseOpens||{}; const cs=$('adminCaseOpens');
  if(cs) cs.innerHTML=Object.keys(co).length?Object.entries(co).map(e=>e[0]+': <b>'+e[1]+'</b>').join(' · '):'нет данных'; });
  api('/api/admin/users').then(r=>{ if(r.error)return;
  setH('adminUsers',(r.rows||[]).map(x=>'<div class="top-row"><div class="pos">#'+x.tg_id+'</div><b>'+x.name+'</b><div class="won">⭐'+fmt(x.balance)+'</div></div>').join('')); });
  api('/api/admin/promo/list').then(r=>{ if(r.error)return;
  setH('adminPromos',(r.rows||[]).map(p=>'<div class="battle-row"><div class="info"><b>'+p.code+'</b><span class="muted">⭐'+p.amount+' · активаций '+p.uses+(p.max_uses?'/'+p.max_uses:'')+'</span></div><button class="btn btn-danger" style="width:auto;min-width:90px;min-height:40px" onclick="admPromoDel(\''+p.code+'\')">Удалить</button></div>').join('')||'<div class="muted">Промокодов нет</div>'); }); }
function admGrant(){ const id=parseInt($('admId').value), sum=parseInt($('admSum').value);
  if(!id||!sum)return toast('Заполни ID и сумму','bad');
  api('/api/admin/grant',{method:'POST',body:JSON.stringify({id,sum})}).then(r=>{
    toast(r.ok?('✅ Начислено ⭐'+sum+' игроку #'+id):('❌ '+r.error), r.ok?'good':'bad'); renderAdmin(); }); }
function admBroadcast(){ const t=$('admMsg'); const text=t?t.value.trim():''; if(!text)return;
  api('/api/admin/broadcast',{method:'POST',body:JSON.stringify({text})}).then(r=>{
    toast(r.ok?('📨 Отправлено '+r.sent+' игрокам'):('❌ '+r.error), r.ok?'good':'bad'); t.value=''; }); }
function admPromoCreate(){ const c=$('admPromoCode'), s=$('admPromoSum');
  const code=c?c.value.trim().toUpperCase():'', sum=s?parseInt(s.value):0;
  if(!code||!sum)return toast('Код и сумма обязательны','bad');
  api('/api/admin/promo/create',{method:'POST',body:JSON.stringify({code,sum})}).then(r=>{
    toast(r.ok?('✅ Промокод '+code+' создан'):('❌ '+r.error), r.ok?'good':'bad');
    if(r.ok&&c&&s){ c.value=''; s.value=''; } renderAdmin(); }); }
function admPromoDel(code){ api('/api/admin/promo/delete',{method:'POST',body:JSON.stringify({code})}).then(r=>{
  toast(r.ok?'🗑 Промокод удалён':'❌ '+r.error, r.ok?'good':'bad'); renderAdmin(); }); }
function copyId(){ navigator.clipboard.writeText(String(S.tgId||'')); toast('🆔 ID скопирован','good'); }
function hash(s){ let h=5381; for(let i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))>>>0; return h.toString(16); }
async function applyPromo(){ const pi=$('promoInput'); const c=pi?pi.value.trim().toUpperCase():'';
  if(!c)return;
  const r=await api('/api/promo/apply',{method:'POST',body:JSON.stringify({code:c})});
  if(r.ok){ S.balance+=r.amount; sfx.win(); confetti(60); toast('🎟 Промокод: +⭐'+r.amount,'good'); pi.value=''; save(); renderHeader(); }
  else toast('❌ '+(r.error||'Неверный код'),'bad'); }
function copyRef(){ const code=S.tgId||S.seed.slice(0,8);
  navigator.clipboard.writeText('https://t.me/CashBanni_bot?start=ref_'+code);
  toast('🤝 Ссылка скопирована! Друг зайдёт и внесёт депозит — получишь ⭐'+REF_REWARD,'good'); }
function toggleSound(){ S.sound=$('soundToggle').checked; saveLocal(); }
function toggleFair(){ S.fair=$('fairToggle').checked; saveLocal(); renderProfile(); }
function addStars(){ if(S.serverMode&&TG){ openPay(); } else { S.balance+=100; sfx.click(); toast('⭐ +100 (демо)'); saveLocal(); renderHeader(); } }

(function(){ const cols=['#a855f7','#ec4899','#3b82f6','#f59e0b']; const bb=$('bubbles');
  if(!bb)return;
  for(let i=0;i<6;i++){ const d=document.createElement('div'); d.className='bubble';
    const s=rnd(200,420); d.style.width=d.style.height=s+'px';
    d.style.left=rnd(0,100)+'%'; d.style.top=rnd(0,100)+'%';
    d.style.background=pick(cols); d.style.animationDelay=rnd(0,8)+'s';
    bb.appendChild(d); } })();

(async function startup(){
  try{
    if(S.inv.length!==validInv().length){ S.inv=validInv(); saveLocal(); }
    const me=await apiR('/api/me');
    if(me&&me.tg_id){
      S.tgId=me.tg_id; S.refs=me.ref_count||0; S.isAdmin=!!me.admin; S.createdAt=me.created_at||S.createdAt;
      S.balance=Number(me.balance)||0; S.inv=Array.isArray(me.inv)?me.inv:[];
      S.stats=Object.assign(DEF().stats, me.stats||{}); S.xp=Number(me.xp)||0;
      S.serverMode=true; if(!S.tgName&&me.first_name)S.tgName=me.first_name; saveLocal();
    }
    renderHeader();
    try{ renderSection(activeTab()); }catch(e){}
    setTimeout(()=>{ if(S.isAdmin) toast('Cash Banni · build '+BUILD+' · '+(S.serverMode?'🟢':'')); },400);
  }catch(e){ console.error('startup',e); }
})();

async function requestNft(u){
  const it=S.inv.find(i=>i.uid===u); if(!it)return;
  const g=gift(it.gid); if(!g)return;
  if(!confirm('📨 Создать заявку на вывод NFT?\n'+g.name+' ⭐'+g.price+'\nПредмет зарезервируется, админ выплатит вручную.'))return;
  const r=await api('/api/withdraw_request',{method:'POST',body:JSON.stringify({uid:u})});
  if(r&&r.ok){ S.inv=r.inv; saveLocal(); renderHeader(); renderInventory();
    toast('📨 Заявка #'+r.req_id+' создана · ⏳ в обработке','good'); }
  else toast('❌ '+(r&&r.error||'ошибка'),'bad');
}


// ===== v64: adaptive upgrade (mobile=original, desktop=3col) =====
(function(){
  var layout=document.querySelector('#sec-upgrade .up-layout'); if(!layout) return;
  var ORIG=layout.innerHTML; var built=false;
  function buildDesktop(){
    if(built) return;
    var mine=$('upMine'), target=$('upTarget');
    var wheelWrap=layout.querySelector('.wheel-wrap');
    var btn=$('upBtn');
    if(!mine||!target||!wheelWrap||!btn) return;
    layout.classList.add('up-desktop');
    var colL=document.createElement('div'); colL.className='up-col';
    colL.innerHTML='<div class="up-slot"><div class="up-slot-label">ТВОЙ ПРЕДМЕТ</div><div class="up-slot-body" id="upFromView"><span class="us-empty">—</span></div></div><div class="up-list-head">Твои предметы</div>';
    var colR=document.createElement('div'); colR.className='up-col';
    colR.innerHTML='<div class="up-slot"><div class="up-slot-label">ЦЕЛЬ</div><div class="up-slot-body" id="upToView"><span class="us-empty">—</span></div></div><div class="up-list-head">Возможные предметы</div>';
    var mid=document.createElement('div'); mid.className='up-mid';
    mine.className='up-list'; target.className='up-list';
    colL.appendChild(mine); colR.appendChild(target);
    mid.appendChild(wheelWrap); mid.appendChild(btn);
    layout.innerHTML='';
    layout.appendChild(colL); layout.appendChild(mid); layout.appendChild(colR);
    var b=$('upBtn'); if(b) b.onclick=doUpgrade;
    built=true;
  }
  function restoreMobile(){
    if(!built) return;
    layout.classList.remove('up-desktop');
    layout.innerHTML=ORIG; built=false;
    var b=$('upBtn'); if(b) b.onclick=doUpgrade;
  }
  function apply(){ if(window.innerWidth>=900) buildDesktop(); else restoreMobile(); }
  apply();
  var rt; window.addEventListener('resize', function(){ clearTimeout(rt); rt=setTimeout(apply,250); });
})();
function upSlotHtml(g){ return g? gImg(g)+'<div class="us-name">'+g.name+'</div><div class="us-price">⭐'+fmt(g.price)+'</div>' : '<span class="us-empty">—</span>'; }
function updateUpSlots(){
  if(window.innerWidth<900) return;
  var f=$('upFromView'), t=$('upToView');
  if(f) f.innerHTML=upSlotHtml(upFrom?gift(upFrom.gid):null);
  if(t) t.innerHTML=upSlotHtml(upTo);
}
var _ru64=renderUpgrade;
renderUpgrade=function(){ _ru64(); updateUpSlots(); };

function gateSub(){ modalOpen('subGateModal'); }
async function recheckSub(){ const ok=await checkSub();
  if(ok){ S.subDone=true; saveLocal(); modalClose('subGateModal');
    toast('🎉 Подписка подтверждена! Бесплатный кейс твой','good'); renderTasks(); }
  else toast('❌ Подписка не найдена — нажми «Подписаться на канал»','bad'); }

// ===== v69: errModal (красивые окна ошибок) =====
function errModal(icon,title,text,actions){
  var ei=$('errIcon'),et=$('errTitle'),ex=$('errText'),ea=$('errActions'),em=$('errModal');
  if(!em) return toast('❌ '+title,'bad');
  if(ei) ei.textContent=icon||'⚠️';
  if(et) et.textContent=title||'Ошибка';
  if(ex) ex.textContent=text||'';
  if(ea){ ea.innerHTML='';
    var acts=actions||[{label:'Понятно',primary:true,action:function(){modalClose('errModal')}}];
    acts.forEach(function(a){ var b=document.createElement('button');
      b.className='btn '+(a.primary?'btn-primary':'btn-secondary');
      b.textContent=a.label;
      b.onclick=function(){ if(a.action) a.action(); else modalClose('errModal'); };
      ea.appendChild(b); }); }
  modalOpen('errModal');
}
function errBalance(need){
  errModal('💸','Не хватает звёзд','Для этой операции нужно ⭐'+fmt(need)+' на балансе.',[
    {label:'🎯 Пополнить',primary:true,action:function(){modalClose('errModal');openPay();}},
    {label:'Позже',action:function(){modalClose('errModal');}}
  ]);
}
function errCooldown(hoursLeft){
  errModal('⏳','Бесплатный кейс','Ты уже открывал бесплатный кейс сегодня. Следующий — через '+hoursLeft+' ч.',[
    {label:'Хорошо',primary:true,action:function(){modalClose('errModal');}}
  ]);
}
function errSub(){ gateSub(); }
function errUsedCode(){
  errModal('🔒','Код уже использован','Ты уже открывал этот промокод. Попроси новый у стримера!',[
    {label:'Понятно',primary:true,action:function(){modalClose('errModal');}}
  ]);
}
function errBadCode(){
  errModal('❌','Неверный код','Такого промокода нет или он уже исчерпан.',[
    {label:'Попробовать снова',primary:true,action:function(){modalClose('errModal');}},
    {label:'Закрыть',action:function(){modalClose('errModal');}}
  ]);
}
function errGeneric(msg){
  errModal('⚠️','Ошибка',msg||'Что-то пошло не так. Попробуй ещё раз.',[
    {label:'Понятно',primary:true,action:function(){modalClose('errModal');}}
  ]);
}
function smartError(msg){
  if(!msg){ errGeneric(); return; }
  var m=String(msg);
  if(/недостаточно|not enough|хватает/i.test(m)) errBalance(0);
  else if(/24ч|24 ?ч|cooldown|раз в/i.test(m)) errCooldown(24);
  else if(/подписк|sub/i.test(m)){ gateSub(); return; }
  else if(/уже открывал|already used|used/i.test(m)) errUsedCode();
  else if(/неверн|invalid|использован|лимит исчерпан/i.test(m)) errBadCode();
  else errGeneric(m);
}

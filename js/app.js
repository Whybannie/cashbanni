const BUILD = 10;
const $ = id => document.getElementById(id);
const fmt = n => n.toLocaleString('ru-RU');
const rnd = (a,b) => a + Math.random()*(b-a);
const pick = a => a[Math.floor(Math.random()*a.length)];
const gift = id => GIFTS.find(g=>g.id===id);
const uid = () => Date.now().toString(36)+Math.random().toString(36).slice(2,7);

const DEF = () => ({
  balance:ECO.START_BALANCE, xp:0, inv:[],
  stats:{opened:0,spent:0,won:0,best:0,upgrades:0,upWins:0,battles:0,bWins:0,sells:0,buys:0,crashWins:0},
  qp:{}, qc:[], ac:[], promo:[], refs:0, freeLast:0, subDone:false, tgId:null, migrated:false,
  sound:true, fair:false, seed:uid()+uid(), serverMode:false, isAdmin:false
});
let S = load();
function load(){
  try{
    const s=JSON.parse(localStorage.getItem('cashbanni_v2'));
    if(!s) return DEF();
    const def=DEF(); const out=Object.assign(def,s);
    out.stats=Object.assign(def.stats,s.stats||{});
    out.inv=(Array.isArray(s.inv)?s.inv:[]).filter(i=>i&&i.gid&&GIFTS.some(g=>g.id===i.gid));
    out.inv.forEach(i=>{ if(!i.uid) i.uid=uid(); });
    return out;
  }catch(e){ return DEF(); }
}

const TG = (window.Telegram && window.Telegram.WebApp) || null;
let FS_MODE = false;
if (TG) {
  try {
    TG.ready(); TG.expand();
    setTimeout(()=>{try{TG.expand()}catch(e){}},300);
    if (TG.requestFullscreen) { try{ const p=TG.requestFullscreen(); if(p&&p.then){p.then(()=>{FS_MODE=true;document.body.classList.add('fs');}).catch(()=>{});} }catch(e){} }
    setTimeout(()=>{ if(FS_MODE) document.body.classList.add('fs'); },800);
    if (TG.setHeaderColor) TG.setHeaderColor('#06061a');
    if (TG.setBackgroundColor) TG.setBackgroundColor('#06061a');
    const u = TG.initDataUnsafe && TG.initDataUnsafe.user;
    if (u) S.tgName = u.first_name || null;
  } catch (e) {}
}
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
let saveTimer=null;
function apiSave(){ if(!S.serverMode)return; clearTimeout(saveTimer);
  saveTimer=setTimeout(()=>{ api("/api/save",{method:"POST",body:JSON.stringify({balance:S.balance,inv:S.inv,stats:S.stats,xp:S.xp})}); },800); }
async function apiPay(stars){
  const r=await api("/api/pay",{method:"POST",body:JSON.stringify({stars})});
  if(r.ok) toast("💳 Счёт на ⭐"+stars+" отправлен в Telegram","good"); else toast("Не удалось создать счёт","bad");
}
function save(){ localStorage.setItem('cashbanni_v2', JSON.stringify(S)); apiSave(); }
function validInv(){ return S.inv.filter(i=>i&&i.gid&&gift(i.gid)); }

let upFrom=null, upTo=null, curCase=null, spinning=false, upBusy=false;
const IMG = {};
function modalOpen(id){ $(id).classList.add('active'); document.body.classList.add('modal-open'); }
function modalClose(id){ $(id).classList.remove('active');
  if(!document.querySelector('.modal-overlay.active')) document.body.classList.remove('modal-open'); }

async function loadTgs(url){
  const res=await fetch(url); if(!res.ok) throw new Error('http '+res.status);
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
  for(const g of GIFTS){ if(!g.tgs) continue;
    try{
      const data=await loadTgs(g.tgs);
      const div=document.createElement('div'); div.style.cssText='width:96px;height:96px;position:fixed;left:-9999px;top:0';
      document.body.appendChild(div);
      const anim=lottie.loadAnimation({animationData:data,renderer:'canvas',loop:false,autoplay:false,container:div});
      await new Promise(r=>anim.addEventListener('DOMLoaded',r,{once:true}));
      anim.goToAndStop(Math.floor((anim.totalFrames||30)/2),true);
      const c=div.querySelector('canvas'); if(c){ IMG[g.id]=c.toDataURL('image/png'); ok++; }
      anim.destroy(); div.remove();
    }catch(e){}
  }
  if(ok) renderAll();
}

let AC;
function beep(f,d,t,v){ d=d||0.08;t=t||'square';v=v||0.12; if(!S.sound)return;
  try{ AC=AC||new (window.AudioContext||window.webkitAudioContext)();
    const o=AC.createOscillator(),g=AC.createGain(); o.type=t;o.frequency.value=f;g.gain.value=v;
    o.connect(g);g.connect(AC.destination);o.start();
    g.gain.exponentialRampToValueAtTime(0.001,AC.currentTime+d); o.stop(AC.currentTime+d); }catch(e){} }
const sfx={ click:()=>{beep(600,.05,'triangle',.07);haptic('light');},
  tick:()=>beep(800+Math.random()*400,.03,'square',.04),
  win:()=>{beep(523,.1);setTimeout(()=>beep(659,.1),100);setTimeout(()=>beep(784,.2),200);haptic('success');},
  lose:()=>{beep(180,.35,'sawtooth',.1);haptic('error');},
  legend:()=>{[523,659,784,1046,1318,1568].forEach((f,i)=>setTimeout(()=>beep(f,.16,'triangle',.2),i*90));haptic('success');} };

const cv=$('confetti'), cx=cv.getContext('2d'); let parts=[];
function sizeCv(){ cv.width=innerWidth; cv.height=innerHeight; }
sizeCv(); addEventListener('resize',sizeCv);
function confetti(n){ n=n||140; const cols=['#a855f7','#ec4899','#fbbf24','#22c55e','#60a5fa'];
  for(let i=0;i<n;i++) parts.push({x:innerWidth/2,y:innerHeight/3,vx:rnd(-7,7),vy:rnd(-11,-3),s:rnd(4,9),c:pick(cols),r:rnd(0,6),vr:rnd(-.2,.2)}); }
(function loop(){ cx.clearRect(0,0,cv.width,cv.height);
  parts=parts.filter(p=>p.y<cv.height+20);
  parts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.25;p.r+=p.vr;
    cx.save();cx.translate(p.x,p.y);cx.rotate(p.r);cx.fillStyle=p.c;cx.fillRect(-p.s/2,-p.s/2,p.s,p.s);cx.restore();});
  requestAnimationFrame(loop); })();

function toast(msg,type){ const d=document.createElement('div'); d.className='toast '+(type||''); d.innerHTML=msg;
  $('toasts').appendChild(d); setTimeout(()=>d.classList.add('out'),2600); setTimeout(()=>d.remove(),3100); }
function gImg(g,cls){ cls=cls||'gimg';
  return IMG[g.id] ? '<img class="'+cls+'" src="'+IMG[g.id]+'" alt="'+g.name+'">' : '<span class="emoji">'+g.emoji+'</span>'; }
function levelInfo(){ let lvl=1,need=500; while(S.xp>=need){lvl++;need+=lvl*500;} const prev=need-lvl*500; return {lvl,prog:(S.xp-prev)/(need-prev)}; }
function renderHeader(){ $('balanceValue').textContent=fmt(S.balance);
  $('lvlFill').style.width=(levelInfo().prog*100)+'%'; }

function activateTab(t){ sfx.click();
  document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===t));
  document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
  const sec=$('sec-'+t); if(sec) sec.classList.add('active');
  renderSection(t); scrollTo({top:0,behavior:'smooth'});
  if(t==='crash') setTimeout(crashResize,60); }
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>activateTab(b.dataset.tab));
function renderSection(t){
  if(t==='home') renderCases();
  else if(t==='profile'){ renderProfile(); renderInventory(); renderTop(); renderRank(); }
  else if(t==='tasks') renderTasks();
  else if(t==='market') renderMarket();
  else if(t==='upgrade') renderUpgrade();
  else if(t==='battles') renderBattles(); }
function renderAll(){ renderHeader(); renderSection(document.querySelector('.section.active').id.replace('sec-','')); }

function setWheel(el,segs){ let acc=0;
  const stops=segs.map(s=>{const f=acc;acc+=s.pct;return s.color+' '+f+'% '+acc+'%';});
  el.style.background='conic-gradient('+stops.join(',')+')'; }
function spinWheel(el,segs,winIndex,cb){ let start=0;
  const zones=segs.map(s=>{const z=[start,start+s.pct];start+=s.pct;return z;});
  const a=zones[winIndex][0],b=zones[winIndex][1];
  const t=(a+(b-a)*rnd(0.15,0.85))*3.6, R=5*360+(360-t);
  el.style.transition='none'; el.style.transform='rotate(0deg)'; void el.offsetWidth;
  el.style.transition='transform 4s cubic-bezier(.12,.8,.2,1)'; el.style.transform='rotate('+R+'deg)';
  let n=0; const ti=setInterval(()=>{sfx.tick(); if(++n>26)clearInterval(ti);},150);
  setTimeout(cb,4100); }

async function checkSub(){ const r=await api('/api/check_sub'); return !!(r&&r.sub); }
function openChannel(){ try{ TG&&TG.openTelegramLink?TG.openTelegramLink(CHANNEL):window.open(CHANNEL); }catch(e){ window.open(CHANNEL); } }

// ---------- КЕЙСЫ ----------
function caseArt(c){ const col=CASE_COLORS[c.rarity];
  return '<div class="case-art" style="--c0:'+col[0]+';--c1:'+col[1]+';--c2:'+col[2]+';--glow:'+RAR[c.rarity].glow+'">'+
    '<div class="bow"></div><div class="lid"></div><div class="body"></div><div class="rv"></div><div class="rh"></div><div class="em">'+c.em+'</div></div>'; }
function freeReady(){ return Date.now()-(S.freeLast||0)>=FREE_CASE_COOLDOWN; }
function renderCases(){ $('casesStat').textContent='Открыто: '+S.stats.opened;
  $('casesGrid').innerHTML=CASES.map(c=>
    '<div class="case-card" style="--glow:'+RAR[c.rarity].glow+'" onclick="openCaseModal(\''+c.id+'\')">'+
    (c.free?'<div class="free-badge">'+(freeReady()?'ДОСТУПНО':'1/24Ч')+'</div>':'')+
    '<div class="rt" style="background:'+RAR[c.rarity].color+';color:'+RAR[c.rarity].color+'"></div>'+
    caseArt(c)+'<div class="name">'+c.name+'</div>'+
    '<div class="price">'+(c.price===0?'БЕСПЛАТНО':'⭐ '+fmt(c.price))+'</div></div>').join(''); }
function rollDrop(c){ let r=Math.random(),acc=0; for(const d of c.drops){acc+=d[1]; if(r<=acc)return gift(d[0]);} return gift(c.drops[0][0]); }
function resetRoulette(){ const st=$('rouletteStrip');
  st.classList.remove('spinning'); st.style.transition='none'; st.style.transform='translateX(0)'; st.innerHTML='';
  $('rouletteBox').style.display='block';
  $('multiResults').classList.remove('active'); $('multiResults').innerHTML=''; }
function openCaseModal(id){ sfx.click(); curCase=CASES.find(c=>c.id===id);
  if(curCase.free&&!freeReady()){ const h=Math.ceil((FREE_CASE_COOLDOWN-(Date.now()-S.freeLast))/36e5);
    return toast('⏳ Бесплатный кейс раз в 24 часа. Ещё '+h+' ч.','bad'); }
  $('cmTitle').textContent=curCase.name+' · '+(curCase.price===0?'0⭐':'⭐'+curCase.price);
  $('p1').textContent=fmt(curCase.price); $('p3').textContent=fmt(curCase.price*3); $('p5').textContent=fmt(curCase.price*5);
  $('btnX3').style.display=curCase.free?'none':''; $('btnX5').style.display=curCase.free?'none':'';
  $('cmContents').innerHTML=curCase.drops.map(d=>{const g=gift(d[0]);return
    '<div class="c-item" style="border:1px solid '+RAR[g.rarity].color+'44">'+gImg(g)+'<div>'+g.name+'</div><div class="ch">'+(d[1]*100).toFixed(0)+'% · ⭐'+g.price+'</div></div>';}).join('');
  resetRoulette(); modalOpen('caseModal'); }
function closeCaseModal(){ if(!spinning) modalClose('caseModal'); }
function spinOnce(g,dur){ return new Promise(res=>{
  const st=$('rouletteStrip');
  st.classList.remove('spinning'); st.style.transition='none'; st.style.transform='translateX(0)'; st.innerHTML='';
  const winIdx=42;
  for(let i=0;i<50;i++){ const it=(i===winIdx)?g:gift(pick(curCase.drops)[0]);
    const d=document.createElement('div'); d.className='roulette-item'; d.style.background=RAR[it.rarity].color+'18';
    d.innerHTML=gImg(it)+'<span class="name">'+it.name+'</span>'; st.appendChild(d); }
  const w=88,cw=$('rouletteBox').offsetWidth;
  const off=winIdx*w-cw/2+w/2+rnd(-26,26);
  let tk=0; const ti=setInterval(()=>{sfx.tick(); if(++tk>Math.floor(dur/140))clearInterval(ti);},140);
  void st.offsetWidth;
  st.style.transition='transform '+dur+'ms cubic-bezier(.12,.8,.2,1)';
  requestAnimationFrame(()=>{ st.classList.add('spinning'); st.style.transform='translateX(-'+off+'px)'; });
  setTimeout(()=>{ clearInterval(ti); res(); },dur+60); }); }
async function spin(n){ if(spinning) return;
  if(curCase.free){ if(!freeReady()) return toast('⏳ Раз в 24 часа','bad');
    const sub=await checkSub();
    if(!sub){ toast('📢 Только для подписчиков канала','bad'); openChannel(); return; } }
  if(curCase.free) n=1;
  const cost=curCase.price*n;
  if(S.balance<cost) return toast('Недостаточно Stars ⭐','bad');
  spinning=true; S.balance-=cost; S.stats.spent+=cost;
  if(curCase.free) S.freeLast=Date.now();
  save(); renderHeader(); resetRoulette();
  $('multiResults').classList.add('active');
  const wins=[]; for(let i=0;i<n;i++) wins.push(rollDrop(curCase));
  const dur=(n===1)?4200:1500;
  for(let i=0;i<n;i++){ const g=wins[i];
    await spinOnce(g,dur);
    S.inv.push({uid:uid(),gid:g.id}); S.stats.opened++; S.stats.won+=g.price; S.xp+=Math.floor(Math.max(curCase.price,1)/5);
    if(g.price>S.stats.best)S.stats.best=g.price;
    $('multiResults').insertAdjacentHTML('beforeend',itemCard(g,true));
    if(g.rarity==='epic'||g.rarity==='legendary'){sfx.legend();confetti(150);toast('💎 ЭПИКА: '+g.name+'!','good');} else sfx.win();
    qEvent('open',1); save(); renderHeader(); }
  spinning=false; checkAch(); save(); renderCases(); renderTasks(); }

// ---------- CRASH LIVE: раунды идут 24/7, самолёт летает всегда ----------
const crash={ phase:'bet', betEnds:Date.now()+6000, t0:0, m:1, cp:1, myBet:0, cashed:false, hist:[], lastInt:1, sparks:[], tNow:0 };
function genCrash(){ const r=Math.random(); if(r<0.03)return 1.00; return Math.min(150,Math.floor(0.97/(1-r)*100)/100); }
function crashResize(){ const c=$('crashCanvas'); if(!c)return;
  const r=c.parentElement.getBoundingClientRect(), dpr=window.devicePixelRatio||1;
  c.width=r.width*dpr; c.height=r.height*dpr; }
addEventListener('resize',()=>{ if($('sec-crash').classList.contains('active'))crashResize(); });
function crashBet(d){ const i=$('crashBetInput'); i.value=Math.max(5,(parseInt(i.value)||20)+d); }
function crashAction(){
  if(crash.phase==='bet'){
    if(crash.myBet>0){ S.balance+=crash.myBet; crash.myBet=0; sfx.click();
      toast('Ставка отменена','good'); save(); renderHeader(); return; }
    const bet=Math.max(5,parseInt($('crashBetInput').value)||20);
    if(S.balance<bet) return toast('Недостаточно Stars ⭐','bad');
    S.balance-=bet; crash.myBet=bet; crash.cashed=false;
    sfx.click(); toast('✅ Ставка ⭐'+bet+' принята! Жди взлёт','good');
    save(); renderHeader(); return;
  }
  if(crash.phase==='fly'&&crash.myBet>0&&!crash.cashed){
    const win=Math.floor(crash.myBet*crash.m);
    S.balance+=win; S.stats.won+=win; S.stats.crashWins=(S.stats.crashWins||0)+1;
    crash.cashed=true;
    $('crashMult').className='crash-mult green';
    $('crashStatus').innerHTML='✅ Забрал на '+crash.m.toFixed(2)+'× → +⭐'+fmt(win);
    sfx.win(); if(crash.m>=5)confetti(90);
    save(); renderHeader(); checkAch(); return;
  }
  toast('⏳ Ставки принимаются только перед взлётом','bad');
}
function crashLoop(){
  const now=Date.now();
  if(crash.phase==='bet'){
    const left=(crash.betEnds-now)/1000;
    $('crashMult').textContent='1.00×'; $('crashMult').className='crash-mult';
    $('crashStatus').innerHTML='🎰 Ставки: '+Math.max(0,left).toFixed(1)+' с';
    const hero=$('heroCrashState'); if(hero) hero.textContent='Приём ставок: '+Math.max(0,left).toFixed(0)+' с';
    if(left<=0){ crash.phase='fly'; crash.t0=now; crash.cp=genCrash(); crash.m=1; crash.lastInt=1; crash.sparks=[];
      if(crash.myBet>0) toast('🚀 Взлёт! Твоя ставка ⭐'+crash.myBet+' в игре','good'); }
  } else if(crash.phase==='fly'){
    const t=now-crash.t0; crash.tNow=t;
    crash.m=Math.exp(t/9000);
    if(crash.m>=crash.cp){ crash.m=crash.cp; crash.phase='crash'; crash.betEnds=now+2500;
      $('crashMult').textContent=crash.cp.toFixed(2)+'×'; $('crashMult').className='crash-mult red';
      const c=$('crashCanvas'),dpr=window.devicePixelRatio||1;
      for(let i=0;i<26;i++)crash.sparks.push({x:c.width*0.85,y:c.height*0.25,vx:rnd(-4,4)*dpr,vy:rnd(-4,4)*dpr,l:1});
      $('crashStatus').innerHTML='💥 Краш на '+crash.cp.toFixed(2)+'×';
      if(crash.myBet>0&&!crash.cashed){ sfx.lose(); toast('💥 Краш! −⭐'+crash.myBet,'bad'); }
      $('crashBox').classList.add('shake'); setTimeout(()=>$('crashBox').classList.remove('shake'),500);
      crash.hist.unshift(crash.cp); crash.hist=crash.hist.slice(12); crashHist(); crash.myBet=0; crash.cashed=false;
    } else {
      if(Math.floor(crash.m)>crash.lastInt){ crash.lastInt=Math.floor(crash.m); sfx.tick(); }
      $('crashMult').textContent=crash.m.toFixed(2)+'×';
      $('crashMult').className='crash-mult'+(crash.m>=10?' gold':'');
      $('crashStatus').innerHTML=crash.myBet>0?(crash.cashed?'✅ Забрано':'🚀 Летим! Забрать: ⭐'+Math.floor(crash.myBet*crash.m)):'🚀 В полёте';
      const hero=$('heroCrashState'); if(hero) hero.textContent='LIVE: '+crash.m.toFixed(2)+'×';
    }
  } else {
    if(now>=crash.betEnds){ crash.phase='bet'; crash.betEnds=now+6000; }
  }
  const btn=$('crashBtn');
  if(crash.phase==='bet') btn.textContent=crash.myBet>0?('Отменить ⭐'+crash.myBet):'Сделать ставку';
  else if(crash.phase==='fly') btn.textContent=crash.myBet>0?(crash.cashed?'Забрано ✅':'Забрать ⭐'+Math.floor(crash.myBet*crash.m)):'Ждём следующий раунд…';
  else btn.textContent='💥 Краш…';
  crashDraw();
  requestAnimationFrame(crashLoop);
}
function crashY(m,mMax,H){ return H*0.94-(H*0.8)*((m-1)/(mMax-1||1)); }
function crashDraw(){ const c=$('crashCanvas'); if(!c||!c.width)return;
  const x=c.getContext('2d'),W=c.width,H=c.height,dpr=window.devicePixelRatio||1;
  x.clearRect(0,0,W,H);
  const mMax=Math.max(crash.m*1.15,2);
  x.font=(10*dpr)+'px system-ui'; x.textAlign='right';
  [1,1.5,2,3,5,10,25,50,100].filter(v=>v<=mMax).forEach(v=>{
    const y=crashY(v,mMax,H);
    x.strokeStyle='rgba(255,255,255,.05)'; x.lineWidth=1*dpr;
    x.beginPath();x.moveTo(0,y);x.lineTo(W,y);x.stroke();
    x.fillStyle='rgba(255,255,255,.28)'; x.fillText(v+'×',W-8*dpr,y-4*dpr); });
  if(crash.phase==='bet'){
    const bob=Math.sin(Date.now()/300)*4*dpr;
    x.font=(30*dpr)+'px serif'; x.textAlign='center';
    x.fillText('🚀',W*0.12,H*0.8+bob);
    for(let i=1;i<=3;i++){ x.fillStyle='rgba(251,191,36,'+(0.3/i)+')';
      x.beginPath();x.arc(W*0.12-14*dpr*i,H*0.8+bob,(4-i)*dpr,0,7);x.fill(); }
    return;
  }
  const tNow=crash.phase==='fly'?crash.tNow:(4500*Math.log(crash.m)||0), N=70, pts=[];
  for(let i=0;i<=N;i++){ const tt=tNow*i/N, m=Math.exp(tt/9000);
    pts.push([W*0.05+(W*0.88)*(i/N), crashY(Math.min(m,mMax),mMax,H)]); }
  x.save(); x.shadowColor=crash.phase==='crash'?'#ef4444':'#a855f7'; x.shadowBlur=16*dpr;
  const grad=x.createLinearGradient(0,H,W,0);
  grad.addColorStop(0,'#a855f7'); grad.addColorStop(1,crash.phase==='crash'?'#ef4444':'#ec4899');
  x.strokeStyle=grad; x.lineWidth=3.5*dpr; x.lineJoin='round';
  x.beginPath(); pts.forEach((p,i)=>i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1])); x.stroke(); x.restore();
  x.lineTo(pts[N][0],H); x.lineTo(pts[0][0],H); x.closePath();
  const fg=x.createLinearGradient(0,0,0,H);
  fg.addColorStop(0,'rgba(168,85,247,.28)'); fg.addColorStop(1,'rgba(168,85,247,0)');
  x.fillStyle=fg; x.fill();
  const tip=pts[N], prev=pts[N-1]||tip;
  const ang=Math.atan2(tip[1]-prev[1],tip[0]-prev[0]);
  if(crash.phase==='fly'){
    for(let i=1;i<=3;i++){ x.fillStyle='rgba(251,191,36,'+(0.35/i)+')';
      x.beginPath(); x.arc(tip[0]-Math.cos(ang)*10*dpr*i,tip[1]-Math.sin(ang)*10*dpr*i,(5-i)*dpr,0,7); x.fill(); }
    x.save(); x.translate(tip[0],tip[1]); x.rotate(ang);
    x.font=(26*dpr)+'px serif'; x.textAlign='center'; x.textBaseline='middle';
    x.fillText('🚀',6*dpr,0); x.restore();
  } else { x.font=(30*dpr)+'px serif'; x.textAlign='center'; x.fillText('💥',tip[0],tip[1]); }
  crash.sparks=crash.sparks.filter(s=>s.l>0);
  crash.sparks.forEach(s=>{ s.x+=s.vx;s.y+=s.vy;s.vy+=0.15*dpr;s.l-=0.03;
    x.fillStyle='rgba(239,68,68,'+Math.max(s.l,0)+')';
    x.beginPath();x.arc(s.x,s.y,2.5*dpr,0,7);x.fill(); }); }
function crashHist(){ $('crashHistory').innerHTML=crash.hist.map(v=>
  '<span class="ch-h '+(v>=10?'hi':v>=2?'mid':'lo')+'">'+v.toFixed(2)+'×</span>').join(''); }

// ---------- ИНВЕНТАРЬ ----------
function itemCard(g,noActs){ return '<div class="inv-item">'+
  '<div class="rt" style="background:'+RAR[g.rarity].color+'"></div>'+
  gImg(g)+'<div class="name">'+g.name+'</div><div class="price">⭐ '+fmt(g.price)+'</div>'+
  (noActs?'':'<div class="acts"><button class="mini-btn sell" onclick="sellItem(\''+g.uid+'\')">Продать ⭐'+g.price+'</button>'+
  '<button class="mini-btn up" onclick="toUpgrade(\''+g.uid+'\')">⚡</button></div>')+'</div>'; }
function renderInventory(){ const items=validInv();
  const val=items.reduce((a,i)=>a+gift(i.gid).price,0);
  $('invValue').textContent='Предметов: '+items.length+' · ⭐'+fmt(val);
  $('inventoryGrid').innerHTML=items.length?items.map(i=>itemCard(Object.assign({},gift(i.gid),{uid:i.uid}))).join(''):'<div class="muted">Пусто. Открой кейс или купи в маркете! 📦</div>'; }
function sellItem(u){ const idx=S.inv.findIndex(i=>i.uid===u); if(idx<0)return;
  const g=gift(S.inv[idx].gid); if(!g)return;
  S.inv.splice(idx,1); S.balance+=g.price; S.stats.sells++;
  qEvent('sell'); sfx.win(); toast('Продано: '+g.name+' +⭐'+fmt(g.price),'good');
  save(); renderHeader(); renderInventory(); renderUpgrade(); checkAch(); }
function sellAll(){ const items=validInv(); if(!items.length)return;
  let t=0; items.forEach(i=>t+=gift(i.gid).price);
  if(!confirm('Продать всё за ⭐'+fmt(t)+'?'))return;
  S.stats.sells+=items.length; S.inv=[]; S.balance+=t;
  qEvent('sell'); sfx.win(); toast('Продано всё: +⭐'+fmt(t),'good');
  save(); renderHeader(); renderInventory(); renderUpgrade(); }
function toUpgrade(u){ upFrom=S.inv.find(i=>i.uid===u)||null; upTo=null; activateTab('upgrade'); }

// ---------- АПГРЕЙД ----------
function upChanceVal(){ if(!(upFrom&&upTo))return 0;
  return Math.min(80,Math.max(2,Math.floor(gift(upFrom.gid).price/upTo.price*100*ECO.UPGRADE_EDGE))); }
function selFrom(u){ upFrom=S.inv.find(i=>i.uid===u)||null; upTo=null; sfx.click(); renderUpgrade(); }
function selTo(id){ upTo=gift(id)||null; sfx.click(); renderUpgrade(); }
function renderUpgrade(){ const items=validInv();
  if(upFrom&&!items.some(i=>i.uid===upFrom.uid))upFrom=null;
  if(upTo&&upFrom&&upTo.price<=gift(upFrom.gid).price)upTo=null;
  $('upMine').innerHTML=items.length?items.map(i=>{const g=gift(i.gid);
    return '<button class="chip '+(upFrom&&upFrom.uid===i.uid?'sel':'')+'" onclick="selFrom(\''+i.uid+'\')">'+gImg(g)+'<div class="name">'+g.name+'</div><div class="price">⭐'+g.price+'</div></button>';}).join('')
    :'<button class="chip empty" onclick="activateTab(\'home\')">Инвентарь пуст — открыть кейс 🎁</button>';
  const min=upFrom?gift(upFrom.gid).price:0;
  const targets=GIFTS.filter(g=>g.price>min).sort((a,b)=>a.price-b.price);
  $('upTarget').innerHTML=targets.length?targets.map(g=>
    '<button class="chip '+(upTo&&upTo.id===g.id?'sel':'')+'" onclick="selTo(\''+g.id+'\')">'+gImg(g)+'<div class="name">'+g.name+'</div><div class="price">⭐'+g.price+'</div></button>').join('')
    :'<div class="chip empty">Нет целей дороже</div>';
  const ch=upChanceVal(); $('upChance').textContent=ch+'%';
  if(upFrom&&upTo)setWheel($('upWheel'),[{pct:ch,color:'#22c55e'},{pct:100-ch,color:'#2a2a4a'}]);
  else setWheel($('upWheel'),[{pct:100,color:'#2a2a4a'}]);
  $('upWheel').style.transition='none'; $('upWheel').style.transform='rotate(0deg)';
  $('upBtn').disabled=!(upFrom&&upTo)||upBusy; }
$('upBtn').onclick=doUpgrade;
function doUpgrade(){ if(!upFrom||!upTo||upBusy)return;
  upBusy=true; $('upBtn').disabled=true;
  const ch=upChanceVal(), win=Math.random()*100<ch;
  spinWheel($('upWheel'),[{pct:ch,color:'#22c55e'},{pct:100-ch,color:'#2a2a4a'}],win?0:1,()=>{
    S.stats.upgrades++;
    const idx=S.inv.findIndex(i=>i.uid===upFrom.uid);
    if(win){ S.inv[idx]={uid:uid(),gid:upTo.id}; S.stats.upWins++; S.stats.won+=upTo.price;
      sfx.win(); toast('⚡ Апгрейд успешен: '+upTo.name+'!','good');
      if(upTo.rarity==='epic'){confetti(150);sfx.legend();} qEvent('upgrade_win'); }
    else { if(idx>=0)S.inv.splice(idx,1); sfx.lose(); toast('💥 Не повезло...','bad'); }
    upFrom=null;upTo=null;upBusy=false;
    save(); renderHeader(); renderUpgrade(); renderInventory(); checkAch(); }); }

// ---------- ЗАДАНИЯ ----------
function renderTasks(){ const fr=freeReady();
  $('freeCaseState').textContent=fr?'Доступен сейчас · 1 спин · подписка':'Следующий через '+Math.ceil((FREE_CASE_COOLDOWN-(Date.now()-S.freeLast))/36e5)+' ч.';
  const sb=$('subBtn');
  if(S.subDone){sb.textContent='✅ Получено';sb.disabled=true;} else sb.textContent='Подписаться';
  $('refCount').textContent=S.refs;
  renderQuests(); renderAchs(); }
async function doSub(){ openChannel();
  setTimeout(async()=>{ const r=await api('/api/check_sub');
    if(r&&r.sub&&!S.subDone){ S.subDone=true; S.balance+=25; sfx.win(); confetti(60);
      toast('📢 Подписка подтверждена: +⭐25','good'); save(); renderHeader(); renderTasks(); renderProfile(); }
    else if(r&&r.sub){ S.subDone=true; toast('Подписка есть ✅','good'); renderProfile(); }
    else toast('Ты не подписан на канал','bad'); },2500); }
function renderQuests(){ $('questsList').innerHTML=QUESTS.map(q=>{
  const p=Math.min(S.qp[q.type]||0,q.target),done=p>=q.target,cl=S.qc.includes(q.id);
  return '<div class="quests-row"><div class="q-head"><span>'+q.name+'</span><span class="muted">'+p+'/'+q.target+'</span></div>'+
    '<div class="q-bar"><div class="q-fill" style="width:'+(p/q.target*100)+'%"></div></div>'+
    '<button class="q-claim" '+(done&&!cl?'':'disabled')+' onclick="claimQuest(\''+q.id+'\')">'+(cl?'✅ Получено':'Забрать ⭐'+q.reward)+'</button></div>';}).join(''); }
function renderAchs(){ $('achList').innerHTML=ACHS.map(a=>{const d=a.cond(S);return
  '<div class="ach '+(d?'done':'locked')+'"><span class="emoji">'+a.emoji+'</span><div><b>'+a.name+'</b><div class="muted small">'+(d?'Выполнено ✅':'Не выполнено')+'</div></div></div>';}).join(''); }
function claimQuest(id){ const q=QUESTS.find(x=>x.id===id);
  if(S.qc.includes(id)||(S.qp[q.type]||0)<q.target)return;
  S.qc.push(id); S.balance+=q.reward; sfx.win(); toast('📜 Квест: +⭐'+q.reward,'good');
  save(); renderHeader(); renderTasks(); }
function qEvent(t,n){ S.qp[t]=(S.qp[t]||0)+(n||1); save(); renderHeader(); }
function checkAch(){ ACHS.forEach(a=>{ if(!S.ac.includes(a.id)&&a.cond(S)){S.ac.push(a.id);toast('🏅 Достижение: '+a.name+'!','good');confetti(60);} }); save(); }

// ---------- МАРКЕТ ----------
function dailyDiscount(){ return GIFTS[3+new Date().getDate()%(GIFTS.length-3)].id; }
function renderMarket(){ const disc=dailyDiscount();
  const note=$('marketNote');
  if(note)note.innerHTML='Цены = реальные цены TG · Скидка дня −20%: <b style="color:var(--ok)">'+gift(disc).name+'</b>';
  $('marketGrid').innerHTML=GIFTS.filter(g=>g.price>=15).map(g=>{
    const p=disc===g.id?Math.floor(g.price*ECO.DISCOUNT):g.price;
    const owned=validInv().filter(i=>i.gid===g.id).length;
    return '<div class="inv-item mkt"><div class="rt" style="background:'+RAR[g.rarity].color+'"></div>'+
      (owned?'<div class="owned">×'+owned+'</div>':'')+gImg(g)+'<div class="name">'+g.name+'</div>'+
      '<div class="price">'+(disc===g.id?'<s>⭐'+g.price+'</s> ':'')+'⭐'+p+'</div>'+
      '<div class="acts"><button class="mini-btn sell" onclick="buyGift(\''+g.id+'\','+p+')">Купить</button></div></div>';}).join(''); }
function buyGift(id,p){ if(S.balance<p)return toast('Недостаточно Stars','bad');
  S.balance-=p; S.stats.spent+=p; S.inv.push({uid:uid(),gid:id}); S.stats.buys++;
  qEvent('buy'); sfx.win(); toast('Куплено: '+gift(id).name+' за ⭐'+p,'good');
  save(); renderHeader(); renderMarket(); renderInventory(); renderUpgrade(); checkAch(); }

// ---------- БАТТЛЫ ----------
function renderBattles(){ if(!S.serverMode){$('battlesList').innerHTML='<div class="muted">Баттлы доступны в Telegram-версии.</div>';return;}
  api('/api/battles').then(r=>{ if(r.error){$('battlesList').innerHTML='<div class="muted">Сервер недоступен.</div>';return;}
    const list=r.battles||[];
    if(!list.length){$('battlesList').innerHTML='<div class="muted">Нет активных баттлов. Создай свой!</div>';return;}
    $('battlesList').innerHTML=list.map(b=>{
      if(b.mine&&b.status==='wait')return '<div class="battle-row"><div class="info"><b>Твой баттл</b><span class="muted">ждём соперника…</span></div><div class="bet">⭐'+b.bet+'</div></div>';
      if(b.mine&&b.status==='done')return '<div class="battle-row"><div class="info"><b>Твой баттл</b><span class="muted">соперник найден</span></div><div class="bet">⭐'+b.bet+'</div><button class="btn btn-primary" onclick="showMyResult(\''+b.id+'\')">Результат</button></div>';
      if(b.mine)return '';
      return '<div class="battle-row"><div class="info"><b>'+(b.host_name||'Игрок')+'</b><span class="muted">живой игрок · 50/50</span></div><div class="bet">⭐'+b.bet+'</div><button class="btn btn-primary" onclick="joinBattle(\''+b.id+'\')">Войти</button></div>';}).join(''); }); }
function showMyResult(id){ api('/api/battles/result?id='+id).then(r=>{ if(!r.error)runBattle(r.host_name,r.bet,r.you_win); }); }
function createBattle(){ if(!S.serverMode)return toast('Только в Telegram-версии','bad');
  const bet=parseInt(prompt('Твоя ставка (Stars):','50')); if(!bet||bet<10)return;
  if(S.balance<bet)return toast('Недостаточно Stars','bad');
  api('/api/battles/create',{method:'POST',body:JSON.stringify({bet})}).then(r=>{
    if(r.error)return toast(r.error,'bad');
    S.balance-=bet; save(); renderHeader();
    toast('⚔️ Баттл создан! Ждём соперника…','good'); renderBattles(); }); }
function joinBattle(id){ api('/api/battles/join',{method:'POST',body:JSON.stringify({id})}).then(r=>{
  if(r.error)return toast(r.error,'bad');
  S.balance-=r.bet; save(); renderHeader(); runBattle(r.host_name,r.bet,r.you_win); }); }
function runBattle(hostName,bet,youWin){ $('battlePot').textContent=fmt(bet*2);
  $('battlePlayers').innerHTML='<div class="b-player" id="bp1"><span class="emoji">😎</span><b>'+(S.tgName||'Ты')+'</b></div>'+
    '<div class="b-player" id="bp2"><span class="emoji">🧑</span><b>'+hostName+'</b></div>';
  $('battleLog').textContent='Крутим колесо...'; modalOpen('battleModal');
  setWheel($('bWheel'),[{pct:50,color:'#a855f7'},{pct:50,color:'#ec4899'}]);
  spinWheel($('bWheel'),[{pct:50,color:'#a855f7'},{pct:50,color:'#ec4899'}],youWin?0:1,()=>{
    $('bp'+(youWin?1:2)).classList.add('win'); S.stats.battles++;
    if(youWin){ S.balance+=bet*2; S.stats.bWins++; S.stats.won+=bet*2;
      $('battleLog').textContent='🎉 ПОБЕДА! +⭐'+fmt(bet*2); sfx.win(); confetti(100); qEvent('battle_win'); }
    else { $('battleLog').textContent='💥 Поражение...'; sfx.lose(); }
    save(); renderHeader(); checkAch(); }); }
function closeBattle(){ modalClose('battleModal'); renderBattles(); }
setInterval(()=>{ if($('sec-battles').classList.contains('active'))renderBattles(); },6000);

// ---------- ТОП-50 / РАНГ / КАБИНЕТ / АДМИН ----------
function renderRank(){ const rc=$('rankCard');
  if(!S.serverMode){ rc.innerHTML='<div class="ic-box gold"><svg class="ic"><use href="#i-trophy"/></svg></div><div><b>Твоё место: #1</b><span>Лидерборд живых — в Telegram</span></div>'; return; }
  api('/api/rank').then(r=>{ if(r.error)return;
    rc.innerHTML='<div class="ic-box gold"><svg class="ic"><use href="#i-trophy"/></svg></div>'+
      '<div><b>Твоё место: #'+r.rank+' из '+r.total+'</b><span>Выиграно: ⭐'+fmt(r.won)+'</span></div>'; }); }
function renderTop(){ if(!S.serverMode){ $('topList').innerHTML='<div class="top-row me"><div class="pos">🥇</div><b>😎 '+(S.tgName||'ТЫ')+'</b><div class="won">⭐'+fmt(S.stats.won)+'</div></div>'; return; }
  api('/api/top?limit=50').then(r=>{ const rows=r.rows||[];
    if(!rows.length){$('topList').innerHTML='<div class="muted">Пока пусто — стань первым!</div>';return;}
    $('topList').innerHTML=rows.map((x,i)=>'<div class="top-row '+(x.me?'me':'')+'"><div class="pos">'+(i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1)+'</div><b>'+(x.me?'😎 ':'🧑 ')+x.name+'</b><div class="won">⭐'+fmt(x.won)+'</div></div>').join(''); }); }
function renderProfile(){ const st=S.stats,li=levelInfo();
  $('myId').textContent=S.tgId||'—';
  $('subState').textContent=S.subDone?'Активна ✅':'Не подтверждена';
  $('statsGrid').innerHTML=[['Уровень',li.lvl+' ур.'],['Кейсов',st.opened],['Потрачено','⭐'+fmt(st.spent)],['Выиграно','⭐'+fmt(st.won)],
    ['Лучший дроп','⭐'+fmt(st.best)],['Апгрейдов',st.upWins+'/'+st.upgrades],['Баттлов',st.bWins+'/'+st.battles],['Crash побед',st.crashWins||0],
    ['Режим',S.serverMode?'🟢 онлайн':'⚪ локально'],['Сборка','build '+BUILD]].map(x=>'<div class="stat-card"><b>'+x[1]+'</b><span>'+x[0]+'</span></div>').join('');
  $('soundToggle').checked=S.sound; $('fairToggle').checked=S.fair;
  $('fairInfo').innerHTML=S.fair?'Seed: '+S.seed+'<br>Hash: '+hash(S.seed):'';
  if(S.isAdmin){ $('adminBlock').style.display='block'; renderAdmin(); } }
function renderAdmin(){ api('/api/admin/stats').then(r=>{ if(r.error)return;
  $('adminStats').innerHTML=[['Игроков',r.total],['Балансов всего','⭐'+fmt(r.sumBalance)],['Баттлов',r.battles],['Платежей',r.payments]].map(x=>'<div class="stat-card"><b>'+x[1]+'</b><span>'+x[0]+'</span></div>').join(''); });
  api('/api/admin/users').then(r=>{ if(r.error)return;
  $('adminUsers').innerHTML=(r.rows||[]).map(x=>'<div class="top-row"><div class="pos">#'+x.tg_id+'</div><b>'+x.name+'</b><div class="won">⭐'+fmt(x.balance)+'</div></div>').join(''); }); }
function admGrant(){ const id=parseInt($('admId').value), sum=parseInt($('admSum').value);
  if(!id||!sum)return toast('Заполни ID и сумму','bad');
  api('/api/admin/grant',{method:'POST',body:JSON.stringify({id,sum})}).then(r=>{
    toast(r.ok?('✅ Начислено ⭐'+sum+' игроку #'+id):('❌ '+r.error), r.ok?'good':'bad'); renderAdmin(); }); }
function admBroadcast(){ const text=$('admMsg').value.trim(); if(!text)return;
  api('/api/admin/broadcast',{method:'POST',body:JSON.stringify({text})}).then(r=>{
    toast(r.ok?('📨 Отправлено '+r.sent+' игрокам'):('❌ '+r.error), r.ok?'good':'bad'); $('admMsg').value=''; }); }
function copyId(){ navigator.clipboard.writeText(String(S.tgId||'')); toast('🆔 ID скопирован','good'); }
function hash(s){ let h=5381; for(let i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))>>>0; return h.toString(16); }
function applyPromo(){ const c=$('promoInput').value.trim().toUpperCase();
  if(!PROMOS[c])return toast('Неверный код','bad');
  if(S.promo.includes(c))return toast('Уже использован','bad');
  S.promo.push(c); S.balance+=PROMOS[c]; sfx.win(); toast('🎟 Промокод: +⭐'+PROMOS[c],'good');
  $('promoInput').value=''; save(); renderHeader(); }
function copyRef(){ const code=S.tgId||S.seed.slice(0,8);
  navigator.clipboard.writeText('https://t.me/CashBanni_bot?start=ref_'+code);
  toast('🤝 Ссылка скопирована! Друг зайдёт — получишь ⭐'+REF_REWARD,'good'); }
function toggleSound(){ S.sound=$('soundToggle').checked; save(); }
function toggleFair(){ S.fair=$('fairToggle').checked; save(); renderProfile(); }
function resetAll(){ if(confirm('Сбросить ТОЛЬКО локальный кеш? Данные на сервере сохранятся!')){ localStorage.removeItem('cashbanni_v2'); location.reload(); } }
function addStars(){ if(S.serverMode&&TG){apiPay(100);} else {S.balance+=100;sfx.click();toast('⭐ +100 (демо)');save();renderHeader();} }

(function(){ const cols=['#a855f7','#ec4899','#3b82f6','#f59e0b'];
  for(let i=0;i<6;i++){ const d=document.createElement('div'); d.className='bubble';
    const s=rnd(200,420); d.style.width=d.style.height=s+'px';
    d.style.left=rnd(0,100)+'%'; d.style.top=rnd(0,100)+'%';
    d.style.background=pick(cols); d.style.animationDelay=rnd(0,8)+'s';
    $('bubbles').appendChild(d); } })();

(async function startup(){
  if(S.inv.length!==validInv().length){ S.inv=validInv(); localStorage.setItem('cashbanni_v2',JSON.stringify(S)); }
  const me=await api('/api/me');
  if(me&&me.tg_id){
    S.tgId=me.tg_id; S.refs=me.ref_count||0; S.isAdmin=!!me.admin;
    const serverEmpty=(!me.stats||!me.stats.opened)&&me.balance===ECO.START_BALANCE&&!me.inv.length;
    const localHas=S.stats.opened>0||S.inv.length>0||S.balance!==ECO.START_BALANCE;
    if(serverEmpty&&localHas&&!S.migrated){
      await api('/api/save',{method:'POST',body:JSON.stringify({balance:S.balance,inv:S.inv,stats:S.stats,xp:S.xp})});
      S.migrated=true; toast('📦 Твой локальный прогресс перенесён на сервер!','good');
    } else {
      S.balance=me.balance; S.inv=me.inv; S.stats=me.stats; S.xp=me.xp; S.migrated=true;
    }
    S.serverMode=true;
    localStorage.setItem('cashbanni_v2',JSON.stringify(S));
  }
  renderHeader(); renderCases(); crashHist(); crashResize(); crashLoop();
  save(); buildGiftImages();
  setTimeout(()=>toast(S.serverMode?'Cash Banni · build '+BUILD+' · 🟢':'Cash Banni · build '+BUILD+' · ⚪'),400);
})();

// ===== CRASH SYNC v32: полное переопределение (фикс ставок + истории) =====
var CR2 = { ROUND:15000, BET:6000, SEED:'cashbanni_v1' };

function roundNumber(){ return Math.floor(Date.now()/CR2.ROUND); }
function roundStart(r){ return r*CR2.ROUND; }
function crashPoint(r){
  let h = 0x811c9dc5;
  const s = CR2.SEED + ':' + r;
  for(let i=0;i<s.length;i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  h = (h >>> 0) / 0xffffffff;
  if(h < 0.03) return 1.00;
  return Math.min(150, Math.floor(0.96/(1-h)*100)/100);
}
function crashHistory(){
  const cur = roundNumber(); const arr=[];
  for(let i=1;i<=10;i++) arr.push(crashPoint(cur-i));
  return arr;
}
function crashHist(){ setH('crashHistory', (crash.hist||[]).map(v=>
  '<span class="ch-h '+(v>=10?'hi':v>=2?'mid':'lo')+'">'+v.toFixed(2)+'×</span>').join('')); }

function startCrashLoop(){ if(crashLoopOn) return; crashLoopOn=true; crash.lastFrame=Date.now(); requestAnimationFrame(crashLoop); }
function crashResize(){ const c=$('crashCanvas'); if(!c)return;
  const r=c.parentElement.getBoundingClientRect(), dpr=window.devicePixelRatio||1;
  c.width=r.width*dpr; c.height=r.height*dpr; }
function syncBetUI(){ setT('crashBetVal',crash.betVal); }
function crashBet(d){ if(crash.phase!=='bet')return; crash.betVal=Math.max(5,crash.betVal+d); syncBetUI(); sfx.click(); }
function crashSet(v){ if(crash.phase!=='bet')return; crash.betVal=v; syncBetUI(); sfx.click(); }

function syncCrashBtn(){
  const btn=$('crashBtn'); if(!btn)return;
  const now=Date.now(); const rn=roundNumber(); const elapsed=now-roundStart(rn);
  if(elapsed < CR2.BET){
    if(crash.myBet>0 && crash._betRnd===rn){ btn.textContent='ОТМЕНИТЬ ⭐'+crash.myBet; btn.className='btn crash-main-btn cancel'; }
    else { btn.textContent='ПОСТАВИТЬ ⭐'+crash.betVal; btn.className='btn crash-main-btn bet'; }
  } else {
    const t=elapsed-CR2.BET; const m=Math.exp(t/9000);
    if(m>=crash.cp){ btn.textContent='💥 КРАШ '+crash.cp.toFixed(2)+'×'; btn.className='btn crash-main-btn wait'; }
    else if(crash.myBet>0 && !crash.cashed && crash._betRnd===rn){ btn.textContent='ЗАБРАТЬ ⭐'+Math.floor(crash.myBet*m); btn.className='btn crash-main-btn cash'; }
    else if(crash.cashed){ btn.textContent='ЗАБРАНО ✅'; btn.className='btn crash-main-btn wait'; }
    else { btn.textContent='В ПОЛЁТЕ — СТАВКА НА СЛЕД. РАУНД'; btn.className='btn crash-main-btn wait'; }
  }
}

function crashAction(){
  const now=Date.now();
  const rn=roundNumber();
  const elapsed=now-roundStart(rn);
  if(elapsed < CR2.BET){
    if(crash.myBet>0 && crash._betRnd===rn){
      S.balance+=crash.myBet; crash.myBet=0; crash.cashed=false; sfx.click();
      toast('Ставка отменена','good'); save(); renderHeader(); syncCrashBtn(); return;
    }
    crash.myBet=0;
    const bet=crash.betVal;
    if(S.balance<bet) return toast('Недостаточно Stars ⭐','bad');
    S.balance-=bet; crash.myBet=bet; crash.cashed=false; crash._betRnd=rn;
    sfx.win(); toast('✅ Ставка ⭐'+bet+' принята! Жди взлёт','good');
    save(); renderHeader(); syncCrashBtn(); return;
  }
  const t=elapsed-CR2.BET;
  const m=Math.exp(t/9000);
  if(m < crash.cp && crash.myBet>0 && !crash.cashed && crash._betRnd===rn){
    const win=Math.floor(crash.myBet*m);
    S.balance+=win; S.stats.won+=win; S.stats.crashWins=(S.stats.crashWins||0)+1;
    crash.cashed=true;
    sfx.win(); if(m>=5)confetti(90);
    toast('✅ Забрал на '+m.toFixed(2)+'× → +⭐'+fmt(win),'good');
    save(); renderHeader(); checkAch(); syncCrashBtn(); return;
  }
  toast('⏳ Ставки принимаются только перед взлётом','bad');
}

function crashLoop(){
  crash.lastFrame=Date.now();
  const now=Date.now();
  const rn=roundNumber();
  const t0=roundStart(rn);
  const elapsed=now-t0;

  if(crash._rnd!==rn){
    crash._rnd=rn;
    crash.myBet=0; crash.cashed=false; crash.sparks=[]; crash.lastInt=1;
    crash._lostRnd=0; crash._sparkRnd=0;
    crash.hist=crashHistory();
    crashHist();
  }
  crash.cp=crashPoint(rn);

  if(elapsed < CR2.BET){
    crash.phase='bet'; crash.m=1;
    const left=(CR2.BET-elapsed)/1000;
    setT('crashMult','1.00×');
    const cm=$('crashMult'); if(cm)cm.className='crash-mult';
    setH('crashStatus','🎰 Приём ставок: '+left.toFixed(1)+' с');
    setT('heroCrashState','Приём ставок: '+Math.max(0,left).toFixed(0)+' с');
  } else {
    const t=elapsed-CR2.BET;
    crash.m=Math.exp(t/9000);
    crash.t0=t0;
    if(crash.m>=crash.cp){
      crash.m=crash.cp; crash.phase='crash';
      setT('crashMult',crash.cp.toFixed(2)+'×');
      const cm=$('crashMult'); if(cm)cm.className='crash-mult red';
      setH('crashStatus','💥 Краш на '+crash.cp.toFixed(2)+'×');
      setT('heroCrashState','Краш '+crash.cp.toFixed(2)+'×');
      if(crash.myBet>0 && !crash.cashed && crash._betRnd===rn && crash._lostRnd!==rn){
        crash._lostRnd=rn;
        sfx.lose(); toast('💥 Краш! −⭐'+crash.myBet,'bad');
      }
      if(crash._sparkRnd!==rn){
        crash._sparkRnd=rn;
        const cc=$('crashCanvas'); const dpr=window.devicePixelRatio||1;
        if(cc){ for(let i=0;i<26;i++) crash.sparks.push({x:cc.width*0.85,y:cc.height*0.25,vx:rnd(-4,4)*dpr,vy:rnd(-4,4)*dpr,l:1}); }
      }
      const cb=$('crashBox'); if(cb && !cb.classList.contains('shake')){cb.classList.add('shake'); setTimeout(()=>cb.classList.remove('shake'),500);}
    } else {
      crash.phase='fly';
      if(Math.floor(crash.m)>crash.lastInt){ crash.lastInt=Math.floor(crash.m); sfx.tick(); }
      setT('crashMult',crash.m.toFixed(2)+'×');
      const cm=$('crashMult'); if(cm)cm.className='crash-mult'+(crash.m>=10?' gold':'');
      setH('crashStatus', (crash.myBet>0&&!crash.cashed&&crash._betRnd===rn) ? '🚀 Летим! Забирай вовремя' : '🚀 В полёте');
      setT('heroCrashState','LIVE: '+crash.m.toFixed(2)+'×');
    }
  }
  syncCrashBtn();
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
  const elapsed=Date.now()-roundStart(roundNumber());
  const tNow=crash.phase==='fly'?Math.max(0,elapsed-CR2.BET):(4500*Math.log(crash.m)||0);
  const N=70, pts=[];
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
  crash.sparks=(crash.sparks||[]).filter(s=>s.l>0);
  crash.sparks.forEach(s=>{ s.x+=s.vx;s.y+=s.vy;s.vy+=0.15*dpr;s.l-=0.03;
    x.fillStyle='rgba(239,68,68,'+Math.max(s.l,0)+')';
    x.beginPath();x.arc(s.x,s.y,2.5*dpr,0,7);x.fill(); });
}

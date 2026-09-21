var CR2 = { ROUND:15000, BET:6000, SEED:'cashbanni_v1' };
if (typeof crash === 'undefined') var crash = {};
crash.phase = crash.phase || 'bet';
crash.m = 1;
crash.cp = 1;
crash.myBet = 0;
crash.cashed = false;
crash.hist = crash.hist || [];
crash.lastInt = 1;
crash.sparks = [];
crash.betVal = crash.betVal || 20;
crash.auto = crash.auto || 0;
crash.lastFrame = Date.now();
var crashLoopOn = false;

function roundNumber(){ return Math.floor(Date.now()/CR2.ROUND); }
function roundStart(r){ return r*CR2.ROUND; }
function crashPoint(r){
  var h = 0x811c9dc5;
  var s = CR2.SEED+':'+r;
  for(var i=0;i<s.length;i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  h = (h>>>0)/0xffffffff;
  if(h < 0.03) return 1.00;
  return Math.min(150, Math.floor(0.96/(1-h)*100)/100);
}
function crashHistory(){ var cur=roundNumber(); var a=[]; for(var i=1;i<=10;i++) a.push(crashPoint(cur-i)); return a; }
function crashHist(){
  var cur=roundNumber(); var arr=[];
  for(var i=1;i<=10;i++){ var rn=cur-i; var v=(crash.seen&&crash.seen[rn])?crash.seen[rn]:crashPoint(rn); arr.push(v); }
  crash.hist=arr;
  var html=arr.map(function(v){return '<span class="ch-h '+(v>=10?'hi':v>=2?'mid':'lo')+'">'+v.toFixed(2)+'×</span>';}).join('');
  var r1=$('crashHistRow'); if(r1) r1.innerHTML=html||'<span class="ch-h lo">—</span>';
}
function startCrashLoop(){ if(crashLoopOn) return; crashLoopOn=true; crash.lastFrame=Date.now(); requestAnimationFrame(crashLoop); }
function crashResize(){ var c=$('crashCanvas'); if(!c)return;
  var r=c.parentElement.getBoundingClientRect(), dpr=window.devicePixelRatio||1;
  c.width=r.width*dpr; c.height=r.height*dpr; }
function syncBetUI(){ setT('crashBetVal',crash.betVal); }
function crashBet(d){ if(crash.phase!=='bet')return; crash.betVal=Math.max(5,crash.betVal+d); syncBetUI(); sfx.click(); }
function crashSet(v){ if(crash.phase!=='bet')return; crash.betVal=v; syncBetUI(); sfx.click(); }
function setAuto(v){ crash.auto=v; var i=$('autoCash'); if(i) i.value=v||''; sfx.click(); }

(function(){
  var box=$('crashBox');
  if(box && !$('crashHistRow')) box.insertAdjacentHTML('afterbegin','<div class="crash-hist-row" id="crashHistRow"></div>');
  crash.hist=crashHistory(); crashHist();
  startCrashLoop();
})();

function syncCrashBtn(){
  var btn=$('crashBtn'); if(!btn)return;
  var now=Date.now(); var rn=roundNumber(); var el=now-roundStart(rn);
  if(el < CR2.BET){
    if(crash.myBet>0 && crash._betRnd===rn){ btn.textContent='ОТМЕНИТЬ ⭐'+crash.myBet; btn.className='btn crash-main-btn cancel'; }
    else { btn.textContent='ПОСТАВИТЬ ⭐'+crash.betVal; btn.className='btn crash-main-btn bet'; }
  } else {
    var t=el-CR2.BET; var m=Math.exp(t/9000);
    if(m>=crash.cp){ btn.textContent='💥 КРАШ '+crash.cp.toFixed(2)+'×'; btn.className='btn crash-main-btn wait'; }
    else if(crash.myBet>0 && !crash.cashed && crash._betRnd===rn){ btn.textContent='ЗАБРАТЬ ⭐'+Math.floor(crash.myBet*m); btn.className='btn crash-main-btn cash'; }
    else if(crash.cashed){ btn.textContent='ЗАБРАНО ✅'; btn.className='btn crash-main-btn wait'; }
    else { btn.textContent='ЖДЁМ СЛЕД. РАУНД…'; btn.className='btn crash-main-btn wait'; }
  }
}
function doCashout(m){
  var win=Math.floor(crash.myBet*m);
  S.balance+=win; S.stats.won+=win; S.stats.crashWins=(S.stats.crashWins||0)+1;
  crash.cashed=true; sfx.win(); if(m>=5)confetti(90);
  toast('✅ Забрал на '+m.toFixed(2)+'× → +⭐'+fmt(win),'good');
  save(); renderHeader(); checkAch(); syncCrashBtn();
}
function crashAction(){
  var now=Date.now(); var rn=roundNumber(); var el=now-roundStart(rn);
  if(el < CR2.BET){
    if(crash.myBet>0 && crash._betRnd===rn){
      S.balance+=crash.myBet; crash.myBet=0; crash.cashed=false; sfx.click();
      toast('Ставка отменена','good'); save(); renderHeader(); syncCrashBtn(); return; }
    crash.myBet=0;
    var bet=crash.betVal;
    if(S.balance<bet) return toast('Недостаточно Stars ⭐','bad');
    S.balance-=bet; crash.myBet=bet; crash.cashed=false; crash._betRnd=rn;
    sfx.win(); toast('✅ Ставка ⭐'+bet+' принята!','good'); save(); renderHeader(); syncCrashBtn(); return; }
  var t=el-CR2.BET; var m=Math.exp(t/9000);
  if(m < crash.cp && crash.myBet>0 && !crash.cashed && crash._betRnd===rn){ doCashout(m); return; }
  toast('⏳ Ставки принимаются до взлёта','bad');
}
function crashLoop(){
  try{
    crash.lastFrame=Date.now();
    var now=Date.now(); var rn=roundNumber(); var t0=roundStart(rn); var el=now-t0;
    if(crash._rnd!==rn){
      crash._rnd=rn; crash.myBet=0; crash.cashed=false; crash.sparks=[]; crash.lastInt=1; crash._lostRnd=0; crash._sparkRnd=0;
      crash.hist=crashHistory(); crashHist();
    }
    crash.cp=crashPoint(rn);
    if(el < CR2.BET){
      crash.phase='bet'; crash.m=1;
      var left=(CR2.BET-el)/1000;
      setT('crashMult', left.toFixed(1));
      var cm=$('crashMult'); if(cm) cm.className='crash-mult betcount';
      setH('crashStatus','🎰 СТАВКИ ОТКРЫТЫ · взлёт через '+left.toFixed(1)+' с');
      setT('heroCrashState','Ставки: '+Math.max(0,left).toFixed(0)+' с');
    } else {
      var t=el-CR2.BET; crash.m=Math.exp(t/9000); crash.t0=t0;
      if(crash.auto>0 && crash.myBet>0 && !crash.cashed && crash._betRnd===rn && crash.m>=crash.auto && crash.m<crash.cp){ doCashout(crash.m); }
      if(crash.m>=crash.cp){
        crash.m=crash.cp; crash.phase='crash';
      if(!crash.seen)crash.seen={}; crash.seen[rn]=crash.cp;
      var ks=Object.keys(crash.seen); if(ks.length>12){ delete crash.seen[ks[0]]; }
        setT('crashMult', crash.cp.toFixed(2)+'×');
        var cm2=$('crashMult'); if(cm2) cm2.className='crash-mult red';
        setH('crashStatus','💥 КРАШ на '+crash.cp.toFixed(2)+'× · новый раунд скоро');
        setT('heroCrashState','Краш '+crash.cp.toFixed(2)+'×');
        if(crash.myBet>0 && !crash.cashed && crash._betRnd===rn && crash._lostRnd!==rn){ crash._lostRnd=rn; sfx.crash(); toast('💥 Краш! −⭐'+crash.myBet,'bad'); }
        if(crash._sparkRnd!==rn){ crash._sparkRnd=rn; var cc=$('crashCanvas'); var dpr=window.devicePixelRatio||1;
          if(cc) for(var i=0;i<26;i++) crash.sparks.push({x:cc.width*0.85,y:cc.height*0.25,vx:rnd(-4,4)*dpr,vy:rnd(-4,4)*dpr,l:1}); }
      } else {
        crash.phase='fly';
        if(Math.floor(crash.m)>crash.lastInt){ crash.lastInt=Math.floor(crash.m); sfx.tick(); }
        setT('crashMult', crash.m.toFixed(2)+'×');
        var cm3=$('crashMult'); if(cm3) cm3.className='crash-mult'+(crash.m>=10?' gold':'');
        setH('crashStatus', (crash.myBet>0&&!crash.cashed&&crash._betRnd===rn) ? '🚀 В ПОЛЁТЕ · забирай вовремя!' : '🚀 В полёте');
        setT('heroCrashState','LIVE '+crash.m.toFixed(2)+'×');
      }
    }
    syncCrashBtn(); crashDraw();
  }catch(e){ console.error('crash loop',e); }
  requestAnimationFrame(crashLoop);
}
function crashY(m,mMax,H){ return H*0.94-(H*0.8)*((m-1)/(mMax-1||1)); }
function crashDraw(){ var c=$('crashCanvas'); if(!c||!c.width)return;
  var x=c.getContext('2d'),W=c.width,H=c.height,dpr=window.devicePixelRatio||1;
  x.clearRect(0,0,W,H);
  var mMax=Math.max(crash.m*1.15,2);
  x.font=(10*dpr)+'px system-ui'; x.textAlign='right';
  [1,1.5,2,3,5,10,25,50,100].filter(function(v){return v<=mMax;}).forEach(function(v){
    var y=crashY(v,mMax,H);
    x.strokeStyle='rgba(255,255,255,.05)'; x.lineWidth=1*dpr;
    x.beginPath();x.moveTo(0,y);x.lineTo(W,y);x.stroke();
    x.fillStyle='rgba(255,255,255,.28)'; x.fillText(v+'×',W-8*dpr,y-4*dpr); });
  if(crash.phase==='bet'){
    var bob=Math.sin(Date.now()/300)*4*dpr;
    x.font=(30*dpr)+'px serif'; x.textAlign='center';
    x.fillText('🚀',W*0.12,H*0.8+bob);
    return; }
  var el=Date.now()-roundStart(roundNumber());
  var tNow=crash.phase==='fly'?Math.max(0,el-CR2.BET):(4500*Math.log(crash.m)||0);
  var N=70, pts=[];
  for(var i=0;i<=N;i++){ var tt=tNow*i/N, m=Math.exp(tt/9000);
    pts.push([W*0.05+(W*0.88)*(i/N), crashY(Math.min(m,mMax),mMax,H)]); }
  var tip=pts[N], prev=pts[N-1]||tip; var ang=Math.atan2(tip[1]-prev[1],tip[0]-prev[0]);
  if(crash.phase==='fly'){
    var ft=Date.now()/40;
    for(var fi=1;fi<=12;fi++){
      var fd=fi*11*dpr + Math.sin(ft+fi)*3*dpr;
      var fr=(12-fi)*1.6*dpr + Math.sin(ft*1.7+fi)*1.2*dpr;
      x.fillStyle= fi<4 ? 'rgba(255,230,140,'+(0.7-fi*0.05)+')' : (fi<8 ? 'rgba(251,146,60,'+(0.55-fi*0.04)+')' : 'rgba(239,68,68,'+(0.35-fi*0.02)+')');
      x.beginPath(); x.arc(tip[0]-Math.cos(ang)*fd, tip[1]-Math.sin(ang)*fd, Math.max(fr,0.5), 0, 7); x.fill();
    }
    x.save(); x.translate(tip[0],tip[1]); x.rotate(ang);
    x.font=(26*dpr)+'px serif'; x.textAlign='center'; x.textBaseline='middle';
    x.fillText('🚀',6*dpr,0); x.restore();
  } else { x.font=(30*dpr)+'px serif'; x.textAlign='center'; x.fillText('💥',tip[0],tip[1]); }
  crash.sparks=(crash.sparks||[]).filter(function(s){return s.l>0;});
  crash.sparks.forEach(function(s){ s.x+=s.vx;s.y+=s.vy;s.vy+=0.15*dpr;s.l-=0.03;
    x.fillStyle='rgba(239,68,68,'+Math.max(s.l,0)+')';
    x.beginPath();x.arc(s.x,s.y,2.5*dpr,0,7);x.fill(); });
}

addEventListener('resize', function(){ try{crashResize();}catch(e){} });
(function(){ var a0=window.activateTab; if(a0){ window.activateTab=function(t){ var r=a0(t); if(t==='crash'){ setTimeout(crashResize,60); setTimeout(crashResize,300); } return r; }; } })();
setTimeout(function(){ try{crashResize();}catch(e){} },200);

// ===== v38.4: heal-подключение к серверу + перерисовка =====
(function(){
  var tries=0;
  function heal(){
    if(S.serverMode){ try{renderSection(activeTab());}catch(e){} return; }
    if(tries++>20) return;
    apiR('/api/me').then(function(me){
      if(me&&me.tg_id){
        S.tgId=me.tg_id; S.balance=Number(me.balance)||0; S.inv=Array.isArray(me.inv)?me.inv:[];
        S.stats=Object.assign(DEF().stats,me.stats||{}); S.xp=Number(me.xp)||0;
        S.refs=me.ref_count||0; S.isAdmin=!!me.admin; S.createdAt=me.created_at||S.createdAt;
        if(!S.tgName&&me.first_name)S.tgName=me.first_name;
        S.serverMode=true; saveLocal(); renderHeader();
        try{renderSection(activeTab());}catch(e){}
        
      } else { setTimeout(heal,5000); }
    });
  }
  setTimeout(heal,4000);
})();

// v53: plinkoDrop wrap — анти-лаг лимит шаров
(function(){ var pd=window.plinkoDrop; if(pd){ window.plinkoDrop=function(){
  if(document.querySelectorAll('.pl-ball.on').length>=6){ if(window.toast) toast('⏳ Подожди, пока шары упадут','bad'); return; }
  return pd.apply(this,arguments); }; } })();

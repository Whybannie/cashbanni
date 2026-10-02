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
      crash.crashPos=null; crash.crashTime=null; // 🔥 Сбрасываем время краша для нового раунда
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
        if(!crash.crashTime || crash.crashTime===0) crash.crashTime=Date.now(); // 🔥 Сохраняем время краша один раз
        // 🔥 Сохраняем координаты взрыва чтобы ракета не исчезала
        if(!crash.crashPos){
          var cc=$('crashCanvas');
          if(cc){
            var W=cc.width, H=cc.height, dpr=window.devicePixelRatio||1;
            var mMax=Math.max(crash.cp*1.15,2);
            var t=Date.now()-roundStart(roundNumber())-CR2.BET;
            var N=70, pts=[];
            for(var i=0;i<=N;i++){ var tt=t*i/N, m=Math.exp(tt/9000);
              pts.push([W*0.05+(W*0.88)*(i/N), crashY(Math.min(m,mMax),mMax,H)]); }
            crash.crashPos={x:pts[N][0],y:pts[N][1],mMax:mMax};
          }
        }
      if(!crash.seen)crash.seen={}; crash.seen[rn]=crash.cp;
      var ks=Object.keys(crash.seen); if(ks.length>12){ delete crash.seen[ks[0]]; }
        setT('crashMult', crash.cp.toFixed(2)+'×');
        var cm2=$('crashMult'); if(cm2) cm2.className='crash-mult red';
        setH('crashStatus','💥 КРАШ на '+crash.cp.toFixed(2)+'× · новый раунд скоро');
        setT('heroCrashState','Краш '+crash.cp.toFixed(2)+'×');
        if(crash.myBet>0 && !crash.cashed && crash._betRnd===rn && crash._lostRnd!==rn){ crash._lostRnd=rn; crash.myBet=0; sfx.crash(); toast('💥 Краш! −⭐'+crash.myBet,'bad'); }
        if(crash._sparkRnd!==rn){ 
          crash._sparkRnd=rn; 
          var cc=$('crashCanvas'); 
          var dpr=window.devicePixelRatio||1;
          // 🔥 Искры летят из позиции взрыва, а не из угла
          var sx, sy;
          if(crash.crashPos){ sx=crash.crashPos.x; sy=crash.crashPos.y; }
          else { sx=cc.width*0.85; sy=cc.height*0.25; }
          if(cc) for(var i=0;i<26;i++) crash.sparks.push({x:sx,y:sy,vx:rnd(-4,4)*dpr,vy:rnd(-4,4)*dpr,l:1}); 
        }
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
function crashDraw(){ 
  var c=$('crashCanvas'); 
  if(!c||!c.width)return;
  var x=c.getContext('2d'),W=c.width,H=c.height,dpr=window.devicePixelRatio||1;
  var now=Date.now();
  
  x.clearRect(0,0,W,H);
  
  // === ФОН: ЧЁРНЫЙ КОСМОС (без синевы) ===
  var grad=x.createLinearGradient(0,0,0,H);
  grad.addColorStop(0,'#000000'); 
  grad.addColorStop(0.5,'#020204'); 
  grad.addColorStop(1,'#050508');
  x.fillStyle=grad; 
  x.fillRect(0,0,W,H);
  
  // Туманности - очень слабые (только намёк)
  var neb1=x.createRadialGradient(W*0.2,H*0.25,0,W*0.2,H*0.25,W*0.5);
  neb1.addColorStop(0,'rgba(30,10,50,0.3)'); 
  neb1.addColorStop(1,'rgba(0,0,0,0)');
  x.fillStyle=neb1; 
  x.fillRect(0,0,W,H);
  
  var neb2=x.createRadialGradient(W*0.8,H*0.75,0,W*0.8,H*0.75,W*0.45);
  neb2.addColorStop(0,'rgba(10,20,40,0.25)'); 
  neb2.addColorStop(1,'rgba(0,0,0,0)');
  x.fillStyle=neb2; 
  x.fillRect(0,0,W,H);
  
  // === ЗВЁЗДЫ: чисто белые, параллакс ===
  if(!crash._stars){
    crash._stars=[];
    for(var si=0;si<180;si++){
      var layer = si < 50 ? 3 : (si < 120 ? 2 : 1);
      crash._stars.push({
        x: Math.random(),
        y: Math.random(),
        s: Math.random()*1.0 + 0.2 + layer*0.15,
        speed: (0.00015 + Math.random()*0.00035) * layer,
        phase: Math.random()*Math.PI*2,
        layer: layer
      });
    }
  }
  
  var flySpeed = crash.phase==='fly' ? 1+Math.min(crash.m, 8)*0.4 : 1;
  crash._stars.forEach(function(st){
    st.y += st.speed * flySpeed;
    if(st.y > 1.05){
      st.y = -0.05;
      st.x = Math.random();
    }
    var twk = 0.65 + Math.sin(now/450 + st.phase) * 0.35;
    var alpha = (0.3 + st.s*0.25) * twk;
    // Только белые оттенки
    var brightness = 200 + Math.floor(st.s*55);
    x.fillStyle = 'rgba('+brightness+','+brightness+','+brightness+','+alpha.toFixed(3)+')';
    x.beginPath(); 
    x.arc(st.x*W, st.y*H, st.s*dpr, 0, Math.PI*2); 
    x.fill();
  });
  
  // === СЕТКА МНОЖИТЕЛЕЙ ===
  var mMax = Math.max(crash.m*1.15, 2);
  x.font = (10*dpr)+'px system-ui'; 
  x.textAlign = 'right';
  [1, 1.5, 2, 3, 5, 10, 25, 50, 100].filter(function(v){return v<=mMax;}).forEach(function(v){
    var y = crashY(v, mMax, H);
    x.strokeStyle = 'rgba(255,255,255,.04)'; 
    x.lineWidth = 1*dpr;
    x.beginPath(); x.moveTo(0, y); x.lineTo(W, y); x.stroke();
    x.fillStyle = 'rgba(255,255,255,.25)'; 
    x.fillText(v+'×', W-8*dpr, y-4*dpr);
  });
  
  // === КРУТАЯ ДЕТАЛИЗИРОВАННАЯ РАКЕТА ===
  function drawRocket(px, py, rk, tilt, fireOn){
    x.save();
    x.translate(px, py);
    if(tilt) x.rotate(tilt);
    
    // Выхлоп - только когда летит
    if(fireOn){
      var flick = 1 + Math.sin(now/45) * 0.22;
      var flameLen = rk * 1.4 * flick;
      
      // Внешний огонь
      var fg1 = x.createLinearGradient(-rk*0.22, 0, -rk*0.22-flameLen, 0);
      fg1.addColorStop(0, 'rgba(255,230,140,0.95)');
      fg1.addColorStop(0.25, 'rgba(255,160,40,0.85)');
      fg1.addColorStop(1, 'rgba(255,40,20,0)');
      x.fillStyle = fg1;
      x.beginPath();
      x.moveTo(-rk*0.2, -rk*0.25);
      x.quadraticCurveTo(-rk*0.22-flameLen, 0, -rk*0.2, rk*0.25);
      x.closePath(); 
      x.fill();
      
      // Внутренний (жёлтый)
      var fg2 = x.createLinearGradient(-rk*0.18, 0, -rk*0.18-flameLen*0.6, 0);
      fg2.addColorStop(0, 'rgba(255,255,240,1)');
      fg2.addColorStop(1, 'rgba(255,220,100,0)');
      x.fillStyle = fg2;
      x.beginPath();
      x.moveTo(-rk*0.18, -rk*0.13);
      x.quadraticCurveTo(-rk*0.18-flameLen*0.6, 0, -rk*0.18, rk*0.13);
      x.closePath(); 
      x.fill();
    }
    
    // КРЫЛЬЯ - большие, с детализацией
    x.fillStyle = '#c1121f';
    x.beginPath(); 
    x.moveTo(-rk*0.15, -rk*0.15); 
    x.lineTo(-rk*0.5, -rk*0.55); 
    x.lineTo(-rk*0.35, -rk*0.55);
    x.lineTo(-rk*0.15, -rk*0.35); 
    x.closePath(); 
    x.fill();
    x.beginPath(); 
    x.moveTo(-rk*0.15, rk*0.15); 
    x.lineTo(-rk*0.5, rk*0.55); 
    x.lineTo(-rk*0.35, rk*0.55);
    x.lineTo(-rk*0.15, rk*0.35); 
    x.closePath(); 
    x.fill();
    
    // Блик на крыльях
    x.fillStyle = 'rgba(255,255,255,0.15)';
    x.beginPath();
    x.moveTo(-rk*0.2, -rk*0.2);
    x.lineTo(-rk*0.4, -rk*0.4);
    x.lineTo(-rk*0.35, -rk*0.38);
    x.lineTo(-rk*0.2, -rk*0.22);
    x.closePath();
    x.fill();
    
    // КОРПУС - белый с металлическим отливом
    var bg = x.createLinearGradient(0, -rk*0.3, 0, rk*0.3);
    bg.addColorStop(0, '#f5f5f7');
    bg.addColorStop(0.5, '#ffffff');
    bg.addColorStop(1, '#c8c8d0');
    x.fillStyle = bg;
    x.beginPath();
    x.moveTo(rk*0.55, 0);
    x.quadraticCurveTo(rk*0.3, -rk*0.32, -rk*0.3, -rk*0.26);
    x.lineTo(-rk*0.3, rk*0.26);
    x.quadraticCurveTo(rk*0.3, rk*0.32, rk*0.55, 0);
    x.closePath(); 
    x.fill();
    
    // Тень на корпусе
    x.fillStyle = 'rgba(0,0,0,0.08)';
    x.beginPath();
    x.moveTo(rk*0.5, rk*0.08);
    x.quadraticCurveTo(rk*0.2, rk*0.3, -rk*0.3, rk*0.26);
    x.lineTo(-rk*0.3, rk*0.18);
    x.quadraticCurveTo(rk*0.2, rk*0.22, rk*0.5, rk*0.08);
    x.closePath();
    x.fill();
    
    // НОС - красный
    x.fillStyle = '#c1121f';
    x.beginPath();
    x.moveTo(rk*0.55, 0);
    x.quadraticCurveTo(rk*0.4, -rk*0.22, rk*0.25, -rk*0.22);
    x.lineTo(rk*0.25, rk*0.22);
    x.quadraticCurveTo(rk*0.4, rk*0.22, rk*0.55, 0);
    x.closePath(); 
    x.fill();
    
    // Блик на носу
    x.fillStyle = 'rgba(255,255,255,0.3)';
    x.beginPath();
    x.moveTo(rk*0.5, -rk*0.05);
    x.quadraticCurveTo(rk*0.38, -rk*0.18, rk*0.3, -rk*0.18);
    x.lineTo(rk*0.3, -rk*0.1);
    x.quadraticCurveTo(rk*0.38, -rk*0.1, rk*0.5, -rk*0.05);
    x.closePath();
    x.fill();
    
    // ОКНО - синее с бликом
    x.fillStyle = '#0d1b2a';
    x.beginPath(); 
    x.arc(rk*0.05, 0, rk*0.14, 0, Math.PI*2); 
    x.fill();
    x.strokeStyle = '#6c757d'; 
    x.lineWidth = rk*0.05; 
    x.stroke();
    x.fillStyle = '#1b263b';
    x.beginPath(); 
    x.arc(rk*0.05, 0, rk*0.12, 0, Math.PI*2); 
    x.fill();
    // Блик
    x.fillStyle = 'rgba(255,255,255,0.7)';
    x.beginPath(); 
    x.arc(rk*0.0, -rk*0.05, rk*0.05, 0, Math.PI*2); 
    x.fill();
    
    // Полоски на корпусе (детализация)
    x.fillStyle = 'rgba(193,18,31,0.8)';
    x.fillRect(-rk*0.1, -rk*0.05, rk*0.1, rk*0.02);
    x.fillRect(-rk*0.1, rk*0.03, rk*0.1, rk*0.02);
    
    x.restore();
  }
  
  // === ФАЗА BET ===
  if(crash.phase==='bet'){
    var bob = Math.sin(now/300) * 4 * dpr;
    var rk = Math.max(22*dpr, Math.min(38*dpr, H*0.18));
    drawRocket(W*0.12, H*0.82 + bob, rk, 0, false);
    
    // Текст "СТАВКИ"
    x.font = 'bold '+(14*dpr)+'px system-ui';
    x.fillStyle = 'rgba(255,255,255,0.8)';
    x.textAlign = 'center';
    x.fillText('СТАВКИ ОТКРЫТЫ', W*0.5, H*0.15);
    return;
  }
  
  // === ПОЗИЦИЯ РАКЕТЫ ===
  var el = now - roundStart(roundNumber());
  var tNow = crash.phase==='fly' ? Math.max(0, el-CR2.BET) : (4500*Math.log(crash.m)||0);
  var N = 70, pts = [];
  for(var i=0; i<=N; i++){ 
    var tt = tNow * i / N;
    var m = Math.exp(tt/9000);
    pts.push([W*0.05 + (W*0.88)*(i/N), crashY(Math.min(m, mMax), mMax, H)]); 
  }
  var tip = pts[N];
  var prev = pts[N-1] || tip;
  
  // Защита от NaN и выхода за границы
  if(isNaN(tip[0]) || isNaN(tip[1])){
    tip = [W*0.8, H*0.3];
    prev = [W*0.7, H*0.35];
  }
  tip[0] = Math.max(rk||40, Math.min(W-(rk||40), tip[0]));
  tip[1] = Math.max(rk||40, Math.min(H-(rk||40), tip[1]));
  
  var dx = tip[0] - prev[0];
  var dy = tip[1] - prev[1];
  var ang = Math.atan2(dy, dx);
  
  if(crash.phase === 'fly'){
    var rk = Math.max(22*dpr, Math.min(42*dpr, H*0.22));
    var wobble = Math.sin(now/500) * 0.03;
    // Ограничиваем позицию ракеты чтобы не уходила за экран
    var safeX = Math.max(rk*1.5, Math.min(W - rk*1.5, tip[0]));
    var safeY = Math.max(rk*1.5, Math.min(H - rk*1.5, tip[1]));
    drawRocket(safeX, safeY, rk, ang + wobble, true);
  } else if(crash.phase === 'crash') {
    // === ФАЗА CRASH: показываем взрыв и результат ===
    var ex, ey;
    if(crash.crashPos){
      ex = crash.crashPos.x; 
      ey = crash.crashPos.y;
    } else {
      ex = Math.max(40, Math.min(W - 40, tip[0]));
      ey = Math.max(40, Math.min(H - 40, tip[1]));
    }
    
    var tExplode = crash.crashTime ? now - crash.crashTime : 0;
    var explodeProgress = Math.min(1, tExplode / 1000);
    
    // Расширяющееся кольцо взрыва
    var blastR = (20 + explodeProgress * 50) * dpr;
    var fadeOut = 1 - explodeProgress;
    
    // Внешнее кольцо (огненное)
    var blastG = x.createRadialGradient(ex, ey, blastR*0.5, ex, ey, blastR*2);
    blastG.addColorStop(0, 'rgba(255,180,60,'+(fadeOut*0.6)+')');
    blastG.addColorStop(0.5, 'rgba(239,68,68,'+(fadeOut*0.4)+')');
    blastG.addColorStop(1, 'rgba(100,20,20,0)');
    x.fillStyle = blastG;
    x.beginPath(); 
    x.arc(ex, ey, blastR*2, 0, Math.PI*2); 
    x.fill();
    
    // Ядро
    var coreR = blastR * 0.5 * (1 - explodeProgress*0.6);
    x.fillStyle = 'rgba(255,240,200,'+fadeOut+')';
    x.beginPath(); 
    x.arc(ex, ey, coreR, 0, Math.PI*2); 
    x.fill();
    
    // Текст результата
    if(explodeProgress > 0.3){
      x.font = 'bold '+(24*dpr)+'px system-ui';
      x.fillStyle = 'rgba(239,68,68,'+Math.min(1, (explodeProgress-0.3)*2)+')';
      x.textAlign = 'center';
      x.textBaseline = 'middle';
      x.fillText('КРАШ '+crash.cp.toFixed(2)+'×', W*0.5, H*0.2);
    }
  }
  
  // === ИСКРЫ ===
  crash.sparks = (crash.sparks||[]).filter(function(s){return s.l>0;});
  crash.sparks.forEach(function(s){ 
    s.x += s.vx; 
    s.y += s.vy; 
    s.vy += 0.15*dpr; 
    s.l -= 0.025;
    x.fillStyle = 'rgba(255,'+Math.floor(100+s.l*155)+',40,'+Math.max(s.l,0)+')';
    x.beginPath(); 
    x.arc(s.x, s.y, (2+s.l*2)*dpr, 0, Math.PI*2); 
    x.fill(); 
  });
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


// ===== v73: оптимизация - остановка Crash при неактивной вкладке =====
(function(){
  var crashRunning = false;
  document.addEventListener('visibilitychange', function(){
    if(document.hidden){
      crashRunning = false;
    } else {
      if(!crashRunning){
        crashRunning = true;
        try{ crashLoop(); }catch(e){}
      }
    }
  });
})();

// ===== DOGS v6 — таймер ставок, полноэкранный победитель, фикс границ =====
console.log('[DOGS] v6 loaded');
var DOGS = [
  {id:0,name:'Рекс',color:'#ef4444',mult:2.0,chance:0.24},
  {id:1,name:'Белка',color:'#f97316',mult:2.3,chance:0.20},
  {id:2,name:'Гром',color:'#3b82f6',mult:2.7,chance:0.16},
  {id:3,name:'Луна',color:'#a3a3a3',mult:3.2,chance:0.13},
  {id:4,name:'Чарли',color:'#eab308',mult:4.0,chance:0.10},
  {id:5,name:'Никс',color:'#8b5cf6',mult:5.5,chance:0.08},
  {id:6,name:'Зефир',color:'#f8fafc',mult:8.0,chance:0.06},
  {id:7,name:'Алмаз',color:'#22d3ee',mult:15.0,chance:0.03}
];
var LANE_CENTERS=[0.206,0.289,0.372,0.456,0.539,0.622,0.706,0.789];
var ZOOM=4;
var T_BET=7000, T_COUNT=2700, T_RESULT=4200;
var dogs={phase:'bet',phaseStart:Date.now(),bet:20,selected:null,myDog:null,myBet:0,
  winner:null,pos:[0,0,0,0,0,0,0,0],finT:[],t0:0,hist:[],cam:0,round:1,active:false,
  _settled:false,_lastCount:99,_lastTenth:-1};

function dogsDpr(){return Math.min(window.devicePixelRatio||1,2);}
function dogsTrackEl(){var c=$('dogsCanvas');return c?c.parentElement:null;}
function dogsResize(){
  var t=dogsTrackEl(),c=$('dogsCanvas');
  if(!t||!c)return false;
  var r=t.getBoundingClientRect();
  if(r.width<10||r.height<10)return false;
  var dpr=dogsDpr();
  var w=Math.round(r.width*dpr),h=Math.round(r.height*dpr);
  if(c.width!==w||c.height!==h){c.width=w;c.height=h;}
  return true;
}
function dogsSetActive(){
  var sec=$('sec-dogs');
  dogs.active=!!(sec&&sec.classList.contains('active'));
}
function dogsCamTarget(){
  var c=$('dogsCanvas');if(!c||!c.width)return 0;
  var vw=c.width/dogsDpr(),worldW=vw*ZOOM;
  if(dogs.phase==='bet'||dogs.phase==='count')return 0;
  if(dogs.phase==='result')return worldW-vw;
  var lead=0;
  for(var i=0;i<8;i++)lead=Math.max(lead,dogs.pos[i]);
  var leadX=worldW*0.08+(worldW*0.84)*lead;
  return Math.max(0,Math.min(worldW-vw,leadX-vw*0.5));
}
// ===== ТАЙМЕР СТАВОК (пилюля сверху трека) =====
function dogsTimerUpdate(sec){
  var t=$('dogsTimer');
  if(!t){
    var tr=dogsTrackEl();if(!tr)return;
    t=document.createElement('div');t.id='dogsTimer';t.className='dogs-timer';
    tr.appendChild(t);
  }
  if(dogs.phase==='bet'){
    t.classList.add('show');
    var tenth=Math.ceil(sec*10);
    if(tenth!==dogs._lastTenth){
      dogs._lastTenth=tenth;
      t.innerHTML='🎰 СТАВКИ ОТКРЫТЫ · <b>'+sec.toFixed(1)+' с</b>';
    }
  }else{
    t.classList.remove('show');
  }
}
// ===== ПОЛНОЭКРАННЫЙ МОДАЛ ПОБЕДИТЕЛЯ =====
function showWinModal(w,lineHtml){
  var m=$('dwModal');
  if(!m){
    m=document.createElement('div');m.id='dwModal';m.className='dw-modal';
    m.onclick=function(){hideWinModal();};
    document.body.appendChild(m);
  }
  var d=DOGS[w];
  m.innerHTML='<div class="dwm-card">'+
    '<div class="dwm-crown">👑</div>'+
    '<div class="dwm-title">ПОБЕДИТЕЛЬ РАУНДА #'+dogs.round+'</div>'+
    '<div class="dwm-dog"><span class="dwm-num" style="background:'+d.color+';color:'+(w===6?'#333':'#fff')+'">'+(w+1)+'</span>'+
    '<span class="dwm-name">'+d.name+'</span></div>'+
    '<div class="dwm-mult">×'+d.mult.toFixed(1)+'</div>'+
    lineHtml+
    '<div class="dwm-hint">нажми, чтобы продолжить</div></div>';
  m.classList.add('show');
}
function hideWinModal(){var m=$('dwModal');if(m)m.classList.remove('show');}

function dogsBet(d){if(dogs.phase!=='bet'||dogs.myDog!==null)return;dogs.bet=Math.max(5,dogs.bet+d);syncDogsUI();sfx.click();}
function dogsSet(v){if(dogs.phase!=='bet'||dogs.myDog!==null)return;dogs.bet=Math.max(5,v);syncDogsUI();sfx.click();}
function dogsSelect(i){
  if(dogs.phase!=='bet'||dogs.myDog!==null)return;
  dogs.selected=(dogs.selected===i)?null:i;
  sfx.click();renderDogsOdds();syncDogsUI();
}
function renderDogsOdds(){
  var el=$('dogsOdds');if(!el)return;
  el.className='dogs-odds'+(dogs.phase==='bet'&&dogs.myDog===null?' open':'');
  el.innerHTML=DOGS.map(function(d){
    var txt=(d.id===6)?'#333':'#fff';
    var sel=(dogs.selected===d.id)||(dogs.myDog===d.id);
    return '<div class="dog-odd'+(sel?' sel':'')+'" onclick="dogsSelect('+d.id+')">'+
      '<span class="do-num" style="background:'+d.color+';color:'+txt+'">'+(d.id+1)+'</span>'+
      '<span class="do-name">'+d.name+'</span>'+
      '<span class="do-mult">×'+d.mult.toFixed(1)+'</span></div>';
  }).join('');
}
function renderDogsHist(){
  var el=$('dogsHistRow');if(!el)return;
  if(!dogs.hist.length){el.innerHTML='<span style="opacity:.4">—</span>';return;}
  el.innerHTML=dogs.hist.slice(-8).map(function(h){
    var d=DOGS[h.id];
    return '<span style="background:'+d.color+'22;color:'+d.color+';border:1px solid '+d.color+'55">'+d.name+' '+h.mult.toFixed(1)+'×</span>';
  }).join('');
}
function syncDogsUI(){
  setT('dogsBetVal',dogs.bet);
  var pot=$('dogsPotential');
  var showDog=(dogs.myDog!==null)?dogs.myDog:dogs.selected;
  if(pot)pot.textContent=showDog!==null?fmt(Math.floor(dogs.bet*DOGS[showDog].mult)):'0';
  var btn=$('dogsBtn');if(!btn)return;
  if(dogs.phase==='bet'){
    if(dogs.myDog!==null){btn.textContent='✅ СТАВКА ПРИНЯТА · '+DOGS[dogs.myDog].name;btn.className='btn dogs-btn wait';}
    else if(dogs.selected===null){btn.textContent='ВЫБЕРИ СОБАКУ';btn.className='btn dogs-btn wait';}
    else{btn.textContent='ПОСТАВИТЬ ⭐'+dogs.bet+' · '+DOGS[dogs.selected].name;btn.className='btn dogs-btn go';}
  }else if(dogs.phase==='count'){btn.textContent='🔒 СТАВКИ ЗАКРЫТЫ';btn.className='btn dogs-btn wait';}
  else if(dogs.phase==='race'||dogs.phase==='finish'){btn.textContent='🏁 ГОНКА ИДЁТ';btn.className='btn dogs-btn wait';}
  else{btn.textContent='⏳ СЛЕДУЮЩИЙ РАУНД';btn.className='btn dogs-btn wait';}
}
function dogsOverlay(html){
  var o=$('dogsOverlay');if(!o)return;
  if(html===null){o.classList.remove('show');o.innerHTML='';}
  else{o.innerHTML=html;o.classList.add('show');}
}
function pickWinner(){
  var r=Math.random(),sum=0;
  for(var i=0;i<8;i++){sum+=DOGS[i].chance;if(r<=sum)return i;}
  return 0;
}
function dogsStart(){
  if(dogs.phase!=='bet')return toast('Подожди окно ставок','bad');
  if(dogs.myDog!==null)return toast('Ставка уже принята','bad');
  if(dogs.selected===null)return toast('Сначала выбери собаку','bad');
  if(dogs.bet<5)dogs.bet=5;
  if(S.balance<dogs.bet)return toast('Недостаточно Stars ⭐','bad');
  S.balance-=dogs.bet;save();renderHeader();
  dogs.myDog=dogs.selected;dogs.myBet=dogs.bet;
  sfx.win();
  renderDogsOdds();syncDogsUI();
}
function prepareRace(){
  dogs.winner=pickWinner();
  var T=7.5+Math.random()*1.5;
  dogs.finT=[];
  for(var i=0;i<8;i++)dogs.finT.push(i===dogs.winner?T:T+0.3+Math.random()*2.6);
  dogs.pos=[0,0,0,0,0,0,0,0];
  dogs._settled=false;
}
function settleBets(){
  if(dogs._settled)return;
  dogs._settled=true;
  var w=dogs.winner;
  dogs.hist.push({id:w,mult:DOGS[w].mult});
  renderDogsHist();
  var line;
  if(dogs.myDog!==null){
    if(dogs.myDog===w){
      var win=Math.floor(dogs.myBet*DOGS[w].mult);
      S.balance+=win;save();renderHeader();sfx.win();confetti(100);
      line='<div class="dwm-line win">ТВОЯ СТАВКА СЫГРАЛА: +⭐'+fmt(win)+'</div>';
      toast('🏆 '+DOGS[w].name+' первый! +⭐'+fmt(win),'good');
    }else{
      sfx.crash();
      line='<div class="dwm-line lose">СТАВКА ⭐'+dogs.myBet+' СГОРЕЛА</div>';
      toast(DOGS[w].name+' победил. Не повезло','bad');
    }
  }else{
    line='<div class="dwm-line none">В этом раунде ты не ставил</div>';
  }
  showWinModal(w,line);
}
function resetForBet(){
  dogs.round++;
  dogs.phase='bet';dogs.phaseStart=Date.now();
  dogs.selected=null;dogs.myDog=null;dogs.myBet=0;
  dogs.pos=[0,0,0,0,0,0,0,0];
  dogs._lastTenth=-1;
  hideWinModal();
  dogsOverlay(null);
  renderDogsOdds();syncDogsUI();
}
// ===== ГЛАВНЫЙ ЦИКЛ =====
function dogsLoopAll(){
  requestAnimationFrame(dogsLoopAll);
  dogsSetActive();
  if(!dogs.active)return;
  try{
    var now=Date.now(),el=now-dogs.phaseStart;
    if(dogs.phase==='bet'){
      dogsTimerUpdate(Math.max(0,(T_BET-el)/1000));
      if(el>=T_BET){prepareRace();dogs.phase='count';dogs.phaseStart=now;dogs._lastCount=99;syncDogsUI();renderDogsOdds();}
    }else if(dogs.phase==='count'){
      dogsTimerUpdate(0);
      var n=3-Math.floor(el/900);
      if(n!==dogs._lastCount&&n>=1){dogs._lastCount=n;dogsOverlay('<div class="ov-big">'+n+'</div><div class="ov-sub">Ставки закрыты</div>');sfx.tick();}
      if(el>=T_COUNT){dogsOverlay(null);dogs.phase='race';dogs.phaseStart=now;dogs.t0=now;syncDogsUI();}
    }else if(dogs.phase==='race'){
      dogsTimerUpdate(0);
      var t=(now-dogs.t0)/1000;
      for(var i=0;i<8;i++){
        var p=Math.min(1,t/dogs.finT[i]);
        var w=(p>0.04&&p<0.96)?0.02*Math.sin(t*2.3+i*1.7)*(1-p):0;
        dogs.pos[i]=Math.max(0,Math.min(1,p+w));
      }
      if(dogs.pos[dogs.winner]>=1){dogs.phase='finish';dogs.phaseStart=now;sfx.tick();}
    }else if(dogs.phase==='finish'){
      dogsTimerUpdate(0);
      var t2=(now-dogs.t0)/1000;
      for(var j=0;j<8;j++){
        var p2=Math.min(1,t2/dogs.finT[j]);
        dogs.pos[j]=Math.max(dogs.pos[j],Math.min(1,p2));
      }
      if(el>=1500){dogs.phase='result';dogs.phaseStart=now;settleBets();syncDogsUI();}
    }else if(dogs.phase==='result'){
      dogsTimerUpdate(0);
      if(el>=T_RESULT)resetForBet();
    }
    dogs.cam+=(dogsCamTarget()-dogs.cam)*0.08;
    dogsDraw();
  }catch(e){}
}
// ===== ОТРИСОВКА =====
function dogsDraw(){
  var c=$('dogsCanvas');if(!c)return;
  if(!c.width){if(!dogsResize())return;}
  var x=c.getContext('2d'),W=c.width,H=c.height,dpr=dogsDpr(),vw=W/dpr;
  var now=Date.now();
  x.clearRect(0,0,W,H);
  var worldW=vw*ZOOM,startWX=worldW*0.08,finWX=worldW*0.92;
  var t=dogsTrackEl();
  if(t)t.style.backgroundPositionX=(-dogs.cam)+'px';
  for(var i=0;i<8;i++){
    var ly=LANE_CENTERS[i]*H;
    var gx=(startWX-30-dogs.cam)*dpr;
    if(gx>-40*dpr&&gx<W+40*dpr){
      x.fillStyle='rgba(0,0,0,.6)';
      x.beginPath();x.arc(gx,ly,10*dpr,0,7);x.fill();
      x.fillStyle=DOGS[i].color;
      x.beginPath();x.arc(gx,ly,8*dpr,0,7);x.fill();
      x.fillStyle=(i===6)?'#333':'#fff';
      x.font='bold '+(10*dpr)+'px system-ui';x.textAlign='center';x.textBaseline='middle';
      x.fillText(String(i+1),gx,ly+1*dpr);
    }
  }
  for(i=0;i<8;i++){
    var wx=startWX+(finWX-startWX)*dogs.pos[i];
    var sx=(wx-dogs.cam)*dpr;
    if(sx<-90*dpr||sx>W+90*dpr)continue;
    var sy=LANE_CENTERS[i]*H;
    var running=(dogs.phase==='race'||dogs.phase==='finish')&&dogs.pos[i]<1;
    if(dogs.myDog===i){
      x.strokeStyle='rgba(74,222,128,.9)';x.lineWidth=2*dpr;
      x.setLineDash([4*dpr,3*dpr]);
      x.beginPath();x.ellipse(sx,sy+8*dpr,30*dpr,10*dpr,0,0,7);x.stroke();
      x.setLineDash([]);
    }else if(dogs.selected===i&&dogs.phase==='bet'){
      x.strokeStyle='rgba(251,191,36,.9)';x.lineWidth=2*dpr;
      x.setLineDash([4*dpr,3*dpr]);
      x.beginPath();x.ellipse(sx,sy+8*dpr,30*dpr,10*dpr,0,0,7);x.stroke();
      x.setLineDash([]);
    }
    drawDog(x,sx,sy,H*0.055,DOGS[i],i,running,now);
  }
}
function drawDog(x,cx,cy,s,dog,idx,running,now){
  if(s<4)return;
  var ph=running?now/85+idx*1.1:0;
  var bob=running?Math.sin(ph*2)*s*0.06:0;
  x.save();x.translate(cx,cy+bob);
  x.fillStyle='rgba(0,0,0,.35)';
  x.beginPath();x.ellipse(0,s*0.62,s*0.62,s*0.1,0,0,7);x.fill();
  if(running){
    for(var p=0;p<3;p++){
      x.fillStyle='rgba(210,180,140,'+(0.3-p*0.08).toFixed(2)+')';
      x.beginPath();
      x.arc(-s*0.55-p*s*0.22,s*0.5+Math.sin(now/50+p)*s*0.08,s*(0.07+p*0.03),0,7);
      x.fill();
    }
  }
  var legF=running?Math.sin(ph)*0.85:0.15;
  var legB=running?Math.sin(ph+Math.PI)*0.85:-0.15;
  x.strokeStyle=dog.color;x.lineWidth=s*0.09;x.lineCap='round';
  x.beginPath();x.moveTo(-s*0.55,-s*0.05);
  x.quadraticCurveTo(-s*0.85,-s*0.25+Math.sin(now/140+idx)*s*0.12,-s*0.95,-s*0.45);x.stroke();
  x.lineWidth=s*0.11;
  x.save();x.translate(-s*0.35,s*0.15);x.rotate(legB*0.7);
  x.beginPath();x.moveTo(0,0);x.lineTo(-s*0.12,s*0.42);x.stroke();x.restore();
  x.save();x.translate(-s*0.28,s*0.15);x.rotate(-legB*0.7);
  x.beginPath();x.moveTo(0,0);x.lineTo(s*0.05,s*0.44);x.stroke();x.restore();
  x.fillStyle=dog.color;
  x.beginPath();
  x.moveTo(-s*0.55,-s*0.05);
  x.quadraticCurveTo(-s*0.2,-s*0.38,s*0.25,-s*0.28);
  x.quadraticCurveTo(s*0.5,-s*0.22,s*0.55,-s*0.05);
  x.quadraticCurveTo(s*0.3,s*0.28,-s*0.15,s*0.25);
  x.quadraticCurveTo(-s*0.45,s*0.2,-s*0.55,-s*0.05);
  x.closePath();x.fill();
  x.fillStyle='rgba(0,0,0,.18)';
  x.beginPath();x.ellipse(0,s*0.16,s*0.42,s*0.1,0,0,7);x.fill();
  x.fillStyle='rgba(255,255,255,.92)';
  x.beginPath();
  if(x.roundRect)x.roundRect(-s*0.18,-s*0.3,s*0.34,s*0.34,s*0.06);else x.rect(-s*0.18,-s*0.3,s*0.34,s*0.34);
  x.fill();
  x.fillStyle='#111';x.font='bold '+(s*0.26)+'px system-ui';
  x.textAlign='center';x.textBaseline='middle';
  x.fillText(String(idx+1),-s*0.01,-s*0.12);
  x.strokeStyle=dog.color;x.lineWidth=s*0.1;
  x.save();x.translate(s*0.32,s*0.1);x.rotate(legF*0.8);
  x.beginPath();x.moveTo(0,0);x.lineTo(s*0.1,s*0.45);x.stroke();x.restore();
  x.save();x.translate(s*0.4,s*0.08);x.rotate(-legF*0.8);
  x.beginPath();x.moveTo(0,0);x.lineTo(-s*0.02,s*0.46);x.stroke();x.restore();
  x.fillStyle=dog.color;
  x.beginPath();
  x.moveTo(s*0.42,-s*0.22);
  x.quadraticCurveTo(s*0.62,-s*0.42,s*0.68,-s*0.5);
  x.lineTo(s*0.85,-s*0.42);
  x.quadraticCurveTo(s*0.72,-s*0.15,s*0.55,-s*0.05);
  x.closePath();x.fill();
  x.beginPath();x.arc(s*0.72,-s*0.52,s*0.17,0,7);x.fill();
  x.beginPath();x.ellipse(s*0.88,-s*0.48,s*0.12,s*0.08,0.15,0,7);x.fill();
  x.fillStyle='#1a1a1a';
  x.beginPath();x.arc(s*0.98,-s*0.48,s*0.04,0,7);x.fill();
  x.fillStyle='rgba(0,0,0,.3)';
  x.beginPath();
  x.moveTo(s*0.66,-s*0.64);
  x.quadraticCurveTo(s*0.6,-s*0.78,s*0.74,-s*0.7);
  x.closePath();x.fill();
  x.fillStyle='#111';
  x.beginPath();x.arc(s*0.76,-s*0.55,s*0.03,0,7);x.fill();
  x.restore();
}
document.addEventListener('click',function(e){
  var c=$('dogsCanvas');
  if(!c||e.target!==c)return;
  if(dogs.phase!=='bet'||dogs.myDog!==null)return;
  var rect=c.getBoundingClientRect();
  var fy=(e.clientY-rect.top)/rect.height;
  var best=0,bd=9;
  for(var i=0;i<LANE_CENTERS.length;i++){
    var d=Math.abs(fy-LANE_CENTERS[i]);
    if(d<bd){bd=d;best=i;}
  }
  dogsSelect(best);
});
setInterval(function(){
  try{
    dogsSetActive();
    if(!dogs.active)return;
    dogsResize();
    var o=$('dogsOdds');
    if(o&&!o.innerHTML.trim())renderDogsOdds();
  }catch(e){}
},500);
(function(){
  var a0=window.activateTab;
  if(a0){
    window.activateTab=function(t){
      var r=a0(t);
      if(t==='dogs'){
        dogsSetActive();
        setTimeout(function(){dogsResize();renderDogsOdds();renderDogsHist();syncDogsUI();},60);
        setTimeout(function(){dogsResize();},300);
      }
      return r;
    };
  }
  requestAnimationFrame(dogsLoopAll);
})();
addEventListener('resize',function(){try{dogsResize();}catch(e){}});
setTimeout(function(){try{dogsResize();renderDogsOdds();renderDogsHist();syncDogsUI();}catch(e){}},600);

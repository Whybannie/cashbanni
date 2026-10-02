// ===== DOGS v2 — профессиональные собачьи бега =====
var DOGS = [
  {id:0, name:'Рекс',   color:'#ef4444', mult:2.0,  chance:0.24},
  {id:1, name:'Белка',  color:'#f97316', mult:2.3,  chance:0.20},
  {id:2, name:'Гром',   color:'#3b82f6', mult:2.7,  chance:0.16},
  {id:3, name:'Луна',   color:'#a3a3a3', mult:3.2,  chance:0.13},
  {id:4, name:'Чарли',  color:'#eab308', mult:4.0,  chance:0.10},
  {id:5, name:'Никс',   color:'#8b5cf6', mult:5.5,  chance:0.08},
  {id:6, name:'Зефир',  color:'#f8fafc', mult:8.0,  chance:0.06},
  {id:7, name:'Алмаз',  color:'#22d3ee', mult:15.0, chance:0.03}
];
// Центры дорожек на картинке трека (доли высоты)
var LANE_CENTERS = [0.206,0.289,0.372,0.456,0.539,0.622,0.706,0.789];
var START_X = 0.16, FINISH_X = 0.895;

var dogs = {
  phase:'idle', bet:20, selected:null, winner:null,
  pos:[0,0,0,0,0,0,0,0], finT:[], t0:0, running:false,
  hist:[], finishOrder:[], finishAt:0, countT:0
};

function dogsResize(){
  var c = $('dogsCanvas');
  if(!c) return;
  var r = c.parentElement.getBoundingClientRect();
  var dpr = window.devicePixelRatio || 1;
  c.width = Math.round(r.width * dpr);
  c.height = Math.round(r.height * dpr);
  dogsDraw();
}

function dogsBet(d){
  if(dogs.phase !== 'idle') return;
  dogs.bet = Math.max(5, dogs.bet + d);
  syncDogsUI(); sfx.click();
}
function dogsSet(v){
  if(dogs.phase !== 'idle') return;
  dogs.bet = v;
  syncDogsUI(); sfx.click();
}
function dogsSelect(i){
  if(dogs.phase !== 'idle') return;
  dogs.selected = (dogs.selected === i) ? null : i;
  sfx.click();
  renderDogsOdds(); syncDogsUI(); dogsDraw();
}

function renderDogsOdds(){
  var el = $('dogsOdds'); if(!el) return;
  el.innerHTML = DOGS.map(function(d){
    var txt = (d.id === 6) ? '#333' : '#fff';
    return '<div class="dog-odd'+(dogs.selected===d.id?' sel':'')+'" onclick="dogsSelect('+d.id+')">'+
      '<span class="do-num" style="background:'+d.color+';color:'+txt+'">'+(d.id+1)+'</span>'+
      '<span class="do-name">'+d.name+'</span>'+
      '<span class="do-mult">×'+d.mult.toFixed(1)+'</span></div>';
  }).join('');
}

function renderDogsHist(){
  var el = $('dogsHistRow'); if(!el) return;
  if(!dogs.hist.length){ el.innerHTML = '<span style="opacity:.4">—</span>'; return; }
  el.innerHTML = dogs.hist.slice(-8).map(function(h){
    var d = DOGS[h.id];
    return '<span style="background:'+d.color+'22;color:'+d.color+';border:1px solid '+d.color+'55">'+h.mult.toFixed(1)+'×</span>';
  }).join('');
}

function syncDogsUI(){
  setT('dogsBetVal', dogs.bet);
  var pot = $('dogsPotential');
  if(pot) pot.textContent = dogs.selected !== null ? fmt(Math.floor(dogs.bet * DOGS[dogs.selected].mult)) : '0';
  var btn = $('dogsBtn'); if(!btn) return;
  if(dogs.phase === 'idle'){
    if(dogs.selected === null){ btn.textContent = 'ВЫБЕРИ СОБАКУ'; btn.className = 'btn dogs-btn wait'; btn.disabled = false; }
    else { btn.textContent = 'СТАРТ · '+DOGS[dogs.selected].name+' ×'+DOGS[dogs.selected].mult.toFixed(1); btn.className = 'btn dogs-btn go'; btn.disabled = false; }
  } else if(dogs.phase === 'count'){ btn.textContent = 'ПРИГОТОВЬСЯ...'; btn.className = 'btn dogs-btn wait'; btn.disabled = true; }
  else if(dogs.phase === 'race' || dogs.phase === 'finish'){ btn.textContent = '🏁 ГОНКА ИДЁТ'; btn.className = 'btn dogs-btn wait'; btn.disabled = true; }
  else { btn.textContent = 'СЛЕДУЮЩИЙ РАУНД...'; btn.className = 'btn dogs-btn wait'; btn.disabled = true; }
}

function dogsOverlay(html){
  var o = $('dogsOverlay'); if(!o) return;
  if(html === null){ o.classList.remove('show'); o.innerHTML = ''; }
  else { o.innerHTML = html; o.classList.add('show'); }
}

function pickWinner(){
  var r = Math.random(), sum = 0;
  for(var i=0;i<DOGS.length;i++){ sum += DOGS[i].chance; if(r <= sum) return i; }
  return 0;
}

function dogsStart(){
  if(dogs.phase !== 'idle') return;
  if(dogs.selected === null) return toast('Сначала выбери собаку','bad');
  if(S.balance < dogs.bet) return toast('Недостаточно Stars ⭐','bad');
  S.balance -= dogs.bet; save(); renderHeader();

  dogs.winner = pickWinner();
  var T = 6.5 + Math.random()*1.5;
  dogs.finT = [];
  for(var i=0;i<DOGS.length;i++){
    dogs.finT.push(i === dogs.winner ? T : T + 0.25 + Math.random()*2.4);
  }
  dogs.pos = [0,0,0,0,0,0,0,0];
  dogs.finishOrder = [];
  dogs.phase = 'count';
  syncDogsUI();

  var n = 3;
  dogsOverlay('<div class="ov-big">'+n+'</div><div class="ov-sub">Ставки приняты</div>');
  sfx.tick();
  var iv = setInterval(function(){
    n--;
    if(n > 0){ dogsOverlay('<div class="ov-big">'+n+'</div><div class="ov-sub">Ставки приняты</div>'); sfx.tick(); }
    else {
      clearInterval(iv);
      dogsOverlay('<div class="ov-big" style="color:#4ade80">GO!</div>');
      sfx.win();
      setTimeout(function(){ dogsOverlay(null); }, 700);
      dogs.phase = 'race';
      dogs.t0 = Date.now();
      syncDogsUI();
      if(!dogs.running){ dogs.running = true; requestAnimationFrame(dogsLoop); }
    }
  }, 900);
}

function dogsLoop(){
  if(dogs.phase !== 'race' && dogs.phase !== 'finish'){ dogs.running = false; return; }
  var t = (Date.now() - dogs.t0)/1000;
  for(var i=0;i<DOGS.length;i++){
    var p = Math.min(1, t/dogs.finT[i]);
    var w = (p > 0.04 && p < 0.96) ? 0.02*Math.sin(t*2.3 + i*1.7)*(1-p) : 0;
    dogs.pos[i] = Math.max(0, Math.min(1, p + w));
    if(p >= 1 && dogs.finishOrder.indexOf(i) < 0) dogs.finishOrder.push(i);
  }
  if(dogs.phase === 'race' && dogs.pos[dogs.winner] >= 1){
    dogs.phase = 'finish';
    dogs.finishAt = Date.now();
    sfx.tick();
  }
  if(dogs.phase === 'finish' && Date.now() - dogs.finishAt > 1500){
    dogs.running = false;
    dogsDraw();
    dogsFinish();
    return;
  }
  dogsDraw();
  requestAnimationFrame(dogsLoop);
}

function dogsFinish(){
  var w = dogs.winner;
  var won = dogs.selected === w;
  dogs.phase = 'result';
  dogs.hist.push({id:w, mult:DOGS[w].mult});
  renderDogsHist();

  if(won){
    var win = Math.floor(dogs.bet * DOGS[w].mult);
    S.balance += win;
    sfx.win(); confetti(90);
    dogsOverlay('<div class="ov-big">🏆 '+DOGS[w].name+'</div><div class="ov-sub ov-win">ПОБЕДА! +⭐'+fmt(win)+'</div>');
    toast('🏆 '+DOGS[w].name+' первый! +⭐'+fmt(win),'good');
  } else {
    sfx.crash();
    dogsOverlay('<div class="ov-big">🏆 '+DOGS[w].name+'</div><div class="ov-sub ov-lose">Твоя ставка не сыграла</div>');
    toast(DOGS[w].name+' победил. В следующий раз повезёт!','bad');
  }
  save(); renderHeader(); syncDogsUI(); dogsDraw();

  setTimeout(function(){
    dogsOverlay(null);
    dogs.phase = 'idle';
    dogs.selected = null;
    dogs.pos = [0,0,0,0,0,0,0,0];
    renderDogsOdds(); syncDogsUI(); dogsDraw();
  }, 4000);
}

// ===== ОТРИСОВКА =====
function dogsDraw(){
  var c = $('dogsCanvas');
  if(!c || !c.width) return;
  var x = c.getContext('2d');
  var W = c.width, H = c.height;
  var dpr = window.devicePixelRatio || 1;
  var now = Date.now();
  x.clearRect(0,0,W,H);

  // Номера дорожек у старта
  for(var i=0;i<DOGS.length;i++){
    var ly = LANE_CENTERS[i]*H;
    x.fillStyle = 'rgba(0,0,0,0.55)';
    x.beginPath(); x.arc(W*0.075, ly, 9*dpr, 0, Math.PI*2); x.fill();
    x.fillStyle = DOGS[i].color;
    x.beginPath(); x.arc(W*0.075, ly, 7*dpr, 0, Math.PI*2); x.fill();
    x.fillStyle = (i===6)?'#333':'#fff';
    x.font = 'bold '+(9*dpr)+'px system-ui';
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(String(i+1), W*0.075, ly+0.5*dpr);
  }

  // Собаки
  for(var i=0;i<DOGS.length;i++){
    var px = (START_X + (FINISH_X - START_X)*dogs.pos[i]) * W;
    var py = LANE_CENTERS[i]*H;
    var running = (dogs.phase === 'race' || dogs.phase === 'finish') && dogs.pos[i] < 1;

    // Подсветка выбранной
    if(dogs.selected === i && dogs.phase === 'idle'){
      x.strokeStyle = 'rgba(251,191,36,0.9)';
      x.lineWidth = 2*dpr;
      x.setLineDash([4*dpr, 3*dpr]);
      x.beginPath(); x.ellipse(px, py+6*dpr, 26*dpr, 9*dpr, 0, 0, Math.PI*2); x.stroke();
      x.setLineDash([]);
    }
    // Корона победителю
    if((dogs.phase === 'finish' || dogs.phase === 'result') && dogs.winner === i){
      x.font = (14*dpr)+'px serif';
      x.textAlign = 'center';
      x.fillText('🏆', px, py - 20*dpr);
    }
    drawDog(x, px, py, H*0.062, DOGS[i], i, running, now);
  }
}

function drawDog(x, cx, cy, s, dog, idx, running, now){
  var ph = running ? now/85 + idx*1.1 : 0;
  var bob = running ? Math.sin(ph*2)*s*0.06 : Math.sin(now/600+idx)*s*0.03;
  x.save();
  x.translate(cx, cy + bob);

  // Тень
  x.fillStyle = 'rgba(0,0,0,0.35)';
  x.beginPath(); x.ellipse(0, s*0.62, s*0.62, s*0.1, 0, 0, Math.PI*2); x.fill();

  // Пыль из-под лап
  if(running){
    for(var p=0;p<4;p++){
      var a = 0.35 - p*0.08;
      x.fillStyle = 'rgba(210,180,140,'+a.toFixed(2)+')';
      x.beginPath();
      x.arc(-s*0.55 - p*s*0.22 - Math.random()*s*0.1, s*0.5 + Math.sin(now/50+p)*s*0.08, s*(0.07+p*0.03), 0, Math.PI*2);
      x.fill();
    }
  }

  var legF = running ? Math.sin(ph)*0.85 : 0.15;
  var legB = running ? Math.sin(ph+Math.PI)*0.85 : -0.15;

  // Хвост
  x.strokeStyle = dog.color;
  x.lineWidth = s*0.09; x.lineCap = 'round';
  x.beginPath();
  x.moveTo(-s*0.55, -s*0.05);
  x.quadraticCurveTo(-s*0.85, -s*0.25 + Math.sin(now/140+idx)*s*0.12, -s*0.95, -s*0.45);
  x.stroke();

  // Задние лапы
  x.strokeStyle = dog.color; x.lineWidth = s*0.11;
  x.save(); x.translate(-s*0.35, s*0.15); x.rotate(legB*0.7);
  x.beginPath(); x.moveTo(0,0); x.lineTo(-s*0.12, s*0.42); x.stroke(); x.restore();
  x.save(); x.translate(-s*0.28, s*0.15); x.rotate(-legB*0.7);
  x.beginPath(); x.moveTo(0,0); x.lineTo(s*0.05, s*0.44); x.stroke(); x.restore();

  // Тело (поджарое, как у грейхаунда)
  var bg = x.createLinearGradient(0, -s*0.35, 0, s*0.3);
  bg.addColorStop(0, dog.color);
  bg.addColorStop(1, 'rgba(0,0,0,0.35)');
  x.fillStyle = dog.color;
  x.beginPath();
  x.moveTo(-s*0.55, -s*0.05);
  x.quadraticCurveTo(-s*0.2, -s*0.38, s*0.25, -s*0.28);
  x.quadraticCurveTo(s*0.5, -s*0.22, s*0.55, -s*0.05);
  x.quadraticCurveTo(s*0.3, s*0.28, -s*0.15, s*0.25);
  x.quadraticCurveTo(-s*0.45, s*0.2, -s*0.55, -s*0.05);
  x.closePath(); x.fill();
  // Тень на животе
  x.fillStyle = 'rgba(0,0,0,0.18)';
  x.beginPath();
  x.ellipse(0, s*0.16, s*0.42, s*0.1, 0, 0, Math.PI*2);
  x.fill();

  // Номерной жилет
  x.fillStyle = 'rgba(255,255,255,0.92)';
  x.beginPath();
  x.roundRect ? x.roundRect(-s*0.18, -s*0.3, s*0.34, s*0.34, s*0.06) : x.rect(-s*0.18, -s*0.3, s*0.34, s*0.34);
  x.fill();
  x.fillStyle = '#111';
  x.font = 'bold '+(s*0.26)+'px system-ui';
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(String(idx+1), -s*0.01, -s*0.12);

  // Передние лапы
  x.strokeStyle = dog.color; x.lineWidth = s*0.1;
  x.save(); x.translate(s*0.32, s*0.1); x.rotate(legF*0.8);
  x.beginPath(); x.moveTo(0,0); x.lineTo(s*0.1, s*0.45); x.stroke(); x.restore();
  x.save(); x.translate(s*0.4, s*0.08); x.rotate(-legF*0.8);
  x.beginPath(); x.moveTo(0,0); x.lineTo(-s*0.02, s*0.46); x.stroke(); x.restore();

  // Шея и голова
  x.fillStyle = dog.color;
  x.beginPath();
  x.moveTo(s*0.42, -s*0.22);
  x.quadraticCurveTo(s*0.62, -s*0.42, s*0.68, -s*0.5);
  x.lineTo(s*0.85, -s*0.42);
  x.quadraticCurveTo(s*0.72, -s*0.15, s*0.55, -s*0.05);
  x.closePath(); x.fill();
  // Голова
  x.beginPath(); x.arc(s*0.72, -s*0.52, s*0.17, 0, Math.PI*2); x.fill();
  // Морда
  x.beginPath(); x.ellipse(s*0.88, -s*0.48, s*0.12, s*0.08, 0.15, 0, Math.PI*2); x.fill();
  // Нос
  x.fillStyle = '#1a1a1a';
  x.beginPath(); x.arc(s*0.98, -s*0.48, s*0.04, 0, Math.PI*2); x.fill();
  // Ухо
  x.fillStyle = 'rgba(0,0,0,0.3)';
  x.beginPath();
  x.moveTo(s*0.66, -s*0.64);
  x.quadraticCurveTo(s*0.6, -s*0.78, s*0.74, -s*0.7);
  x.closePath(); x.fill();
  // Глаз
  x.fillStyle = '#111';
  x.beginPath(); x.arc(s*0.76, -s*0.55, s*0.03, 0, Math.PI*2); x.fill();

  x.restore();
}

// Клик по дорожке на канвасе
document.addEventListener('click', function(e){
  var c = $('dogsCanvas');
  if(!c || e.target !== c) return;
  if(dogs.phase !== 'idle') return;
  var rect = c.getBoundingClientRect();
  var fy = (e.clientY - rect.top) / rect.height;
  var best = 0, bd = 9;
  for(var i=0;i<LANE_CENTERS.length;i++){
    var d = Math.abs(fy - LANE_CENTERS[i]);
    if(d < bd){ bd = d; best = i; }
  }
  dogsSelect(best);
});

(function(){
  var a0 = window.activateTab;
  if(a0){
    window.activateTab = function(t){
      var r = a0(t);
      if(t === 'dogs'){
        renderDogsOdds(); renderDogsHist(); syncDogsUI();
        setTimeout(dogsResize, 60); setTimeout(dogsResize, 300);
      }
      return r;
    };
  }
})();
addEventListener('resize', function(){ try{dogsResize();}catch(e){} });
setTimeout(function(){ try{ dogsResize(); renderDogsOdds(); renderDogsHist(); syncDogsUI(); }catch(e){} }, 500);

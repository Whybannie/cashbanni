// ===== DOGS — собачьи гонки =====
var DOGS = [
  {id:0, name:'Рекс',    color:'#e63946', coat:'#d62828', mult:2.00,  chance:0.22},
  {id:1, name:'Белка',   color:'#f4a261', coat:'#e76f51', mult:2.20,  chance:0.18},
  {id:2, name:'Гром',    color:'#264653', coat:'#1d3557', mult:2.50,  chance:0.16},
  {id:3, name:'Луна',    color:'#a8dadc', coat:'#457b9d', mult:2.80,  chance:0.14},
  {id:4, name:'Чарли',   color:'#e9c46a', coat:'#d4a017', mult:3.20,  chance:0.11},
  {id:5, name:'Никс',    color:'#7209b7', coat:'#560bad', mult:4.00,  chance:0.09},
  {id:6, name:'Зефир',   color:'#f8f9fa', coat:'#c9c9c9', mult:6.00,  chance:0.07},
  {id:7, name:'Алмаз',   color:'#fbbf24', coat:'#d4a017', mult:12.00, chance:0.03}
];

var dogs = {
  phase: 'idle',      // idle | bet | race | result
  bet: 20,
  selected: null,
  winner: null,
  positions: [],      // x позиция каждой собаки 0..1
  speeds: [],
  frame: 0,
  running: false,
  resultShown: false
};

function dogsResize(){
  var c = $('dogsCanvas');
  if(!c) return;
  var r = c.parentElement.getBoundingClientRect();
  var dpr = window.devicePixelRatio || 1;
  c.width = r.width * dpr;
  c.height = r.height * dpr;
  dogsDraw();
}

function dogsBet(d){
  if(dogs.phase !== 'idle') return;
  dogs.bet = Math.max(5, dogs.bet + d);
  setT('dogsBetVal', dogs.bet);
  sfx.click();
}

function dogsSet(v){
  if(dogs.phase !== 'idle') return;
  dogs.bet = v;
  setT('dogsBetVal', dogs.bet);
  sfx.click();
}

function dogsSelect(id){
  if(dogs.phase !== 'idle') return;
  dogs.selected = id;
  sfx.click();
  dogsDraw();
  // Подсветка в списке
  document.querySelectorAll('.dog-card').forEach(function(el, i){
    if(i === id) el.classList.add('selected');
    else el.classList.remove('selected');
  });
}

// Генерация победителя с учётом коэффициентов
function pickWinner(){
  var r = Math.random();
  var sum = 0;
  for(var i=0; i<DOGS.length; i++){
    sum += DOGS[i].chance;
    if(r <= sum) return i;
  }
  return 0;
}

function dogsStart(){
  if(dogs.phase !== 'idle') return;
  if(dogs.selected === null) return toast('Выбери собаку','bad');
  if(S.balance < dogs.bet) return toast('Недостаточно Stars ⭐','bad');
  
  S.balance -= dogs.bet;
  save(); renderHeader();
  
  dogs.phase = 'race';
  dogs.winner = pickWinner();
  dogs.positions = [];
  dogs.speeds = [];
  dogs.frame = 0;
  dogs.resultShown = false;
  
  for(var i=0; i<DOGS.length; i++){
    dogs.positions.push(0);
    // Победитель бежит в среднем быстрее остальных
    var base = i === dogs.winner ? 0.0045 : (0.0025 + Math.random()*0.0018);
    dogs.speeds.push(base);
  }
  
  syncDogsUI();
  if(!dogs.running){
    dogs.running = true;
    requestAnimationFrame(dogsLoop);
  }
}

function dogsLoop(){
  if(dogs.phase !== 'race'){
    dogs.running = false;
    return;
  }
  
  dogs.frame++;
  var allDone = true;
  for(var i=0; i<DOGS.length; i++){
    if(dogs.positions[i] < 1){
      // Скорость меняется (как в реальной гонке)
      var jitter = 1 + Math.sin(dogs.frame/20 + i*1.3) * 0.3 + (Math.random()-0.5)*0.4;
      dogs.positions[i] = Math.min(1, dogs.positions[i] + dogs.speeds[i] * jitter);
      allDone = false;
    }
  }
  
  // Убеждаемся что победитель финиширует точно
  if(dogs.positions[dogs.winner] >= 1){
    for(var j=0; j<DOGS.length; j++){
      dogs.positions[j] = Math.min(1, dogs.positions[j]);
    }
  }
  
  dogsDraw();
  
  if(allDone || dogs.positions[dogs.winner] >= 1){
    // Проверка финиша: все собаки финишировали или победитель достиг цели
    var winnerDone = dogs.positions[dogs.winner] >= 1;
    if(winnerDone && !dogs.resultShown){
      dogs.resultShown = true;
      setTimeout(dogsFinish, 800);
    }
  }
  
  if(!allDone && !dogs.resultShown){
    requestAnimationFrame(dogsLoop);
  }
}

function dogsFinish(){
  var won = dogs.selected === dogs.winner;
  if(won){
    var win = Math.floor(dogs.bet * DOGS[dogs.winner].mult);
    S.balance += win;
    sfx.win();
    confetti(80);
    toast('🏆 '+DOGS[dogs.winner].name+' победил! +⭐'+fmt(win), 'good');
  } else {
    sfx.crash();
    toast('😿 '+DOGS[dogs.winner].name+' выиграл. Твоя ставка проиграла', 'bad');
  }
  save();
  renderHeader();
  
  dogs.phase = 'result';
  syncDogsUI();
  
  // Через 3 секунды сбрасываем
  setTimeout(function(){
    dogs.phase = 'idle';
    dogs.selected = null;
    dogs.winner = null;
    syncDogsUI();
    dogsDraw();
  }, 3000);
}

function syncDogsUI(){
  var btn = $('dogsBtn');
  if(!btn) return;
  if(dogs.phase === 'idle'){
    if(dogs.selected === null){
      btn.textContent = 'ВЫБЕРИ СОБАКУ';
      btn.className = 'btn crash-main-btn wait';
    } else {
      btn.textContent = 'СТАРТ ⭐' + dogs.bet;
      btn.className = 'btn crash-main-btn bet';
    }
  } else if(dogs.phase === 'race'){
    btn.textContent = 'ГОНКА ИДЁТ...';
    btn.className = 'btn crash-main-btn cash';
  } else if(dogs.phase === 'result'){
    var won = dogs.selected === dogs.winner;
    btn.textContent = won ? '🏆 ПОБЕДА' : '😿 ПРОИГРЫШ';
    btn.className = 'btn crash-main-btn ' + (won ? 'cash' : 'wait');
  }
}

// ===== ОТРИСОВКА СОБАК НА CANVAS =====
function dogsDraw(){
  var c = $('dogsCanvas');
  if(!c || !c.width) return;
  var x = c.getContext('2d');
  var W = c.width, H = c.height;
  var dpr = window.devicePixelRatio || 1;
  var now = Date.now();
  
  x.clearRect(0,0,W,H);
  
  // Фон — зелёная трава с градиентом
  var bg = x.createLinearGradient(0,0,0,H);
  bg.addColorStop(0, '#1a4731');
  bg.addColorStop(1, '#0f2e1f');
  x.fillStyle = bg;
  x.fillRect(0,0,W,H);
  
  // Текстура травы (полоски)
  x.strokeStyle = 'rgba(34,139,34,0.08)';
  x.lineWidth = 1*dpr;
  for(var i=0; i<W; i+=20*dpr){
    x.beginPath();
    x.moveTo(i, 0);
    x.lineTo(i+10*dpr, H);
    x.stroke();
  }
  
  // Линии дорожек
  var lanes = DOGS.length;
  var laneH = H / lanes;
  
  for(var i=0; i<=lanes; i++){
    var y = i * laneH;
    if(i > 0 && i < lanes){
      x.strokeStyle = 'rgba(255,255,255,0.1)';
      x.setLineDash([8*dpr, 4*dpr]);
      x.lineWidth = 1*dpr;
      x.beginPath();
      x.moveTo(0, y);
      x.lineTo(W, y);
      x.stroke();
      x.setLineDash([]);
    }
  }
  
  // Финишная линия (справа)
  var finishX = W - 30*dpr;
  x.fillStyle = 'rgba(255,255,255,0.9)';
  for(var fi=0; fi<8; fi++){
    var fx = finishX + (fi%2===0 ? 0 : 8*dpr);
    x.fillRect(fx, 0, 8*dpr, H);
  }
  x.fillStyle = 'rgba(0,0,0,0.9)';
  for(var fi=0; fi<8; fi++){
    var fx = finishX + (fi%2===1 ? 0 : 8*dpr);
    x.fillRect(fx, 0, 8*dpr, H);
  }
  
  // Старт-линия (слева)
  x.fillStyle = 'rgba(255,255,255,0.3)';
  x.fillRect(50*dpr, 0, 3*dpr, H);
  
  // Рисуем собак
  for(var i=0; i<DOGS.length; i++){
    var dog = DOGS[i];
    var laneY = i * laneH + laneH/2;
    var startX = 70*dpr;
    var endX = W - 60*dpr;
    var posX = startX + (endX - startX) * dogs.positions[i];
    
    // Подсветка выбранной собаки
    if(dogs.selected === i){
      x.fillStyle = 'rgba(251,191,36,0.15)';
      x.fillRect(0, i*laneH, W, laneH);
    }
    
    // Подсветка победителя в фазе result
    if(dogs.phase === 'result' && dogs.winner === i){
      x.fillStyle = 'rgba(34,197,94,0.2)';
      x.fillRect(0, i*laneH, W, laneH);
    }
    
    // Номер и имя слева
    x.font = 'bold '+(10*dpr)+'px system-ui';
    x.fillStyle = dog.color;
    x.textAlign = 'left';
    x.fillText('#'+(i+1), 8*dpr, laneY + 3*dpr);
    
    // Рисуем саму собаку
    drawDog(x, posX, laneY, laneH*0.7, dog, i, now);
  }
}

function drawDog(x, cx, cy, size, dog, idx, now){
  var s = size * 0.4;
  x.save();
  x.translate(cx, cy);
  
  // Анимация бега
  var runPhase = dogs.phase === 'race' ? now/80 + idx : 0;
  var legSwing = Math.sin(runPhase) * 0.4;
  var bodyBob = Math.sin(runPhase*2) * s*0.05;
  
  // Тень
  x.fillStyle = 'rgba(0,0,0,0.3)';
  x.beginPath();
  x.ellipse(0, s*0.55, s*0.5, s*0.08, 0, 0, Math.PI*2);
  x.fill();
  
  // ХВОСТ
  x.strokeStyle = dog.coat;
  x.lineWidth = s*0.08;
  x.lineCap = 'round';
  x.beginPath();
  x.moveTo(-s*0.45, -s*0.1);
  var tailWag = Math.sin(now/150) * 0.3;
  x.quadraticCurveTo(-s*0.7, -s*0.4 + bodyBob, -s*0.55, -s*0.55 + bodyBob + tailWag*s*0.2);
  x.stroke();
  
  // ЗАДНИЕ ЛАПЫ
  x.fillStyle = dog.coat;
  // Левая задняя
  var backLeftX = -s*0.25;
  var backLeftY = s*0.1;
  var backLeftAng = -legSwing;
  x.save();
  x.translate(backLeftX, backLeftY);
  x.rotate(backLeftAng);
  x.beginPath();
  x.ellipse(0, s*0.2, s*0.08, s*0.22, 0, 0, Math.PI*2);
  x.fill();
  x.restore();
  // Правая задняя
  x.save();
  x.translate(-s*0.15, backLeftY);
  x.rotate(legSwing);
  x.beginPath();
  x.ellipse(0, s*0.2, s*0.08, s*0.22, 0, 0, Math.PI*2);
  x.fill();
  x.restore();
  
  // ТЕЛО
  var bodyGrad = x.createLinearGradient(0, -s*0.3, 0, s*0.3);
  bodyGrad.addColorStop(0, dog.color);
  bodyGrad.addColorStop(1, dog.coat);
  x.fillStyle = bodyGrad;
  x.beginPath();
  x.ellipse(0, bodyBob, s*0.5, s*0.22, 0, 0, Math.PI*2);
  x.fill();
  
  // Блик на теле
  x.fillStyle = 'rgba(255,255,255,0.15)';
  x.beginPath();
  x.ellipse(-s*0.1, bodyBob - s*0.1, s*0.3, s*0.08, 0, 0, Math.PI*2);
  x.fill();
  
  // ПЕРЕДНИЕ ЛАПЫ
  x.fillStyle = dog.coat;
  // Левая передняя
  x.save();
  x.translate(s*0.25, s*0.1);
  x.rotate(legSwing);
  x.beginPath();
  x.ellipse(0, s*0.2, s*0.08, s*0.22, 0, 0, Math.PI*2);
  x.fill();
  x.restore();
  // Правая передняя
  x.save();
  x.translate(s*0.35, s*0.1);
  x.rotate(-legSwing);
  x.beginPath();
  x.ellipse(0, s*0.2, s*0.08, s*0.22, 0, 0, Math.PI*2);
  x.fill();
  x.restore();
  
  // ШЕЯ + ГОЛОВА
  x.fillStyle = dog.color;
  x.beginPath();
  x.moveTo(s*0.35, bodyBob - s*0.05);
  x.lineTo(s*0.55, bodyBob - s*0.25);
  x.lineTo(s*0.45, bodyBob + s*0.1);
  x.closePath();
  x.fill();
  
  // Голова
  x.fillStyle = dog.color;
  x.beginPath();
  x.arc(s*0.6, bodyBob - s*0.25, s*0.2, 0, Math.PI*2);
  x.fill();
  
  // Морда
  x.fillStyle = dog.coat;
  x.beginPath();
  x.ellipse(s*0.78, bodyBob - s*0.22, s*0.12, s*0.09, 0, 0, Math.PI*2);
  x.fill();
  
  // Нос
  x.fillStyle = '#1a1a1a';
  x.beginPath();
  x.ellipse(s*0.88, bodyBob - s*0.22, s*0.04, s*0.03, 0, 0, Math.PI*2);
  x.fill();
  
  // Глаз
  x.fillStyle = '#1a1a1a';
  x.beginPath();
  x.arc(s*0.65, bodyBob - s*0.28, s*0.035, 0, Math.PI*2);
  x.fill();
  // Блик в глазе
  x.fillStyle = '#fff';
  x.beginPath();
  x.arc(s*0.66, bodyBob - s*0.29, s*0.012, 0, Math.PI*2);
  x.fill();
  
  // УШИ
  x.fillStyle = dog.coat;
  // Левое ухо
  x.beginPath();
  x.moveTo(s*0.5, bodyBob - s*0.4);
  x.lineTo(s*0.45, bodyBob - s*0.55);
  x.lineTo(s*0.6, bodyBob - s*0.4);
  x.closePath();
  x.fill();
  // Правое ухо
  x.beginPath();
  x.moveTo(s*0.7, bodyBob - s*0.4);
  x.lineTo(s*0.75, bodyBob - s*0.55);
  x.lineTo(s*0.8, bodyBob - s*0.4);
  x.closePath();
  x.fill();
  
  // Имя над собакой
  x.font = 'bold '+(10*window.devicePixelRatio||10)+'px system-ui';
  x.fillStyle = '#fff';
  x.textAlign = 'center';
  x.strokeStyle = 'rgba(0,0,0,0.8)';
  x.lineWidth = 3;
  x.strokeText(dog.name, 0, -s*0.7);
  x.fillText(dog.name, 0, -s*0.7);
  
  // Если бежит — пыль из-под лап
  if(dogs.phase === 'race' && dogs.positions[idx] < 1){
    for(var p=0; p<3; p++){
      var dx = -s*0.3 - p*s*0.15;
      var dy = s*0.5 + Math.random()*s*0.1;
      x.fillStyle = 'rgba(255,255,255,'+(0.3 - p*0.08)+')';
      x.beginPath();
      x.arc(dx, dy, s*0.05 + p*s*0.02, 0, Math.PI*2);
      x.fill();
    }
  }
  
  x.restore();
}

// Клик по собаке
document.addEventListener('click', function(e){
  var c = $('dogsCanvas');
  if(!c || e.target !== c) return;
  if(dogs.phase !== 'idle') return;
  
  var rect = c.getBoundingClientRect();
  var dpr = window.devicePixelRatio || 1;
  var y = (e.clientY - rect.top) * dpr;
  var laneH = c.height / DOGS.length;
  var id = Math.floor(y / laneH);
  if(id >= 0 && id < DOGS.length) dogsSelect(id);
});

// Инициализация при открытии таба
(function(){
  var a0 = window.activateTab;
  if(a0){
    window.activateTab = function(t){
      var r = a0(t);
      if(t === 'dogs'){
        setTimeout(dogsResize, 60);
        setTimeout(dogsResize, 300);
      }
      return r;
    };
  }
})();

addEventListener('resize', function(){ try{dogsResize();}catch(e){} });
setTimeout(function(){ try{dogsResize();}catch(e){} }, 400);

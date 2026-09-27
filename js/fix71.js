// ===== v71.3: FINAL clean versions (loads last, overrides everything) =====

function caseArt(c){
  var col = CASE_COLORS[c.rarity] || CASE_COLORS.common;
  var src = c.img || CASE_IMG[c.id];
  var art = src
    ? '<img class="case-img" src="'+src+'" alt="'+c.name+'" loading="lazy" decoding="async" fetchpriority="high">'
    : '<div class="case-emoji">'+c.em+'</div>';
  return '<div class="case-art" style="background:'+col+'22;border:1px solid '+col+'55;">'+art+'</div>';
}

function openCaseModal(id){
  sfx.click();
  curCase = CASES.find(c=>c.id===id);
  if(!curCase) return;
  
  if(curCase.free && !freeReady()){
    var hh = Math.ceil((FREE_CASE_COOLDOWN-(Date.now()-S.freeLast))/36e5);
    errModal('⏳','Бесплатный кейс','Следующий бесплатный кейс будет доступен через '+hh+' ч.',[{label:'Хорошо',primary:true}]);
    return;
  }
  
  setT('cmTitle', curCase.name);
  setT('p1', fmt(curCase.price));
  setT('p3', fmt(curCase.price*3));
  setT('p5', fmt(curCase.price*5));
  
  var b1=$('btnX1'), b3=$('btnX3'), b5=$('btnX5');
  if(b1){
    if(curCase.id==='secret') b1.innerHTML='🔐 ОТКРЫТЬ ПО КОДУ';
    else if(curCase.free) b1.innerHTML='🎁 ОТКРЫТЬ · 1 раз в 24ч';
    else if(!b1.querySelector('#p1')) b1.innerHTML='Открыть ×1 ⭐<span id="p1"></span>';
  }
  
  var hideMulti = curCase.free || curCase.id==='secret';
  if(b3){ b3.style.display = hideMulti ? 'none' : ''; b3.disabled = hideMulti; }
  if(b5){ b5.style.display = hideMulti ? 'none' : ''; b5.disabled = hideMulti; }
  
  var m = document.querySelector('#caseModal .modal');
  if(m) m.classList.remove('compact');
  
  var oldBlock = document.getElementById('caseContentsBlock');
  if(oldBlock) oldBlock.remove();
  
  var cfc = $('cmContents');
  if(cfc) cfc.style.display = 'none';
  
  if(m){
    var items = curCase.drops.map(function(dd){
      var g = gift(dd[0]);
      return '<div class="c-item" style="border:1px solid '+RAR[g.rarity].color+'55;">'+
        gImg(g)+'<div class="cname">'+g.name+'</div><div class="cprice">⭐'+g.price+'</div></div>';
    }).join('');
    
    var act0 = m.querySelector('.cf-actions');
    (act0||m).insertAdjacentHTML('beforebegin',
      '<div id="caseContentsBlock" style="margin:8px 0;">'+
        '<div style="font-size:.78rem;font-weight:900;margin-bottom:6px;color:#fff;">🎁 Содержимое кейса</div>'+
        '<div class="contents" style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;max-height:34vh;overflow-y:auto;padding:2px;">'+items+'</div>'+
      '</div>');
  }
  
  var box = $('cfStrips');
  box.innerHTML = '';
  var prev = document.createElement('div');
  prev.className = 'roulette-container preview';
  prev.innerHTML = '<div class="roulette-label">ПРЕВЬЮ</div><div class="roulette-strip"></div>';
  box.appendChild(prev);
  buildStrip(prev.querySelector('.roulette-strip'), gift(pick(curCase.drops)[0]));
  
  var oldRow = document.getElementById('secretCodeRow');
  if(oldRow) oldRow.remove();
  if(curCase.id==='secret'){
    var act2 = document.querySelector('#caseModal .cf-actions');
    if(act2) act2.insertAdjacentHTML('beforebegin',
      '<div id="secretCodeRow" style="display:flex;gap:8px;margin:8px 0;">'+
        '<input id="secretCodeInput" placeholder="🔐 ВВЕДИ ПРОМОКОД" style="flex:1;min-width:0;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);border-radius:13px;padding:10px;color:#fff;font-size:.85rem;outline:none;min-height:44px;text-transform:uppercase;">'+
      '</div>');
  }
  
  modalOpen('caseModal');
}

async function spin(n){
  if(spinning) return;
  if(!curCase) return;
  spinning = true;
  
  try{
    if(curCase.free){
      var ok = await checkSub();
      if(!ok){ spinning=false; gateSub(); return; }
    }
    
    var caseCode = '';
    if(curCase.id==='secret'){
      var ci = $('secretCodeInput');
      caseCode = (ci ? ci.value : '').trim().toUpperCase();
      if(!caseCode){
        spinning = false;
        errModal('🔐','Нужен промокод','Введи промокод в поле выше и нажми кнопку снова.',[{label:'Понятно',primary:true}]);
        return;
      }
    }
    
    var r = await api('/api/case_open',{
      method:'POST',
      body:JSON.stringify({id:curCase.id, count:n, code:caseCode})
    });
    
    if(r && r.error){
      spinning = false;
      var err = r.error;
      if(/подписк/i.test(err)){ gateSub(); }
      else if(/24/i.test(err)){ errModal('⏳','Бесплатный кейс','Следующий бесплатный кейс будет доступен позже.',[{label:'Хорошо',primary:true}]); }
      else if(/уже открывал/i.test(err)){ errModal('🔒','Код использован','Ты уже открывал этот промокод. Попроси новый!',[{label:'Понятно',primary:true}]); }
      else if(/неверн|исчерпан/i.test(err)){ errModal('❌','Неверный код','Такого промокода нет или он исчерпан.',[{label:'Понятно',primary:true}]); }
      else if(/Недостаточно/i.test(err)){ errModal('💸','Не хватает звёзд','Пополни баланс, чтобы открыть этот кейс.',[{label:'🎯 Пополнить',primary:true,action:function(){modalClose('errModal');openPay();}},{label:'Позже'}]); }
      else smartError(err);
      return;
    }
    
    S.balance = r.balance;
    S.inv = r.inv;
    S.stats = Object.assign(DEF().stats, r.stats);
    S.xp = r.xp || S.xp;
    if(curCase.free) S.freeLast = Date.now();
    saveLocal();
    renderHeader();
    
    var wins = r.results.map(function(gid){ return gift(gid); });
    var box = $('cfStrips');
    box.innerHTML = '';
    box.dataset.n = n;
    
    var modal = document.querySelector('#caseModal .modal');
    if(modal) modal.classList.toggle('compact', n>1);
    
    var newItems = (r.inv||[]).slice((r.inv||[]).length-n);
    var rows = wins.map(function(g,i){
      var c = document.createElement('div');
      c.className = 'roulette-container';
      c.innerHTML = '<div class="roulette-strip"></div>';
      box.appendChild(c);
      return {c:c, strip:c.querySelector('.roulette-strip'), g:g, uid:(newItems[i]&&newItems[i].uid)||uid()};
    });
    
    rows.forEach(function(x){ buildStrip(x.strip, x.g); });
    
    var dur = (n===1) ? 8500 : 7000;
    await Promise.all(rows.map(function(x){ return animateStrip(x.strip, dur); }));
    
    rows.forEach(function(x){
      x.c.classList.add('won');
      x.c.insertAdjacentHTML('beforeend',
        '<div class="won-card">'+
          gImg(x.g)+
          '<div class="won-name">+'+x.g.name+' ⭐'+x.g.price+'</div>'+
          '<div class="won-actions">'+
            '<button class="mini-btn" onclick="sellWon(\''+x.uid+'\')">Продать</button>'+
            '<button class="mini-btn" onclick="keepWon(\''+x.uid+'\')">В инвентарь</button>'+
          '</div>'+
        '</div>');
    });
    
    for(var i=0; i<wins.length; i++){
      if(wins[i].rarity==='epic' || wins[i].rarity==='legendary'){
        sfx.legend();
        toast('💎 ЭПИКА: '+wins[i].name+'!', 'good');
      }
    }
    
    sfx.win();
    spinning = false;
    saveLocal();
    renderHeader();
    renderCases();
    renderTasks();
    refreshInv();
    checkAch();
    
  }catch(e){
    spinning = false;
    console.error('spin error:', e);
    errModal('⚠️','Ошибка','Что-то пошло не так. Попробуй ещё раз.',[{label:'Понятно',primary:true}]);
  }
}

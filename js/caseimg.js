// ===== МОДУЛЬ-ПАТЧ v25 =====
const CASE_IMG = {
  free:'case_fri.JPG', fri:'case_fri.JPG',
  starter:'case_starter.JPG', start:'case_starter.JPG',
  mini:'case_mini.JPG',
  xaip:'case_xaip.JPG', hype:'case_xaip.JPG', haip:'case_xaip.JPG',
  premium:'case_premium.JPG', prem:'case_premium.JPG'
};
function caseArt(c){
  const col=CASE_COLORS[c.rarity];
  const src=c.img||CASE_IMG[c.id];
  const art = src
    ? '<img class="case-img" src="'+src+'" alt="'+c.name+'" decoding="async">'
    : '<div class="bow"></div><div class="lid"></div><div class="body"></div><div class="rv"></div><div class="rh"></div><div class="em">'+c.em+'</div>';
  return '<div class="case-art'+(src?' img-art':'')+'" style="--c0:'+col[0]+';--c1:'+col[1]+';--c2:'+col[2]+';--glow:'+RAR[c.rarity].glow+'">'+art+'</div>';
}

// ---- Кейс: состав виден СРАЗУ под шапкой + превью-лента в поле прокрута ----
function openCaseModal(id){ sfx.click(); curCase=CASES.find(c=>c.id===id);
  if(curCase.free&&!freeReady()){ const h=Math.ceil((FREE_CASE_COOLDOWN-(Date.now()-S.freeLast))/36e5);
    return toast('⏳ Бесплатный кейс раз в 24 часа. Ещё '+h+' ч.','bad'); }
  setT('cmTitle',curCase.name);
  setT('p1',fmt(curCase.price)); setT('p3',fmt(curCase.price*3)); setT('p5',fmt(curCase.price*5));
  const b3=$('btnX3'),b5=$('btnX5');
  if(b3)b3.style.display=curCase.free?'none':''; if(b5)b5.style.display=curCase.free?'none':'';
  const m=document.querySelector('#caseModal .modal'); if(m) m.classList.remove('compact');
  setH('cmContents',
    '<div class="cf-hero">'+caseArt(curCase)+
      '<div class="cf-hero-info"><b>'+curCase.name+'</b>'+
      '<div class="price">'+(curCase.price===0?'БЕСПЛАТНО':'⭐ '+fmt(curCase.price))+'</div>'+
      '<span class="muted">Состав и шансы выпада:</span></div></div>'+
    '<div class="contents">'+curCase.drops.map(d=>{const g=gift(d[0]);return
      '<div class="c-item" style="border:1px solid '+RAR[g.rarity].color+'55;box-shadow:0 0 16px '+RAR[g.rarity].color+'22 inset">'+
      '<div class="ch">'+(d[1]*100).toFixed(0)+'%</div>'+gImg(g)+
      '<div class="cname">'+g.name+'</div><div class="cprice">⭐'+g.price+'</div></div>';}).join('')+'</div>');
  const box=$('cfStrips'); box.innerHTML='';
  const prev=document.createElement('div'); prev.className='roulette-container preview';
  prev.innerHTML='<div class="preview-label">ПРЕВЬЮ ПРОКРУТА</div><div class="roulette-pointer"></div><div class="roulette-strip"></div>';
  box.appendChild(prev);
  buildStrip(prev.querySelector('.roulette-strip'), gift(pick(curCase.drops)[0]));
  modalOpen('caseModal'); }

// ---- Задания: кнопка подписки «прожатая» + авто-проверка ----
let _subCheckTs=0;
function renderTasks(){ const fr=freeReady();
  setT('freeCaseState',fr?'Доступен сейчас · 1 спин · подписка':'Следующий через '+Math.ceil((FREE_CASE_COOLDOWN-(Date.now()-S.freeLast))/36e5)+' ч.');
  const sb=$('subBtn');
  if(sb){ if(S.subDone){sb.textContent='✅ Награда получена';sb.disabled=true;sb.classList.add('pressed');}
    else {sb.textContent='Подписаться';sb.disabled=false;sb.classList.remove('pressed');} }
  setT('refCount',S.refs);
  renderQuests(); renderAchs();
  if(S.serverMode && !S.subDone && Date.now()-_subCheckTs>15000){ _subCheckTs=Date.now();
    checkSub().then(ok=>{ if(ok){ S.subDone=true; S.balance+=SUB_REWARD; save(); renderHeader();
      sfx.win(); confetti(60); toast('📢 Подписка замечена: +⭐'+SUB_REWARD,'good');
      renderTasks(); renderProfile(); } }); }
}

// ---- Баттлы: подписи сторон, легенда, без лагов ----
let _bCache='';
function pYou(n){ return '<div class="b-player you"><span class="emoji">😎</span><b>'+(n||S.tgName||'Ты')+'</b><span class="bp-tag you">ТЫ</span></div>'; }
function pOpp(n){ return '<div class="b-player opp"><span class="emoji">🧑</span><b>'+(n||'Игрок')+'</b><span class="bp-tag opp">СОПЕРНИК</span></div>'; }
function bLegend(){ return '<div class="b-legend"><span class="lg-you">🟣 Твоя сторона колеса</span><span class="lg-opp">🩷 Сторона соперника</span></div>'; }
function battleCard(b){
  if(b.mine&&b.status==='wait')return '<div class="battle-card mine"><div class="bc-top"><span class="bc-wait">⏳ ОЖИДАНИЕ</span><div class="bet">⭐'+b.bet+'</div></div>'+
    '<div class="bc-mid">'+pYou()+'<div class="b-player empty"><span class="emoji">❓</span><b>Ищем соперника…</b></div></div>'+
    '<button class="btn btn-secondary" onclick="openBattleHost(\''+b.id+'\','+b.bet+')">Открыть баттл</button></div>';
  if(b.mine&&b.status==='done')return '<div class="battle-card mine"><div class="bc-top"><span class="bc-done">✅ СЫГРАН</span><div class="bet">⭐'+b.bet+'</div></div><button class="btn btn-primary" onclick="showMyResult(\''+b.id+'\')">🎬 Результат</button></div>';
  return '<div class="battle-card"><div class="bc-top"><span class="bc-live">🔴 АКТИВЕН</span><div class="bet">⭐'+b.bet+'</div></div>'+
    '<div class="bc-mid">'+pOpp(b.host_name)+'<div class="b-player empty"><span class="emoji">🎯</span><b>Твой слот</b><span class="bp-tag you">ТЫ</span></div></div>'+
    '<button class="btn btn-primary" onclick="joinBattle(\''+b.id+'\')">Войти за ⭐'+b.bet+'</button></div>';
}
function renderBattles(){ if(!S.serverMode){setH('battlesList','<div class="muted">Баттлы доступны в Telegram-версии.</div>');return;}
  apiR('/api/battles').then(r=>{ if(r.error)return;
    const list=r.battles||[];
    const key=JSON.stringify(list);
    if(key===_bCache)return; _bCache=key;
    if(!list.length){setH('battlesList','<div class="battle-empty"><span class="emoji">⚔️</span><b>Нет активных баттлов</b><span class="muted">Создай свой — соперник найдётся за секунды</span></div>');return;}
    setH('battlesList',list.map(battleCard).join('')); }); }
function showMyResult(id){ api('/api/battles/result?id='+id).then(r=>{ if(!r.error)runBattle(r.host_name,r.bet,r.you_win,true); }); }
function createBattle(){ if(!S.serverMode)return toast('Только в Telegram-версии','bad');
  const bet=parseInt(prompt('Твоя ставка (Stars):','50')); if(!bet||bet<10)return;
  if(S.balance<bet)return toast('Недостаточно Stars','bad');
  api('/api/battles/create',{method:'POST',body:JSON.stringify({bet})}).then(r=>{
    if(r.error)return toast(r.error,'bad');
    S.balance-=bet; save(); renderHeader();
    _bCache=''; openBattleHost(r.id,bet); renderBattles(); }); }
function openBattleHost(bid,bet){
  stopBattleWatch();
  setT('battlePot',fmt(bet*2));
  const w=$('bWheel'); setWheel(w,[{pct:50,color:'#a855f7'},{pct:50,color:'#ec4899'}]);
  if(w){ w.classList.add('idle'); w.style.transition='none'; w.style.transform='none'; }
  setH('battlePlayers',bLegend()+pYou()+'<div class="b-player empty"><span class="emoji">❓</span><b>Ищем соперника…</b></div>');
  setT('battleLog','⏳ Баттл виден всем — ждём соперника');
  modalOpen('battleModal');
  battleWatch=setInterval(async()=>{
    const r=await api('/api/battles/result?id='+bid);
    if(r&&!r.error){ stopBattleWatch();
      const ww=$('bWheel'); if(ww) ww.classList.remove('idle');
      setH('battlePlayers',bLegend()+pYou()+pOpp(r.guest_name));
      setT('battleLog','🎯 Соперник найден! Крутим колесо…');
      setTimeout(()=>spinBattleWheel(r.you_win,r.bet,true,false),700);
    }
  },2500);
}
function joinBattle(id){ api('/api/battles/join',{method:'POST',body:JSON.stringify({id})}).then(r=>{
    if(r.error)return toast(r.error,'bad');
    S.balance-=r.bet; save(); renderHeader(); _bCache='';
    setH('battlePlayers',bLegend()+pOpp(r.host_name)+pYou());
    setT('battleLog','🎯 Крутим колесо…');
    const w=$('bWheel'); setWheel(w,[{pct:50,color:'#ec4899'},{pct:50,color:'#a855f7'}]); if(w)w.classList.remove('idle');
    modalOpen('battleModal');
    setTimeout(()=>spinBattleWheel(r.you_win,r.bet,false,false),700); }); }
function spinBattleWheel(youWin,bet,iAmHost,replay){
  setT('battlePot',fmt(bet*2));
  const segs=iAmHost?[{pct:50,color:'#a855f7'},{pct:50,color:'#ec4899'}]:[{pct:50,color:'#ec4899'},{pct:50,color:'#a855f7'}];
  const winIndex=iAmHost?(youWin?0:1):(youWin?1:0);
  if(replay) setT('battleLog','🎬 Повтор результата…');
  spinWheel($('bWheel'),segs,winIndex,()=>{
    const my=document.querySelector('.b-player.you')||document.querySelector('.b-player.me');
    const op=document.querySelector('.b-player.opp')||document.querySelector('.b-player:not(.me)');
    if(youWin&&my)my.classList.add('win'); if(!youWin&&op)op.classList.add('win');
    if(replay){
      setT('battleLog',youWin?'🎉 Ты победил (повтор, без начислений)':'💥 Ты проиграл (повтор)');
      if(youWin){sfx.win();confetti(60);} else sfx.lose();
      return;
    }
    S.stats.battles++;
    if(youWin){ S.balance+=bet*2; S.stats.bWins++; S.stats.won+=bet*2;
      setT('battleLog','🎉 ПОБЕДА! +⭐'+fmt(bet*2)); sfx.win(); confetti(100); qEvent('battle_win'); }
    else { setT('battleLog','💥 Поражение… банк ушёл сопернику'); sfx.lose(); }
    save(); renderHeader(); checkAch(); _bCache=''; renderBattles();
    setTimeout(refreshMe,1200);
  });
}
function runBattle(hostName,bet,youWin,replay){
  setH('battlePlayers',bLegend()+pOpp(hostName)+pYou());
  const w=$('bWheel'); setWheel(w,[{pct:50,color:'#ec4899'},{pct:50,color:'#a855f7'}]); if(w)w.classList.remove('idle');
  setT('battleLog','🎯 Крутим колесо…'); modalOpen('battleModal');
  setTimeout(()=>spinBattleWheel(youWin,bet,false,!!replay),700); }
function closeBattle(){ stopBattleWatch(); const w=$('bWheel'); if(w)w.classList.remove('idle'); modalClose('battleModal'); _bCache=''; renderBattles(); }

// ===== CASEIMG v35: консолидированный модуль (без слоёв) =====
const CASE_IMG = {
  free:'case_fri.JPG', fri:'case_fri.JPG',
  starter:'case_starter.JPG', start:'case_starter.JPG',
  mini:'case_mini.JPG',
  hype:'case_xaip.JPG', xaip:'case_xaip.JPG',
  premium:'case_premium.JPG', prem:'case_premium.JPG',
  danya:'case_danya.JPG',
  secret:'case_secret.JPG'
};

function caseArt(c){
  const col = CASE_COLORS[c.rarity] || CASE_COLORS.common;
  const src = c.img || CASE_IMG[c.id];
  const art = src
    ? '<img class="case-img" src="'+src+'" alt="'+c.name+'" decoding="async">'
    : '<div class="bow"></div><div class="lid"></div><div class="body"></div><div class="rv"></div><div class="rh"></div><div class="em">'+c.em+'</div>';
  return '<div class="case-art'+(src?' img-art':'')+(c.streamer?' is-streamer':'')+'" style="--c0:'+col[0]+';--c1:'+col[1]+';--c2:'+col[2]+';--glow:'+RAR[c.rarity].glow+'">'+art+'</div>';
}

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
      (curCase.streamer?'<div class="cf-hero-streamer">🎥 '+curCase.streamer+'</div>':'')+
      '<div class="price">'+(curCase.id==='secret'?'🔐 ПО ПРОМОКОДУ':(curCase.price===0?'БЕСПЛАТНО':'⭐ '+fmt(curCase.price)))+'</div>'+
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
  modalOpen('caseModal');
  var oldRow=document.getElementById('secretCodeRow'); if(oldRow) oldRow.remove();
  if(curCase.id==='secret'){
    var act2=document.querySelector('#caseModal .cf-actions');
    if(act2) act2.insertAdjacentHTML('beforebegin','<div id="secretCodeRow" style="display:flex;gap:8px;margin:10px 0 0;"><input id="secretCodeInput" placeholder="🔐 ВВЕДИ ПРОМОКОД КЕЙСА" style="flex:1;min-width:0;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);border-radius:13px;padding:12px;color:#fff;font-size:.85rem;outline:none;min-height:48px;text-transform:uppercase;"></div>');
    var b1=$('btnX1'); if(b1) b1.innerHTML='🔐 ОТКРЫТЬ ПО КОДУ';
    if(b3)b3.style.display='none'; if(b5)b5.style.display='none';
  }

  var modalEl=document.querySelector('#caseModal .modal');
  var oldBlock=document.getElementById('caseContentsBlock'); if(oldBlock) oldBlock.remove();
  if(modalEl){
    var items=curCase.drops.map(function(dd){ var g=gift(dd[0]); var pct=dd[1]*100; var pc=pct<1?pct.toFixed(2):pct.toFixed(0);
      return '<div class="c-item" style="border:1px solid '+RAR[g.rarity].color+'55;">'+
        '<div class="ch">'+pc+'%</div>'+
        gImg(g)+'<div class="cname">'+g.name+'</div>'+
        '<div class="cprice">⭐'+g.price+'</div></div>'; }).join('');
    var act0=modalEl.querySelector('.cf-actions'); (act0||modalEl).insertAdjacentHTML('beforebegin','<div id="caseContentsBlock" style="display:block;margin:0 0 12px;flex:0 0 auto;">'+
      '<div style="font-size:.82rem;font-weight:900;margin-bottom:8px;color:#fff;">🎁 Содержимое кейса</div>'+
      '<div class="contents" style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;max-height:34vh;overflow-y:auto;padding:2px;">'+items+'</div></div>');
  }
  var cf=$('cmContents');
  if(cf){
    cf.style.cssText='display:block;margin:0 0 12px;flex:0 0 auto;min-height:60px;';
    var grid=cf.querySelector('.contents');
    if(grid){ grid.style.cssText='display:grid;grid-template-columns:repeat(3,1fr);gap:8px;max-height:42vh;overflow-y:auto;margin:0;padding:2px;'; }
    var hero=cf.querySelector('.cf-hero');
    if(hero){ hero.style.cssText='display:flex;gap:14px;align-items:center;padding:4px 2px 10px;'; }
  }
}

// ---- Задания + понятная рефералка ----
function renderTasks(){ const fr=freeReady();
  setT('freeCaseState',fr?'Доступен сейчас · 1 спин · подписка':'Следующий через '+Math.ceil((FREE_CASE_COOLDOWN-(Date.now()-S.freeLast))/36e5)+' ч.');
  const sb=$('subBtn');
  if(sb){ if(S.subDone){sb.textContent='✅ Награда получена';sb.disabled=true;sb.classList.add('pressed');}
    else {sb.textContent='Подписаться';sb.disabled=false;sb.classList.remove('pressed');} }
  setT('refCount',S.refs);
  const re=$('refExplain');
  if(re) re.innerHTML='<div class="ref-explain">'+
      '<div class="re-step"><b>1.</b> Поделись ссылкой с другом</div>'+
      '<div class="re-step"><b>2.</b> Друг заходит в игру (бесплатно)</div>'+
      '<div class="re-step highlight"><b>3.</b> Друг делает первый депозит от ⭐5</div>'+
      '<div class="re-step reward"><b>4.</b> Ты получаешь ⭐'+REF_REWARD+'!</div></div>';
  renderQuests(); renderAchs();
  if(S.serverMode && !S.subDone && Date.now()-_subCheckTs>15000){ _subCheckTs=Date.now();
    checkSub().then(ok=>{ if(ok){ S.subDone=true; renderTasks(); renderProfile(); } }); }
}
let _subCheckTs=0;

// ---- Квесты = XP ----
function renderQuests(){ setH('questsList',QUESTS.map(q=>{
  const p=Math.min(S.qp[q.type]||0,q.target),done=p>=q.target,cl=S.qc.includes(q.id);
  return '<div class="quests-row"><div class="q-head"><span>'+q.name+'</span><span class="muted">'+p+'/'+q.target+'</span></div>'+
    '<div class="q-bar"><div class="q-fill" style="width:'+(p/q.target*100)+'%"></div></div>'+
    '<button class="q-claim" '+(done&&!cl?'':'disabled')+' onclick="claimQuest(\''+q.id+'\')">'+(cl?'✅ Получено':'Забрать +'+(q.reward*10)+' XP')+'</button></div>';}).join('')); }
function claimQuest(id){ const q=QUESTS.find(x=>x.id===id);
  if(S.qc.includes(id)||(S.qp[q.type]||0)<q.target)return;
  S.qc.push(id); S.xp+=q.reward*10; sfx.win(); toast('📜 Квест выполнен: +'+(q.reward*10)+' XP 🏅','good');
  saveLocal(); renderHeader(); renderTasks(); }

// ---- Серверные кейсы ----
function saveLocal(){ localStorage.setItem('cashbanni_v2', JSON.stringify(S)); }
async function spin(n){ if(spinning) return;
  if(curCase.free&&!freeReady()) return toast('⏳ Раз в 24 часа','bad');
  if(curCase.free) n=1;
  spinning=true;
  var caseCode='';
  if(curCase.id==='secret'){ var ci=$('secretCodeInput'); caseCode=(ci?ci.value:'').trim().toUpperCase(); if(!caseCode){ spinning=false; toast('🔐 Введи промокод кейса','bad'); return; } }
  const r=await api('/api/case_open',{method:'POST',body:JSON.stringify({id:curCase.id,count:n,code:caseCode})});
  if(r.error){ spinning=false;
    if(String(r.error).indexOf('подпис')>=0){ toast('📢 Только для подписчиков','bad'); openChannel(); }
    else toast('❌ '+r.error,'bad');
    return; }
  S.balance=r.balance; S.inv=r.inv; S.stats=Object.assign(DEF().stats,r.stats); S.xp=r.xp||S.xp;
  if(curCase.free) S.freeLast=Date.now();
  saveLocal(); renderHeader();
  const wins=r.results.map(gid=>gift(gid));
  const box=$('cfStrips'); box.innerHTML=''; box.dataset.n=n;
  const modal=document.querySelector('#caseModal .modal'); if(modal) modal.classList.toggle('compact', n>1);
  const newItems=(r.inv||[]).slice((r.inv||[]).length-n);
  const rows=wins.map((g,i)=>{ const c=document.createElement('div'); c.className='roulette-container';
    c.innerHTML='<div class="roulette-pointer"></div><div class="roulette-strip"></div>';
    box.appendChild(c); return {c:c,strip:c.querySelector('.roulette-strip'),g:g,uid:(newItems[i]&&newItems[i].uid)||uid()}; });
  rows.forEach(x=>buildStrip(x.strip,x.g));
  const dur=(n===1)?8500:7000;
  await Promise.all(rows.map(x=>animateStrip(x.strip,dur)));
  rows.forEach(x=>{ x.c.classList.add('won');
    x.c.insertAdjacentHTML('beforeend','<div class="strip-win" data-ow="'+x.uid+'">'+gImg(x.g)+
      '<div class="sw-info"><b>+'+x.g.name+'</b><span>⭐'+x.g.price+'</span></div>'+
      '<div class="sw-acts"><button class="sw-btn sell" onclick="sellWon(\''+x.uid+'\')">Продать</button>'+
      '<button class="sw-btn keep" onclick="keepWon(\''+x.uid+'\')">В инвентарь</button></div></div>'); });
  for(const g of wins){ if(g.rarity==='epic'||g.rarity==='legendary'){ sfx.legend(); confetti(150); toast('💎 ЭПИКА: '+g.name+'!','good'); } }
  if(wins.every(g=>g.rarity!=='epic'&&g.rarity!=='legendary')) sfx.win();
  spinning=false; saveLocal(); renderHeader(); renderCases(); renderTasks(); refreshInv(); checkAch();
}
function keepWon(u){ sfx.click(); refreshInv();
  const o=document.querySelector('[data-ow="'+u+'"]'); if(o){ o.innerHTML='📦 В инвентаре'; setTimeout(()=>o.classList.add('fade'),1000); } }
function sellWon(u){ const idx=S.inv.findIndex(i=>i.uid===u); if(idx<0)return;
  const g=gift(S.inv[idx].gid); if(!g)return;
  S.inv.splice(idx,1); S.balance+=g.price; S.stats.sells=(S.stats.sells||0)+1;
  qEvent('sell'); sfx.win(); toast('Продано: '+g.name+' +⭐'+fmt(g.price),'good');
  save(); renderHeader(); refreshInv(); checkAch();
  const o=document.querySelector('[data-ow="'+u+'"]'); if(o){ o.innerHTML='✅ Продано +⭐'+g.price; setTimeout(()=>o.classList.add('fade'),1000); } }

// ---- Титулы (бейдж-сосед, не затирается) ----
function playerTitle(){ const st=S.stats||{};
  if((st.won||0)>=5000) return {t:'🐋 Кит',c:'gold'};
  if((st.opened||0)>=200) return {t:'👑 Легенда кейсов',c:'gold'};
  if((st.bWins||0)>=10) return {t:'⚔️ Гладиатор',c:'epic'};
  if((st.opened||0)>=100) return {t:'📦 Коллекционер',c:'epic'};
  if((st.won||0)>=1000) return {t:'⭐ Про',c:'rare'};
  if((st.opened||0)>=25) return {t:'🎮 Игрок',c:'rare'};
  return {t:'🌱 Новичок',c:'common'}; }

// ---- Баттлы: подписи + кэш ----
let _bCache='';
function pYou(n){ return '<div class="b-player you"><span class="emoji">😎</span><b>'+(n||S.tgName||'Ты')+'</b><span class="bp-tag you">ТЫ</span></div>'; }
function pOpp(n){ return '<div class="b-player opp"><span class="emoji">🧑</span><b>'+(n||'Игрок')+'</b><span class="bp-tag opp">СОПЕРНИК</span></div>'; }
function bLegend(){ return '<div class="b-legend"><span class="lg-you">🟣 Твоя сторона</span><span class="lg-opp">🩷 Соперник</span></div>'; }
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

// ---- Flush save перед серверной перезаписью ----
function flushSave(){ if(!S.serverMode)return Promise.resolve(); clearTimeout(saveTimer);
  return api("/api/save",{method:"POST",body:JSON.stringify({balance:S.balance,inv:S.inv,stats:S.stats,xp:S.xp})}); }
async function refreshMe(){ await flushSave(); const me=await apiR('/api/me');
  if(me&&me.tg_id){ S.balance=Number(me.balance)||0; S.inv=Array.isArray(me.inv)?me.inv:[];
    S.stats=Object.assign(DEF().stats, me.stats||{}); S.xp=Number(me.xp)||0;
    S.refs=me.ref_count||0; S.isAdmin=!!me.admin; S.createdAt=me.created_at||S.createdAt;
    S.serverMode=true; save(); renderHeader();
    try{ renderSection(activeTab()); }catch(e){} } }

// ===== v42: дизайнерские дропы с картинками (как фотки кейсов) =====
function gImg(g,cls){ cls=cls||'gimg';
  var tier=(g.rarity==='nft')?(g.price>=28000?' nft-mythic':(g.price>=8000?' nft-ultra':'')):'';
  var src=(typeof GIFT_IMG!=='undefined'?GIFT_IMG:{})[g.id];
  if(!src) return '<span class="emoji'+tier+'">'+g.emoji+'</span>';
  return '<img class="'+cls+tier+'" src="'+src+'" alt="" decoding="async" loading="lazy" onerror="this.style.display=\'none\';if(this.nextElementSibling)this.nextElementSibling.style.display=\'block\'">'+
         '<span class="emoji'+tier+'" style="display:none">'+g.emoji+'</span>'; }

// ===== v53: баттлы на замке =====
function renderBattles(){ setH('battlesList','<div class="battle-empty"><span class="emoji">🔒</span><b>Баттлы временно закрыты</b><span class="muted">Режим на обслуживании — скоро вернём с обновлением</span></div>'); }
function createBattle(){ toast('🔒 Баттлы временно закрыты — скоро откроем','bad'); }
function joinBattle(id){ toast('🔒 Баттлы временно закрыты','bad'); }

// ===== v55: live NFT prices with server =====
async function syncNftPrices(){ const r=await api('/api/gifts');
  if(r&&r.rows){ r.rows.forEach(x=>{ const g=GIFTS.find(q=>q.id===x.id);
    if(g){ g.price=x.price||g.price; g.name=x.name||g.name; g.emoji=x.emoji||g.emoji; } });
    try{ renderCases(); }catch(e){} } }
setTimeout(syncNftPrices,3000);
setInterval(syncNftPrices,600000);

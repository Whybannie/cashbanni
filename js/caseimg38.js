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

/* v71.3: DUPLICATE REMOVED — см. fix71.js */
/* function caseArt(c){
  const col = CASE_COLORS[c.rarity] || CASE_COLORS.common;
... */

/* v71.3: DUPLICATE REMOVED — см. fix71.js */
/* function openCaseModal(id){ sfx.click(); curCase=CASES.find(c=>c.id===id);
  if(... */

// ---- Задания + понятная рефералка ----
/* v71.3: DUPLICATE REMOVED — см. fix71.js */
/* function renderTasks(){ const fr=freeReady();
  setT('freeCaseState',fr?'Доступе... */
let _subCheckTs=0;

// ---- Квесты = XP ----
/* v71.3: DUPLICATE REMOVED — см. fix71.js */
/* function renderQuests(){ setH('questsList',QUESTS.map(q=>{
  const p=Math.min(S.... */
function keepWon(u){ sfx.click(); refreshInv();
  const o=document.querySelector('[data-ow="'+u+'"]'); if(o){ o.innerHTML='📦 В инвентаре'; setTimeout(()=>o.classList.add('fade'),1000); } }
function sellWon(u){ const idx=S.inv.findIndex(i=>i.uid===u); if(idx<0)return;
  const g=gift(S.inv[idx].gid); if(!g)return;
  S.inv.splice(idx,1); S.balance+=g.price; S.stats.sells=(S.stats.sells||0)+1;
  qEvent('sell'); sfx.win(); toast('Продано: '+g.name+' +⭐'+fmt(g.price),'good');
  save(); renderHeader(); refreshInv(); checkAch();
  const o=document.querySelector('[data-ow="'+u+'"]'); if(o){ o.innerHTML='✅ Продано +⭐'+g.price; setTimeout(()=>o.classList.add('fade'),1000); } }

// ---- Титулы (бейдж-сосед, не затирается) ----
/* v71.3: DUPLICATE REMOVED — см. fix71.js */
/* function playerTitle(){ const st=S.stats||{};
  if((st.won||0)>=5000) return {t:... */
/* v71.3: DUPLICATE REMOVED — см. fix71.js */
/* function renderBattles(){ if(!S.serverMode){setH('battlesList','<div class="mute... */
/* v71.3: DUPLICATE REMOVED — см. fix71.js */
/* function joinBattle(id){ api('/api/battles/join',{method:'POST',body:JSON.string... */
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

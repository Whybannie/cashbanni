const BUILD = 67;

// ===== v68: aggressive cache-bust reload =====
(function(){
  var stored=localStorage.getItem('cashbanni_build');
  if(stored && stored!==String(BUILD)){
    localStorage.setItem('cashbanni_build', String(BUILD));
    location.replace(location.pathname+'?v='+BUILD+'&t='+Date.now());
    return;
  }
  if(!stored) localStorage.setItem('cashbanni_build', String(BUILD));
})();

const $ = id => document.getElementById(id);
const setT = (id,v) => { const e=$(id); if(e) e.textContent=v; };
const setH = (id,v) => { const e=$(id); if(e) e.innerHTML=v; };
const fmt = n => (Number(n)||0).toLocaleString('ru-RU');
const rnd = (a,b) => a + Math.random()*(b-a);
const pick = a => a[Math.floor(Math.random()*a.length)];
const gift = id => GIFTS.find(g=>g.id===id);
const uid = () => Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const SUB_REWARD = 10;
const PAY_PRESETS = [1,5,10,25,50,100,250,500];
const STRIP_W = 132;

const DEF = () => ({
  balance:ECO.START_BALANCE, xp:0, inv:[],
  stats:{opened:0,spent:0,won:0,best:0,upgrades:0,upWins:0,battles:0,bWins:0,sells:0,buys:0,crashWins:0,mines:0,minesW:0,plinko:0,plinkoW:0},
  qp:{}, qc:[], ac:[], promo:[], refs:0, freeLast:0, subDone:false, tgId:null, migrated:false, createdAt:null,
  sound:true, fair:false, seed:uid()+uid(), serverMode:false, isAdmin:false
});
let S = load();
function load(){
  try{
    const s=JSON.parse(localStorage.getItem('cashbanni_v2'));
    if(!s) return DEF();
    const def=DEF(); const out=Object.assign(def,s);
    out.stats=Object.assign(def.stats,s.stats||{});
    if(out.sound===undefined||out.sound===null) out.sound=true;
    out.inv=(Array.isArray(s.inv)?s.inv:[]).filter(i=>i&&i.gid&&GIFTS.some(g=>g.id===i.gid));
    out.inv.forEach(i=>{ if(!i.uid) i.uid=uid(); });
    return out;
  }catch(e){ return DEF(); }
}
function saveLocal(){ localStorage.setItem('cashbanni_v2', JSON.stringify(S)); }
let saveTimer=null;
function apiSave(){ if(!S.serverMode)return; clearTimeout(saveTimer);
  saveTimer=setTimeout(()=>{ api("/api/save",{method:"POST",body:JSON.stringify({balance:S.balance,inv:S.inv,stats:S.stats,xp:S.xp})}); },300); }
function save(){ saveLocal(); if(S.serverMode){ clearTimeout(saveTimer); api("/api/save",{method:"POST",body:JSON.stringify({balance:S.balance,inv:S.inv,stats:S.stats,xp:S.xp})}); } }

const TG = (window.Telegram && window.Telegram.WebApp) || null;
let FS_MODE = false;
function applySafe(){
  let top = 0;
  try{ if(TG&&TG.safeAreaInset&&TG.safeAreaInset.top) top = TG.safeAreaInset.top||0; }catch(e){}
  if (TG && TG.initData) top = Math.max(top, 52) + 16;
  if (FS_MODE) top = Math.max(top, 60) + 12;
  document.documentElement.style.setProperty('--sat', top+'px');
  let bot = 0;
  try{ if(TG&&TG.safeAreaInset&&TG.safeAreaInset.bottom) bot = TG.safeAreaInset.bottom||0; }catch(e){}
  document.documentElement.style.setProperty('--sab', bot+'px');
}
if (TG) { try {
  TG.ready(); TG.expand(); setTimeout(()=>{try{TG.expand()}catch(e){}},300);
  if (TG.initData) document.body.classList.add('tg');
  if (TG.requestFullscreen) { try{ const p=TG.requestFullscreen(); if(p&&p.then)p.then(()=>{FS_MODE=true;applySafe();}).catch(()=>{}); }catch(e){} }
  if (TG.setHeaderColor) TG.setHeaderColor('#06061a');
  if (TG.setBackgroundColor) TG.setBackgroundColor('#06061a');
  if (TG.onEvent){ TG.onEvent('safeAreaChanged',applySafe); TG.onEvent('viewportChanged',applySafe); }
  const u = TG.initDataUnsafe && TG.initDataUnsafe.user; if (u) S.tgName = u.first_name || null;
} catch (e) {} }
applySafe();

(function(){ try{
  const m = document.querySelector('meta[name="build"]');
  const pb = m ? m.content : '0';
  if (pb !== String(BUILD)) { const key='cb_reload_'+BUILD;
    if (!localStorage.getItem(key)) { localStorage.setItem(key,'1'); location.replace(location.pathname+'?cb='+BUILD+'&'+Date.now()); } }
}catch(e){} })();

function haptic(k){ try{ if(!TG||!TG.HapticFeedback)return;
  if(k==='success')TG.HapticFeedback.notificationOccurred('success');
  else if(k==='error')TG.HapticFeedback.notificationOccurred('error');
  else TG.HapticFeedback.impactOccurred('light'); }catch(e){} }

const API_BASE = "https://cashbanni-api-proxy2.vercel.app";
async function api(path, opts = {}) {
  try {
    const init = (TG && TG.initData) ? TG.initData : "";
    const res = await fetch(API_BASE + path, { ...opts, headers: { "Content-Type":"application/json", "X-Telegram-Init-Data": init } });
    if (!res.ok) return { error: "http " + res.status };
    return await res.json();
  } catch (e) { return { error: e.message }; }
}
async function apiR(path, opts, tries) {
  tries = tries===undefined ? 2 : tries;
  let r = await api(path, opts);
  if (r && r.error && tries > 0) { await new Promise(res=>setTimeout(res,1200)); r = await apiR(path, opts, tries-1); }
  return r;
}
function errBalance(need){
  errModal('💸','Не хватает звёзд','Для этой операции нужно ⭐'+fmt(need)+' на балансе.',[
    {label:'🎯 Пополнить',primary:true,action:function(){modalClose('errModal');openPay();}},
    {label:'Позже',action:function(){modalClose('errModal');}}
  ]);
}
function errCooldown(hoursLeft){
  errModal('⏳','Бесплатный кейс','Ты уже открывал бесплатный кейс сегодня. Следующий — через '+hoursLeft+' ч.',[
    {label:'Хорошо',primary:true,action:function(){modalClose('errModal');}}
  ]);
}
function errSub(){ gateSub(); }
function errUsedCode(){
  errModal('🔒','Код уже использован','Ты уже открывал этот промокод. Попроси новый у стримера!',[
    {label:'Понятно',primary:true,action:function(){modalClose('errModal');}}
  ]);
}
function errBadCode(){
  errModal('❌','Неверный код','Такого промокода нет или он уже исчерпан.',[
    {label:'Попробовать снова',primary:true,action:function(){modalClose('errModal');}},
    {label:'Закрыть',action:function(){modalClose('errModal');}}
  ]);
}
function errGeneric(msg){
  errModal('⚠️','Ошибка',msg||'Что-то пошло не так. Попробуй ещё раз.',[
    {label:'Понятно',primary:true,action:function(){modalClose('errModal');}}
  ]);
}
function smartError(msg){
  if(!msg){ errGeneric(); return; }
  var m=String(msg);
  if(/недостаточно|not enough|хватает/i.test(m)) errBalance(0);
  else if(/24ч|24 ?ч|cooldown|раз в/i.test(m)) errCooldown(24);
  else if(/подписк|sub/i.test(m)){ gateSub(); return; }
  else if(/уже открывал|already used|used/i.test(m)) errUsedCode();
  else if(/неверн|invalid|использован|лимит исчерпан/i.test(m)) errBadCode();
  else errGeneric(m);
}

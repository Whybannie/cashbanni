// ===== PLINKO v27: медленнее, мульти-шары, чипы 5-100 =====
const PL_ROWS=10;
const PL_MULT=[12,3.5,1.6,1.0,0.8,0.6,0.8,1.0,1.6,3.5,12];
const PL_MAX_BALLS=12;
const PL_STEP_MS=190;   // скорость шага (было 125)
const pl={bet:20,hist:[]};
function plBet(d){ pl.bet=Math.max(5,pl.bet+d); plSync(); sfx.click(); }
function plSet(v){ pl.bet=v; plSync(); sfx.click(); }
function plSync(){ setT('plinkoBetVal',pl.bet);
  const b=$('plinkoBtn'); if(!b)return;
  b.textContent='БРОСИТЬ ⭐'+pl.bet;
  b.className='btn crash-main-btn bet'; b.disabled=false; }
function buildPlinkoBoard(){
  const board=$('plinkoBoard'); if(!board||board.dataset.built)return; board.dataset.built='1';
  const step=100/(PL_ROWS+2);
  let html='';
  for(let r=0;r<PL_ROWS;r++){
    const count=r+3;
    for(let i=0;i<count;i++){
      const x=50+(i-(count-1)/2)*step;
      const y=10+r*6.5;
      html+='<span class="pl-peg" style="left:'+x+'%;top:'+y+'%"></span>';
    }
  }
  html+='<div class="pl-slots">';
  for(let k=0;k<=PL_ROWS;k++) html+='<div class="pl-slot" data-k="'+k+'">'+PL_MULT[k]+'×</div>';
  html+='</div>';
  board.innerHTML=html;
}
function plHist(){ setH('plinkoHist',pl.hist.map(m=>'<span class="ch-h '+(m>=3.5?'hi':m>=1?'mid':'lo')+'">'+m+'×</span>').join('')); }
function plinkoDrop(){
  const board=$('plinkoBoard');
  if(!board)return;
  if(board.querySelectorAll('.pl-ball.on').length>=PL_MAX_BALLS) return toast('Максимум '+PL_MAX_BALLS+' шаров одновременно','bad');
  if(S.balance<pl.bet) return toast('Недостаточно Stars ⭐','bad');
  const bet=pl.bet;
  S.balance-=bet; save(); renderHeader();
  const ball=document.createElement('div'); ball.className='pl-ball on'; board.appendChild(ball);
  const step=100/(PL_ROWS+2);
  const dirs=[]; for(let r=0;r<PL_ROWS;r++) dirs.push(Math.random()<0.5?0:1);
  let r=0,k=0;
  ball.style.transition='none'; ball.style.left='50%'; ball.style.top='4%';
  function stepAnim(){
    if(r>=PL_ROWS){
      const cx=2+(k+0.5)*96/11;
      ball.style.transition='left .2s linear, top .2s ease-in';
      ball.style.left=cx+'%'; ball.style.top='84%';
      setTimeout(()=>{
        const slot=board.querySelector('.pl-slot[data-k="'+k+'"]');
        if(slot){ slot.classList.add('hit'); setTimeout(()=>slot.classList.remove('hit'),900); }
        const mult=PL_MULT[k]; const win=Math.floor(bet*mult);
        S.balance+=win; S.stats.won+=win;
        S.stats.plinko=(S.stats.plinko||0)+1; if(mult>=1)S.stats.plinkoW=(S.stats.plinkoW||0)+1;
        pl.hist.unshift(mult); pl.hist=pl.hist.slice(12); plHist();
        ball.remove();
        if(mult>=3.5){ sfx.win(); confetti(80); toast('✅ '+mult+'× → +⭐'+fmt(win),'good'); }
        else if(mult>=1){ sfx.tick(); }
        save(); renderHeader(); checkAch();
      },220);
      return;
    }
    k+=dirs[r];
    const rr=r+1;
    const x=50+(k-rr/2)*step;
    const y=10+r*6.5+3.2;
    ball.style.transition='left .18s linear, top .18s cubic-bezier(.45,.05,.55,.95)';
    ball.style.left=x+'%'; ball.style.top=y+'%';
    r++;
    setTimeout(stepAnim,PL_STEP_MS);
  }
  stepAnim();
}
(function(){ const cw=document.querySelector('#sec-plinko .cp-chips');
  if(cw) cw.innerHTML=[5,10,25,50,100].map(v=>'<button class="cp-chip" onclick="plSet('+v+')">'+v+'</button>').join(''); })();
buildPlinkoBoard(); plHist(); plSync();

// ========== ЭКОНОМИКА ==========
const ECO = { START_BALANCE: 0, DISCOUNT: 0.8, UPGRADE_EDGE: 1 };
const FREE_CASE_COOLDOWN = 24*60*60*1000; // 24 часа
const REF_REWARD = 5;
const CHANNEL = "https://t.me/CashBanni";

// ========== РЕДКОСТИ ==========
const RAR = {
  common:    { color:'#22c55e', glow:'rgba(34,197,94,.35)' },
  rare:      { color:'#3b82f6', glow:'rgba(59,130,246,.35)' },
  epic:      { color:'#a855f7', glow:'rgba(168,85,247,.40)' },
  legendary: { color:'#fbbf24', glow:'rgba(251,191,36,.45)' }
};
const CASE_COLORS = {
  common:    ['#052e16','#14532d','#166534'],
  rare:      ['#0c1a3a','#1e3a8a','#1d4ed8'],
  epic:      ['#2e1065','#6b21a8','#7e22ce'],
  legendary: ['#451a03','#92400e','#b45309']
};

// ========== ПОДАРКИ (реальные цены TG Stars) ==========
const GIFTS = [
  { id:'rose',    name:'Роза',    emoji:'🌹', price:15,   rarity:'common' },
  { id:'heart',   name:'Сердце',  emoji:'❤️', price:15,   rarity:'common' },
  { id:'teddy',   name:'Мишка',   emoji:'🧸', price:15,   rarity:'common' },
  { id:'clover',  name:'Клевер',  emoji:'🍀', price:25,   rarity:'common' },
  { id:'star',    name:'Звезда',  emoji:'⭐', price:50,   rarity:'rare' },
  { id:'rocket',  name:'Ракета',  emoji:'🚀', price:100,  rarity:'rare' },
  { id:'crown',   name:'Корона',  emoji:'👑', price:250,  rarity:'epic' },
  { id:'diamond', name:'Алмаз',   emoji:'💎', price:500,  rarity:'legendary' },
  { id:'trophy',  name:'Кубок',   emoji:'🏆', price:1000, rarity:'legendary' }
];

// ========== КЕЙСЫ (дизайнерские арты из img/) ==========
const CASES = [
  { id:'free', name:'Бесплатный кейс', rarity:'common', price:0, free:true, em:'🎁', img:'case_fri.JPG',
    drops:[['rose',.50],['heart',.30],['teddy',.15],['clover',.05]] },
  { id:'starter', name:'Стартер', rarity:'common', price:15, em:'📦', img:'case_starter.JPG',
    drops:[['rose',.40],['heart',.30],['teddy',.20],['clover',.07],['star',.03]] },
  { id:'mini', name:'Мини', rarity:'rare', price:40, em:'🧰', img:'case_mini.JPG',
    drops:[['clover',.45],['star',.35],['rocket',.15],['crown',.05]] },
  { id:'xaip', name:'Хайп', rarity:'epic', price:120, em:'🔥', img:'case_xaip.JPG',
    drops:[['star',.40],['rocket',.35],['crown',.18],['diamond',.07]] },
  { id:'premium', name:'Премиум', rarity:'legendary', price:300, em:'💎', img:'case_premium.JPG',
    drops:[['rocket',.40],['crown',.35],['diamond',.18],['trophy',.07]] }
];

// ========== КВЕСТЫ ==========
const QUESTS = [
  { id:'q_open5',  name:'Открой 5 кейсов',           type:'open',        target:5,  reward:20 },
  { id:'q_open25', name:'Открой 25 кейсов',          type:'open',        target:25, reward:75 },
  { id:'q_sell3',  name:'Продай 3 предмета',         type:'sell',        target:3,  reward:15 },
  { id:'q_buy2',   name:'Купи 2 предмета в маркете', type:'buy',         target:2,  reward:20 },
  { id:'q_up1',    name:'Выиграй апгрейд',           type:'upgrade_win', target:1,  reward:30 },
  { id:'q_bat1',   name:'Победи в баттле',           type:'battle_win',  target:1,  reward:40 }
];

// ========== ДОСТИЖЕНИЯ ==========
const ACHS = [
  { id:'a_first',  name:'Первый кейс',  emoji:'🎁', cond:S=>(S.stats.opened||0)>=1 },
  { id:'a_open50', name:'Коллекционер', emoji:'📦', cond:S=>(S.stats.opened||0)>=50 },
  { id:'a_rich',   name:'Богач',        emoji:'💰', cond:S=>(S.stats.won||0)>=1000 },
  { id:'a_up10',   name:'Инженер',      emoji:'⚡', cond:S=>(S.stats.upWins||0)>=10 },
  { id:'a_bat5',   name:'Гладиатор',    emoji:'⚔️', cond:S=>(S.stats.bWins||0)>=5 },
  { id:'a_crash',  name:'Ловец ракет',  emoji:'🚀', cond:S=>(S.stats.crashWins||0)>=10 },
  { id:'a_mines',  name:'Сапёр',        emoji:'💎', cond:S=>(S.stats.minesW||0)>=10 }
];

// ========== ПРОМОКОДЫ (локальный фолбэк) ==========
const PROMOS = { START:50, CASH:75, BANNI2026:150, MELLSTROY:250 };

const TGS = 'https://raw.githubusercontent.com/MasterGroosha/telegram-gifts-catalogue/web/images/';

const RAR = {
  common:    { name:'Обычный',     color:'#9ca3af', glow:'rgba(156,163,175,.3)' },
  rare:      { name:'Редкий',      color:'#60a5fa', glow:'rgba(96,165,250,.4)' },
  epic:      { name:'Эпический',   color:'#c084fc', glow:'rgba(192,132,252,.45)' },
  legendary: { name:'Легендарный', color:'#fbbf24', glow:'rgba(251,191,36,.5)' },
};

// ============ ЛОГИЧЕСКАЯ ЦЕПОЧКА ОТ ЦЕН TG ============
// цена 15/25 = common, 50 = rare, 100 = epic (позже NFT = legendary)
// имена/эмодзи/цены = откалиброваны по реальным картинкам TG
const GIFTS = [
  { id:'bear',    emoji:'🧸', name:'Мишка',    rarity:'common', price:15,  tgs:TGS+'5170233102089322756.tgs' },
  { id:'heart',   emoji:'❤️', name:'Сердце',   rarity:'common', price:15,  tgs:TGS+'5170145012310081615.tgs' },
  { id:'rose',    emoji:'🌹', name:'Роза',     rarity:'common', price:25,  tgs:TGS+'5168103777563050263.tgs' },
  { id:'box',     emoji:'🎁', name:'Бокс',     rarity:'common', price:25,  tgs:TGS+'5170250947678437525.tgs' },
  { id:'cake',    emoji:'🎂', name:'Тортик',   rarity:'rare',   price:50,  tgs:TGS+'5170144170496491616.tgs' },
  { id:'bouquet', emoji:'💐', name:'Букет',    rarity:'rare',   price:50,  tgs:TGS+'5170314324215857265.tgs' },
  { id:'rocket',  emoji:'🚀', name:'Ракета',   rarity:'rare',   price:50,  tgs:TGS+'5170564780938756245.tgs' },
  { id:'beer',    emoji:'🍾', name:'Пиво',     rarity:'rare',   price:50,  tgs:TGS+'6028601630662853006.tgs' },
  { id:'ring',    emoji:'💍', name:'Кольцо',   rarity:'epic',   price:100, tgs:TGS+'5170690322832818290.tgs' },
  { id:'trophy',  emoji:'🏆', name:'Кубок',    rarity:'epic',   price:100, tgs:TGS+'5168043875654172773.tgs' },
  { id:'diamond', emoji:'💎', name:'Алмаз',    rarity:'epic',   price:100, tgs:TGS+'5170521118301225164.tgs' },
];

// КЕЙСЫ = тиры цепочки (EV считаем от цен TG, edge 10-14%)
const CASES = [
  { id:'starter', name:'Стартер',  em:'⭐', price:20,  rarity:'common',
    drops:[['bear',.40],['heart',.30],['rose',.18],['box',.12]] },
  { id:'hype',    name:'Хайп',     em:'🔥', price:45,  rarity:'rare',
    drops:[['rose',.25],['box',.25],['bouquet',.20],['cake',.15],['rocket',.10],['ring',.05]] },
  { id:'premium', name:'Премиум',  em:'💎', price:110, rarity:'epic',
    drops:[['ring',.35],['trophy',.35],['diamond',.20],['rocket',.10]] },
];

const CASE_COLORS = {
  common:    ['#2c2c4a','#4a4a7a','#9ca3af'],
  rare:      ['#14304f','#1d4ed8','#60a5fa'],
  epic:      ['#3b1656','#7e22ce','#c084fc'],
  legendary: ['#4a2c0a','#b45309','#fbbf24'],
};

const QUESTS = [
  { id:'q1', type:'open',        target:3,  reward:15, name:'Открой 3 кейса' },
  { id:'q2', type:'open',        target:10, reward:60, name:'Открой 10 кейсов' },
  { id:'q3', type:'sell',        target:2,  reward:10, name:'Продай 2 предмета' },
  { id:'q4', type:'upgrade_win', target:1,  reward:40, name:'Выиграй апгрейд' },
  { id:'q5', type:'battle_win',  target:1,  reward:50, name:'Выиграй баттл' },
  { id:'q6', type:'buy',         target:1,  reward:15, name:'Купи подарок в маркете' },
];

const ACHS = [
  { id:'a1', emoji:'🎁', name:'Первый дроп',         cond:s=>s.stats.opened>=1 },
  { id:'a2', emoji:'📦', name:'100 кейсов',           cond:s=>s.stats.opened>=100 },
  { id:'a3', emoji:'💎', name:'Поймать эпику (100⭐)', cond:s=>s.stats.best>=100 },
  { id:'a4', emoji:'💰', name:'Баланс 2 000',         cond:s=>s.balance>=2000 },
  { id:'a5', emoji:'⚔️', name:'5 побед в баттлах',    cond:s=>s.stats.bWins>=5 },
  { id:'a6', emoji:'⚡', name:'3 успешных апгрейда',  cond:s=>s.stats.upWins>=3 },
];

const PROMOS = { 'START':50, 'CASH':75, 'BANNI2026':150, 'MELLSTROY':250 };
const BOTS = ['mellstroy_fan','drop_king','lucky_boy','star_hunter','case_master','gift_pro','neon_gamer','crypto_kid','banni_top','xXdroperXx'];

const ECO = { SELL_BACK:0.7, DISCOUNT:0.8, DAILY_BASE:50, DAILY_STEP:25, DAILY_CAP:300, START_BALANCE:100 };

// Калибровка с gifts.html (если есть) поверх базы
try{
  const __m = JSON.parse(localStorage.getItem('cb_gift_map') || 'null');
  if (__m) __m.forEach(o => {
    const g = GIFTS.find(x => x.id === o.id);
    if (g) {
      if (o.name)   g.name   = o.name;
      if (o.price)  g.price  = +o.price;
      if (o.rarity) g.rarity = o.rarity;
      if (o.emoji)  g.emoji  = o.emoji;
    }
  });
}catch(e){}

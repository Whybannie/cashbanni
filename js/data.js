const TGS = 'https://raw.githubusercontent.com/MasterGroosha/telegram-gifts-catalogue/web/images/';

const RAR = {
  common:    { name:'Обычный',     color:'#9ca3af', glow:'rgba(156,163,175,.3)' },
  rare:      { name:'Редкий',      color:'#60a5fa', glow:'rgba(96,165,250,.4)' },
  epic:      { name:'Эпический',   color:'#c084fc', glow:'rgba(192,132,252,.45)' },
  legendary: { name:'Легендарный', color:'#fbbf24', glow:'rgba(251,191,36,.5)' },
};

// Виртуальные дешёвые дропы (1-5⭐) + реальные подарки TG
const GIFTS = [
  { id:'dust',    emoji:'✨', name:'Звёздная пыль', rarity:'common', price:1,   tgs:'' },
  { id:'coin',    emoji:'🪙', name:'Монетка',       rarity:'common', price:3,   tgs:'' },
  { id:'spark',   emoji:'💫', name:'Искра',         rarity:'common', price:5,   tgs:'' },
  { id:'bear',    emoji:'🧸', name:'Мишка',         rarity:'common', price:15,  tgs:TGS+'5170233102089322756.tgs' },
  { id:'heart',   emoji:'❤️', name:'Сердце',        rarity:'common', price:15,  tgs:TGS+'5170145012310081615.tgs' },
  { id:'rose',    emoji:'🌹', name:'Роза',          rarity:'common', price:25,  tgs:TGS+'5168103777563050263.tgs' },
  { id:'box',     emoji:'🎁', name:'Бокс',          rarity:'common', price:25,  tgs:TGS+'5170250947678437525.tgs' },
  { id:'cake',    emoji:'🎂', name:'Тортик',        rarity:'rare',   price:50,  tgs:TGS+'5170144170496491616.tgs' },
  { id:'bouquet', emoji:'💐', name:'Букет',         rarity:'rare',   price:50,  tgs:TGS+'5170314324215857265.tgs' },
  { id:'rocket',  emoji:'🚀', name:'Ракета',        rarity:'rare',   price:50,  tgs:TGS+'5170564780938756245.tgs' },
  { id:'beer',    emoji:'🍾', name:'Пиво',          rarity:'rare',   price:50,  tgs:TGS+'6028601630662853006.tgs' },
  { id:'ring',    emoji:'💍', name:'Кольцо',        rarity:'epic',   price:100, tgs:TGS+'5170690322832818290.tgs' },
  { id:'trophy',  emoji:'🏆', name:'Кубок',         rarity:'epic',   price:100, tgs:TGS+'5168043875654172773.tgs' },
  { id:'diamond', emoji:'💎', name:'Алмаз',         rarity:'epic',   price:100, tgs:TGS+'5170521118301225164.tgs' },
];

// КЕЙСЫ: выплаты урезаны, house edge 22-33%. Казино всегда в плюсе.
const CASES = [
  { id:'free',    name:'Бесплатная рулетка', em:'🎡', price:0,   rarity:'common', free:true,
    drops:[['dust',.70],['coin',.18],['spark',.08],['bear',.03],['heart',.01]] },
  { id:'mini',    name:'Мини',     em:'🪙', price:5,   rarity:'common',
    drops:[['dust',.40],['coin',.30],['spark',.15],['bear',.10],['heart',.04],['rose',.01]] },
  { id:'starter', name:'Стартер',  em:'⭐', price:20,  rarity:'common',
    drops:[['dust',.25],['bear',.30],['heart',.25],['rose',.12],['box',.08]] },
  { id:'hype',    name:'Хайп',     em:'🔥', price:45,  rarity:'rare',
    drops:[['dust',.15],['rose',.28],['box',.25],['cake',.14],['bouquet',.09],['rocket',.06],['beer',.02],['ring',.01]] },
  { id:'premium', name:'Премиум',  em:'💎', price:110, rarity:'epic',
    drops:[['dust',.02],['ring',.32],['trophy',.30],['diamond',.12],['rocket',.14],['beer',.10]] },
];

const CASE_COLORS = {
  common:    ['#2c2c4a','#4a4a7a','#9ca3af'],
  rare:      ['#14304f','#1d4ed8','#60a5fa'],
  epic:      ['#3b1656','#7e22ce','#c084fc'],
  legendary: ['#4a2c0a','#b45309','#fbbf24'],
};

// Колесо фортуны: EV ~14⭐ в сутки (экономно)
const DAILY_WHEEL = [
  { pct:30, value:5,   label:'5⭐',   color:'#334155' },
  { pct:25, value:10,  label:'10⭐',  color:'#3f4b63' },
  { pct:15, value:20,  label:'20⭐',  color:'#4a5878' },
  { pct:10, value:1,   label:'1⭐',   color:'#2a2a4a' },
  { pct:8,  value:15,  label:'15⭐',  color:'#55648a' },
  { pct:7,  value:50,  label:'50⭐',  color:'#6d7ba3' },
  { pct:3,  value:3,   label:'3⭐',   color:'#8b96b8' },
  { pct:2,  value:100, label:'100⭐', color:'#fbbf24' },
];

const QUESTS = [
  { id:'q1', type:'open',        target:3,  reward:10, name:'Открой 3 кейса' },
  { id:'q2', type:'open',        target:10, reward:40, name:'Открой 10 кейсов' },
  { id:'q3', type:'sell',        target:2,  reward:8,  name:'Продай 2 предмета' },
  { id:'q4', type:'upgrade_win', target:1,  reward:30, name:'Выиграй апгрейд' },
  { id:'q5', type:'battle_win',  target:1,  reward:40, name:'Выиграй баттл' },
  { id:'q6', type:'buy',         target:1,  reward:10, name:'Купи подарок в маркете' },
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
const CHANNEL = 'https://t.me/CashBanni';
const CHANNEL_USER = '@CashBanni';
const REF_REWARD = 5;
const FREE_CASE_COOLDOWN = 3600 * 1000; // 1 час

const ECO = { SELL_BACK:1, DISCOUNT:0.8, START_BALANCE:100, UPGRADE_EDGE:0.85 };

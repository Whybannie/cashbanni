const TGS = 'https://raw.githubusercontent.com/MasterGroosha/telegram-gifts-catalogue/web/images/';

const RAR = {
  common:    { name:'Обычный',      color:'#9ca3af', glow:'rgba(156,163,175,.3)' },
  rare:      { name:'Редкий',       color:'#60a5fa', glow:'rgba(96,165,250,.4)' },
  epic:      { name:'Эпический',    color:'#c084fc', glow:'rgba(192,132,252,.45)' },
  legendary: { name:'Легендарный',  color:'#fbbf24', glow:'rgba(251,191,36,.5)' },
  nft:         { name:'NFT',          color:'#22d3ee', glow:'rgba(34,211,238,.55)' },
  streamer:  { name:'Стримерский',  color:'#f472b6', glow:'rgba(244,114,182,.55)' }
};

const GIFTS = [
  { id:'dust',    emoji:'✨', name:'Звёздная пыль', rarity:'common',    price:1,   tgs:'' },
  { id:'coin',    emoji:'🪙', name:'Монетка',       rarity:'common',    price:3,   tgs:'' },
  { id:'spark',   emoji:'💫', name:'Искра',         rarity:'common',    price:5,   tgs:'' },
  { id:'bear',    emoji:'🧸', name:'Мишка',         rarity:'common',    price:15,  tgs:TGS+'5170233102089322756.tgs' },
  { id:'heart',   emoji:'❤️', name:'Сердце',        rarity:'common',    price:15,  tgs:TGS+'5170145012310081615.tgs' },
  { id:'rose',    emoji:'🌹', name:'Роза',          rarity:'common',    price:25,  tgs:TGS+'5168103777563050263.tgs' },
  { id:'box',     emoji:'🎁', name:'Бокс',          rarity:'common',    price:25,  tgs:TGS+'5170250947678437525.tgs' },
  { id:'cake',    emoji:'🎂', name:'Тортик',        rarity:'rare',      price:50,  tgs:TGS+'5170144170496491616.tgs' },
  { id:'bouquet', emoji:'💐', name:'Букет',         rarity:'rare',      price:50,  tgs:TGS+'5170314324215857265.tgs' },
  { id:'rocket',  emoji:'🚀', name:'Ракета',        rarity:'rare',      price:50,  tgs:TGS+'5170564780938756245.tgs' },
  { id:'beer',    emoji:'🍾', name:'Пиво',          rarity:'rare',      price:50,  tgs:TGS+'6028601630662853006.tgs' },
  { id:'ring',    emoji:'💍', name:'Кольцо',        rarity:'epic',      price:100, tgs:TGS+'5170690322832818290.tgs' },
  { id:'trophy',  emoji:'🏆', name:'Кубок',         rarity:'epic',      price:100, tgs:TGS+'5168043875654172773.tgs' },
  { id:'diamond', emoji:'💎', name:'Алмаз',         rarity:'legendary', price:100, tgs:TGS+'5170521118301225164.tgs' },
  { id:'nft_dog', emoji:'🐶', name:'Snoop Dogg', rarity:'nft', price:625, tgs:'' },
  { id:'nft_doshirak', emoji:'🍜', name:'Доширак', rarity:'nft', price:500, tgs:'' },
  { id:'nft_lolipop', emoji:'🍭', name:'Lollipop', rarity:'nft', price:525, tgs:'' },
  { id:'nft_backpack', emoji:'🎒', name:'Рюкзак', rarity:'nft', price:600, tgs:'' },
  { id:'nft_poop', emoji:'💩', name:'Какашка', rarity:'nft', price:555, tgs:'' },
  { id:'nft_socks', emoji:'🧦', name:'Носки', rarity:'nft', price:550, tgs:'' },
  { id:'nft_cigar_snoop', emoji:'🚬', name:'Сигара Snoop', rarity:'nft', price:1621, tgs:'' },
  { id:'nft_sword', emoji:'⚔️', name:'Световой меч', rarity:'nft', price:723, tgs:'' },
  { id:'nft_monkey', emoji:'🐵', name:'Обезьяна', rarity:'nft', price:769, tgs:'' },
  { id:'nft_egg', emoji:'🥚', name:'Пасхальное яйцо', rarity:'nft', price:550, tgs:'' },
  { id:'nft_candybox', emoji:'🍬', name:'Коробка конфет', rarity:'nft', price:1255, tgs:'' },
  { id:'nft_cylinder', emoji:'🎩', name:'Цилиндр', rarity:'nft', price:1233, tgs:'' },
  { id:'nft_shoes', emoji:'👠', name:'Туфли', rarity:'nft', price:2121, tgs:'' },
  { id:'nft_ring_case', emoji:'💍', name:'Кольцо в футляре', rarity:'nft', price:3463, tgs:'' },
  { id:'nft_rose_flask', emoji:'🌹', name:'Роза в колбе', rarity:'nft', price:2654, tgs:'' },
  { id:'nft_bear_pink', emoji:'🧸', name:'Розовый мишка', rarity:'nft', price:3954, tgs:'' },
  { id:'nft_hairdryer', emoji:'💨', name:'Фен', rarity:'nft', price:1635, tgs:'' },
  { id:'nft_pumpkin', emoji:'🎃', name:'Тыква', rarity:'nft', price:1390, tgs:'' },
  { id:'nft_cigar', emoji:'🚬', name:'Сигара', rarity:'nft', price:4032, tgs:'' },
  { id:'nft_motohelm', emoji:'🪖', name:'Мотошлем', rarity:'nft', price:4042, tgs:'' },
  { id:'nft_bonder_ring', emoji:'💍', name:'Bonder Ring', rarity:'nft', price:4534, tgs:'' },
  { id:'nft_snoop_hand', emoji:'🖐️', name:'Рука Snoop', rarity:'nft', price:11504, tgs:'' },
  { id:'nft_tephy_statue', emoji:'🗿', name:'Статуя Тэфи', rarity:'nft', price:8106, tgs:'' },
  { id:'nft_cat', emoji:'🐱', name:'Кошка', rarity:'nft', price:28953, tgs:'' },
  { id:'nft_brick', emoji:'🧱', name:'Кирпич', rarity:'nft', price:7017, tgs:'' },
  { id:'nft_genie_lamp', emoji:'🪔', name:'Лампа джина', rarity:'nft', price:3702, tgs:'' },
  { id:'nft_spartan_helm', emoji:'🛡️', name:'Спартанский шлем', rarity:'nft', price:19109, tgs:'' },
  { id:'nft_arm_statue', emoji:'💪', name:'Статуя руки', rarity:'nft', price:12474, tgs:'' },
  { id:'nft_watch', emoji:'⌚', name:'Часы', rarity:'nft', price:5933, tgs:'' },
  { id:'nft_nft_ring', emoji:'💍', name:'NFT-кольцо', rarity:'nft', price:3550, tgs:'' },
  { id:'nft_snoop_car', emoji:'🚗', name:'Машина Snoop', rarity:'nft', price:6177, tgs:'' },
  { id:'nft_frog', emoji:'🐸', name:'Лягушка', rarity:'nft', price:5297, tgs:'' },
  { id:'nft_lips', emoji:'💋', name:'Губы', rarity:'nft', price:4777, tgs:'' },
  { id:'nft_bag', emoji:'👜', name:'Сумка', rarity:'nft', price:14469, tgs:'' },
  { id:'nft_cartier', emoji:'⌚', name:'Cartier', rarity:'nft', price:12542, tgs:'' },
  { id:'nft_cap', emoji:'🧢', name:'Кепка', rarity:'nft', price:41915, tgs:'' },
  { id:'nft_perfume', emoji:'🧴', name:'Духи', rarity:'nft', price:8203, tgs:'' }
];

const CASES = [
  { id:'secret', name:'Секретный кейс', em:'🔐', price:0, rarity:'legendary',
    drops:[['ring',.2],['trophy',.2],['rocket',.2],['beer',.15],['diamond',.15],['cake',.0994],['nft_dog',.0004],['nft_lolipop',.0002]] },
  { id:'free', name:'Бесплатный', em:'🎁', price:0, rarity:'common',
    drops:[['dust',0.54994],['coin',0.25],['spark',0.12],['bear',0.05],['heart',0.02],['rose',0.01],['nft_bag',2e-05],['nft_snoop_hand',2e-05],['nft_cat',1e-05],['nft_cap',1e-05]] },
  { id:'mini', name:'Мини', em:'🎁', price:5, rarity:'common',
    drops:[['dust',0.3991],['coin',0.3],['spark',0.15],['bear',0.1],['heart',0.04],['rose',0.01],['nft_dog',0.0001],['nft_doshirak',0.0001],['nft_lolipop',0.0001],['nft_backpack',0.0001],['nft_poop',0.0001],['nft_socks',0.0001],['nft_sword',0.0001],['nft_monkey',0.0001],['nft_egg',0.0001]] },
  { id:'starter', name:'Стартер', em:'🎁', price:20, rarity:'rare',
    drops:[['dust',0.2466],['bear',0.3],['heart',0.25],['rose',0.12],['box',0.08],['nft_dog',0.0003],['nft_doshirak',0.0003],['nft_lolipop',0.0003],['nft_backpack',0.0003],['nft_poop',0.0003],['nft_socks',0.0003],['nft_sword',0.0003],['nft_monkey',0.0003],['nft_egg',0.0003],['nft_cigar_snoop',0.0001],['nft_candybox',0.0001],['nft_cylinder',0.0001],['nft_shoes',0.0001],['nft_hairdryer',0.0001],['nft_pumpkin',0.0001],['nft_watch',0.0001]] },
  { id:'hype', name:'Хайп', em:'🔥', price:45, rarity:'rare',
    drops:[['dust',0.14663],['rose',0.28],['box',0.25],['cake',0.14],['bouquet',0.09],['rocket',0.06],['beer',0.02],['ring',0.01],['nft_cigar_snoop',0.0003],['nft_candybox',0.0003],['nft_cylinder',0.0003],['nft_shoes',0.0003],['nft_hairdryer',0.0003],['nft_pumpkin',0.0003],['nft_watch',0.0003],['nft_rose_flask',6e-05],['nft_ring_case',6e-05],['nft_bear_pink',6e-05],['nft_cigar',6e-05],['nft_motohelm',6e-05],['nft_bonder_ring',6e-05],['nft_brick',6e-05],['nft_genie_lamp',6e-05],['nft_nft_ring',6e-05],['nft_snoop_car',6e-05],['nft_frog',6e-05],['nft_lips',6e-05],['nft_tephy_statue',6e-05],['nft_snoop_hand',1.5e-05],['nft_arm_statue',1.5e-05],['nft_bag',1.5e-05],['nft_cartier',1.5e-05],['nft_perfume',1.5e-05],['nft_spartan_helm',1.5e-05]] },
  { id:'premium', name:'Премиум', em:'💎', price:110, rarity:'epic',
    drops:[['dust',0.01568],['ring',0.32],['trophy',0.3],['diamond',0.12],['rocket',0.14],['beer',0.1],['nft_rose_flask',0.0002],['nft_ring_case',0.0002],['nft_bear_pink',0.0002],['nft_cigar',0.0002],['nft_motohelm',0.0002],['nft_bonder_ring',0.0002],['nft_brick',0.0002],['nft_genie_lamp',0.0002],['nft_nft_ring',0.0002],['nft_snoop_car',0.0002],['nft_frog',0.0002],['nft_lips',0.0002],['nft_tephy_statue',0.0002],['nft_snoop_hand',5e-05],['nft_arm_statue',5e-05],['nft_bag',5e-05],['nft_cartier',5e-05],['nft_perfume',5e-05],['nft_spartan_helm',5e-05],['nft_cat',1e-05],['nft_cap',1e-05]] },
  { id:'danya', name:'Кейс Дани', em:'🎥', price:75, rarity:'streamer', streamer:'Danya',
    drops:[['rose',0.13983],['box',0.13],['cake',0.15],['bouquet',0.13],['rocket',0.12],['beer',0.08],['ring',0.09],['trophy',0.09],['diamond',0.06],['nft_dog',0.0005],['nft_doshirak',0.0005],['nft_lolipop',0.0005],['nft_backpack',0.0005],['nft_poop',0.0005],['nft_socks',0.0005],['nft_sword',0.0005],['nft_monkey',0.0005],['nft_egg',0.0005],['nft_cigar_snoop',0.0004],['nft_candybox',0.0004],['nft_cylinder',0.0004],['nft_shoes',0.0004],['nft_hairdryer',0.0004],['nft_pumpkin',0.0004],['nft_watch',0.0004],['nft_rose_flask',0.0001],['nft_ring_case',0.0001],['nft_bear_pink',0.0001],['nft_cigar',0.0001],['nft_motohelm',0.0001],['nft_bonder_ring',0.0001],['nft_brick',0.0001],['nft_genie_lamp',0.0001],['nft_nft_ring',0.0001],['nft_snoop_car',0.0001],['nft_frog',0.0001],['nft_lips',0.0001],['nft_tephy_statue',0.0001],['nft_snoop_hand',4e-05],['nft_arm_statue',4e-05],['nft_bag',4e-05],['nft_cartier',4e-05],['nft_perfume',4e-05],['nft_spartan_helm',4e-05],['nft_cat',1.5e-05],['nft_cap',1.5e-05]] },

];

const CASE_COLORS = {
  common:    ['#2c2c4a','#4a4a7a','#9ca3af'],
  rare:      ['#14304f','#1d4ed8','#60a5fa'],
  epic:      ['#3b1656','#7e22ce','#c084fc'],
  legendary: ['#4a2c0a','#b45309','#fbbf24'],
  streamer:  ['#4a0e3a','#be185d','#f472b6']
};

const QUESTS = [
  { id:'q1', type:'open',        target:3,  reward:10, name:'Открой 3 кейса' },
  { id:'q2', type:'open',        target:10, reward:40, name:'Открой 10 кейсов' },
  { id:'q3', type:'sell',        target:2,  reward:8,  name:'Продай 2 предмета' },
  { id:'q4', type:'upgrade_win', target:1,  reward:30, name:'Выиграй апгрейд' },
  { id:'q5', type:'battle_win',  target:1,  reward:40, name:'Выиграй баттл' },
  { id:'q6', type:'buy',         target:1,  reward:10, name:'Купи подарок в маркете' }
];

const ACHS = [
  { id:'a1', emoji:'🎁', name:'Первый дроп',         cond:s=>s.stats.opened>=1 },
  { id:'a2', emoji:'📦', name:'100 кейсов',           cond:s=>s.stats.opened>=100 },
  { id:'a3', emoji:'💎', name:'Поймать эпику (100⭐)', cond:s=>s.stats.best>=100 },
  { id:'a4', emoji:'💰', name:'Баланс 2 000',         cond:s=>s.balance>=2000 },
  { id:'a5', emoji:'⚔️', name:'5 побед в баттлах',    cond:s=>s.stats.bWins>=5 },
  { id:'a6', emoji:'⚡', name:'3 успешных апгрейда',  cond:s=>s.stats.upWins>=3 }
];

const PROMOS = { 'START':50, 'CASH':75, 'BANNI2026':150, 'MELLSTROY':250 };
const CHANNEL = 'https://t.me/CashBanni';
const REF_REWARD = 5;
const FREE_CASE_COOLDOWN = 24 * 3600 * 1000;
const ECO = { SELL_BACK:1, DISCOUNT:0.8, START_BALANCE:0, UPGRADE_EDGE:0.85 };

const GIFT_IMG = {
  dust:'gift_dust.png', coin:'gift_coin.png', spark:'gift_spark.png',
  bear:'gift_bear.png', heart:'gift_heart.png', rose:'gift_rose.png', box:'gift_box.png',
  cake:'gift_cake.png', bouquet:'gift_bouquet.png', rocket:'gift_rocket.png', beer:'gift_beer.png',
  ring:'gift_ring.png', trophy:'gift_trophy.png', diamond:'gift_diamond.png'
};

Object.assign(GIFT_IMG,{nft_dog:'gift_nft_dog.png',nft_doshirak:'gift_nft_doshirak.png',nft_lolipop:'gift_nft_lolipop.png',nft_backpack:'gift_nft_backpack.png',nft_poop:'gift_nft_poop.png',nft_socks:'gift_nft_socks.png',nft_cigar_snoop:'gift_nft_cigar_snoop.png',nft_sword:'gift_nft_sword.png',nft_monkey:'gift_nft_monkey.png',nft_egg:'gift_nft_egg.png',nft_candybox:'gift_nft_candybox.png',nft_cylinder:'gift_nft_cylinder.png',nft_shoes:'gift_nft_shoes.png',nft_ring_case:'gift_nft_ring_case.png',nft_rose_flask:'gift_nft_rose_flask.png',nft_bear_pink:'gift_nft_bear_pink.png',nft_hairdryer:'gift_nft_hairdryer.png',nft_pumpkin:'gift_nft_pumpkin.png',nft_cigar:'gift_nft_cigar.png',nft_motohelm:'gift_nft_motohelm.png',nft_bonder_ring:'gift_nft_bonder_ring.png',nft_snoop_hand:'gift_nft_snoop_hand.png',nft_tephy_statue:'gift_nft_tephy_statue.png',nft_cat:'gift_nft_cat.png',nft_brick:'gift_nft_brick.png',nft_genie_lamp:'gift_nft_genie_lamp.png',nft_spartan_helm:'gift_nft_spartan_helm.png',nft_arm_statue:'gift_nft_arm_statue.png',nft_watch:'gift_nft_watch.png',nft_nft_ring:'gift_nft_nft_ring.png',nft_snoop_car:'gift_nft_snoop_car.png',nft_frog:'gift_nft_frog.png',nft_lips:'gift_nft_lips.png',nft_bag:'gift_nft_bag.png',nft_cartier:'gift_nft_cartier.png',nft_cap:'gift_nft_cap.png',nft_perfume:'gift_nft_perfume.png'});

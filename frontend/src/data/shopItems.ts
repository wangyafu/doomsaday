import type { ShopItem, Shelter } from '@/types'

// 避难所列表
export const shelters: Shelter[] = [
  {
    id: 'rental',
    name: '出租屋',
    price: 1000,
    space: 30,
    defense: 1,
    description: '拥挤的单间，窗外有晾衣架。适合不想花钱的赌徒。',
    hidden_discription:"1.周围人口密度极高，在前期容易遭受丧尸围堵。 2.防盗门质量较差，在壮汉持械攻击下容易破坏。 3.隔音效果较差，发出声音时会吸引丧尸。"
  },
  {
    id: 'basement',
    name: '地下室',
    price: 2500,
    space: 55,
    defense: 2,
    description: '只有透气窗的阴暗水泥房，堆满箱子。压抑，易抑郁。',
    hidden_discription:"1.地下室有一定隔音效果。 2.防盗门质量较差，在壮汉持械攻击下容易破坏。"
  },
  {
    id: 'villa',
    name: '半山别墅',
    price: 4800,
    space: 100,
    defense: 3,
    description: '1. 带有落地窗和围栏的豪宅。易招惹强盗。',
    hidden_discription:"1.豪宅内有游泳池，极端情况下可从中取水。 2.围栏有2m高，普通丧尸难以翻越。 3.豪宅内置图书、游戏机等，即使用户不额外购买也不缺乏娱乐设施。 "
  }
]

// 商品列表
export const shopItems: ShopItem[] = [
  // 生存必需品
  {
    id: 'biscuit',
    name: '压缩饼干',
    price: 30,
    space: 1,
    category: 'food',
    description: '维持一天的生命体征。难吃但必须吃。',
    icon: '🍪',
    hidden: '每日消耗1份。满足一天食物需求。配合水源食用时SAN+2（口感改善）。单独干啃时SAN-1（太难吃）。缺少食物一天：HP-20。'
  },
  {
    id: 'water',
    name: '瓶装水',
    price: 50,
    space: 1,
    category: 'food',
    description: '2L装纯净水。每天必须消耗1瓶。',
    icon: '💧',
    hidden: '每日消耗1份。满足一天饮水需求。缺水一天直接扣大量HP（-40）。可用于清洗伤口（配合医疗用品时提升治疗效果）。'
  },
  {
    id: 'canned',
    name: '罐头',
    price: 60,
    space: 1,
    category: 'food',
    description: '午餐肉罐头，开盖即食。末世里难得的"美味"，能提振一点心情。',
    icon: '🥫',
    hidden: '每日消耗1份。满足一天食物需求，SAN+3（美味加成）。无需加热或配水。可与其他幸存者交易，价值较高。'
  },
  {
    id: 'instant_noodle',
    name: '方便面',
    price: 25,
    space: 1,
    category: 'food',
    description: '红烧牛肉面，停电后只能干啃。但至少比压缩饼干有味道。',
    icon: '🍜',
    hidden: '每日消耗1份。满足一天食物需求。干啃时SAN+1（比压缩饼干好）。有热水泡时SAN+5（幸福感爆棚）。需配合水源。'
  },
  
  // 防御/战斗
  {
    id: 'bat',
    name: '棒球棍',
    price: 200,
    space: 3,
    category: 'weapon',
    description: '铝合金材质，挥舞时有破风声。对付单个丧尸够用，但要小心被围攻。',
    icon: '🏏',
    hidden: '近战武器，无声，不会引来更多丧尸。耐久度高，不易损坏。'
  },
  {
    id: 'knife',
    name: '水果刀',
    price: 80,
    space: 1,
    category: 'weapon',
    description: '刀刃锋利的小刀，便携但攻击距离太短。用它对付丧尸需要极大勇气。',
    icon: '🔪',
    hidden: '战斗效果：对单个丧尸成功率50%，受伤概率50%（HP-15~-30）。攻击距离极短，使用时SAN-5（恐惧）。可用于日常切割、开罐头等。无声武器。'
  },
  {
    id: 'shotgun',
    name: '霰弹枪',
    price: 4000,
    space: 5,
    category: 'weapon',
    description: '近距离散射武器，一枪能打烂丧尸的头。但枪声会引来更多怪物。',
    icon: '🔫',
    hidden: '战斗效果：对1-3个丧尸成功率95%，几乎无受伤风险。每次射击消耗1发霰弹。枪声会在30分钟内吸引周围丧尸（触发后续危机事件）。无弹药时无法使用。威慑力强，可吓退部分人类敌人。'
  },
  {
    id: 'ammo',
    name: '霰弹',
    price: 150,
    space: 1,
    category: 'weapon',
    description: '12号霰弹，5发装。末世后再也买不到，每一发都要省着用。',
    icon: '🎯',
    hidden: '使用规则：每盒5发。配合霰弹枪使用，每次射击消耗1发。末世后无法补充，极其珍贵。可用于交易，价值很高。'
  },
  
  // 医疗
  {
    id: 'bandage',
    name: '绷带',
    price: 40,
    space: 1,
    category: 'medical',
    description: '无菌纱布绷带，能简单止血包扎。被丧尸抓伤后的第一道防线。',
    icon: '🩹',
    hidden: '治疗效果：轻伤（HP损失<20）时使用，HP+10。配合水源清洗伤口时HP+15。无法处理重伤或感染。使用后移除<受伤>标签（如果是轻伤）。'
  },
  {
    id: 'antibiotic',
    name: '抗生素',
    price: 200,
    space: 1,
    category: 'medical',
    description: '阿莫西林胶囊，能对抗细菌感染。末世里医院已成废墟，这就是救命药。',
    icon: '💊',
    hidden: '治疗效果：治疗<感染>状态，阻止HP持续下降。需连续服用3天才能完全治愈。预防性服用可降低伤口感染概率50%。一瓶可使用5次。'
  },
  {
    id: 'firstaid',
    name: '急救包',
    price: 400,
    space: 2,
    category: 'medical',
    description: '专业医疗套装，含止血带、消毒液、缝合针。能处理严重外伤。',
    icon: '🏥',
    hidden: '治疗效果：可处理重伤（HP损失>20），HP+30~+50。能处理骨折、深度撕裂等严重外伤。使用需要一定医疗知识，否则效果减半。一个急救包可使用3次。移除<重伤>标签。'
  },
  
  // 情绪价值
  {
    id: 'cat',
    name: '橘猫',
    price: 400,
    space: 5,
    category: 'emotional',
    description: '胖乎乎的橘猫，会撒娇会卖萌。孤独绝望时，它的呼噜声能拯救你的理智。',
    icon: '🐱',
    hidden: '情绪效果：每天自动SAN+5（陪伴效果）。SAN<30时额外SAN+5（治愈加成）。需要消耗食物喂养（每3天消耗1份食物）。长期孤独时防止SAN快速下降。猫的存在可能在某些剧情中带来意外帮助或麻烦。'
  },
  {
    id: 'switch',
    name: 'Switch游戏机',
    price: 600,
    space: 2,
    category: 'emotional',
    description: '任天堂游戏机，内置《塞尔达》。停电前能让你暂时忘记外面的惨状。',
    icon: '🎮',
    hidden: '情绪效果：有电时使用，SAN+10（沉浸式娱乐）。停电后无法使用。可缓解长期隔离带来的精神压力。使用时会忘记时间流逝，可能错过重要事件（剧情分支）。'
  },
  {
    id: 'laoganma',
    name: '老干妈',
    price: 15,
    space: 1,
    category: 'emotional',
    description: '风味豆豉辣酱，拌什么都香。末世里唯一能让压缩饼干变好吃的东西。',
    icon: '🌶️',
    hidden: '情绪效果：配合食物使用时额外SAN+3（美味加成）。一瓶可使用10次。能让压缩饼干、方便面等变得可口。可用于交易，对中国幸存者吸引力极大。'
  },
  {
    id: 'book',
    name: '小说',
    price: 20,
    space: 1,
    category: 'emotional',
    description: '厚厚的悬疑小说，能打发漫长的黑夜。阅读能让人暂时逃离现实。',
    icon: '📚',
    hidden: '情绪效果：阅读时SAN+5。可重复阅读，但第二次后效果减半。停电后仍可使用（白天或有手电）。长期隔离时的重要精神支柱。可能在某些剧情中提供灵感或知识。'
  },
  {
    id: 'cigarette',
    name: '香烟',
    price: 50,
    space: 1,
    category: 'emotional',
    description: '中华香烟一条。尼古丁能短暂缓解焦虑，也是和其他幸存者交易的硬货。',
    icon: '🚬',
    hidden: '情绪效果：使用时SAN+8（短期缓解焦虑）。一条可使用20次。交易价值极高，可换取食物、情报等。长期使用可能产生依赖（剧情分支）。在紧张时刻使用可稳定情绪。'
  },
  {
    id: 'wine',
    name: '红酒',
    price: 150,
    space: 2,
    category: 'emotional',
    description: '法国波尔多红酒。末世也要保持体面，醉一场能忘掉很多恐惧。',
    icon: '🍷',
    hidden: '情绪效果：饮用时SAN+15（醉酒忘忧）。一瓶可使用5次。醉酒状态下判断力下降，可能做出冒险决策。可用于社交，提升与其他幸存者的关系。过量饮用可能导致第二天HP-5（宿醉）。'
  }
]

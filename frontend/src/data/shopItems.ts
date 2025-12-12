import type { ShopItem, Shelter } from '@/types'

// 避难所列表
export const shelters: Shelter[] = [
  {
    id: 'rental',
    name: '出租屋',
    price: 2000,
    space: 50,
    defense: 1,
    description: '拥挤的单间，窗外有晾衣架。适合不想花钱的赌徒。',
    hidden_discription:"1.周围人口密度极高，在前期容易遭受丧尸围堵。 2.防盗门质量较差，在壮汉持械攻击下容易破坏。 3.隔音效果较差，发出声音时会吸引丧尸。"
  },
  {
    id: 'basement',
    name: '地下室',
    price: 4000,
    space: 80,
    defense: 2,
    description: '只有透气窗的阴暗水泥房，堆满箱子。压抑，易抑郁。',
    hidden_discription:"1.地下室有一定隔音效果。 2.防盗门质量较差，在壮汉持械攻击下容易破坏。"
  },
  {
    id: 'villa',
    name: '半山别墅',
    price: 8000,
    space: 150,
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
    price: 50,
    space: 1,
    category: 'food',
    description: '能量密度高，保质期长',
    icon: '🍪'
  },
  {
    id: 'water',
    name: '桶装水',
    price: 30,
    space: 2,
    category: 'food',
    description: '生命之源',
    icon: '💧'
  },
  {
    id: 'canned',
    name: '罐头',
    price: 40,
    space: 1,
    category: 'food',
    description: '午餐肉罐头，美味又顶饱',
    icon: '🥫'
  },
  {
    id: 'instant_noodle',
    name: '方便面',
    price: 20,
    space: 1,
    category: 'food',
    description: '泡面搭档，末世美食',
    icon: '🍜'
  },
  
  // 防御/战斗
  {
    id: 'bat',
    name: '棒球棍',
    price: 200,
    space: 3,
    category: 'weapon',
    description: '近战神器，挥舞起来很帅',
    icon: '🏏'
  },
  {
    id: 'knife',
    name: '水果刀',
    price: 80,
    space: 1,
    category: 'weapon',
    description: '削苹果也能削丧尸',
    icon: '🔪'
  },
  {
    id: 'shotgun',
    name: '霰弹枪',
    price: 2000,
    space: 5,
    category: 'weapon',
    description: '一枪一个小朋友（丧尸）',
    icon: '🔫'
  },
  {
    id: 'ammo',
    name: '霰弹',
    price: 100,
    space: 1,
    category: 'weapon',
    description: '霰弹枪弹药，5发装',
    icon: '🎯'
  },
  
  // 医疗
  {
    id: 'bandage',
    name: '绷带',
    price: 30,
    space: 1,
    category: 'medical',
    description: '止血包扎必备',
    icon: '🩹'
  },
  {
    id: 'antibiotic',
    name: '抗生素',
    price: 150,
    space: 1,
    category: 'medical',
    description: '防止伤口感染',
    icon: '💊'
  },
  {
    id: 'firstaid',
    name: '急救包',
    price: 300,
    space: 2,
    category: 'medical',
    description: '专业医疗套装',
    icon: '🏥'
  },
  
  // 情绪价值
  {
    id: 'cat',
    name: '橘猫',
    price: 500,
    space: 5,
    category: 'emotional',
    description: '治愈系宠物，能有效恢复理智',
    icon: '🐱'
  },
  {
    id: 'switch',
    name: 'Switch游戏机',
    price: 800,
    space: 2,
    category: 'emotional',
    description: '无聊时的最佳伴侣',
    icon: '🎮'
  },
  {
    id: 'laoganma',
    name: '老干妈',
    price: 20,
    space: 1,
    category: 'emotional',
    description: '中国人的精神支柱',
    icon: '🌶️'
  },
  {
    id: 'book',
    name: '小说',
    price: 30,
    space: 1,
    category: 'emotional',
    description: '打发时间，保持理智',
    icon: '📚'
  },
  {
    id: 'cigarette',
    name: '香烟',
    price: 60,
    space: 1,
    category: 'emotional',
    description: '压力大的时候来一根',
    icon: '🚬'
  },
  {
    id: 'wine',
    name: '红酒',
    price: 200,
    space: 2,
    category: 'emotional',
    description: '末世也要有仪式感',
    icon: '🍷'
  }
]

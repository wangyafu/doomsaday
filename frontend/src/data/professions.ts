import type { Profession } from '@/types'

/**
 * 职业列表
 * 
 * 每个职业包含：
 * - id: 唯一标识
 * - name: 职业名称
 * - icon: 显示图标
 * - description: 展示给用户的描述（用于选择职业）
 * - hiddenDescription: 隐藏描述（影响AI剧情发展）
 * - bonusMoney: 额外金钱加成
 * - bonusHp: 初始HP加成
 * - bonusSan: 初始SAN加成
 * - unlockedItems: 解锁的额外商品ID列表（可选）
 */
export const professions: Profession[] = [
  {
    id: 'office_worker',
    name: '普通白领',
    icon: '👔',
    description: '朝九晚五的打工人，存款一般，但心态稳定。',
    hiddenDescription: '普通人，没有特殊技能。在危机中容易慌张，但也更容易获得其他幸存者的信任和帮助。',
    bonusMoney: 0,
    bonusHp: 0,
    bonusSan: 5
  },
  {
    id: 'doctor',
    name: '医生',
    icon: '👨‍⚕️',
    description: '三甲医院的外科医生，收入不错，懂得急救知识。',
    hiddenDescription: '精通医疗知识，使用医疗物品时效果翻倍。能够判断伤口感染风险，在医疗相关决策中成功率更高。但长期面对生死，心理承受能力较弱。',
    bonusMoney: 1500,
    bonusHp: 0,
    bonusSan: -10,
    unlockedItems: ['surgical_kit']
  },
  {
    id: 'soldier',
    name: '退伍军人',
    icon: '🎖️',
    description: '服役五年的老兵，身体素质过硬，熟悉武器操作。',
    hiddenDescription: '战斗经验丰富，使用武器时命中率和伤害更高。体能出色，在需要体力的行动中有优势。但退伍后经济拮据，存款较少。',
    bonusMoney: -1000,
    bonusHp: 15,
    bonusSan: 0,
    unlockedItems: ['combat_knife']
  },
  {
    id: 'programmer',
    name: '程序员',
    icon: '💻',
    description: '996的码农，高薪但亚健康，宅家技能满点。',
    hiddenDescription: '擅长分析和逻辑思考，在需要智力判断的场景中成功率更高。长期宅家，对独处有较强适应性，隔离时SAN下降较慢。但身体素质较差，体力活动容易受伤。',
    bonusMoney: 2500,
    bonusHp: -10,
    bonusSan: 0
  },
  {
    id: 'chef',
    name: '厨师',
    icon: '👨‍🍳',
    description: '五星酒店主厨，懂得如何用有限食材做出美味。',
    hiddenDescription: '烹饪大师，食用食物时获得额外SAN恢复。能够辨别食物是否变质，避免食物中毒。在有烹饪条件时，可以将普通食材变成美味佳肴。',
    bonusMoney: 500,
    bonusHp: 0,
    bonusSan: 10,
    unlockedItems: ['spice_set']
  },
  {
    id: 'athlete',
    name: '运动员',
    icon: '🏃',
    description: '职业马拉松选手，体能充沛，跑得比丧尸快。',
    hiddenDescription: '体能极佳，在逃跑、追逐等需要速度和耐力的场景中几乎必定成功。但高强度训练导致食物消耗更大，每天需要额外的食物补给。',
    bonusMoney: 0,
    bonusHp: 20,
    bonusSan: 0
  },
  {
    id: 'psychologist',
    name: '心理咨询师',
    icon: '🧠',
    description: '专业心理医生，擅长自我调节，心理素质极强。',
    hiddenDescription: '精通心理调节，SAN值下降速度减半。能够安抚其他幸存者，在社交场景中更容易获得信任。但缺乏实战经验，面对暴力场景时容易恐惧。',
    bonusMoney: 1000,
    bonusHp: -5,
    bonusSan: 20
  },
  {
    id: 'security',
    name: '保安',
    icon: '💂',
    description: '小区保安队长，熟悉各种防御设施，警觉性高。',
    hiddenDescription: '警觉性极高，在遭遇突袭时有更高概率提前发现危险。熟悉门禁、监控等安防设备，在防御相关场景中有优势。收入一般，但身体素质不错。',
    bonusMoney: -1000,
    bonusHp: 10,
    bonusSan: 0
  },
  {
    id: 'streamer',
    name: '网红主播',
    icon: '📱',
    description: '百万粉丝的直播达人，社交能力强，但有点作。',
    hiddenDescription: '社交达人，与其他幸存者交流时更容易建立信任和合作关系。但习惯了舒适生活，在艰苦环境中SAN下降更快。有一定存款。',
    bonusMoney: 1000,
    bonusHp: 0,
    bonusSan: -5
  },
  {
    id: 'survivalist',
    name: '生存狂',
    icon: '🏕️',
    description: '末日论信徒，早就在为这一天做准备了。',
    hiddenDescription: '生存技能满点，野外求生、陷阱制作、物资搜索等技能熟练。对末日场景有心理准备，初期SAN下降较慢。但社交能力较差，其他幸存者可能觉得他很奇怪。',
    bonusMoney: 1000,
    bonusHp: 5,
    bonusSan: 10,
    unlockedItems: ['survival_manual']
  }
]

/**
 * 职业解锁的额外商品
 * 这些商品只有特定职业才能购买
 */
export const professionItems: Record<string, {
  id: string
  name: string
  price: number
  space: number
  category: 'food' | 'weapon' | 'medical' | 'emotional'
  description: string
  icon: string
  hidden: string
}> = {
  surgical_kit: {
    id: 'surgical_kit',
    name: '手术器械包',
    price: 800,
    space: 3,
    category: 'medical',
    icon: '🔬',
    description: '专业手术器械，只有医生才知道怎么用。',
    hidden: '专业医疗器械，只有医生职业才能有效使用。可进行复杂手术，治疗重伤时HP恢复+50。非医生使用可能造成二次伤害。'
  },
  combat_knife: {
    id: 'combat_knife',
    name: '军用匕首',
    price: 500,
    space: 1,
    category: 'weapon',
    icon: '🗡️',
    description: '制式军刀，退伍时"顺"回来的纪念品。',
    hidden: '军用级别匕首，锋利耐用。退伍军人使用时战斗成功率+30%。近战武器，无声，不会引来更多丧尸。'
  },
  spice_set: {
    id: 'spice_set',
    name: '调料套装',
    price: 100,
    space: 2,
    category: 'food',
    icon: '🧂',
    description: '厨师的秘密武器，能让任何食物变美味。',
    hidden: '专业调料套装，厨师使用时可让任何食物额外恢复SAN+5。一套可使用20次。非厨师使用效果减半。'
  },
  survival_manual: {
    id: 'survival_manual',
    name: '野外生存手册',
    price: 50,
    space: 1,
    category: 'emotional',
    icon: '📖',
    description: '生存狂的圣经，记满了各种求生技巧。',
    hidden: '详细的野外生存指南，包含净水、陷阱、急救等知识。阅读后在相关场景中决策成功率+20%。生存狂已经倒背如流，额外获得SAN+3。'
  }
}

/**
 * 随机获取一个职业
 */
export function getRandomProfession(): Profession {
  const index = Math.floor(Math.random() * professions.length)
  return professions[index]
}

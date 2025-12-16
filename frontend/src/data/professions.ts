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
    hiddenDescription: '生存技能满点，野外求生、陷阱制作、物资搜索等技能熟练。对末日场景有心理准备，初期SAN下降较慢。但社交能力较差,其他幸存者可能觉得他很奇怪。',
    bonusMoney: 1000,
    bonusHp: 5,
    bonusSan: 10,
    unlockedItems: ['survival_manual']
  },
  {
    id: 'dragon_king',
    name: '龙王',
    icon: '🐉',
    description: '三年期满，家族禁令已解。区区丧尸，不过是蝼蚁！',
    tags: [
      {
        name: '歪嘴一笑',
        description: '当龙王露出这个表情，就没有杀不死的敌人。战斗必定胜利。'
      },
      {
        name: '隐藏实力',
        description: '平时看起来像个赘婿，关键时刻爆发出惊人的战斗力。'
      },
      {
        name: '黑金卡',
        description: '初始资金 100000... 哪怕在末世刷不了卡，但这代表了尊贵。'
      }
    ],
    hiddenDescription: `神秘的强者，拥有以下特质：
1. 【歪嘴一笑】在任何战斗场景中必定胜利，无论敌人数量多少。面对丧尸群、暴徒、野兽等任何威胁时，只要龙王出手，结果必然是碾压性的胜利。战斗过程可以描写得轻松写意，仿佛在散步。
2. 【隐藏实力】平时表现得低调普通，甚至有些懦弱。但在关键时刻（生死危机、保护他人等）会突然爆发出惊人的战斗力和领导力。这种反差会让其他幸存者感到震惊和敬畏。
3. 【黑金卡】拥有惊人的财富和资源，代表着尊贵的身份。虽然末世中金钱作用有限，但这种身份带来的气场和底蕴会让其他幸存者本能地尊重和服从。在需要资源、交易、谈判时有巨大优势。`,
    bonusMoney: 10000,
    bonusHp: 30,
    bonusSan: 15,
    unlockedItems: ['dragon_amulet']
  },
  {
    id: 'rock_girl',
    name: '摇滚少女',
    icon: '🎸',
    description: '地下乐队主唱，用音乐对抗这个疯狂的世界。',
    tags: [
      {
        name: '摇滚精神',
        description: '永不妥协的态度，在绝望中也能保持斗志。SAN值低于30时不会陷入疯狂。'
      },
      {
        name: '舞台魅力',
        description: '天生的领袖气质，能够鼓舞其他幸存者的士气。'
      },
      {
        name: '穷困潦倒',
        description: '追梦的代价就是口袋空空。初始资金很少，但这不重要。'
      }
    ],
    hiddenDescription: `充满激情的摇滚乐手，拥有以下特质：
1. 【摇滚精神】永不妥协的态度，精神力极其顽强。即使在极度绝望的情况下也不会崩溃，SAN值低于30时仍能保持理智和行动能力，不会出现幻觉或失控。面对恐怖场景时恢复速度更快。对噪音不敏感，枪声和爆炸不会额外降低SAN。
2. 【舞台魅力】天生的领袖气质和感染力。在团队场景中能够鼓舞其他幸存者的士气，提升他们的战斗力和生存意志。擅长演讲和激励，可以化解团队内部矛盾，让绝望的人重燃希望。
3. 【穷困潦倒】长期追求音乐梦想导致经济拮据，初始资金很少。但这种经历让她习惯了艰苦生活，对物质条件要求不高，在资源匮乏时心态更稳定。`,
    bonusMoney: -1500,
    bonusHp: -20,
    bonusSan: 20,
    unlockedItems: ['electric_guitar']
  },
  {
    id: 'naive_student',
    name: '清澈愚蠢大学生',
    icon: '🎓',
    description: '象牙塔里的天真少年，对世界充满美好幻想。',
    tags: [
      {
        name: '精神大条',
        description: '由于过于愚蠢，意识不到事情的严重性。'
      },
      {
        name: '天真无邪',
        description: '天然地容易相信他人'
      },
      {
        name: '傻人有傻福',
        description: '好运连连'
      }
    ],
    hiddenDescription: `涉世未深的大学生，对世界保持着单纯的看法，拥有以下特质：
1. 【天真无邪】涉世未深，容易相信他人、被他人欺骗。
2. 【精神大条】由于过于愚蠢，意识不到事情的严重性。即便目睹惨象，san值也下降较少
3. 【傻人有傻福】傻人有傻福，运气出奇的好。在危急关头经常能遇到意外的转机：找到隐藏物资、恰好避开危险、获得陌生人帮助等。在需要运气判定的场景中成功率更高。`,
    bonusMoney: 500,
    bonusHp: -10,
    bonusSan: 10
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
  },
  dragon_amulet: {
    id: 'dragon_amulet',
    name: '龙族徽章',
    price: 9999,
    space: 1,
    category: 'emotional',
    icon: '🔱',
    description: '象征着龙王身份的神秘徽章，散发着威严的气息。',
    hidden: '龙族的身份象征，佩戴后在任何社交场景中都能获得尊重和敬畏。战斗时可以震慑敌人，使其不敢轻举妄动。持有此物品时，所有战斗相关判定自动成功。'
  },
  electric_guitar: {
    id: 'electric_guitar',
    name: '电吉他',
    price: 800,
    space: 4,
    category: 'emotional',
    icon: '🎸',
    description: '摇滚少女的灵魂伴侣，虽然没电了但依然帅气。',
    hidden: '摇滚乐手的标志性装备。虽然无法插电使用，但可以作为钝器武器（攻击力中等）。更重要的是，弹奏时能够恢复SAN+10，并提升团队士气。摇滚少女使用时效果翻倍。'
  }
}

/**
 * 随机获取一个职业
 */
export function getRandomProfession(): Profession {
  const index = Math.floor(Math.random() * professions.length)
  return professions[index]
}

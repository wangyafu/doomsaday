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
        description: '初始资金 100000+。虽然末世刷不了卡，但这代表了尊贵。'
      }
    ],
    hiddenDescription: `【玩家人设：爽文男主】
1. **叙事风格强制**：请使用"土味爽文"风格。不要称呼玩家为"你"，请尊称为"龙王"或"主上"。描写战斗时要极度夸张，突出主角的轻蔑和无敌。
2. **【歪嘴一笑】(核心Buff)**：在玩家选择"攻击/硬刚"时触发。描述玩家嘴角上扬露出√状笑容，随后敌人（无论是丧尸还是暴徒）会被瞬间秒杀，甚至出现"头颅旋转360度"等夸张死法。战斗胜率锁定为 99%。
3. **【隐藏实力】**：如果NPC敢嘲讽玩家，玩家"亮明身份"后，NPC必须立刻跪地求饶或被吓死。
4. **【黑金卡】**：拥有巨额财富。虽然在废土后期钱无用，但在开局抢购阶段可以买下半山别墅和所有神装。
重要：请为玩家营造畅爽的游戏体验，玩家此时拥有超自然力量。`,
    bonusMoney: 14000, // 基础6000 + 14000 = 20000，足够买别墅+神装，体验"富豪"感觉
    bonusHp: 50,       // 龙王身体素质必须强
    bonusSan: 50,      // 龙王不会玉玉，只会让别人玉玉
    unlockedItems: ['dragon_amulet'] // 建议加一个装饰品"龙王令"
  },
  {
    id: 'rock_girl',
    name: '摇滚少女',
    icon: '🎸',
    description: '社恐吉他手。只要背着琴，这里就是我的舞台。',
    tags: [
      {
        name: '物理超度',
        description: '吉他不仅是乐器，更是趁手的钝器。'
      },
      {
        name: '独奏时刻',
        description: 'San值过低时弹奏一曲，虽然引怪，但能重铸灵魂。'
      },
      {
        name: '波奇体质',
        description: '极度社恐，无法与人类NPC正常交流，但内心戏丰富。'
      }
    ],
    hiddenDescription: `【玩家人设：孤独摇滚少女】
1. **【物理超度】(战斗Buff)**：玩家随身携带的【电吉他】是强力钝器。当玩家描述"用吉他砸"时，判定攻击力极高，描述吉他碎裂声与丧尸骨裂声交织的暴力美学。
2. **【独奏时刻】(特殊技能)**：当SAN值<30时，允许玩家"弹奏吉他"。此行为将**SAN值直接回满**（进入心流），但副作用是**极大增加**遭遇丧尸的概率（引怪）。
3. **【波奇体质】(社交Debuff)**：遭遇人类NPC时，玩家无法说出完整句子，判定交易/沟通失败。内心活动极其丰富，但外表僵硬。
4. **【穷困潦倒】**：开局资金极少，迫使玩家走"捡垃圾"路线。`,
    bonusMoney: -500, // 基础6000 - 3000 = 3000，比较拮据
    bonusHp: -10,      // 长期熬夜身体差
    bonusSan: 30,      // 精神状态美丽
    unlockedItems: ['electric_guitar'] // 必须有吉他
  },
  {
    id: 'naive_student',
    name: '清澈愚蠢大学生',
    icon: '🎓',
    description: '眼神清澈，透露着未被知识污染的愚蠢。',
    tags: [
      {
        name: '清澈的愚蠢',
        description: '极其容易相信陌生人，被骗概率+200%。'
      },
      {
        name: '脆皮',
        description: '体测不及格。甚至可能因为洗澡水太凉而生病。'
      },
      {
        name: '傻人傻福',
        description: '运气好到离谱，总能捡到奇怪的物资。'
      }
    ],
    hiddenDescription: `【玩家人设：笨蛋大学生】
1. **【清澈的愚蠢】(社交Debuff)**：核心机制！遇到任何人（强盗/骗子），玩家会本能地选择"相信"。AI必须判定玩家被骗（物资被抢/被绑架），并用搞笑口吻描述玩家"甚至还说了声谢谢"。
2. **【脆皮】(生存Debuff)**：HP扣减修正值为 1.5倍。可能因为"没吃早饭"、"被划伤手指"等小事掉血。
3. **【傻人傻福】(幸运Buff)**：运气极大提升。搜刮空房间时，经常能找到【学生证】带来的隐藏福利（如：食堂剩下的鸡腿、学长留下的泡面）。在必死局面下，可能因为"丧尸觉得你没脑子不好吃"而意外逃生。`,
    bonusMoney: -1000, // 基础6000 - 4000 = 2000，真实贫困大学生
    bonusHp: -20,      // 脆皮
    bonusSan: 20,      // 心大，不记仇
    unlockedItems: ['student_id'] // 学生证：幸运护身符
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

  electric_guitar: {
    id: 'electric_guitar',
    name: '电吉他',
    price: 0,
    space: 4,
    category: 'weapon',
    description: '带有硬质琴箱的重型电吉他。摇滚不死，只会用它砸碎丧尸的头。',
    icon: '🎸',
    hidden: '特殊效果：1. 【物理超度】：作为近战钝器使用时，攻击判定大幅提升（甚至高于棒球棍）。2. 【独奏时刻】：SAN<30时可弹奏，瞬间回满SAN值（进入心流状态），但会引来周围所有丧尸（触发强制战斗）。'
  },
  student_id: {
    id: 'student_id',
    name: '学生证',
    price: 0,
    space: 0,
    category: 'emotional',
    description: '某不知名大学的学生证。照片上的眼神清澈且愚蠢。',
    icon: '💳',
    hidden: '特殊效果：1. 【傻人傻福】：作为幸运护身符，搜刮空房间时，触发"意外获得物资"的概率提升50%。2. 【食堂饭卡】：在特定场景（如学校、便利店）可能刷出隐藏的免费食物。'
  },
  dragon_amulet: {
    id: 'dragon_amulet',
    name: '龙王令',
    price: 0,
    space: 1,
    category: 'emotional',
    description: '纯金打造的令牌，背面刻着一个歪嘴笑的龙首。身份的象征。',
    icon: '🐉',
    hidden: '特殊效果：1. 【王霸之气】：持有此物遭遇人类NPC（强盗/军队）时，解锁【亮明身份】选项，有极大概率直接吓退对方或使其臣服。2. 【不灭金身】：微量提升SAN值恢复速度。'
  }
}

/**
 * 随机获取一个职业
 */
export function getRandomProfession(): Profession {
  const index = Math.floor(Math.random() * professions.length)
  return professions[index]
}

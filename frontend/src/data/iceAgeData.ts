import type { IceAgeTalent, IceAgeShelter } from '@/stores/iceAgeStore'
import type { ShopItem } from '@/types'

// 天赋池（约20个），每次游戏随机抽取10个
export const TALENT_POOL: IceAgeTalent[] = [
    {
        id: 'cold_resistance',
        name: '寒冷抗性',
        icon: '🔥',
        description: '你对严寒有着超乎常人的耐受力',
        hiddenDescription: '玩家受到的寒冷伤害减半，在低温环境下不容易失温'
    },
    {
        id: 'craftsman',
        name: '手工达人',
        icon: '🛠️',
        description: '你擅长用简单材料制作工具',
        hiddenDescription: '玩家可以用基础材料制作简易工具和设备，制作成功率高'
    },
    {
        id: 'agile',
        name: '敏捷身法',
        icon: '🏃',
        description: '你的反应速度比常人快',
        hiddenDescription: '逃跑成功率大幅提升，躲避危险的判定加成'
    },
    {
        id: 'food_saver',
        name: '节约食物',
        icon: '🍖',
        description: '你能用更少的食物维持体力',
        hiddenDescription: '食物消耗减半，同样的食物可以支撑更长时间'
    },
    {
        id: 'strong_body',
        name: '强壮体魄',
        icon: '💪',
        description: '你的身体素质远超常人',
        hiddenDescription: '初始HP +20，受伤后恢复更快'
    },
    {
        id: 'calm_mind',
        name: '冷静思考',
        icon: '🧠',
        description: '你的心理素质极其稳定',
        hiddenDescription: '初始SAN +20，面对恐惧和压力时SAN损失减少'
    },
    {
        id: 'night_vision',
        name: '夜视能力',
        icon: '🔦',
        description: '你能在黑暗中看清事物',
        hiddenDescription: '夜间行动不受影响，可以在黑暗中正常搜索和移动'
    },
    {
        id: 'animal_friend',
        name: '动物之友',
        icon: '🐕',
        description: '动物似乎天生亲近你',
        hiddenDescription: '可以驯服野生动物，动物不会主动攻击玩家'
    },
    {
        id: 'architect',
        name: '建筑专家',
        icon: '🏠',
        description: '你懂得如何加固建筑',
        hiddenDescription: '避难所防御加成，可以修缮和加固避难所'
    },
    {
        id: 'sharpshooter',
        name: '精准射击',
        icon: '🎯',
        description: '你的射击技术一流',
        hiddenDescription: '使用远程武器时伤害加成，命中率提高'
    },
    {
        id: 'medic',
        name: '医疗知识',
        icon: '💊',
        description: '你了解基本的医疗救治',
        hiddenDescription: '药品效果翻倍，可以治疗更严重的伤病'
    },
    {
        id: 'survivalist',
        name: '野外求生',
        icon: '🏕️',
        description: '你精通野外生存技巧',
        hiddenDescription: '外出搜索收获增加，能在野外找到更多有用物资'
    },
    {
        id: 'socialite',
        name: '社交达人',
        icon: '🤝',
        description: '你很擅长与人交流',
        hiddenDescription: '与NPC交互时获得加成，更容易说服他人'
    },
    {
        id: 'thick_skin',
        name: '厚脸皮',
        icon: '😎',
        description: '你不太在意别人的看法',
        hiddenDescription: '减少因道德困境或负面事件导致的SAN损失'
    },
    {
        id: 'hoarder',
        name: '囤货癖',
        icon: '📦',
        description: '你总是习惯性地储备物资',
        hiddenDescription: '初始背包空间+10'
    },
    {
        id: 'intuition',
        name: '直觉敏锐',
        icon: '👁️',
        description: '你总能提前感知到危险',
        hiddenDescription: '危险事件触发前会有预警，给予玩家准备时间'
    },
    {
        id: 'deep_sleeper',
        name: '睡眠大师',
        icon: '😴',
        description: '你的睡眠质量极高',
        hiddenDescription: '休息时HP和SAN恢复翻倍'
    },
    {
        id: 'iron_stomach',
        name: '铁胃',
        icon: '🍽️',
        description: '你的肠胃异常坚强',
        hiddenDescription: '可以食用变质或可疑的食物而不会生病'
    },
    {
        id: 'lucky',
        name: '幸运儿',
        icon: '🍀',
        description: '幸运之神似乎眷顾着你',
        hiddenDescription: '随机事件中获得正面结果的概率提升'
    },
    {
        id: 'iron_will',
        name: '坚强意志',
        icon: '💎',
        description: '你的意志力坚不可摧',
        hiddenDescription: '当HP低于20时获得防御加成，不会轻易倒下'
    }
]

// 冰河末世避难所
export const ICE_AGE_SHELTERS: IceAgeShelter[] = [
    {
        id: 'apartment',
        name: '出租屋',
        price: 1000,
        space: 80,
        warmth: 1,
        description: '城区老旧住宅，便宜但防寒差',
        hiddenDescription: '防寒能力差，每天需要消耗较多燃料（2木柴或1煤）。位于城区老旧小区，人口密度高，容易遇到其他幸存者。可能触发事件：邻居敲门求助、楼道传来异响、发现楼上有人活动的迹象。'
    },
    {
        id: 'bunker',
        name: '地下防空洞',
        price: 3000,
        space: 150,
        warmth: 2,
        description: '恒温且宽大，长期居住影响情绪',
        hiddenDescription: '地下恒温约10°C，燃料消耗低（1木柴即可）。但封闭空间会导致SAN值每天额外下降2点。防空洞曾是公共设施，可能有其他幸存者躲避于此。可能触发事件：发现其他幸存者的痕迹、深处传来响动、通风口需要清理。'
    },
    {
        id: 'gasstation',
        name: '废弃加油站',
        price: 5000,
        space: 200,
        warmth: 2,
        description: '城郊公路旁，有汽油储备',
        hiddenDescription: '位于城郊公路旁的加油站，便利店区域可作为避难所。有少量汽油储备可用于取暖或交易。过路者较多，物资搜索机会多但也需警惕陌生人。可能触发事件：过路者停靠、便利店物资搜索、远处汽车引擎声、有人试图闯入加油。'
    }
]

// 冰河末世商品
export const ICE_AGE_SHOP_ITEMS: ShopItem[] = [
    // 保暖类
    {
        id: 'cotton_coat',
        name: '棉衣',
        price: 300,
        space: 2,
        category: 'emotional',
        description: '厚实的棉衣，能有效保暖',
        icon: '🧥',
        hidden: '穿戴后降低寒冷伤害'
    },
    {
        id: 'sleeping_bag',
        name: '睡袋',
        price: 400,
        space: 3,
        category: 'emotional',
        description: '保暖睡袋，睡眠更安稳',
        icon: '🛏️',
        hidden: '休息时HP恢复+5，防止夜间失温'
    },
    {
        id: 'hand_warmer',
        name: '暖宝宝',
        price: 50,
        space: 1,
        category: 'emotional',
        description: '一次性发热贴',
        icon: '🔥',
        hidden: '一次性消耗品，使用后当天不受寒冷伤害'
    },
    // 燃料类
    {
        id: 'coal',
        name: '煤炭',
        price: 50,
        space: 2,
        category: 'food',
        description: '可用于取暖和烧水',
        icon: '⬛',
        hidden: '每块煤炭可供暖1天，比木柴更高效'
    },
    {
        id: 'firewood',
        name: '木柴',
        price: 25,
        space: 2,
        category: 'food',
        description: '便宜但燃烧快',
        icon: '🪵',
        hidden: '每捆木柴可供暖半天'
    },
    {
        id: 'gasoline',
        name: '汽油',
        price: 200,
        space: 2,
        category: 'food',
        description: '高效燃料，需小心储存',
        icon: '⛽',
        hidden: '可用于发电机或应急取暖，但易燃危险'
    },
    // 食物类
    {
        id: 'canned_food',
        name: '罐头',
        price: 25,
        space: 1,
        category: 'food',
        description: '保质期长的食物',
        icon: '🥫',
        hidden: '每天消耗1个维持生存'
    },
    {
        id: 'biscuit',
        name: '压缩饼干',
        price: 20,
        space: 1,
        category: 'food',
        description: '高热量应急食品',
        icon: '🍪',
        hidden: '每天消耗1个维持生存，提供额外热量抵御寒冷'
    },
    {
        id: 'frozen_meat',
        name: '冻肉',
        price: 60,
        space: 2,
        category: 'food',
        description: '需要加热食用',
        icon: '🥩',
        hidden: '加热后食用HP+5，生吃可能生病'
    },
    {
        id: 'water',
        name: '桶装水',
        price: 30,
        space: 2,
        category: 'food',
        description: '生存必需品',
        icon: '💧',
        hidden: '每天消耗1单位，缺水会快速损失HP'
    },
    // 工具类
    {
        id: 'lighter',
        name: '打火机',
        price: 30,
        space: 1,
        category: 'weapon',
        description: '生火工具',
        icon: '🔥',
        hidden: '用于点燃燃料，丢失后无法生火取暖'
    },
    {
        id: 'axe',
        name: '斧头',
        price: 150,
        space: 2,
        category: 'weapon',
        description: '可劈柴可防身',
        icon: '🪓',
        hidden: '近战武器，也可用于收集木柴'
    },
    {
        id: 'sled',
        name: '雪橇',
        price: 300,
        space: 4,
        category: 'weapon',
        description: '雪地运输工具',
        icon: '🛷',
        hidden: '外出搜索时可携带更多物资回来'
    },
    {
        id: 'shovel',
        name: '铲子',
        price: 80,
        space: 2,
        category: 'weapon',
        description: '清雪和挖掘',
        icon: '⛏️',
        hidden: '可用于清除积雪、挖掘物资'
    },
    // 药品类
    {
        id: 'frostbite_cream',
        name: '冻伤膏',
        price: 100,
        space: 1,
        category: 'medical',
        description: '治疗冻伤',
        icon: '🧴',
        hidden: '治疗冻伤状态，HP+10'
    },
    {
        id: 'antibiotic',
        name: '抗生素',
        price: 200,
        space: 1,
        category: 'medical',
        description: '治疗感染',
        icon: '💊',
        hidden: '治疗感染和疾病，HP+15'
    },
    {
        id: 'painkiller',
        name: '止痛药',
        price: 80,
        space: 1,
        category: 'medical',
        description: '缓解疼痛',
        icon: '💉',
        hidden: 'HP+5，暂时忽略伤痛debuff'
    },
    {
        id: 'first_aid',
        name: '急救包',
        price: 500,
        space: 2,
        category: 'medical',
        description: '综合医疗用品',
        icon: '🩹',
        hidden: 'HP+30，可治疗多种伤病'
    },
    // 情绪类
    {
        id: 'poker',
        name: '扑克牌',
        price: 30,
        space: 1,
        category: 'emotional',
        description: '打发时间',
        icon: '🃏',
        hidden: '可重复使用，使用后SAN+3'
    },
    {
        id: 'radio',
        name: '收音机',
        price: 150,
        space: 1,
        category: 'emotional',
        description: '收听外界信息',
        icon: '📻',
        hidden: '可收听广播获取情报，SAN+5，需要电池'
    },
    {
        id: 'whiskey',
        name: '威士忌',
        price: 200,
        space: 1,
        category: 'emotional',
        description: '暖身又解忧',
        icon: '🥃',
        hidden: '一次性消耗，SAN+10，同时提供短暂抗寒效果'
    },
    {
        id: 'book',
        name: '小说',
        price: 30,
        space: 1,
        category: 'emotional',
        description: '阅读消磨时间',
        icon: '📚',
        hidden: '可重复使用，使用后SAN+5'
    }
]

/**
 * 从天赋池随机抽取指定数量的天赋
 */
export function getRandomTalents(count: number = 10): IceAgeTalent[] {
    const shuffled = [...TALENT_POOL].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, count)
}

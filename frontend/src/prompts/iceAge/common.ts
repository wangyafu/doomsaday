
import type { Stats, InventoryItem } from '@/types';

/**
 * 冰河末世模式 - 通用共享模块
 * 存放：世界观常量、数值计算规则、通用格式化函数
 */


// ==================== 世界观设定 ====================

export const ICE_AGE_WORLD_CONTEXT = `
<world>
## 世界观：冰河末世

### 背景
全球突发极端寒潮，气温持续下降。你是少数提前获知灾难的幸存者之一，提前准备了一些物资，活过40天就能等到救援。

### 温度变化规律
- 第1天：约-5°C（寒冷起步）
- 第10天：降至-25°C（快速封冻）
- 第20天：降至-35°C（极寒炼狱）// 修正：根据游戏实际体验，降低一点难度，或保持原样
- 第30天后：稳定在-50°C左右（绝对零度般的死寂）

### 生存挑战
- 寒冷：气温下降需要燃料取暖，否则失温
- 饥饿：食物和水是生存必需品
- 孤独：长期隔离影响精神状态
- 危险：其他幸存者、野兽、恶劣天气

### 氛围基调
- 孤独、寒冷、压抑
- 偶有希望的微光（发现物资、遇到好人）
- 强调资源匮乏和生存焦虑
</world>
`;

export const ICE_AGE_MECHANICS = `
<mechanics>
### 生存消耗标准 (每日动态计算)

#### 基础消耗
- 🍱 食物：每天消耗 1 个【罐头】或【压缩饼干】。若无食物，HP -10。
- 💧 饮水：每天消耗 1 单位【桶装水】。若无水，HP -15。

#### 燃料消耗（根据避难所和气温动态调整）
| 避难所 | 0~-20°C | -20~-40°C | <-40°C |
|--------|---------|-----------|--------|
| 出租屋 | 2木柴或1煤 | 3木柴或2煤 | 4木柴或2煤 |
| 地下防空洞 | 1木柴 | 1木柴 | 2木柴或1煤 |
| 废弃加油站 | 1木柴或1煤 | 2木柴或1煤 | 2木柴或1煤 |

- 若无燃料取暖：根据当前气温扣除 HP（0°C以下每降10度，HP额外扣10点）。如零下五十度且燃料不足，hp-40.

### SAN 影响因素
- 长期隔离：每天 -2~-5
- 恐惧事件：-5~-15
- 娱乐活动：使用【扑克牌】或【小说】等物品，SAN +5~+15
- 好消息/安全感：+5~+10

### 胜利条件
存活超过40天，等到救援

### 非危机日事件类型
以下是非危机日（has_crisis=false）时，narration 可简略描写的内容类型：

1. **外出探索** 
2. **避难所活动** 
3. **广播与信息** 
4. **他人踪迹** 
5. **天气与环境** 

### 状态标签系统
你需要维护玩家的长期状态。以下是常见的状态：

   - 【冻伤】: 长期暴露在低温或无保暖外出时获得。
     - 每天清晨额外扣除 5 点 HP。如果不治疗（使用药物或长期保持温暖），会恶化。
   - 【生病】: 抵抗力低或通过随机事件获得。
     - 每天额外扣除 10 点 HP。需要消耗【抗生素】或【草药】治疗。
   - 【受伤】: 战斗或意外导致。
     - 每次行动判定成功率受到惩罚（视为风险等级+1）。需要【绷带】或【酒精】处理。
   - 【虚弱】: 长期饥饿或极度疲劳。
     - 无法进行高体力消耗活动（如伐木、远行）。
   - **切记**: 状态具有持续性，除非明确移除，否则第二天依然存在并持续产生负面效果。
   - 这些状态通过new_hidden_tags和remove_hidden_tags来维护。
</mechanics>
`;

// ==================== 通用工具函数 ====================

export function calculateTemperature(day: number): number {
    let base = -5;
    if (day <= 1) {
        base = -5;
    } else if (day <= 10) {
        // Day 1: -5 -> Day 10: -25
        base = -5 - Math.floor((day - 1) * 2.2);
    } else if (day <= 20) {
        // Day 10: -25 -> Day 20: -40
        base = -25 - Math.floor((day - 10) * 1.5);
    } else {
        // Day 20+: drop to -50
        base = -40 - Math.floor((day - 20) * 0.5);
        if (base < -55) base = -55;
    }

    // 随机波动 +/- 3度 (前端使用 Math.random)
    const fluctuation = Math.floor(Math.random() * 7) - 3; // -3 to 3
    return base + fluctuation;
}

export function formatIceAgeInventory(inventory: InventoryItem[]): string {
    if (!inventory || inventory.length === 0) {
        return "[]";
    }

    const formattedItems = inventory.map(item => ({
        name: item.name,
        count: item.count,
        hidden: item.hidden || ""
    }));

    return JSON.stringify(formattedItems);
}

// 简单的类型定义，根据实际情况调整
interface Talent {
    id: string;
    name: string;
    description: string;
    hiddenDescription?: string;
}

export function formatIceAgeTalents(talents: Talent[] | null | undefined): string {
    if (!talents || talents.length === 0) {
        return "无天赋";
    }

    return talents.map(t => {
        const desc = t.hiddenDescription || t.description || "";
        return desc ? `- ${t.name}: ${desc}` : `- ${t.name}`;
    }).join("\n");
}

export function formatIceAgeStats(stats: Stats): string {
    return `- HP: ${stats.hp}\n- SAN: ${stats.san}`;
}


import type { Stats, InventoryItem, HistoryEntry } from '@/types';
import {
    ICE_AGE_WORLD_CONTEXT,
    ICE_AGE_MECHANICS,
    calculateTemperature,
    formatIceAgeInventory,
    formatIceAgeTalents
} from './common';

// ==================== 批量生成提示词 ====================

export const ICE_AGE_NARRATOR_SYSTEM_PROMPT = `
<role>
你是《末世模拟器：冰河末世》的 AI 叙事引擎。
你需要一次性生成多天的生存日志，为玩家呈现在极寒环境中艰难求生的故事。
</role>

${ICE_AGE_WORLD_CONTEXT}

${ICE_AGE_MECHANICS}

<persona>
## 写作风格
- 第二人称视角（"你"）
- 日记体/生存手记风格
- 环境描写突出寒冷、冰雪、暴风
- 节奏张弛有度

## 叙事多样性要求
- 非危机日：生存日志控制在 **100 字以内**，但内容类型应有变化（外出探索、避难所活动、天气变化、他人踪迹等轮换出现）
- 危机日：生存日志可更长（100-200字），详细描写危机情境
- 用简短描写突出气温变化带来的真实体感

### 叙事原则
- 前后连贯：记住之前发生的事，让故事有因果
- 状态驱动：玩家的HP/SAN会影响你的描写基调
- 物品关联：玩家拥有的物品应该自然地出现在叙事中
- 适度留白：给玩家想象空间，不要过度解释


## 情绪基调映射
- SAN > 70：正常叙事
- SAN 30-70：略带压抑，出现不安暗示
- SAN < 30：幻觉、偏执、不可靠叙述者
</persona>

<task>
## 你的任务

结合玩家的状态、持有的物资、拥有的天赋、避难所的特性，生成后续的生存日志，直到出现新的危机事件为止。

### 输出格式
请依次输出每天的日志，每一天用 <day_log> 标签包裹。

<day_log>
{
  "day": 1,
  "temperature": 10,
  "narration": "...",
  "has_crisis": false,
  //如果有危机事件，这里还要有choices字段。
  "state_update": {
    "hp":-10, //生命值的变化
    "san":-5,//精神值的变化
  } 
  "item_changes": {
    "remove": [],//消耗的物品
    "add": []//新增的物品
  },
  "new_hidden_tags": []//新增的隐藏标签
  "removed_hidden_tags": []//移除的隐藏标签
}
</day_log>

<day_log>
{
  "day": 2,
  ...
}
</day_log>

### 重要规则
1. 不要输出最外层的 \`\`\`json 或 { "days": [...] }
2. 每天必须独立被 <day_log> 标签包裹
3. 每天必须包含 day, temperature, narration,has_crisis,state_update等字段。
4. 约20-30%的天数有危机事件
5. 有危机天：必须包含 choices 数组，数组中每个元素必须是包含 text 和 risk 的 JSON 对象：
   - text: 选项描述（如 "A. 搜索房屋"）
   - risk: 风险等级，只能是 "Low"(低)、"Medium"(中)、"High"(高)、"Extreme"(极高) 之一。
   <example>
   "choices": [
     {"text": "A. 冒险搜索", "risk": "High"},
     {"text": "B. 安全撤离", "risk": "Low"}
   ]
   </example>
6. **每天都必须在 item_changes中处理基础消耗**，在 item_changes.remove 中明确列出消耗的物品（名称必须与背包完全一致）：
   - 食物消耗：移除 1 个【罐头】或【压缩饼干】等
   - 饮水消耗：移除 1 个【桶装水】
   - 燃料消耗：移除对应的【木柴】或【煤炭】
   <example>
   "item_changes": {
     "remove": [{"name": "罐头", "count": 1}, {"name": "桶装水", "count": 1}, {"name": "木柴", "count": 2}],
     "add": []
   }
   </example>
7.如果某一天触发了危机事件 (\`has_crisis: true\`)，你必须在闭合该天的 \`</day_log>\` 标签后**停止生成**。
</task>

<constraints>
## 禁止行为
- 不要让玩家获得背包里没有的物品
- 不要生成过于血腥/色情的内容
- 不要打破第四面墙
- 确保输出是合法的JSON格式
</constraints>
`;

export function buildIceAgeNarratorPrompt(
    startDay: number,
    daysToGenerate: number,
    stats: Stats,
    inventory: InventoryItem[],
    hiddenTags: string[],
    history: HistoryEntry[],
    shelter: any | null = null,
    talents: any[] | null = null
): string {
    const currentTemp = calculateTemperature(startDay);

    // 格式化物品
    const inventoryStr = formatIceAgeInventory(inventory);

    // 格式化天赋
    const talentsStr = formatIceAgeTalents(talents);

    // 格式化避难所
    const shelterStr = !shelter ? "无避难所" : (shelter.name || "未知");
    const shelterHidden = (!shelter ? "" : shelter.hiddenDescription) || "";

    // 格式化历史
    const formatHistoryItem = (h: HistoryEntry) => {
        const dayStr = `第${h.day || '?'}天`;
        const logContent = h.log || '';
        const logSummary = logContent; // Assuming summary needed? Python code kept whole log

        let itemStr = `${dayStr}: ${logSummary}`;

        if (h.player_action) {
            itemStr += `\n  (玩家选择: ${h.player_action})`;
        }
        if (h.judge_result) {
            itemStr += `\n  (判定后果: ${h.judge_result})`;
        }

        return itemStr;
    };

    const recentHistory = history.slice(-5);
    const historyStr = history.length === 0 ? "无" : recentHistory.map(formatHistoryItem).join("\n\n");

    return `
<current_state>
## 当前状态

### 时间
末世第 ${startDay} 天，当前气温 ${currentTemp}°C

### 玩家属性
- HP: ${stats.hp}
- SAN: ${stats.san}

### 天赋
${talentsStr}

### 避难所
${shelterStr}

### 避难所特性
${shelterHidden || '无特殊属性'}

### 背包物品
${inventoryStr}

### 隐藏标签
${hiddenTags && hiddenTags.length > 0 ? hiddenTags.join(', ') : '无'}

### 近期经历
${historyStr}
</current_state>

<instruction>
请生成从第${startDay}天开始的${daysToGenerate}天生存日志。


请直接输出JSON格式的结果。
</instruction>
`;
}

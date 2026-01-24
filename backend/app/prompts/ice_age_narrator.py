"""
冰河末世 Narrator 提示词模块

职责：
1. 批量生成多天生存日志
2. 决定每天是否触发危机事件
3. 设计危机事件的 A/B/C/D 选项
4. 输出每天的状态更新（气温、HP、SAN、物品变化）
"""
from app.models import Stats, InventoryItem, HistoryEntry
from typing import Any


# ==================== 世界观设定 ====================

ICE_AGE_WORLD_CONTEXT = """
<world>
## 世界观：冰河末世

### 背景
全球突发极端寒潮，气温持续下降。你是少数提前获知灾难的幸存者之一，必须在50天内存活，等待救援。

### 温度变化规律
- 第1天：约10°C（正常偏冷）
- 第10天：降至0°C（开始结冰）
- 第20天：降至-30°C（极寒）
- 第30天后：稳定在-40°C左右（地狱级严寒）

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
"""

ICE_AGE_MECHANICS = """
### 生存消耗标准 (每日)
- 🍱 饥饿消耗：每天消耗 1 个【罐头】或【压缩饼干】。若无食物，HP -10。
- 💧 饮水消耗：每天消耗 1 单位【桶装水】。若无水，HP -15。
- 🔥 取暖消耗：
  - 废弃小屋：每天消耗 2 次【木柴】或 1 个【煤炭】。
  - 地下防空洞：每天消耗 1 次【木柴】。
  - 科研站残骸：有燃料时自动保持温暖，消耗少。
  - 若无燃料取暖：根据当前气温扣除 HP（0°C以下每降10度，HP额外多扣5点）。

### SAN 影响因素
- 长期隔离：每天 -2~-5
- 恐惧事件：-5~-15
- 娱乐活动：使用【扑克牌】或【小说】等物品，SAN +5~+15
- 好消息/安全感：+5~+10
- 压抑环境：-3

### 胜利条件
存活超过50天，等到救援

### 危机事件触发
- 约20-30%的天数有需要选择的危机事件
- 其他天数为AI自动描述的日常，必须在 state_update 中体现资源消耗
</mechanics>
"""


# ==================== 批量生成提示词 ====================

ICE_AGE_NARRATOR_SYSTEM_PROMPT = f"""
<role>
你是《末世模拟器：冰河末世》的 AI 叙事引擎。
你需要一次性生成多天的生存日志，为玩家呈现在极寒环境中艰难求生的故事。
</role>

{ICE_AGE_WORLD_CONTEXT}

{ICE_AGE_MECHANICS}

<persona>
## 写作风格
- 第二人称视角（"你"）
- 日记体/生存手记风格
- 环境描写突出寒冷、冰雪、暴风
- 节奏张弛有度

## 情绪基调映射
- SAN > 70：正常叙事
- SAN 30-70：略带压抑，出现不安暗示
- SAN < 30：幻觉、偏执、不可靠叙述者
</persona>

<task>
## 你的任务

根据玩家当前状态，一次性生成5天的生存日志。

### 输出格式
请依次输出每天的日志，每一天用 <day_log> 标签包裹。

<day_log>
{{
  "day": 1,
  "temperature": 10,
  "narration": "...",
  "has_crisis": false,
  "state_update": {{ ... }}
}}
</day_log>

<day_log>
{{
  "day": 2,
  ...
}}
</day_log>

### 重要规则
1. 不要输出最外层的 ```json 或 {{ "days": [...] }}
2. 每天必须独立被 <day_log> 标签包裹

### 重要规则
3. 每天必须包含 day, temperature, narration
4. 无危机天：has_crisis=false，必须包含 state_update
5. 有危机天：has_crisis=true，必须包含 choices（4个选项），不需要 state_update
6. 约20-30%的天数有危机事件
7. 每天必须在 state_update 的 item_changes.remove 中明确列出消耗的物品（名称必须与背包完全一致）：
   - 食物消耗：移除 1 个【罐头】或【压缩饼干】等
   - 饮水消耗：移除 1 个【桶装水】
   - 燃料消耗：移除对应的【木柴】或【煤炭】
   示例：
   "item_changes": {{
     "remove": [{{"name": "罐头", "count": 1}}, {{"name": "桶装水", "count": 1}}, {{"name": "木柴", "count": 2}}],
     "add": []
   }}
8. 如果玩家背包中某种生存物资耗尽，请在 narration 中描写玩家的窘迫处境并在 state_update 中扣除大幅 HP。
</task>

<constraints>
## 禁止行为
- 不要让玩家获得背包里没有的物品
- 不要生成过于血腥/色情的内容
- 不要打破第四面墙
- 确保输出是合法的JSON格式
</constraints>
"""


def build_ice_age_narrator_prompt(
    start_day: int,
    days_to_generate: int,
    stats: Stats,
    inventory: list[InventoryItem],
    hidden_tags: list[str],
    history: list[dict],
    shelter: dict | None = None,
    talents: list[dict] | None = None
) -> str:
    """构建冰河末世批量生成的用户提示词"""
    
    # 计算当前气温
    def calc_temp(d: int) -> int:
        if d <= 1: return 10
        if d <= 10: return 10 - (d - 1)
        if d <= 20: return 0 - (d - 10) * 3
        if d <= 30: return -30 - (d - 20)
        return -40
    
    current_temp = calc_temp(start_day)
    
    # 格式化物品
    inventory_str = "空" if not inventory else "\n".join(
        f"- {item.name} x{item.count}" for item in inventory
    )
    
    # 格式化天赋
    talents_str = "无" if not talents else "\n".join(
        f"- {t.get('name', '未知')}: {t.get('hiddenDescription', '')}" for t in talents
    )
    
    # 格式化避难所
    shelter_str = "无避难所" if not shelter else f"{shelter.get('name', '未知')}"
    
    # 格式化历史
    history_str = "无" if not history else "\n".join(
        f"第{h.get('day', '?')}天: {h.get('log', '')[:50]}..." for h in history[-5:]
    )
    
    return f"""
<current_state>
## 当前状态

### 时间
末世第 {start_day} 天，当前气温 {current_temp}°C

### 玩家属性
- HP: {stats.hp}
- SAN: {stats.san}

### 天赋
{talents_str}

### 避难所
{shelter_str}

### 背包物品
{inventory_str}

### 隐藏标签
{', '.join(hidden_tags) if hidden_tags else '无'}

### 近期经历
{history_str}
</current_state>

<instruction>
请生成从第{start_day}天开始的{days_to_generate}天生存日志。

注意：
1. 第一天不要触发危机事件
2. 危机事件应该与玩家的物品和处境相关
3. 气温越低，生存越困难
4. 如果没有燃料取暖，应该根据环境温度扣减HP。
5. 每天必须在 state_update 的 item_changes.remove 中明确列出消耗的物品（名称必须与背包完全一致）：
   - 食物消耗：移除 1 个【罐头】或【压缩饼干】等
   - 饮水消耗：移除 1 个【桶装水】
   - 燃料消耗：移除对应的【木柴】或【煤炭】（数量参考生存消耗标准）
   示例：
   "item_changes": {{
     "remove": [{{"name": "罐头", "count": 1}}, {{"name": "桶装水", "count": 1}}, {{"name": "木柴", "count": 2}}],
     "add": []
   }}
6. 如果玩家背包中某种生存物资耗尽，请在 narration 中描写玩家的窘迫处境并在 state_update 中扣除大幅 HP。

请直接输出JSON格式的结果。
</instruction>
"""

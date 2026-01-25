"""
冰河末世 Judge 提示词模块

职责：
1. 判定玩家在危机事件中的选择
2. 生成判定结果叙事
3. 计算状态变化
"""
from app.prompts.ice_age_common import (
    format_ice_age_inventory,
    format_ice_age_talents
)

ICE_AGE_JUDGE_SYSTEM_PROMPT = """
<role>
你是《末世模拟器：冰河末世》的裁判AI。
你需要公正地判定玩家在危机事件中的选择，并生成合理的后果。
</role>

<persona>
## 判定风格
- 公正但严苛
- 不会因为玩家"想要"成功就让他成功
- 物品决定论：没有对应物品却想使用 → 必定失败
- 行动有代价：即使成功也可能付出代价

</persona>

<task>
## 你的任务

根据玩家的选择，输出判定结果。

### 输出格式
先输出判定叙事（50-100字），然后用 <state_update> 标签包裹状态更新JSON。

<example>
你小心翼翼地打开了门，门外站着一个浑身发抖的老人。他说自己迷路了，恳求你收留他一晚。你警惕地让他进来，给了他一些热水。

<state_update>
{"stat_changes": {"hp": 0, "san": 5}, "item_changes": {"remove": [], "add": []}, "new_hidden_tags": ["收留了一个陌生人"], "remove_hidden_tags": []}
</state_update>
</example>
</task>

<constraints>
## 规则
- 选项的后果要合理，不能太极端
- 如果玩家使用物品，必须从背包移除
- 如果玩家受伤，必须扣减HP
- 状态变化要符合选择的风险程度
- **必须输出 <state_update> 标签**，即使没有变化也要输出完整结构：
  ```json
  {"stat_changes": {"hp": 0, "san": 0}, "item_changes": {"remove": [], "add": []}, "new_hidden_tags": [], "remove_hidden_tags": []}
  ```
</constraints>
"""



def build_ice_age_judge_prompt(
    day: int,
    temperature: int,
    event_context: str,
    action_content: str,
    stats: dict,
    inventory: list,
    talents: list | None = None,
    luck_value: int = 50
) -> str:
    """构建冰河末世Judge的用户提示词"""
    
    inventory_str = format_ice_age_inventory(inventory)
    talents_str = format_ice_age_talents(talents)
    
    return f"""
<context>
## 当前状态

### 时间与环境
第 {day} 天，气温 {temperature}°C

### 玩家属性
- HP: {stats.get('hp', 100)}
- SAN: {stats.get('san', 100)}

### 天赋
{talents_str}

### 背包物品
{inventory_str}

### 今日事件
{event_context}

### 玩家选择
{action_content}

### 命运骰子
**{luck_value}** (0-100，数值越大运气越好)
</context>

<instruction>
请判定玩家的选择，输出判定叙事和状态更新。

### 判定逻辑（必需遵守）
1. **风险分析**：首先分析玩家行为的风险等级（Low/Medium/High/Extreme）。
   - 如果玩家选择的是预设选项且包含Risk字段，以其为准。
   - 如果是自定义行为，请你根据常识判断风险。
2. **成败判定**：将【命运骰子】({luck_value}) 与风险等级对比：
   - **Low (低风险)**：运气 > 10 成功，否则发生小意外。
   - **Medium (中风险)**：运气 > 40 成功，否则失败并付出代价。
   - **High (高风险)**：运气 > 70 成功，否则失败并遭受重创。
   - **Extreme (极高风险)**：运气 > 90 成功，否则可能致命。
3. **天赋修正**：如果有相关天赋，可降低风险或增加运气检定时的宽容度。
4. **拒绝 "剧情杀"**：虽然有随机性，但解释结果时要符合逻辑，不要生硬地"因为运气不好所以你死了"，而是描述为"风雪太大迷失方向"、"冰层突然断裂"等环境因素。


</instruction>
"""

"""
冰河末世 Judge 提示词模块

职责：
1. 判定玩家在危机事件中的选择
2. 生成判定结果叙事
3. 计算状态变化
"""

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

## 评分标准 (0-100)
- 90-100：神级操作，完美利用资源
- 70-89：优秀决策
- 50-69：中规中矩，完成目标但有代价
- 30-49：勉强过关，付出较大代价
- 0-29：糟糕决策，严重后果
</persona>

<task>
## 你的任务

根据玩家的选择，输出判定结果。

### 输出格式
先输出判定叙事（50-100字），然后用 <state_update> 标签包裹状态更新JSON。

<example>
你小心翼翼地打开了门，门外站着一个浑身发抖的老人。他说自己迷路了，恳求你收留他一晚。你警惕地让他进来，给了他一些热水。

<state_update>
{"score": 75, "stat_changes": {"hp": 0, "san": 5}, "item_changes": {"remove": [], "add": []}, "new_hidden_tags": ["收留了一个陌生人"], "remove_hidden_tags": []}
</state_update>
</example>
</task>

<constraints>
## 规则
- 选项的后果要合理，不能太极端
- 如果玩家使用物品，必须从背包移除
- 如果玩家受伤，必须扣减HP
- 状态变化要符合选择的风险程度
</constraints>
"""


def build_ice_age_judge_prompt(
    day: int,
    temperature: int,
    event_context: str,
    action_content: str,
    stats: dict,
    inventory: list,
    talents: list | None = None
) -> str:
    """构建冰河末世Judge的用户提示词"""
    
    inventory_str = "空" if not inventory else "\n".join(
        f"- {item.get('name', '?')} x{item.get('count', 1)}" for item in inventory
    )
    
    talents_str = "无" if not talents else ", ".join(
        t.get('name', '未知') for t in talents
    )
    
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
</context>

<instruction>
请判定玩家的选择，输出判定叙事和状态更新。
</instruction>
"""

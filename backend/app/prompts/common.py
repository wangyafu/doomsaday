"""
通用模块 - 游戏世界观常量 + 上下文格式化工具函数

所有角色共享的基础设定和工具
"""
from app.models import Stats, InventoryItem, HistoryEntry, Profession


# ==================== 游戏世界观常量 ====================

GAME_WORLD_CONTEXT = """
<world_setting>
## 游戏背景

这是一款 AI 驱动的文字生存 Roguelike 游戏。
### 游戏设定
游戏分为末世前三天的准备阶段，和末世爆发后的生存阶段。
准备阶段：玩家需要选定避难所、购买物资。
生存阶段：系统需要为玩家生成每天的生存日志和候选选项，用户选择后需要进行结果判定。
游戏现在处于生存阶段。
### 世界观设定
- 时间线：现代都市，丧尸病毒爆发
- 玩家身份：一个"重生者"——在前世被丧尸咬死后，意识回到了末日爆发前3天。
- 氛围基调：紧张、压抑、偶有黑色幽默，强调资源匮乏带来的焦虑感



### 社会崩溃时间线
- 第1-3天：丧尸突然爆发,90%的人变成了丧尸。
- 第4-8天：完全停水停电，网络彻底断，大部分幸存者家中食物水源消耗殆尽不得不到外寻找食物，聚集地开始形成。
- 第9-14天：部分丧尸出现了功能性变异，攀爬丧尸可以爬上高墙，疾跑丧尸速度堪比运动员。
- 第15-20天：军队开始清扫丧尸，第20天准时抵达撤离点，熬过去就能获得胜利。

### 生存要素
- 物资：食物、水、药品是硬通货
- 威胁：丧尸、饥饿、疾病、其他幸存者（强盗、疯子）
- 心理：长期隔离和恐惧会导致理智崩溃,理智崩溃同样造成坏结局。
</world_setting>
"""


GAME_MECHANICS_CONTEXT = """
<game_mechanics>
## 核心机制

### 双维属性系统
- ❤️ 生命(HP)：0-100，归零即死亡。受伤、感染都会扣减
- 🧠 理智(SAN)：0-100，影响叙事风格和决策选项。低于30触发幻觉描写，低于10可能做出疯狂行为

### 属性联动规则
- SAN < 30：叙事出现幻觉、偏执描写，行动成功率降低
- HP < 20：进入"濒死"状态，行动成功率降低



### 避难所特性
- 防御等级：影响被袭击概率和抵御能力
- 空间限制：决定能携带多少物资
- 隐藏属性：每个避难所有独特的剧情触发条件

## 回合机制
1. 每一天相当于一个回合。
2. 每个回合中先由<AI叙事引擎>生成生存日志。如果有危机事件，<AI叙事引擎>还要生成候选选项。
3. 如果有危机事件，用户做出决策后<AI裁判引擎>会生成相应判定。
4. 更新受影响的状态后进入下一天。

##  结局机制
- 生命值清零后死亡，坏结局
- san值清零后疯癫，坏结局
- 成功活过20天等到军队营救，好结局。
</game_mechanics>
"""
# ==================== 状态更新共享规则 ====================

STATE_CHANGE_RULES = """
<state_update_rules>
## 状态变化规则

### HP（生命）变化触发

- 生病/感染：持续下降，需添加对应 tag
- 休息/恢复：+5~+10
- 缺少食物，一天没有进食：-20
- 缺少饮水，一天没有饮水：-40

### SAN（理智）变化触发
- 恐惧/压力事件：-5~-15
- 目睹惨状/杀人：-10~-20
- 娱乐/宠物互动：+5~+15
- 安全感/好消息：+5~+10
- 长期隔离：每天 -3~-5

### 物品变化规则

- 消耗品（食物、药品、弹药）：使用后必须在 remove 中扣除
- 工具类（武器、工具）：通常不消耗，但可能损坏（添加 tag）
- 获得新物品：放在 add 中
- 每天必须有进食和饮水，在有食物、水源时即便正文没有提及也要扣除相应消耗品
- 为简化逻辑，一个成人每天消耗一份食物、一份瓶装水。

### 隐藏标签(hidden_tags)用途
- 持续状态：<受伤>、<被吓到了>
- 剧情标记：<暗中有幸存者团体密谋对玩家不利>
- 物品状态：<枪支损坏，强行使用可能炸膛>

### 隐藏标签变更规则
- new_hidden_tags：新增的标签（如受伤、感染等新状态）
- remove_hidden_tags：需要移除的标签
- 只有当状态确实改变时才添加/移除标签
- 移除标签时必须使用与现有标签完全相同的字符串
</state_update_rules>
"""

STATE_OUTPUT_FORMAT = """
## 输出格式
必须返回JSON对象，包含以下字段：
- stat_changes: 对象，包含 hp、san 两个数值（可正可负可为0）
- item_changes: 对象，包含 remove 和 add 两个数组
  - 数组中的每个物品对象必须包含 name 和 count 字段（注意：是 count 不是 quantity）
- new_hidden_tags: 字符串数组（新增的标签）
- remove_hidden_tags: 字符串数组（需要移除的标签）

### 示例输出

平静的一天，读了小说：
{"stat_changes": {"hp": 0, "san": 5}, "item_changes": {"remove": [], "add": []}, "new_hidden_tags": [], "remove_hidden_tags": []}

被丧尸抓伤，消耗绷带包扎：
{"stat_changes": {"hp": -10, "san": -5}, "item_changes": {"remove": [{"name": "绷带", "count": 1}], "add": []}, "new_hidden_tags": ["受伤"], "remove_hidden_tags": []}

伤口痊愈，移除受伤标签：
{"stat_changes": {"hp": 5, "san": 5}, "item_changes": {"remove": [], "add": []}, "new_hidden_tags": [], "remove_hidden_tags": ["受伤"]}

消耗食物和水：
{"stat_changes": {"hp": 0, "san": 0}, "item_changes": {"remove": [{"name": "桶装水", "count": 1}, {"name": "压缩饼干", "count": 1}], "add": []}, "new_hidden_tags": [], "remove_hidden_tags": []}

重要：
1. 直接输出JSON对象，不要有任何其他文字或代码块标记
2. 物品对象的字段名必须是 "name" 和 "count"，不要使用 "quantity" 或其他名称
"""




# ==================== 上下文格式化工具函数 ====================

def format_stats(stats: Stats) -> str:
    """格式化玩家状态，附带状态解读"""
    status_notes = []
    if stats.hp < 20:
        status_notes.append("【濒死】")
    if stats.san < 30:
        status_notes.append("【精神不稳】")
    elif stats.san < 10:
        status_notes.append("【濒临崩溃】")
    
    base = f"❤️生命: {stats.hp}/100 | 🧠理智: {stats.san}/100"
    if status_notes:
        return f"{base}\n状态警告: {' '.join(status_notes)}"
    return base


def format_inventory(inventory: list[InventoryItem]) -> str:
    """格式化背包物品（简单版，用于显示）"""
    if not inventory:
        return "背包空空如也（这很危险！）"
    
    items = [f"- {item.name} x{item.count}" for item in inventory]
    return "\n".join(items)


def format_inventory_detailed(inventory: list[InventoryItem]) -> str:
    """
    详细格式化背包，供AI判定时使用
    包含物品的描述和隐藏信息（数值运算法则）
    """
    if not inventory:
        return "<inventory empty='true'>背包空空如也</inventory>"
    
    lines = ["<inventory>"]
    for item in inventory:
        # 基础属性
        item_line = f"  <item name='{item.name}' count='{item.count}'"
        
        # 添加描述（如果有）
        if item.description:
            item_line += f" description='{item.description}'"
        
        # 添加隐藏信息（如果有）- 这是给AI看的数值运算法则
        if item.hidden:
            lines.append(item_line + ">")
            lines.append(f"    <hidden_info>{item.hidden}</hidden_info>")
            lines.append("  </item>")
        else:
            lines.append(item_line + "/>")
    
    lines.append("</inventory>")
    return "\n".join(lines)


def format_history(history: list[HistoryEntry], max_days: int = 5) -> str:
    """
    格式化历史记录，只取最近N天
    使用XML标签结构化，便于AI理解上下文
    """
    if not history:
        return "<history>\n  <note>这是末世的第一天，一切才刚刚开始...</note>\n</history>"
    
    recent = history[-max_days:] if len(history) > max_days else history
    
    lines = ["<history>"]
    for entry in recent:
        result_attr = f' result="{entry.event_result}"' if entry.event_result != "none" else ""
        lines.append(f'  <day num="{entry.day}"{result_attr}>')
        # 今日事件描述
        lines.append(f"    <narrative>{entry.log}</narrative>")
        # 玩家行动（如果有）
        if entry.player_action:
            lines.append(f"    <player_action>{entry.player_action}</player_action>")
        # 判定结果（如果有）
        if entry.judge_result:
            lines.append(f"    <judge_result>{entry.judge_result}</judge_result>")
        lines.append("  </day>")
    lines.append("</history>")
    
    return "\n".join(lines)


def format_hidden_tags(tags: list[str]) -> str:
    """格式化隐藏标签（仅供AI参考，影响剧情走向）"""
    if not tags:
        return "无特殊状态"
    return ", ".join(tags)


def format_profession(profession: Profession | None) -> str:
    """
    格式化职业信息（供AI参考）
    包含职业名称、描述和隐藏描述
    """
    if profession is None:
        return "<profession>无职业信息</profession>"
    
    return f"""<profession>
  <name>{profession.name}</name>
  <description>{profession.description}</description>
  <hidden_info>{profession.hidden_description}</hidden_info>
</profession>"""



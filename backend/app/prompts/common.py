"""
通用模块 - 游戏世界观常量 + 上下文格式化工具函数

所有角色共享的基础设定和工具
"""
from app.models import Stats, InventoryItem, HistoryEntry


# ==================== 游戏世界观常量 ====================

GAME_WORLD_CONTEXT = """
<world_setting>
## 游戏背景：《末世模拟器：丧尸围城篇》

这是一款 AI 驱动的文字生存 Roguelike 游戏。
### 游戏设定
游戏分为末世前三天的准备阶段，和末世爆发后的生存阶段。
准备阶段：玩家需要选定避难所、购买物资。
生存阶段：系统需要为玩家生成每天的生存日志，在有危机事件时还会为玩家生成多个选项。
游戏现在处于生存阶段。
### 世界观设定
- 时间线：现代都市，丧尸病毒爆发
- 玩家身份：一个"重生者"——在前世被丧尸咬死后，意识回到了末日爆发前3天。
- 核心冲突：玩家利用"先知"优势囤积物资，在避难所中艰难求生
- 氛围基调：紧张、压抑、偶有黑色幽默，强调资源匮乏带来的焦虑感



### 社会崩溃时间线
- 第1-3天：丧尸突然爆发,90%的人变成了丧尸。
- 第4-10天：完全停水停电，网络彻底断，大部分幸存者家中食物水源消耗殆尽不得不到外寻找食物，聚集地开始形成。
- 第11-20天：部分丧尸出现了功能性变异，攀爬丧尸可以爬上高墙，疾跑丧尸速度堪比运动员。
- 第21天-30天：军队进驻城市，开始清扫丧尸。

### 生存要素
- 物资：食物、水、药品是硬通货
- 威胁：丧尸、饥饿、疾病、其他幸存者（强盗、疯子）
- 心理：长期隔离和恐惧会导致理智崩溃
</world_setting>
"""


GAME_MECHANICS_CONTEXT = """
<game_mechanics>
## 核心机制

### 三维属性系统
- ❤️ 生命(HP)：0-100，归零即死亡。受伤、感染、饥饿过度都会扣减
- 🍔 饱腹(Hunger)：0-100，食物不足时会下降，下降到0时身体虚弱，生命流逝。
- 🧠 理智(SAN)：0-100，影响叙事风格和决策选项。低于30触发幻觉描写，低于10可能做出疯狂行为

### 属性联动规则
- Hunger < 30：每天额外扣 HP -5
- Hunger = 0：每天扣 HP -15
- SAN < 30：叙事出现幻觉、偏执描写
- SAN < 10：可能出现自残、攻击同伴等极端选项
- HP < 20：进入"濒死"状态，行动成功率降低

### 物品系统
- 消耗品：食物、水、药品（使用后消失）
- 工具：武器、工具（可重复使用，但可能损坏）
- 情绪物品：宠物、娱乐品（提供SAN恢复，是"奢侈品"）
- 特殊物品：钥匙、地图等剧情道具

### 避难所特性
- 防御等级：影响被袭击概率和抵御能力
- 空间限制：决定能携带多少物资
- 隐藏属性：每个避难所有独特的剧情触发条件
</game_mechanics>
"""


# ==================== 上下文格式化工具函数 ====================

def format_stats(stats: Stats) -> str:
    """格式化玩家状态，附带状态解读"""
    status_notes = []
    if stats.hp < 20:
        status_notes.append("【濒死】")
    if stats.hunger < 30:
        status_notes.append("【饥饿】")
    if stats.san < 30:
        status_notes.append("【精神不稳】")
    elif stats.san < 10:
        status_notes.append("【濒临崩溃】")
    
    base = f"❤️生命: {stats.hp}/100 | 🍔饱腹: {stats.hunger}/100 | 🧠理智: {stats.san}/100"
    if status_notes:
        return f"{base}\n状态警告: {' '.join(status_notes)}"
    return base


def format_inventory(inventory: list[InventoryItem]) -> str:
    """格式化背包物品"""
    if not inventory:
        return "背包空空如也（这很危险！）"
    
    items = [f"- {item.name} x{item.count}" for item in inventory]
    return "\n".join(items)


def format_inventory_detailed(inventory: list[InventoryItem]) -> str:
    """详细格式化背包，供Judge判定时使用"""
    if not inventory:
        return "<inventory empty='true'>背包空空如也</inventory>"
    
    lines = ["<inventory>"]
    for item in inventory:
        lines.append(f"  <item name='{item.name}' count='{item.count}'/>")
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
        lines.append(f"    {entry.log}")
        lines.append("  </day>")
    lines.append("</history>")
    
    return "\n".join(lines)


def format_hidden_tags(tags: list[str]) -> str:
    """格式化隐藏标签（仅供AI参考，影响剧情走向）"""
    if not tags:
        return "无特殊状态"
    return ", ".join(tags)



"""
冰河末世模式 - 通用共享模块
存放：世界观常量、数值计算规则、通用格式化函数
"""
import random
from typing import Any, Union
from app.models import Stats, InventoryItem

# ==================== 世界观设定 ====================

ICE_AGE_WORLD_CONTEXT = """
<world>
## 世界观：冰河末世

### 背景
全球突发极端寒潮，气温持续下降。你是少数提前获知灾难的幸存者之一，必须在40天内存活，等待救援。

### 温度变化规律
- 第1天：约-5°C（寒冷起步）
- 第10天：降至-25°C（快速封冻）
- 第20天：降至-40°C（极寒炼狱）
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
"""

ICE_AGE_MECHANICS = """
<mechanics>
### 生存消耗标准 (每日)
- 🍱 饥饿消耗：每天消耗 1 个【罐头】或【压缩饼干】。若无食物，HP -10。
- 💧 饮水消耗：每天消耗 1 单位【桶装水】。若无水，HP -15。
- 🔥 取暖消耗：
  - 废弃小屋：每天消耗 2 次【木柴】或 1 个【煤炭】。
  - 地下防空洞：每天消耗 1 次【木柴】。
  - 科研站残骸：有燃料时自动保持温暖，消耗少。
  - 若无燃料取暖：根据当前气温扣除 HP（0°C以下每降10度，HP额外多扣10点）。

### SAN 影响因素
- 长期隔离：每天 -2~-5
- 恐惧事件：-5~-15
- 娱乐活动：使用【扑克牌】或【小说】等物品，SAN +5~+15
- 好消息/安全感：+5~+10
- 压抑环境：-3

### 胜利条件
存活超过40天，等到救援

### 危机事件触发
- 约20-30%的天数有需要选择的危机事件
- 其他天数为AI自动描述的日常，必须在 state_update 中体现资源消耗

### 动态资源价值评估
根据当前气温，必需调整对物品价值和风险的判断：

1. **冰封初期 (0°C ~ -20°C)**
   - 状态：开局即入冬，室外水源全部结冰。
   - 重点：储备燃料变得和食物一样重要。
   - 风险：低温是第一杀手，普通衣物已无法长时间御寒。

2. **极寒期 (-20°C ~ -40°C)**
   - 状态：呼吸都会结冰，金属会粘住皮肤。
   - 燃料价值：**极高**。没有火源过夜必死。
   - 风险：强盗和野兽也因寒冷变得疯狂。外出必须有重型保暖装备。

3. **绝对死寂 (气温 < -40°C)**
   - 状态：人类生存禁区。
   - 重点：**热量即生命**。任何可燃烧物都是无价之宝。
   - 风险：**室外活动风险等级强制 +2**（甚至 +3）。除非万不得已，绝对不要出门。
   - 物品修正：任何"保暖"相关的物品判定权重翻倍。

### 状态标签系统 (Status Tags)
你需要通过 hidden_tags 字段维护玩家的长期状态。以下是标准状态及其效果，请在判定和叙事中严格执行：

1. **生理状态 (Physiological)**
   - 【冻伤】(Frostbite): 长期暴露在低温或无保暖外出时获得。
     - 效果: 每天清晨额外扣除 5 点 HP。如果不治疗（使用药物或长期保持温暖），会恶化。
   - 【生病】(Sick): 抵抗力低或通过随机事件获得。
     - 效果: 每天额外扣除 10 点 HP。需要消耗【抗生素】或【草药】治疗。
   - 【受伤】(Injured): 战斗或意外导致。
     - 效果: 每次行动判定成功率受到惩罚（视为风险等级+1）。需要【绷带】或【酒精】处理。
   - 【虚弱】(Weak): 长期饥饿或极度疲劳。
     - 效果: 无法进行高体力消耗活动（如伐木、远行）。

2. **心理状态 (Mental)**
   - 【崩溃】(Breakdown): SAN < 10。
     - 效果: 拒绝执行玩家指令，或者强制做出疯狂举动（如烧毁物资）。
   - 【压抑】(Depressed): SAN < 40。
     - 效果: SAN 恢复效率降低 50%。

3. **状态维护规则**
   - 获得状态: 在 `new_hidden_tags` 返回（如 `["冻伤", "受伤"]`）。
   - 移除状态: 当满足恢复条件（使用了药、休息足够）后，在 `remove_hidden_tags` 中返回。
   - **切记**: 状态具有持续性，除非明确移除，否则第二天依然存在并持续产生负面效果。
</mechanics>
"""

# ==================== 通用工具函数 ====================

def calculate_temperature(day: int) -> int:
    """根据天数计算当前气温（含随机波动）"""
    if day <= 1: 
        base = -5
    elif day <= 10: 
        # Day 1: -5 -> Day 10: -25
        base = -5 - int((day - 1) * 2.2)
    elif day <= 20: 
        # Day 10: -25 -> Day 20: -40
        base = -25 - int((day - 10) * 1.5)
    else: 
        # Day 20+: drop to -50
        base = -40 - int((day - 20) * 0.5)
        if base < -55: base = -55
    
    # 随机波动 +/- 3度
    return base + random.randint(-3, 3)

def get_attr(obj: Any, key: str, default: Any = None) -> Any:
    """兼容 字典 和 对象 的属性获取"""
    if isinstance(obj, dict):
        return obj.get(key, default)
    return getattr(obj, key, default)

def format_ice_age_inventory(inventory: list[Any]) -> str:
    """
    格式化背包物品
    兼容：list[dict] 和 list[InventoryItem]
    """
    import json
    if not inventory:
        return "[]"
    
    formatted_items = []
    for item in inventory:
        formatted_items.append({
            "name": get_attr(item, 'name', '?'),
            "count": get_attr(item, 'count', 1),
            "hidden": get_attr(item, 'hidden', '') or ""
        })
    
    return json.dumps(formatted_items, ensure_ascii=False)

def format_ice_age_talents(talents: list[Any] | None) -> str:
    """格式化天赋列表"""
    if not talents:
        return "无天赋"
    
    lines = []
    for t in talents:
        name = get_attr(t, 'name', '未知')
        desc = get_attr(t, 'hiddenDescription', '') or get_attr(t, 'description', '')
        if desc:
            lines.append(f"- {name}: {desc}")
        else:
            lines.append(f"- {name}")
    
    return "\n".join(lines)

def format_ice_age_stats(stats: Any) -> str:
    """格式化属性"""
    hp = get_attr(stats, 'hp', 100)
    san = get_attr(stats, 'san', 100)
    return f"- HP: {hp}\n- SAN: {san}"

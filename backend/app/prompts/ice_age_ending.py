"""
冰河末世 Ending 提示词模块

职责：
1. 分析死因（如果死亡）
2. 生成人设词
3. 写毒舌评语
4. 生成五维雷达图数据
"""

ICE_AGE_ENDING_SYSTEM_PROMPT = """
<role>
你是《末世模拟器：冰河末世》的结局评论员。
你需要为玩家的冰原生存之旅做出总结评价。
</role>

<persona>
## 说话风格
- 毒舌但有趣
- 评价一针见血
- 有个人观点

## 评价维度
1. 生存力：基于存活天数（1-10天=2分，50天+=10分）
2. 抗寒力：基于保暖措施和燃料管理
3. 智慧：基于决策质量
4. 运气：基于随机事件结果
5. 心理素质：基于SAN值管理
</persona>

<task>
## 输出格式（JSON）

```json
{
  "cause_of_death": "死因描述（如果死亡）或 null（如果存活）",
  "epithet": "人设词（3-6字）",
  "comment": "毒舌评语（50-100字）",
  "radar_chart": [生存力, 抗寒力, 智慧, 运气, 心理素质]
}
```

### 人设词示例
- 正面：冰原战神、极地传奇、寒冬破晓者、不屈意志
- 负面：冻土归客、冰封遗憾、雪中倒下、极夜迷途
- 特色：囤货达人、火焰守护者、孤独旅人
</task>
"""


def build_ice_age_ending_prompt(
    days_survived: int,
    is_victory: bool,
    final_stats: dict,
    final_inventory: list,
    history: list,
    talents: list | None = None
) -> str:
    """构建冰河末世结局评价的用户提示词"""
    
    talents_str = "无" if not talents else ", ".join(
        t.get('name', '未知') for t in talents
    )
    
    # 提取关键历史事件
    key_events = []
    for h in history[-10:]:
        if h.get('player_action'):
            key_events.append(f"第{h.get('day', '?')}天: {h.get('player_action', '')[:30]}...")
    
    return f"""
<result>
## 游戏结果

### 结局
{'🏆 成功存活，等到了救援！' if is_victory else '💀 不幸死亡'}

### 存活天数
{days_survived} 天

### 最终状态
- HP: {final_stats.get('hp', 0)}
- SAN: {final_stats.get('san', 0)}

### 选择的天赋
{talents_str}

### 关键决策
{chr(10).join(key_events) if key_events else '无关键决策记录'}

### 最终背包
{', '.join(item.get('name', '?') for item in final_inventory[:5]) if final_inventory else '空'}
</result>

<instruction>
请基于以上信息，生成结局评价。
输出格式为JSON，包含 cause_of_death, epithet, comment, radar_chart。
</instruction>
"""

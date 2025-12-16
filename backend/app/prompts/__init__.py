"""
提示词模块 - 按角色拆分组织

模块结构：
- common.py: 游戏世界观常量 + 上下文格式化工具函数
- narrator.py: Narrator（小说家/旁白）提示词
- judge.py: Judge（冷酷裁判/DM）提示词
- ending.py: Ending（毒舌评论员）提示词

架构说明（合并叙事与状态更新）：
- Narrator 和 Judge 的叙事输出末尾会包含 <state_update> XML 标签
- 前端从流式输出中解析该标签获取状态更新 JSON
- 不再需要单独的 /state 接口调用
"""

# 从各子模块导入
from app.prompts.common import (
    GAME_WORLD_CONTEXT,
    GAME_MECHANICS_CONTEXT,
    format_stats,
    format_inventory,
    format_inventory_detailed,
    format_history,
    format_hidden_tags,
    format_profession
)

from app.prompts.narrator import (
    NARRATOR_NARRATIVE_SYSTEM_PROMPT,
    build_narrator_prompt,
)

from app.prompts.judge import (
    JUDGE_NARRATIVE_SYSTEM_PROMPT,
    build_judge_narrative_prompt,
)

from app.prompts.ending import (
    ENDING_SYSTEM_PROMPT,
    build_ending_prompt,
)

__all__ = [
    # 世界观常量
    "GAME_WORLD_CONTEXT",
    "GAME_MECHANICS_CONTEXT",
    # 工具函数
    "format_stats",
    "format_inventory",
    "format_inventory_detailed",
    "format_history",
    "format_hidden_tags",
    "format_profession",
    # Narrator（叙事+状态更新合并）
    "NARRATOR_NARRATIVE_SYSTEM_PROMPT",
    "build_narrator_prompt",
    # Judge（判定+状态更新合并）
    "JUDGE_NARRATIVE_SYSTEM_PROMPT",
    "build_judge_narrative_prompt",
    # Ending
    "ENDING_SYSTEM_PROMPT",
    "build_ending_prompt",
]

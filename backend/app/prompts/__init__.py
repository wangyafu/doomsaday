"""
提示词模块 - 按角色拆分组织

模块结构：
- common.py: 游戏世界观常量 + 上下文格式化工具函数
- narrator.py: Narrator（小说家/旁白）提示词
- judge.py: Judge（冷酷裁判/DM）提示词
- ending.py: Ending（毒舌评论员）提示词
"""

# 从各子模块导入
from app.prompts.common import (
    GAME_WORLD_CONTEXT,
    GAME_MECHANICS_CONTEXT,
    format_stats,
    format_inventory,
    format_inventory_detailed,
    format_history,
    format_hidden_tags
)

from app.prompts.narrator import (
    NARRATOR_NARRATIVE_SYSTEM_PROMPT,
    NARRATOR_STATE_SYSTEM_PROMPT,
    build_narrator_prompt,
    build_narrator_state_prompt,
)

from app.prompts.judge import (
    JUDGE_NARRATIVE_SYSTEM_PROMPT,
    JUDGE_STATE_SYSTEM_PROMPT,
    build_judge_narrative_prompt,
    build_judge_state_prompt,
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
    # Narrator
    "NARRATOR_NARRATIVE_SYSTEM_PROMPT",
    "NARRATOR_STATE_SYSTEM_PROMPT",
    "build_narrator_prompt",
    "build_narrator_state_prompt",
    # Judge
    "JUDGE_NARRATIVE_SYSTEM_PROMPT",
    "JUDGE_STATE_SYSTEM_PROMPT",
    "build_judge_narrative_prompt",
    "build_judge_state_prompt",
    # Ending
    "ENDING_SYSTEM_PROMPT",
    "build_ending_prompt",
]

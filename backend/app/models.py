"""
数据模型定义 - 使用 Pydantic 进行请求/响应验证
"""
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


# ==================== 通用模型 ====================

class Stats(BaseModel):
    """玩家状态数值"""
    hp: int = Field(..., description="生命值")
    san: int = Field(..., description="理智值")


class InventoryItem(BaseModel):
    """背包物品"""
    name: str = Field(..., description="物品名称")
    count: int = Field(..., description="物品数量")
    description: Optional[str] = Field(default=None, description="物品描述（对玩家可见）")
    hidden: Optional[str] = Field(default=None, description="隐藏信息（仅供AI参考，包含数值运算法则）")


class HistoryEntry(BaseModel):
    """历史记录条目"""
    day: int = Field(..., description="天数")
    log: str = Field(..., description="Narrator 生成的今日事件描述")
    player_action: Optional[str] = Field(default=None, description="玩家选择的行动（有危机事件时）")
    judge_result: Optional[str] = Field(default=None, description="Judge 的判定叙事（有危机事件时）")
    event_result: str = Field(default="none", description="事件结果：success/fail/none")


class Shelter(BaseModel):
    """避难所（用于AI上下文）"""
    id: str = Field(..., description="避难所ID")
    name: str = Field(..., description="避难所名称")
    price: int = Field(..., description="价格")
    space: int = Field(..., description="提供空间")
    defense: int = Field(..., description="防御等级")
    description: str = Field(..., description="对玩家可见的描述")
    hidden_discription: Optional[str] = Field(default=None, description="对玩家隐藏的描述（仅供AI参考）")


class Profession(BaseModel):
    """职业（用于AI上下文）"""
    id: str = Field(..., description="职业ID")
    name: str = Field(..., description="职业名称")
    description: str = Field(..., description="对玩家可见的描述")
    hidden_description: str = Field(..., description="隐藏描述（影响AI剧情发展）")


# ==================== Narrate 接口模型 ====================

class NarrateRequest(BaseModel):
    """每日剧情生成请求"""
    day: int = Field(..., description="当前天数")
    stats: Stats = Field(..., description="玩家当前状态")
    inventory: list[InventoryItem] = Field(default_factory=list, description="背包物品列表")
    hidden_tags: list[str] = Field(default_factory=list, description="隐藏标签")
    history: list[HistoryEntry] = Field(default_factory=list, description="历史记录")
    shelter: Optional[Shelter] = Field(default=None, description="避难所信息")
    profession: Optional[Profession] = Field(default=None, description="职业信息")


# ==================== Judge 接口模型 ====================

class JudgeRequest(BaseModel):
    """行动判定请求"""
    day: int = Field(..., description="当前天数")
    event_context: str = Field(..., description="当前事件上下文（本回合 /narrate/stream 的输出）")
    action_content: str = Field(..., description="玩家选择的行动内容")
    stats: Stats = Field(..., description="玩家当前状态")
    inventory: list[InventoryItem] = Field(default_factory=list, description="背包物品列表")
    history: list[HistoryEntry] = Field(default_factory=list, description="历史记录")
    profession: Optional[Profession] = Field(default=None, description="职业信息")


class ItemChange(BaseModel):
    """物品变更"""
    name: str = Field(..., description="物品名称")
    count: int = Field(..., description="变更数量")


class ItemChanges(BaseModel):
    """物品变更汇总"""
    remove: list[ItemChange] = Field(default_factory=list, description="消耗的物品")
    add: list[ItemChange] = Field(default_factory=list, description="获得的物品")


class StatChanges(BaseModel):
    """状态变更"""
    hp: int = Field(default=0, description="生命值变化")
    san: int = Field(default=0, description="理智值变化")


# ==================== Ending 接口模型 ====================

class EndingRequest(BaseModel):
    """结局结算请求"""
    days_survived: int = Field(..., description="存活天数")
    high_light_moment: str = Field(default="", description="高光时刻描述")
    final_stats: Stats = Field(..., description="最终状态")
    final_inventory: list[InventoryItem] = Field(default_factory=list, description="最终背包")
    history: list[HistoryEntry] = Field(default_factory=list, description="完整历史记录")
    profession: Optional[Profession] = Field(default=None, description="职业信息")


class EndingResponse(BaseModel):
    """结局结算响应"""
    cause_of_death: Optional[str] = Field(default=None, description="死因，通关时为空")
    epithet: str = Field(..., description="四字人设总结词")
    comment: str = Field(..., description="毒舌评语")
    radar_chart: list[int] = Field(..., min_length=5, max_length=5, description="五维雷达图数据")


# ==================== 流式输出模型 ====================

class StreamEventType(str, Enum):
    """流式输出事件类型"""
    CONTENT = "content"      # 叙事文本片段
    CRISIS = "crisis"        # 危机事件标识
    CHOICES = "choices"      # 选项列表
    DONE = "done"            # 流式完成
    ERROR = "error"          # 错误事件


class StreamEvent(BaseModel):
    """流式输出事件"""
    type: StreamEventType
    text: Optional[str] = None
    has_crisis: Optional[bool] = None
    choices: Optional[list[str]] = None
    error: Optional[str] = None


# ==================== 状态更新模型（前端从流式输出中解析） ====================
# 注意：这些模型不再用于独立的 API 响应，而是嵌入在流式输出的 <state_update> 标签中
# 保留这些定义是为了文档说明和类型参考

# Narrator 状态更新格式（无危机事件时，嵌入在叙事输出末尾）
# {
#   "stat_changes": {"hp": 0, "san": 5, "hunger": -30},
#   "item_changes": {"remove": [...], "add": [...]},
#   "new_hidden_tags": [...],
#   "remove_hidden_tags": [...]
# }

# Judge 状态更新格式（嵌入在判定输出末尾）
# {
#   "score": 75,
#   "stat_changes": {"hp": -10, "san": -5, "hunger": -30},
#   "item_changes": {"remove": [...], "add": [...]},
#   "new_hidden_tags": [...],
#   "remove_hidden_tags": [...]
# }

"""
数据模型定义 - 使用 Pydantic 进行请求/响应验证
"""
from typing import Optional
from pydantic import BaseModel, Field


# ==================== 通用模型 ====================

class Stats(BaseModel):
    """玩家状态数值"""
    hp: int = Field(..., description="生命值")
    san: int = Field(..., description="理智值")
    hunger: int = Field(..., description="饱腹度")


class InventoryItem(BaseModel):
    """背包物品"""
    name: str = Field(..., description="物品名称")
    count: int = Field(..., description="物品数量")


class HistoryEntry(BaseModel):
    """历史记录条目"""
    day: int = Field(..., description="天数")
    log: str = Field(..., description="当天日志")
    event_result: str = Field(default="none", description="事件结果")


class Shelter(BaseModel):
    """避难所（用于AI上下文）"""
    id: str = Field(..., description="避难所ID")
    name: str = Field(..., description="避难所名称")
    price: int = Field(..., description="价格")
    space: int = Field(..., description="提供空间")
    defense: int = Field(..., description="防御等级")
    description: str = Field(..., description="对玩家可见的描述")
    hidden_discription: Optional[str] = Field(default=None, description="对玩家隐藏的描述（仅供AI参考）")


# ==================== Narrate 接口模型 ====================

class NarrateRequest(BaseModel):
    """每日剧情生成请求"""
    day: int = Field(..., description="当前天数")
    stats: Stats = Field(..., description="玩家当前状态")
    inventory: list[InventoryItem] = Field(default_factory=list, description="背包物品列表")
    hidden_tags: list[str] = Field(default_factory=list, description="隐藏标签")
    history: list[HistoryEntry] = Field(default_factory=list, description="历史记录")
    shelter: Optional[Shelter] = Field(default=None, description="避难所信息")


class NarrateResponse(BaseModel):
    """每日剧情生成响应"""
    log_text: str = Field(..., description="今日日志文本")
    has_crisis: bool = Field(..., description="是否有危机事件")
    choices: Optional[list[str]] = Field(default=None, description="选项列表，无危机时为空")


# ==================== Judge 接口模型 ====================

class JudgeRequest(BaseModel):
    """行动判定请求"""
    event_context: str = Field(..., description="当前事件上下文")
    action_content: str = Field(..., description="玩家选择的行动内容")
    stats: Stats = Field(..., description="玩家当前状态")
    inventory: list[InventoryItem] = Field(default_factory=list, description="背包物品列表")
    history: list[HistoryEntry] = Field(default_factory=list, description="历史记录")


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
    hunger: int = Field(default=0, description="饱腹度变化")


class JudgeResponse(BaseModel):
    """行动判定响应"""
    narrative: str = Field(..., description="判定结果叙述")
    score: int = Field(..., ge=0, le=100, description="行动评分 0-100")
    stat_changes: StatChanges = Field(default_factory=StatChanges, description="状态变更")
    item_changes: ItemChanges = Field(default_factory=ItemChanges, description="物品变更")
    new_hidden_tags: list[str] = Field(default_factory=list, description="新增隐藏标签")


# ==================== Ending 接口模型 ====================

class EndingRequest(BaseModel):
    """结局结算请求"""
    days_survived: int = Field(..., description="存活天数")
    high_light_moment: str = Field(default="", description="高光时刻描述")
    final_stats: Stats = Field(..., description="最终状态")
    final_inventory: list[InventoryItem] = Field(default_factory=list, description="最终背包")
    history: list[HistoryEntry] = Field(default_factory=list, description="完整历史记录")


class EndingResponse(BaseModel):
    """结局结算响应"""
    cause_of_death: Optional[str] = Field(default=None, description="死因，通关时为空")
    epithet: str = Field(..., description="四字人设总结词")
    comment: str = Field(..., description="毒舌评语")
    radar_chart: list[int] = Field(..., min_length=5, max_length=5, description="五维雷达图数据")

"""
冰河末世 API 路由

包含：批量剧情生成、行动判定、结局结算
"""
import json
from typing import Optional
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.config import get_settings
from app.llm_service import get_llm_service
from app.prompts.ice_age_narrator import (
    ICE_AGE_NARRATOR_SYSTEM_PROMPT,
    build_ice_age_narrator_prompt
)
from app.prompts.ice_age_judge import (
    ICE_AGE_JUDGE_SYSTEM_PROMPT,
    build_ice_age_judge_prompt
)
from app.prompts.ice_age_ending import (
    ICE_AGE_ENDING_SYSTEM_PROMPT,
    build_ice_age_ending_prompt
)
from app.models import Stats, InventoryItem

router = APIRouter(prefix="/api/ice-age", tags=["ice-age"])

settings = get_settings()


# ==================== 请求模型 ====================

class IceAgeTalent(BaseModel):
    """天赋"""
    id: str
    name: str
    icon: str
    description: str
    hiddenDescription: str


class IceAgeShelter(BaseModel):
    """冰河末世避难所"""
    id: str
    name: str
    price: int
    space: int
    warmth: int
    description: str
    hiddenDescription: str


class IceAgeNarrateRequest(BaseModel):
    """批量生成请求"""
    start_day: int = Field(..., description="开始天数")
    days_to_generate: int = Field(default=5, description="生成天数", ge=1, le=10)
    stats: Stats = Field(..., description="玩家当前状态")
    inventory: list[InventoryItem] = Field(default_factory=list)
    hidden_tags: list[str] = Field(default_factory=list)
    history: list[dict] = Field(default_factory=list)
    shelter: Optional[dict] = None
    talents: Optional[list[dict]] = None


class IceAgeJudgeRequest(BaseModel):
    """行动判定请求"""
    day: int
    temperature: int
    event_context: str
    action_content: str
    stats: dict
    inventory: list[dict] = Field(default_factory=list)
    talents: Optional[list[dict]] = None


class IceAgeEndingRequest(BaseModel):
    """结局请求"""
    days_survived: int
    is_victory: bool
    final_stats: dict
    final_inventory: list[dict] = Field(default_factory=list)
    history: list[dict] = Field(default_factory=list)
    talents: Optional[list[dict]] = None


# ==================== 辅助函数 ====================

def format_sse_event(event_type: str, data: dict) -> str:
    """格式化SSE事件"""
    return f"data: {json.dumps({**data, 'type': event_type}, ensure_ascii=False)}\n\n"


# ==================== 批量叙事接口 ====================

@router.post("/narrate-batch/stream")
async def narrate_batch_stream(request: IceAgeNarrateRequest):
    """
    批量生成多天剧情 - 流式输出
    
    返回JSON格式的多天数据
    """
    llm_service = get_llm_service()
    
    # 构建提示词
    user_prompt = build_ice_age_narrator_prompt(
        start_day=request.start_day,
        days_to_generate=request.days_to_generate,
        stats=request.stats,
        inventory=request.inventory,
        hidden_tags=request.hidden_tags,
        history=request.history,
        shelter=request.shelter,
        talents=request.talents
    )
    
    async def generate():
        try:
            full_text = ""
            async for chunk in llm_service.chat_stream(
                system_prompt=ICE_AGE_NARRATOR_SYSTEM_PROMPT,
                user_prompt=user_prompt,
                temperature=0.8
            ):
                full_text += chunk
                yield format_sse_event("content", {"text": chunk})
            
            yield format_sse_event("done", {"full_text": full_text})
            
        except Exception as e:
            yield format_sse_event("error", {"error": str(e)})
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


# ==================== 判定接口 ====================

@router.post("/judge/stream")
async def judge_stream(request: IceAgeJudgeRequest):
    """
    行动判定 - 流式输出
    """
    llm_service = get_llm_service()
    
    user_prompt = build_ice_age_judge_prompt(
        day=request.day,
        temperature=request.temperature,
        event_context=request.event_context,
        action_content=request.action_content,
        stats=request.stats,
        inventory=request.inventory,
        talents=request.talents
    )
    
    async def generate():
        try:
            full_text = ""
            async for chunk in llm_service.chat_stream(
                system_prompt=ICE_AGE_JUDGE_SYSTEM_PROMPT,
                user_prompt=user_prompt,
                temperature=0.7
            ):
                full_text += chunk
                yield format_sse_event("content", {"text": chunk})
            
            yield format_sse_event("done", {"full_text": full_text})
            
        except Exception as e:
            yield format_sse_event("error", {"error": str(e)})
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


# ==================== 结局接口 ====================

@router.post("/ending")
async def ending(request: IceAgeEndingRequest):
    """
    结局评价 - 非流式
    """
    llm_service = get_llm_service()
    
    user_prompt = build_ice_age_ending_prompt(
        days_survived=request.days_survived,
        is_victory=request.is_victory,
        final_stats=request.final_stats,
        final_inventory=request.final_inventory,
        history=request.history,
        talents=request.talents
    )
    
    try:
        response = await llm_service.chat(
            system_prompt=ICE_AGE_ENDING_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            temperature=0.8
        )
        
        # 尝试解析JSON
        try:
            # 提取JSON部分
            import re
            json_match = re.search(r'\{[\s\S]*\}', response)
            if json_match:
                result = json.loads(json_match.group())
                return result
            else:
                # 返回默认值
                return {
                    "cause_of_death": "未知原因" if not request.is_victory else None,
                    "epithet": "冰原旅人",
                    "comment": response[:100] if response else "你的冰原之旅结束了。",
                    "radar_chart": [5, 5, 5, 5, 5]
                }
        except json.JSONDecodeError:
            return {
                "cause_of_death": "未知原因" if not request.is_victory else None,
                "epithet": "冰原旅人",
                "comment": response[:100] if response else "你的冰原之旅结束了。",
                "radar_chart": [5, 5, 5, 5, 5]
            }
            
    except Exception as e:
        return {
            "cause_of_death": str(e) if not request.is_victory else None,
            "epithet": "系统错误",
            "comment": f"结局生成失败: {str(e)}",
            "radar_chart": [1, 1, 1, 1, 1]
        }

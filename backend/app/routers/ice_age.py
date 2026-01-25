import logging
import json
from typing import Optional
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.config import get_settings
from app.llm_service import get_llm_service
from app.api_logger import log_api_call, format_request_for_log
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

# 配置日志
logger = logging.getLogger(__name__)

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
    logger.info("="*50)
    logger.info("[ICE_AGE/NARRATE] 请求输入:")
    logger.info(f"  开始天数: {request.start_day}")
    logger.info(f"  生成天数: {request.days_to_generate}")
    logger.info(f"  状态: HP={request.stats.hp}, SAN={request.stats.san}")
    
    if not settings.is_production():
         logger.info(f"  背包: {[f'{i.name}x{i.count}' for i in request.inventory]}")

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
    
    # 用于收集完整响应
    full_response_chunks = []
    request_data = format_request_for_log(request)
    
    # 重试配置
    MAX_RETRIES = 3
    
    async def generate():
        for attempt in range(MAX_RETRIES):
            try:
                # 每次重试稍微调整 temperature 增加随机性
                temperature = 0.8 - (attempt * 0.1)  # 0.8, 0.7, 0.6
                
                if attempt > 0:
                    logger.warning(f"[ICE_AGE/NARRATE] 第 {attempt + 1} 次尝试 (temperature={temperature})")
                    yield format_sse_event("retry", {"attempt": attempt + 1, "max_retries": MAX_RETRIES})
                
                full_text = ""
                full_response_chunks.clear()  # 清空之前的尝试
                
                async for chunk in llm_service.chat_stream(
                    system_prompt=ICE_AGE_NARRATOR_SYSTEM_PROMPT,
                    user_prompt=user_prompt,
                    temperature=temperature
                ):
                    full_text += chunk
                    full_response_chunks.append(chunk)
                    yield format_sse_event("content", {"text": chunk})
                
                # 成功完成
                yield format_sse_event("done", {"full_text": full_text})
                
                # 记录日志
                full_response = "".join(full_response_chunks)
                log_api_call("ice-age/narrate-batch", request_data, full_response)
                
                # 打印AI输出摘要（生产环境也显示）
                logger.info(f"[ICE_AGE/NARRATE] AI输出长度: {len(full_response)} 字符")
                logger.info(f"[ICE_AGE/NARRATE] AI输出预览: {full_response}...")
                logger.info("[ICE_AGE/NARRATE] 完成")
                return  # 成功后退出
                
            except Exception as e:
                error_msg = str(e)
                
                # 检查是否是内容安全错误
                is_content_error = "inappropriate content" in error_msg.lower()
                
                # 如果是内容安全错误且还有重试次数
                if is_content_error and attempt < MAX_RETRIES - 1:
                    logger.warning(f"[ICE_AGE/NARRATE] 内容安全检查失败，准备重试 ({attempt + 1}/{MAX_RETRIES})")
                    continue  # 继续下一次重试
                
                # 如果不是内容安全错误，或者已达到最大重试次数
                logger.error(f"[ICE_AGE/NARRATE] 错误: {e}")
                log_api_call("ice-age/narrate-batch", request_data, error=error_msg)
                
                if is_content_error and attempt >= MAX_RETRIES - 1:
                    yield format_sse_event("error", {
                        "error": f"经过 {MAX_RETRIES} 次尝试，仍然遇到内容安全检查。请稍后重试。",
                        "original_error": error_msg
                    })
                else:
                    yield format_sse_event("error", {"error": error_msg})
                return
    
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
    logger.info("="*50)
    logger.info("[ICE_AGE/JUDGE] 请求输入:")
    logger.info(f"  天数: {request.day}")
    logger.info(f"  行动: {request.action_content}")
    
    llm_service = get_llm_service()
    
    import random
    luck_value = random.randint(1, 100)

    user_prompt = build_ice_age_judge_prompt(
        day=request.day,
        temperature=request.temperature,
        event_context=request.event_context,
        action_content=request.action_content,
        stats=request.stats,
        inventory=request.inventory,
        talents=request.talents,
        luck_value=luck_value
    )
    
    full_response_chunks = []
    request_data = format_request_for_log(request)
    request_data['luck_value'] = luck_value # 记录运气值
    
    # 重试配置
    MAX_RETRIES = 3
    
    async def generate():
        for attempt in range(MAX_RETRIES):
            try:
                # 每次重试稍微调整 temperature 增加随机性
                temperature = 0.7 - (attempt * 0.1)  # 0.7, 0.6, 0.5
                
                if attempt > 0:
                    logger.warning(f"[ICE_AGE/JUDGE] 第 {attempt + 1} 次尝试 (temperature={temperature})")
                    yield format_sse_event("retry", {"attempt": attempt + 1, "max_retries": MAX_RETRIES})
                
                full_text = ""
                full_response_chunks.clear()  # 清空之前的尝试
                
                async for chunk in llm_service.chat_stream(
                    system_prompt=ICE_AGE_JUDGE_SYSTEM_PROMPT,
                    user_prompt=user_prompt,
                    temperature=temperature
                ):
                    full_text += chunk
                    full_response_chunks.append(chunk)
                    yield format_sse_event("content", {"text": chunk})
                
                # 成功完成
                yield format_sse_event("done", {"full_text": full_text})
                
                # 记录日志
                full_response = "".join(full_response_chunks)
                log_api_call("ice-age/judge", request_data, full_response)
                
                # 打印AI输出摘要（生产环境也显示）
                logger.info(f"[ICE_AGE/JUDGE] AI输出长度: {len(full_response)} 字符")
                logger.info(f"[ICE_AGE/JUDGE] AI输出预览: {full_response}")
                logger.info("[ICE_AGE/JUDGE] 完成")
                return  # 成功后退出
                
            except Exception as e:
                error_msg = str(e)
                
                # 检查是否是内容安全错误
                is_content_error = "inappropriate content" in error_msg.lower()
                
                # 如果是内容安全错误且还有重试次数
                if is_content_error and attempt < MAX_RETRIES - 1:
                    logger.warning(f"[ICE_AGE/JUDGE] 内容安全检查失败，准备重试 ({attempt + 1}/{MAX_RETRIES})")
                    continue  # 继续下一次重试
                
                # 如果不是内容安全错误，或者已达到最大重试次数
                logger.error(f"[ICE_AGE/JUDGE] 错误: {e}")
                log_api_call("ice-age/judge", request_data, error=error_msg)
                
                if is_content_error and attempt >= MAX_RETRIES - 1:
                    yield format_sse_event("error", {
                        "error": f"经过 {MAX_RETRIES} 次尝试，仍然遇到内容安全检查。请稍后重试。",
                        "original_error": error_msg
                    })
                else:
                    yield format_sse_event("error", {"error": error_msg})
                return
    
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
    logger.info("="*50)
    logger.info("[ICE_AGE/ENDING] 请求输入:")
    logger.info(f"  存活天数: {request.days_survived}")
    logger.info(f"  胜利: {request.is_victory}")
    
    llm_service = get_llm_service()
    request_data = format_request_for_log(request)
    
    user_prompt = build_ice_age_ending_prompt(
        days_survived=request.days_survived,
        is_victory=request.is_victory,
        final_stats=request.final_stats,
        final_inventory=request.final_inventory,
        history=request.history,
        talents=request.talents
    )
    
    try:
        # chat() 方法返回的已经是 dict，无需再次解析
        response = await llm_service.chat(
            system_prompt=ICE_AGE_ENDING_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            temperature=0.8
        )
        
        # 记录日志
        log_api_call("ice-age/ending", request_data, json.dumps(response, ensure_ascii=False))
        
        # 打印AI输出摘要（生产环境也显示）
        response_str = json.dumps(response, ensure_ascii=False)
        logger.info(f"[ICE_AGE/ENDING] AI输出: {response_str}")
        logger.info("[ICE_AGE/ENDING] 完成")
        
        # 验证必需字段
        if isinstance(response, dict):
            # 确保包含所有必需字段
            return {
                "cause_of_death": response.get("cause_of_death"),
                "epithet": response.get("epithet", "冰原旅人"),
                "comment": response.get("comment", "你的冰原之旅结束了。"),
                "radar_chart": response.get("radar_chart", [5, 5, 5, 5, 5])
            }
        else:
            # 如果返回的不是字典，使用默认值
            return {
                "cause_of_death": "未知原因" if not request.is_victory else None,
                "epithet": "冰原旅人",
                "comment": "你的冰原之旅结束了。",
                "radar_chart": [5, 5, 5, 5, 5]
            }
            
    except Exception as e:
        logger.error(f"[ICE_AGE/ENDING] 错误: {e}")
        log_api_call("ice-age/ending", request_data, error=str(e))
        return {
            "cause_of_death": str(e) if not request.is_victory else None,
            "epithet": "系统错误",
            "comment": f"结局生成失败: {str(e)}",
            "radar_chart": [1, 1, 1, 1, 1]
        }

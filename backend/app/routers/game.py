"""
游戏核心API路由
包含：剧情生成、行动判定、结局结算

架构说明（合并叙事与状态更新）：
- Narrator: /narrate/stream - 流式输出叙事内容，末尾包含 <state_update> 标签（无危机时）
- Judge: /judge/stream - 流式输出判定叙事，末尾包含 <state_update> 标签
- 前端从流式输出中解析 <state_update> 标签获取状态更新 JSON
"""
import json
import logging
import re
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

# 配置日志
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

from app.api_logger import log_api_call, format_request_for_log

from app.models import (
    NarrateRequest,
    JudgeRequest,
    EndingRequest, EndingResponse,
)
from app.prompts import (
    NARRATOR_NARRATIVE_SYSTEM_PROMPT,
    build_narrator_prompt,
    JUDGE_NARRATIVE_SYSTEM_PROMPT,
    build_judge_narrative_prompt,
    ENDING_SYSTEM_PROMPT, build_ending_prompt
)
from app.llm_service import get_llm_service

router = APIRouter(prefix="/api/game", tags=["game"])


# ==================== 辅助函数 ====================

def format_sse_event(event_type: str, data: dict) -> str:
    """格式化SSE事件"""
    return f"data: {json.dumps({'type': event_type, **data}, ensure_ascii=False)}\n\n"


def parse_narrative_choices(text: str) -> tuple[str, bool, list[str] | None]:
    """
    从叙事文本中解析危机事件和选项
    
    Returns:
        (log_text, has_crisis, choices)
    """
    # 查找选项分隔符 ---
    if "---" in text:
        parts = text.split("---", 1)
        log_text = parts[0].strip()
        options_text = parts[1].strip() if len(parts) > 1 else ""
        
        # 解析选项 A. B. C. D.
        choices = []
        pattern = r'([A-D])\.\s*(.+?)(?=(?:[A-D]\.|$))'
        matches = re.findall(pattern, options_text, re.DOTALL)
        for letter, content in matches:
            choices.append(f"{letter}. {content.strip()}")
        
        if len(choices) >= 4:
            return log_text, True, choices[:4]
    
    return text.strip(), False, None


# ==================== Narrate 接口 ====================

@router.post("/narrate/stream")
async def narrate_stream(request: NarrateRequest):
    """
    每日剧情生成 - 流式输出叙事内容
    
    AI角色：小说家/旁白
    功能：根据当前状态和历史，流式生成今日日志
    - 无危机事件时：叙事末尾包含 <state_update> 标签
    - 有危机事件时：叙事末尾包含选项和 <hidden> 标签，无 <state_update>
    
    返回：text/event-stream 流式响应（SSE格式）
    事件类型：
    - content: 叙事文本片段
    - done: 流式完成
    - error: 错误信息
    
    前端需要从完整输出中解析 <state_update> 标签获取状态更新 JSON
    """
    logger.info("="*50)
    logger.info("[NARRATE/STREAM] 请求输入:")
    logger.info(f"  天数: {request.day}")
    logger.info(f"  状态: HP={request.stats.hp}, SAN={request.stats.san}")
    if request.shelter:
        logger.info(f"  避难所: {request.shelter.name}")
    logger.info(f"  背包: {[f'{i.name}x{i.count}' for i in request.inventory]}")
    logger.info(f"  隐藏标签: {request.hidden_tags}")
    
    llm = get_llm_service()
    
    # 构建提示词
    user_prompt = build_narrator_prompt(
        day=request.day,
        stats=request.stats,
        inventory=request.inventory,
        hidden_tags=request.hidden_tags,
        history=request.history,
        shelter=request.shelter
    )
    
    logger.info(f"[NARRATE/STREAM] Prompt长度: {len(user_prompt)} 字符")
    
    # 用于收集完整响应的容器
    full_response_chunks = []
    request_data = format_request_for_log(request)
    
    async def generate():
        """SSE流式生成器"""
        try:
            async for chunk in llm.chat_stream(
                system_prompt=NARRATOR_NARRATIVE_SYSTEM_PROMPT,
                user_prompt=user_prompt,
                temperature=0.9,
                role="narrator"
            ):
                full_response_chunks.append(chunk)
                yield format_sse_event("content", {"text": chunk})
            
            # 发送完成信号
            yield format_sse_event("done", {})
            
            # 记录完整响应到日志文件
            full_response = "".join(full_response_chunks)
            log_api_call("narrate/stream", request_data, full_response)
            logger.info("[NARRATE/STREAM] 流式输出完成，已记录到日志文件")
            
        except Exception as e:
            logger.error(f"[NARRATE/STREAM] 流式错误: {e}")
            log_api_call("narrate/stream", request_data, error=str(e))
            yield format_sse_event("error", {"error": str(e)})
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )


# ==================== Judge 接口 ====================

@router.post("/judge/stream")
async def judge_stream(request: JudgeRequest):
    """
    行动判定 - 流式输出判定叙事
    
    AI角色：冷酷裁判/DM
    功能：判定玩家行动的结果，流式输出叙事描述
    叙事末尾包含 <state_update> 标签，包含评分和状态更新 JSON
    
    返回：text/event-stream 流式响应（SSE格式）
    
    前端需要从完整输出中解析 <state_update> 标签获取状态更新 JSON
    """
    logger.info("="*50)
    logger.info("[JUDGE/STREAM] 请求输入:")
    logger.info(f"  天数: {request.day}")
    logger.info(f"  事件上下文: {request.event_context[:100]}...")
    logger.info(f"  玩家行动: {request.action_content}")
    logger.info(f"  状态: HP={request.stats.hp}, SAN={request.stats.san}")
    logger.info(f"  背包: {[f'{i.name}x{i.count}' for i in request.inventory]}")
    logger.info(f"  历史记录条数: {len(request.history)}")
    
    llm = get_llm_service()
    
    # 构建提示词
    user_prompt = build_judge_narrative_prompt(
        day=request.day,
        event_context=request.event_context,
        action_content=request.action_content,
        stats=request.stats,
        inventory=request.inventory,
        history=request.history
    )
    
    # 用于收集完整响应的容器
    full_response_chunks = []
    request_data = format_request_for_log(request)
    
    async def generate():
        """SSE流式生成器"""
        try:
            async for chunk in llm.chat_stream(
                system_prompt=JUDGE_NARRATIVE_SYSTEM_PROMPT,
                user_prompt=user_prompt,
                temperature=0.8,
                role="judge"
            ):
                full_response_chunks.append(chunk)
                yield format_sse_event("content", {"text": chunk})
            
            yield format_sse_event("done", {})
            
            # 记录完整响应到日志文件
            full_response = "".join(full_response_chunks)
            log_api_call("judge/stream", request_data, full_response)
            logger.info("[JUDGE/STREAM] 流式输出完成，已记录到日志文件")
            
        except Exception as e:
            logger.error(f"[JUDGE/STREAM] 流式错误: {e}")
            log_api_call("judge/stream", request_data, error=str(e))
            yield format_sse_event("error", {"error": str(e)})
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )


# ==================== Ending 接口 ====================

@router.post("/ending", response_model=EndingResponse)
async def ending(request: EndingRequest) -> EndingResponse:
    """
    结局结算接口
    
    AI角色：毒舌评论员/算命师
    功能：生成人设词、死因、评语和雷达图
    """
    # 打印请求日志
    logger.info("="*50)
    logger.info("[ENDING] 请求输入:")
    logger.info(f"  存活天数: {request.days_survived}")
    logger.info(f"  高光时刻: {request.high_light_moment}")
    logger.info(f"  最终状态: HP={request.final_stats.hp}, SAN={request.final_stats.san}")
    logger.info(f"  最终背包: {[f'{i.name}x{i.count}' for i in request.final_inventory]}")
    
    request_data = format_request_for_log(request)
    
    try:
        llm = get_llm_service()
        
        # 构建提示词
        user_prompt = build_ending_prompt(
            days_survived=request.days_survived,
            high_light_moment=request.high_light_moment,
            final_stats=request.final_stats,
            final_inventory=request.final_inventory,
            history=request.history
        )
        
        # 调用LLM
        result = await llm.chat_json(
            system_prompt=ENDING_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            temperature=0.9,  # 高创意度，让评语更有趣
            role="ending"
        )
        
        # 打印响应日志
        logger.info("[ENDING] LLM响应:")
        logger.info(f"  cause_of_death: {result.get('cause_of_death')}")
        logger.info(f"  epithet: {result.get('epithet')}")
        logger.info(f"  comment: {result.get('comment')}")
        logger.info(f"  radar_chart: {result.get('radar_chart')}")
        logger.info("="*50)
        
        # 确保雷达图数据有效
        radar_chart = result.get("radar_chart", [5, 5, 5, 5, 5])
        if len(radar_chart) != 5:
            radar_chart = [5, 5, 5, 5, 5]
        # 确保每个值在0-10范围内
        radar_chart = [max(0, min(10, v)) for v in radar_chart]
        
        # 记录到日志文件
        log_api_call("ending", request_data, result)
        
        return EndingResponse(
            cause_of_death=result.get("cause_of_death"),
            epithet=result.get("epithet", "末日幸存者"),
            comment=result.get("comment", "你的末日之旅结束了。"),
            radar_chart=radar_chart
        )
        
    except Exception as e:
        logger.error(f"[ENDING] 错误: {e}")
        log_api_call("ending", request_data, error=str(e))
        raise HTTPException(status_code=500, detail=f"结局生成失败: {str(e)}")

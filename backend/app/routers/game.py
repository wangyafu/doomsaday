"""
游戏核心API路由
包含：剧情生成、行动判定、结局结算

架构说明（拆分叙事和状态更新）：
- Narrator:
  1. /narrate/stream - 流式输出叙事内容（保持AI创造力）
  2. /narrate/state - JSON输出状态更新（确保结构正确）
- Judge:
  1. /judge/stream - 流式输出判定叙事（保持AI创造力）
  2. /judge/state - JSON输出状态更新（确保结构正确）
"""
import json
import logging
import re
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

# 配置日志
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

from app.models import (
    NarrateRequest, NarrateStateRequest, NarrateStateResponse,
    JudgeRequest, JudgeStateRequest, JudgeStateResponse,
    EndingRequest, EndingResponse,
    StatChanges, ItemChanges, ItemChange
)
from app.prompts import (
    NARRATOR_NARRATIVE_SYSTEM_PROMPT, NARRATOR_STATE_SYSTEM_PROMPT,
    build_narrator_prompt, build_narrator_state_prompt,
    JUDGE_NARRATIVE_SYSTEM_PROMPT, JUDGE_STATE_SYSTEM_PROMPT,
    build_judge_narrative_prompt, build_judge_state_prompt,
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


# ==================== Narrate 新版接口（两步分离） ====================

@router.post("/narrate/stream")
async def narrate_stream(request: NarrateRequest):
    """
    每日剧情生成 - 第一步：流式输出叙事内容
    
    AI角色：小说家/旁白
    功能：根据当前状态和历史，流式生成今日日志（包含选项如果有的话）
    
    返回：text/event-stream 流式响应（SSE格式）
    事件类型：
    - content: 叙事文本片段
    - done: 流式完成
    - error: 错误信息
    """
    logger.info("="*50)
    logger.info("[NARRATE/STREAM] 请求输入:")
    logger.info(f"  天数: {request.day}")
    logger.info(f"  状态: HP={request.stats.hp}, SAN={request.stats.san}, HUNGER={request.stats.hunger}")
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
    
    async def generate():
        """SSE流式生成器"""
        try:
            async for chunk in llm.chat_stream(
                system_prompt=NARRATOR_NARRATIVE_SYSTEM_PROMPT,
                user_prompt=user_prompt,
                temperature=0.9
            ):
                yield format_sse_event("content", {"text": chunk})
            
            # 发送完成信号
            yield format_sse_event("done", {})
            logger.info("[NARRATE/STREAM] 流式输出完成")
            
        except Exception as e:
            logger.error(f"[NARRATE/STREAM] 流式错误: {e}")
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


@router.post("/narrate/state", response_model=NarrateStateResponse)
async def narrate_state(request: NarrateStateRequest) -> NarrateStateResponse:
    """
    每日剧情生成 - 第二步：计算状态更新（仅在无危机事件时调用）
    
    功能：根据叙事内容计算状态和物品变化
    
    注意：如果当日有危机事件，前端不应调用此接口，状态更新应在 Judge 之后进行
    
    参数：
        request.day: 当前天数
        request.stats: 玩家当前状态
        request.inventory: 背包物品
        request.hidden_tags: 隐藏标签
        request.history: 完整历史记录
        request.narrative_context: 第一步流式输出的完整叙事文本（本回合 /narrate/stream 的输出）
    
    返回：JSON格式的状态更新
    """
    logger.info("="*50)
    logger.info("[NARRATE/STATE] 请求输入:")
    logger.info(f"  天数: {request.day}")
    logger.info(f"  历史记录条数: {len(request.history)}")
    logger.info(f"  隐藏标签: {request.hidden_tags}")
    logger.info(f"  叙事文本长度: {len(request.narrative_context)} 字符")
    
    try:
        llm = get_llm_service()
        
        # 构建状态更新提示词
        user_prompt = build_narrator_state_prompt(
            day=request.day,
            stats=request.stats,
            inventory=request.inventory,
            hidden_tags=request.hidden_tags,
            history=request.history,
            narrative_context=request.narrative_context
        )
        
        # 调用LLM（JSON模式）
        result = await llm.chat_json(
            system_prompt=NARRATOR_STATE_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            temperature=0.3
        )
        
        logger.info("[NARRATE/STATE] LLM响应:")
        logger.info(f"  stat_changes: {result.get('stat_changes')}")
        logger.info(f"  item_changes: {result.get('item_changes')}")
        logger.info(f"  new_hidden_tags: {result.get('new_hidden_tags')}")
        logger.info("="*50)
        
        # 解析状态变化
        stat_changes_data = result.get("stat_changes", {})
        stat_changes = StatChanges(
            hp=stat_changes_data.get("hp", 0),
            san=stat_changes_data.get("san", 0),
            hunger=stat_changes_data.get("hunger", -10)  # 默认每天消耗10饱腹度
        )
        
        # 解析物品变化
        item_changes_data = result.get("item_changes", {})
        item_changes = ItemChanges(
            remove=[ItemChange(**item) for item in item_changes_data.get("remove", [])],
            add=[ItemChange(**item) for item in item_changes_data.get("add", [])]
        )
        
        return NarrateStateResponse(
            stat_changes=stat_changes,
            item_changes=item_changes,
            new_hidden_tags=result.get("new_hidden_tags", [])
        )
        
    except Exception as e:
        import traceback
        logger.error(f"[NARRATE/STATE] 错误: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"状态更新失败: {str(e)}")


# ==================== Judge 接口（两步分离） ====================

@router.post("/judge/stream")
async def judge_stream(request: JudgeRequest):
    """
    行动判定 - 第一步：流式输出判定叙事
    
    AI角色：冷酷裁判/DM
    功能：判定玩家行动的结果，流式输出叙事描述
    
    返回：text/event-stream 流式响应（SSE格式）
    """
    logger.info("="*50)
    logger.info("[JUDGE/STREAM] 请求输入:")
    logger.info(f"  天数: {request.day}")
    logger.info(f"  事件上下文: {request.event_context[:100]}...")
    logger.info(f"  玩家行动: {request.action_content}")
    logger.info(f"  状态: HP={request.stats.hp}, SAN={request.stats.san}, HUNGER={request.stats.hunger}")
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
    
    async def generate():
        """SSE流式生成器"""
        try:
            async for chunk in llm.chat_stream(
                system_prompt=JUDGE_NARRATIVE_SYSTEM_PROMPT,
                user_prompt=user_prompt,
                temperature=0.8
            ):
                yield format_sse_event("content", {"text": chunk})
            
            yield format_sse_event("done", {})
            logger.info("[JUDGE/STREAM] 流式输出完成")
            
        except Exception as e:
            logger.error(f"[JUDGE/STREAM] 流式错误: {e}")
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


@router.post("/judge/state", response_model=JudgeStateResponse)
async def judge_state(request: JudgeStateRequest) -> JudgeStateResponse:
    """
    行动判定 - 第二步：计算状态更新
    
    功能：根据判定叙事计算状态和物品变化，给出评分
    
    参数：
        request.day: 当前天数
        request.event_context: 事件上下文（本回合 /narrate/stream 的输出）
        request.action_content: 玩家行动
        request.narrative_result: 第一步流式输出的判定叙事（本回合 /judge/stream 的输出）
        request.stats: 玩家当前状态
        request.inventory: 背包物品
        request.hidden_tags: 隐藏标签
        request.history: 完整历史记录
    
    返回：JSON格式的状态更新和评分
    """
    logger.info("="*50)
    logger.info("[JUDGE/STATE] 请求输入:")
    logger.info(f"  天数: {request.day}")
    logger.info(f"  历史记录条数: {len(request.history)}")
    logger.info(f"  隐藏标签: {request.hidden_tags}")
    logger.info(f"  判定叙事长度: {len(request.narrative_result)} 字符")
    logger.info(f"  玩家行动: {request.action_content}")
    
    try:
        llm = get_llm_service()
        
        # 构建状态更新提示词
        user_prompt = build_judge_state_prompt(
            day=request.day,
            event_context=request.event_context,
            action_content=request.action_content,
            narrative_result=request.narrative_result,
            stats=request.stats,
            inventory=request.inventory,
            hidden_tags=request.hidden_tags,
            history=request.history
        )
        
        # 调用LLM（JSON模式）
        result = await llm.chat_json(
            system_prompt=JUDGE_STATE_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            temperature=0.3
        )
        
        logger.info("[JUDGE/STATE] LLM响应:")
        logger.info(f"  score: {result.get('score')}")
        logger.info(f"  stat_changes: {result.get('stat_changes')}")
        logger.info(f"  item_changes: {result.get('item_changes')}")
        logger.info(f"  new_hidden_tags: {result.get('new_hidden_tags')}")
        logger.info("="*50)
        
        # 解析状态变化
        stat_changes_data = result.get("stat_changes", {})
        stat_changes = StatChanges(
            hp=stat_changes_data.get("hp", 0),
            san=stat_changes_data.get("san", 0),
            hunger=stat_changes_data.get("hunger", 0)
        )
        
        # 解析物品变化
        item_changes_data = result.get("item_changes", {})
        item_changes = ItemChanges(
            remove=[ItemChange(**item) for item in item_changes_data.get("remove", [])],
            add=[ItemChange(**item) for item in item_changes_data.get("add", [])]
        )
        
        return JudgeStateResponse(
            score=result.get("score", 50),
            stat_changes=stat_changes,
            item_changes=item_changes,
            new_hidden_tags=result.get("new_hidden_tags", [])
        )
        
    except Exception as e:
        import traceback
        logger.error(f"[JUDGE/STATE] 错误: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"状态更新失败: {str(e)}")


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
    logger.info(f"  最终状态: HP={request.final_stats.hp}, SAN={request.final_stats.san}, HUNGER={request.final_stats.hunger}")
    logger.info(f"  最终背包: {[f'{i.name}x{i.count}' for i in request.final_inventory]}")
    
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
        result = await llm.chat(
            system_prompt=ENDING_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            temperature=0.9  # 高创意度，让评语更有趣
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
        
        return EndingResponse(
            cause_of_death=result.get("cause_of_death"),
            epithet=result.get("epithet", "末日幸存者"),
            comment=result.get("comment", "你的末日之旅结束了。"),
            radar_chart=radar_chart
        )
        
    except Exception as e:
        logger.error(f"[ENDING] 错误: {e}")
        raise HTTPException(status_code=500, detail=f"结局生成失败: {str(e)}")

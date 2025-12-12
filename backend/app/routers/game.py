"""
游戏核心API路由
包含：剧情生成、行动判定、结局结算
"""
import logging
from fastapi import APIRouter, HTTPException

# 配置日志
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

from app.models import (
    NarrateRequest, NarrateResponse,
    JudgeRequest, JudgeResponse,
    EndingRequest, EndingResponse,
    StatChanges, ItemChanges, ItemChange
)
from app.prompts import (
    NARRATOR_SYSTEM_PROMPT, build_narrator_prompt,
    JUDGE_SYSTEM_PROMPT, build_judge_prompt,
    ENDING_SYSTEM_PROMPT, build_ending_prompt
)
from app.llm_service import get_llm_service

router = APIRouter(prefix="/api/game", tags=["game"])


@router.post("/narrate", response_model=NarrateResponse)
async def narrate(request: NarrateRequest) -> NarrateResponse:
    """
    每日剧情生成接口
    
    AI角色：小说家/旁白
    功能：根据当前状态和历史，生成今日日志和可能的选项
    """
    # 打印请求日志
    logger.info("="*50)
    logger.info("[NARRATE] 请求输入:")
    logger.info(f"  天数: {request.day}")
    logger.info(f"  状态: HP={request.stats.hp}, SAN={request.stats.san}, HUNGER={request.stats.hunger}")
    if request.shelter is None:
        logger.info("  避难所: 无")
    else:
        logger.info(
            f"  避难所: {request.shelter.name} (id={request.shelter.id}, defense={request.shelter.defense}, space={request.shelter.space})"
        )
    logger.info(f"  背包: {[f'{i.name}x{i.count}' for i in request.inventory]}")
    logger.info(f"  隐藏标签: {request.hidden_tags}")
    logger.info(f"  历史天数: {len(request.history)}")
    
    try:
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
        
        logger.info(f"[NARRATE] Prompt长度: {len(user_prompt)} 字符")
        
        # 调用LLM
        result = await llm.chat(
            system_prompt=NARRATOR_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            temperature=0.85  # 稍高的创意度，让剧情更丰富
        )
        
        # 打印响应日志
        logger.info("[NARRATE] LLM响应:")
        logger.info(f"  log_text: {result.get('log_text', '')[:100]}...")
        logger.info(f"  has_crisis: {result.get('has_crisis')}")
        logger.info(f"  choices: {result.get('choices')}")
        logger.info("="*50)
        
        # 解析响应
        return NarrateResponse(
            log_text=result.get("log_text", "今天平安无事..."),
            has_crisis=result.get("has_crisis", False),
            choices=result.get("choices") if result.get("has_crisis") else None
        )
        
    except Exception as e:
        import traceback
        logger.error(f"[NARRATE] 错误: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"剧情生成失败: {str(e)}")


@router.post("/judge", response_model=JudgeResponse)
async def judge(request: JudgeRequest) -> JudgeResponse:
    """
    行动判定接口
    
    AI角色：冷酷裁判/DM
    功能：判定玩家行动的结果，计算状态和物品变化
    """
    # 打印请求日志
    logger.info("="*50)
    logger.info("[JUDGE] 请求输入:")
    logger.info(f"  事件上下文: {request.event_context[:100]}...")
    logger.info(f"  玩家行动: {request.action_content}")
    logger.info(f"  状态: HP={request.stats.hp}, SAN={request.stats.san}, HUNGER={request.stats.hunger}")
    logger.info(f"  背包: {[f'{i.name}x{i.count}' for i in request.inventory]}")
    
    try:
        llm = get_llm_service()
        
        # 构建提示词
        user_prompt = build_judge_prompt(
            event_context=request.event_context,
            action_content=request.action_content,
            stats=request.stats,
            inventory=request.inventory,
            history=request.history
        )
        
        # 调用LLM
        result = await llm.chat(
            system_prompt=JUDGE_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            temperature=0.7  # 稍低的创意度，保证判定合理性
        )
        
        # 打印响应日志
        logger.info("[JUDGE] LLM响应:")
        logger.info(f"  narrative: {result.get('narrative', '')[:100]}...")
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
        
        return JudgeResponse(
            narrative=result.get("narrative", "行动完成。"),
            score=result.get("score", 50),
            stat_changes=stat_changes,
            item_changes=item_changes,
            new_hidden_tags=result.get("new_hidden_tags", [])
        )
        
    except Exception as e:
        logger.error(f"[JUDGE] 错误: {e}")
        raise HTTPException(status_code=500, detail=f"行动判定失败: {str(e)}")


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

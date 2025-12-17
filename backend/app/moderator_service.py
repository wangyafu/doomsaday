"""
内容审核服务模块 - 过滤用户输入中的违规内容

使用轻量级模型快速判定用户输入是否包含：
- 色情内容
- 暴力血腥内容
- 其他不适宜内容
"""
import logging
from app.llm_service import get_llm_service

logger = logging.getLogger(__name__)


class ModerationResult:
    """审核结果"""
    
    def __init__(self, is_safe: bool, reason: str = ""):
        self.is_safe = is_safe  # True表示内容安全，False表示违规
        self.reason = reason    # 违规原因


class ModeratorService:
    """内容审核服务"""
    
    def __init__(self):
        self.llm_service = get_llm_service()
        
        # 审核系统提示词
        self.system_prompt = """你是一个内容安全审核助手。你的任务是判断用户输入是否包含不适宜的内容。

需要拒绝的内容类型：
1. 色情、性暗示内容
2. 极端暴力、血腥、虐待内容
3. 仇恨言论、歧视性内容
4. 带有明显政治色彩且不符合社会主义核心价值观内容

注意：
- 本游戏是末世生存题材，允许适度的暴力描写（如丧尸、战斗、受伤等）
- 允许正常的情感表达和人际关系描写
- 只拒绝明显违规的内容

请以JSON格式返回审核结果：
{
    "is_safe": true/false,
    "reason": "违规原因（如果is_safe为false）"
}"""
    
    async def check_content(self, user_input: str) -> ModerationResult:
        """
        检查用户输入是否安全
        
        Args:
            user_input: 用户输入的文本
            
        Returns:
            ModerationResult: 审核结果
        """
        # 空输入直接通过
        if not user_input or not user_input.strip():
            return ModerationResult(is_safe=True)
        
        try:
            # 构建用户提示词
            user_prompt = f"""请审核以下用户输入：

用户输入：
<user_input>{user_input}</user_input>

请判断这段内容是否安全，并以JSON格式返回结果。"""
            
            # 调用LLM进行审核（使用moderator角色配置）
            result = await self.llm_service.chat_json(
                system_prompt=self.system_prompt,
                user_prompt=user_prompt,
                temperature=0.3,  # 使用较低的温度以获得更稳定的判断
                role="moderator"
            )
            
            is_safe = result.get("is_safe", True)
            reason = result.get("reason", "")
            
            # 记录审核结果
            if not is_safe:
                logger.warning(f"内容审核未通过 - 原因: {reason} - 输入: {user_input[:100]}")
            
            return ModerationResult(is_safe=is_safe, reason=reason)
            
        except Exception as e:
            # 审核服务出错时，默认放行（避免影响用户体验）
            logger.error(f"内容审核服务异常: {e}")
            return ModerationResult(is_safe=True)


# 全局单例
_moderator_service: ModeratorService | None = None


def get_moderator_service() -> ModeratorService:
    """获取内容审核服务单例"""
    global _moderator_service
    if _moderator_service is None:
        _moderator_service = ModeratorService()
    return _moderator_service

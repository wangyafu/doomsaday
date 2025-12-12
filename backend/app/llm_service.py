"""
LLM 服务模块 - 封装 OpenAI API 调用
"""
import json
from openai import AsyncOpenAI
from app.config import get_settings


class LLMService:
    """大模型服务封装"""
    
    def __init__(self):
        self.settings = get_settings()
        self.model = self.settings.openai_model
    
    def _get_client(self) -> AsyncOpenAI:
        """每次请求创建新的客户端，避免状态问题"""
        return AsyncOpenAI(
            api_key=self.settings.openai_api_key,
            base_url=self.settings.openai_base_url
        )
    
    async def chat(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 1.0
    ) -> dict:
        """
        发送聊天请求并解析JSON响应
        
        Args:
            system_prompt: 系统提示词，定义AI角色
            user_prompt: 用户提示词，包含上下文
            temperature: 创意度，0-1
            
        Returns:
            解析后的JSON字典
        """
        client = self._get_client()
        response = await client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=temperature,
            response_format={"type": "json_object"}  # 强制JSON输出
        )
        
        content = response.choices[0].message.content
        return json.loads(content)


# 全局单例
_llm_service: LLMService | None = None


def get_llm_service() -> LLMService:
    """获取LLM服务单例"""
    global _llm_service
    if _llm_service is None:
        _llm_service = LLMService()
    return _llm_service

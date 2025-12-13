"""
LLM 服务模块 - 封装 OpenAI API 调用

支持两种输出模式：
1. chat_stream(): 流式输出，用于叙事内容，保持AI创造力
2. chat_json(): JSON模式输出，用于状态更新，确保结构正确
"""
import json
from typing import AsyncGenerator
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
    
    async def chat_stream(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 1.0
    ) -> AsyncGenerator[str, None]:
        """
        流式输出，用于叙事内容
        
        Args:
            system_prompt: 系统提示词，定义AI角色
            user_prompt: 用户提示词，包含上下文
            temperature: 创意度，0-2
            
        Yields:
            逐块返回的文本内容
        """
        client = self._get_client()
        stream = await client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=temperature,
            stream=True
        )
        
        async for chunk in stream:
            if chunk.choices and chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content
    
    async def chat_json(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.7
    ) -> dict:
        """
        JSON模式输出，用于状态更新
        
        Args:
            system_prompt: 系统提示词，定义AI角色
            user_prompt: 用户提示词，包含上下文
            temperature: 创意度，0-2
            
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
            response_format={"type": "json_object"}
        )
        
        content = response.choices[0].message.content
        return json.loads(content)
    
    # 保留旧方法名作为别名，兼容现有代码
    async def chat(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 1.0
    ) -> dict:
        """
        [已废弃] 请使用 chat_json() 代替
        保留此方法以兼容现有代码
        """
        return await self.chat_json(system_prompt, user_prompt, temperature)


# 全局单例
_llm_service: LLMService | None = None


def get_llm_service() -> LLMService:
    """获取LLM服务单例"""
    global _llm_service
    if _llm_service is None:
        _llm_service = LLMService()
    return _llm_service

"""
LLM 服务模块 - 封装 OpenAI API 调用

支持两种输出模式：
1. chat_stream(): 流式输出，用于叙事内容，保持AI创造力
2. chat_json(): JSON模式输出，用于状态更新，确保结构正确
"""
import json
from datetime import datetime
from pathlib import Path
from typing import AsyncGenerator
from openai import AsyncOpenAI
from app.config import get_settings


class LLMService:
    """大模型服务封装"""
    
    def __init__(self):
        self.settings = get_settings()
        # 默认使用通用配置
        self.default_model = self.settings.openai_model
    
    def _get_client(self, role: str | None = None) -> tuple[AsyncOpenAI, str]:
        """
        创建客户端并返回对应的模型名称
        
        Args:
            role: 角色名称（narrator/judge/ending），如果为None则使用通用配置
            
        Returns:
            (client, model) 二元组
        """
        if role:
            api_key, base_url, model = self.settings.get_model_config(role)
        else:
            api_key = self.settings.openai_api_key
            base_url = self.settings.openai_base_url
            model = self.default_model
        
        client = AsyncOpenAI(
            api_key=api_key,
            base_url=base_url
        )
        return client, model

    def _save_context(self, role: str | None, system_prompt: str, user_prompt: str) -> None:
        """
        在开发环境下保存请求上下文到文件
        """
        if self.settings.is_production():
            return

        try:
            # 确保日志目录存在
            log_dir = Path("logs/llm_context")
            log_dir.mkdir(parents=True, exist_ok=True)

            # 生成文件名: YYYYMMDD_HHMMSS_role.txt
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
            role_name = role or "default"
            filename = f"{timestamp}_{role_name}.txt"
            file_path = log_dir / filename

            # 写入内容
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(f"=== Role: {role_name} ===\n")
                f.write(f"=== Timestamp: {datetime.now().isoformat()} ===\n\n")
                f.write("--- SYSTEM PROMPT ---\n")
                f.write(system_prompt)
                f.write("\n\n--- USER PROMPT ---\n")
                f.write(user_prompt)
                f.write("\n")
        except Exception as e:
            # 记录错误但不中断请求
            print(f"[LLMService] 保存上下文失败: {e}")
    
    async def chat_stream(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 1.0,
        role: str | None = None
    ) -> AsyncGenerator[str, None]:
        """
        流式输出，用于叙事内容
        
        Args:
            system_prompt: 系统提示词，定义AI角色
            user_prompt: 用户提示词，包含上下文
            temperature: 创意度，0-2
            role: 角色名称（narrator/judge/ending），用于选择对应的模型配置
            
        Yields:
            逐块返回的文本内容
        """
        self._save_context(role, system_prompt, user_prompt)
        client, model = self._get_client(role)
        stream = await client.chat.completions.create(
            model=model,
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
        temperature: float = 0.7,
        role: str | None = None
    ) -> dict:
        """
        JSON模式输出，用于状态更新
        
        Args:
            system_prompt: 系统提示词，定义AI角色
            user_prompt: 用户提示词，包含上下文
            temperature: 创意度，0-2
            role: 角色名称（narrator/judge/ending），用于选择对应的模型配置
            
        Returns:
            解析后的JSON字典
            
        Raises:
            ValueError: 当LLM返回空内容或无效JSON时
        """
        self._save_context(role, system_prompt, user_prompt)
        client, model = self._get_client(role)
        response = await client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=temperature,
            response_format={"type": "json_object"}
        )
        
        # 检查响应是否有效
        if not response.choices:
            raise ValueError("LLM返回了空的choices列表")
        
        content = response.choices[0].message.content
        
        # 检查内容是否为空
        if not content or not content.strip():
            # 检查是否被内容审核拒绝
            finish_reason = response.choices[0].finish_reason
            if finish_reason == "content_filter":
                raise ValueError("内容被安全过滤器拒绝，请调整提示词")
            raise ValueError(f"LLM返回了空内容，finish_reason: {finish_reason}")
        
        # 清理并解析JSON
        try:
            return self._parse_json_content(content)
        except json.JSONDecodeError as e:
            # 记录原始内容便于调试
            raise ValueError(f"JSON解析失败: {e}\n原始内容: {content[:500]}")
    
    def _parse_json_content(self, content: str) -> dict:
        """
        清理并解析JSON内容
        处理常见的LLM输出问题：前导逗号、代码块标记等
        """
        text = content.strip()
        
        # 移除可能的 markdown 代码块标记
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
        
        # 移除前导逗号（某些模型的常见问题）
        if text.startswith(","):
            text = text[1:].strip()
        
        # 尝试找到JSON对象的起始位置
        start_idx = text.find("{")
        if start_idx > 0:
            text = text[start_idx:]
        
        # 尝试找到JSON对象的结束位置（处理尾部多余内容）
        # 使用简单的括号匹配
        brace_count = 0
        end_idx = -1
        for i, char in enumerate(text):
            if char == "{":
                brace_count += 1
            elif char == "}":
                brace_count -= 1
                if brace_count == 0:
                    end_idx = i + 1
                    break
        
        if end_idx > 0:
            text = text[:end_idx]
        
        return json.loads(text)
    
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

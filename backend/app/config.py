"""
应用配置模块
"""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """应用配置，从环境变量读取"""
    
    # OpenAI 通用配置（默认配置）
    openai_api_key: str = ""
    openai_base_url: str = "https://api.openai.com/v1"
    openai_model: str = "gpt-4o-mini"
    
    # Narrator（叙事者）专用配置
    narrator_api_key: str = ""
    narrator_base_url: str = ""
    narrator_model: str = ""
    
    # Judge（裁判）专用配置
    judge_api_key: str = ""
    judge_base_url: str = ""
    judge_model: str = ""
    
    # Ending（结局评论员）专用配置
    ending_api_key: str = ""
    ending_base_url: str = ""
    ending_model: str = ""
    
    # Moderator（内容审核）专用配置
    moderator_api_key: str = ""
    moderator_base_url: str = ""
    moderator_model: str = ""
    
    # 应用配置
    debug: bool = False
    environment: str = "development"  # development 或 production
    
    # 流量控制配置
    MAX_PUBLIC_USERS: int = 5
    SESSION_TIMEOUT_SECONDS: int = 600
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
    
    def is_production(self) -> bool:
        """判断是否为生产环境"""
        return self.environment.lower() == "production"
    
    def get_model_config(self, role: str) -> tuple[str, str, str]:
        """
        获取指定角色的模型配置
        
        Args:
            role: 角色名称，可选值：narrator, judge, ending, moderator
            
        Returns:
            (api_key, base_url, model) 三元组
            如果角色没有专用配置，则返回通用配置
        """
        role = role.lower()
        
        if role == "narrator":
            api_key = self.narrator_api_key or self.openai_api_key
            base_url = self.narrator_base_url or self.openai_base_url
            model = self.narrator_model or self.openai_model
        elif role == "judge":
            api_key = self.judge_api_key or self.openai_api_key
            base_url = self.judge_base_url or self.openai_base_url
            model = self.judge_model or self.openai_model
        elif role == "ending":
            api_key = self.ending_api_key or self.openai_api_key
            base_url = self.ending_base_url or self.openai_base_url
            model = self.ending_model or self.openai_model
        elif role == "moderator":
            api_key = self.moderator_api_key or self.openai_api_key
            base_url = self.moderator_base_url or self.openai_base_url
            model = self.moderator_model or self.openai_model
        else:
            # 未知角色，使用通用配置
            api_key = self.openai_api_key
            base_url = self.openai_base_url
            model = self.openai_model
        
        return api_key, base_url, model


@lru_cache()
def get_settings() -> Settings:
    """获取配置单例"""
    return Settings()
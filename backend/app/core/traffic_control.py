"""
流量控制模块
用于限制并发用户数，并支持 Access Code 绕过限制
"""
import time
import uuid
import logging
from typing import Dict, Literal

from app.config import get_settings

logger = logging.getLogger(__name__)

class SessionData:
    def __init__(self, session_type: Literal["public", "vip"]):
        self.type = session_type
        self.created_at = time.time()
        self.last_active = time.time()

class TrafficController:
    _instance = None
    _sessions: Dict[str, SessionData] = {}
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(TrafficController, cls).__new__(cls)
        return cls._instance
    
    @property
    def sessions(self) -> Dict[str, SessionData]:
        return self._sessions
    
    @property
    def public_count(self) -> int:
        """当前在线的公开用户数量"""
        # 先清理过期会话，确保计数准确
        self.cleanup()
        return sum(1 for s in self._sessions.values() if s.type == "public")
    
    def try_join(self) -> str:
        """
        尝试加入游戏
        
        Returns:
            token: 会话令牌
            
        Raises:
            ValueError: 如果公共名额已满
        """
        settings = get_settings()
        self.cleanup()
            
        # 尝试以公开用户身份加入
        if self.public_count < settings.MAX_PUBLIC_USERS:
            token = str(uuid.uuid4())
            self._sessions[token] = SessionData(session_type="public")
            logger.info(f"[Traffic] 公开用户加入: {token[:8]} (当前在线: {self.public_count}/{settings.MAX_PUBLIC_USERS})")
            return token
            
        # 名额已满
        raise ValueError("服务器爆满，请稍后重试")
    
    def verify_session(self, token: str) -> bool:
        """
        验证会话是否有效，并刷新活跃时间
        """
        if not token:
            return False
            
        session = self._sessions.get(token)
        if not session:
            return False
            
        # 检查是否超时
        settings = get_settings()
        if time.time() - session.last_active > settings.SESSION_TIMEOUT_SECONDS:
            logger.info(f"[Traffic] 会话超时移除: {token[:8]}")
            del self._sessions[token]
            return False
            
        # 刷新活跃时间
        session.last_active = time.time()
        return True
    
    def cleanup(self):
        """清理过期会话"""
        settings = get_settings()
        now = time.time()
        expired_tokens = [
            token for token, session in self._sessions.items()
            if now - session.last_active > settings.SESSION_TIMEOUT_SECONDS
        ]
        
        for token in expired_tokens:
            del self._sessions[token]
            
        if expired_tokens:
            logger.info(f"[Traffic] 清理了 {len(expired_tokens)} 个过期会话")

    def reset(self):
        """重置所有会话（仅用于测试）"""
        self._sessions.clear()

# 全局单例
traffic_controller = TrafficController()

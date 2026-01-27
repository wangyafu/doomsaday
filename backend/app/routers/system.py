from fastapi import APIRouter
from app.core.traffic_control import traffic_controller
from app.config import get_settings

router = APIRouter(prefix="/api/system", tags=["System"])

@router.get("/users")
async def get_user_status():
    """
    返回当前系统的用户限制和活跃用户数
    """
    settings = get_settings()
    
    # 触发一次清理，确保数据准确
    traffic_controller.cleanup()
    
    return {
        "max_users": settings.MAX_PUBLIC_USERS,
        "active_users": traffic_controller.public_count,
        "status": "ready" if traffic_controller.public_count < settings.MAX_PUBLIC_USERS else "full"
    }

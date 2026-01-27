"""
末世模拟器后端 - FastAPI 主应用入口
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import game, archive, ice_age, system

# 创建应用实例
app = FastAPI(
    title="末世模拟器 API",
    description="丧尸围城篇 - AI驱动的文字生存游戏后端",
    version="1.0.0"
)

# 配置CORS（允许前端跨域访问）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境应限制具体域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(game.router)
app.include_router(archive.router)
app.include_router(ice_age.router)
app.include_router(system.router)


@app.get("/")
async def root():
    """健康检查接口"""
    return {
        "status": "ok",
        "message": "末世模拟器后端运行中",
        "version": "1.0.0"
    }


@app.get("/health")
async def health_check():
    """健康检查"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

"""
末世生存档案 API - 存储和展示玩家结局
"""
import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api/archive", tags=["archive"])

# 档案存储路径
ARCHIVE_FILE = Path(__file__).parent.parent.parent / "data" / "archives.json"


class ArchiveSubmit(BaseModel):
    """提交档案请求"""
    nickname: str = Field(..., min_length=1, max_length=20, description="玩家昵称")
    epithet: str = Field(..., description="四字人设词")
    days_survived: int = Field(..., description="存活天数")
    is_victory: bool = Field(..., description="是否通关")
    cause_of_death: Optional[str] = Field(default=None, description="死因")
    comment: str = Field(..., description="毒舌评语")
    radar_chart: list[int] = Field(..., min_length=5, max_length=5, description="五维雷达图")
    profession_name: Optional[str] = Field(default=None, description="职业名称")
    profession_icon: Optional[str] = Field(default=None, description="职业图标")


class ArchiveRecord(BaseModel):
    """档案记录"""
    id: str
    nickname: str
    epithet: str
    days_survived: int
    is_victory: bool
    cause_of_death: Optional[str]
    comment: str
    radar_chart: list[int]
    profession_name: Optional[str]
    profession_icon: Optional[str]
    created_at: str


def _load_archives() -> list[dict]:
    """加载档案数据"""
    if not ARCHIVE_FILE.exists():
        return []
    try:
        with open(ARCHIVE_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        return []


def _save_archives(archives: list[dict]) -> None:
    """保存档案数据"""
    ARCHIVE_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(ARCHIVE_FILE, "w", encoding="utf-8") as f:
        json.dump(archives, f, ensure_ascii=False, indent=2)


@router.post("/submit", response_model=ArchiveRecord)
async def submit_archive(data: ArchiveSubmit) -> ArchiveRecord:
    """提交结局到档案"""
    archives = _load_archives()
    
    # 创建新档案记录
    record = ArchiveRecord(
        id=str(uuid.uuid4())[:8],
        nickname=data.nickname,
        epithet=data.epithet,
        days_survived=data.days_survived,
        is_victory=data.is_victory,
        cause_of_death=data.cause_of_death,
        comment=data.comment,
        radar_chart=data.radar_chart,
        profession_name=data.profession_name,
        profession_icon=data.profession_icon,
        created_at=datetime.now().isoformat()
    )
    
    # 添加到列表开头（最新的在前）
    archives.insert(0, record.model_dump())
    
    # 限制最多保存 100 条记录
    if len(archives) > 100:
        archives = archives[:100]
    
    _save_archives(archives)
    return record


@router.get("/list", response_model=list[ArchiveRecord])
async def list_archives(limit: int = 20) -> list[ArchiveRecord]:
    """获取档案列表"""
    archives = _load_archives()
    return [ArchiveRecord(**a) for a in archives[:limit]]

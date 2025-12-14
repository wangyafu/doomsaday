"""
API 日志记录模块

将每个 API 的完整请求和响应记录到日志文件，便于调试分析。
日志文件位置：backend/logs/api_YYYYMMDD.log
"""
import json
from datetime import datetime
from pathlib import Path
from typing import Any

# 日志目录（延迟创建）
LOG_DIR = Path(__file__).parent.parent / "logs"


def _ensure_log_dir() -> None:
    """确保日志目录存在"""
    try:
        LOG_DIR.mkdir(exist_ok=True)
    except Exception as e:
        print(f"[API_LOGGER] 创建日志目录失败: {e}")


def get_log_file() -> Path:
    """获取当天的日志文件路径"""
    _ensure_log_dir()
    today = datetime.now().strftime("%Y%m%d")
    return LOG_DIR / f"api_{today}.log"


def log_api_call(
    endpoint: str,
    request_data: dict[str, Any],
    response_data: str | dict[str, Any] | None = None,
    error: str | None = None
) -> None:
    """
    记录 API 调用日志
    
    Args:
        endpoint: API 端点名称（如 "narrate/stream", "judge/stream"）
        request_data: 请求数据
        response_data: 响应数据（流式输出的完整文本或 JSON 响应）
        error: 错误信息（如果有）
    """
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log_file = get_log_file()
    
    # 构建日志条目
    log_entry = {
        "timestamp": timestamp,
        "endpoint": endpoint,
        "request": request_data,
    }
    
    if response_data is not None:
        log_entry["response"] = response_data
    
    if error is not None:
        log_entry["error"] = error
    
    # 写入日志文件（异常不影响主流程）
    try:
        with open(log_file, "a", encoding="utf-8") as f:
            f.write("=" * 80 + "\n")
            f.write(f"[{timestamp}] {endpoint}\n")
            f.write("-" * 80 + "\n")
            f.write("【请求】\n")
            f.write(json.dumps(request_data, ensure_ascii=False, indent=2) + "\n")
            f.write("-" * 80 + "\n")
            
            if response_data is not None:
                f.write("【响应】\n")
                if isinstance(response_data, dict):
                    f.write(json.dumps(response_data, ensure_ascii=False, indent=2) + "\n")
                else:
                    f.write(str(response_data) + "\n")
            
            if error is not None:
                f.write("【错误】\n")
                f.write(error + "\n")
            
            f.write("\n")
    except Exception as e:
        print(f"[API_LOGGER] 写入日志失败: {e}")


def format_request_for_log(request) -> dict[str, Any]:
    """
    将 Pydantic 请求模型转换为可记录的字典
    """
    return request.model_dump()

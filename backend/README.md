# 末世模拟器后端 API

基于 FastAPI 的 AI 驱动文字生存游戏后端。

## 快速开始

### 1. 安装依赖

```bash
cd backend
pip install -r requirements.txt
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并填写你的 OpenAI API Key：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```
OPENAI_API_KEY=你的API密钥
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini
```

### 3. 启动服务

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## API 接口

### POST /api/game/narrate
每日剧情生成，AI 扮演"小说家/旁白"角色。

### POST /api/game/judge
行动判定，AI 扮演"冷酷裁判/DM"角色。

### POST /api/game/ending
结局结算，AI 扮演"毒舌评论员"角色。

## 项目结构

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py          # FastAPI 应用入口
│   ├── config.py        # 配置管理
│   ├── models.py        # Pydantic 数据模型
│   ├── prompts.py       # 提示词模板和上下文组织
│   ├── llm_service.py   # LLM 服务封装
│   └── routers/
│       ├── __init__.py
│       └── game.py      # 游戏核心路由
├── requirements.txt
├── .env.example
└── README.md
```

## 提示词设计说明

### 上下文组织策略
- 历史记录只取最近 3-5 天，避免 token 浪费
- 状态和物品格式化为易读文本
- 隐藏标签仅供 AI 参考，影响剧情走向

### AI 角色分工
1. **Narrator（旁白）**: 负责日志生成和选项设计
2. **Judge（裁判）**: 负责行动判定和数值计算
3. **Ending（评论员）**: 负责结局总结和人设词生成

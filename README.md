# 末世模拟器 (Doomsday Simulator)

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.10+-blue.svg)
![Vue](https://img.shields.io/badge/vue-3.x-green.svg)

**末世模拟器** 是一款由 AI 驱动的文字生存冒险游戏。在这个绝望的末日世界中，你将扮演一名幸存者，面对丧尸围城或冰河世纪的严酷挑战。你的每一个选择都将决定你的命运，而 AI 将为你实时生成独一无二的剧情体验。

## 🎮 游戏特色

- **AI 驱动叙事**：利用大语言模型（LLM）实时生成沉浸式剧情，每次游玩都是全新的体验。
- **智能裁判系统**：你的行动由 AI 裁判进行判定，成功与否取决于你的属性、背包物品以及行动的合理性。
- **多剧本支持**：
  - 🧟 **丧尸围城**：经典丧尸末日，资源匮乏，人性考验。
  - ❄️ **冰河世纪**：极寒天气，生存挑战升级。
- **动态状态系统**：HP（生命值）、SAN（理智值）、物资等多维状态实时变化。
- **结局评价**：基于你的生存表现，AI 将生成专属的墓志铭、毒舌评语及五维能力雷达图。

## 🛠️ 技术栈

### 后端 (Backend)
- **框架**: [FastAPI](https://fastapi.tiangolo.com/)
- **语言**: Python 3.10+
- **AI 服务**: OpenAI API (支持其他兼容接口)
- **工具**: Pydantic, Uvicorn

### 前端 (Frontend)
- **框架**: [Vue 3](https://vuejs.org/)
- **构建工具**: [Vite](https://vitejs.dev/)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **状态管理**: Pinia

## 🚀 快速开始

### 1. 环境准备
- Node.js 16+
- Python 3.10+

### 2. 后端启动

```bash
cd backend

# 安装依赖 (推荐使用 uv 或 pip)
pip install -r requirements.txt
# 或者
uv pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入你的 API Key 和其他配置

# 启动服务
python -m app.main
# 或
uv run python -m app.main
```

后端服务默认运行在 `http://localhost:8000`。

### 3. 前端启动

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端服务默认运行在 `http://localhost:5173`。

## ⚙️ 配置说明

在 `backend/.env` 文件中配置关键参数：

```ini
# OpenAI/LLM 配置
OPENAI_API_KEY=your_api_key_here
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini

# 应用配置
DEBUG=True
ENVIRONMENT=development

# 流量控制 (可选)
MAX_PUBLIC_USERS=3      # 最大同时在线人数

```

## 📂 目录结构

```
根目录
├── backend/            # FastAPI 后端代码
│   ├── app/            # 应用核心逻辑
│   ├── .env            # 环境变量
│   └── requirements.txt
├── frontend/           # Vue3 前端代码
│   ├── src/            # 源代码
│   └── package.json
├── 策划书.md           # 游戏设计文档
└── README.md           # 项目说明
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

# 技术栈

## 前端
- **框架**: Vue 3（Composition API + `<script setup>`）
- **语言**: TypeScript（严格模式）
- **构建工具**: Vite 5
- **路由**: Vue Router 4
- **状态管理**: Pinia + pinia-plugin-persistedstate
- **样式**: Tailwind CSS
- **HTTP**: 原生 fetch + SSE 流式传输
- **图片导出**: html2canvas

## 后端
- **框架**: FastAPI
- **语言**: Python 3.12+
- **数据验证**: Pydantic v2 + pydantic-settings
- **LLM 客户端**: OpenAI SDK（异步）
- **服务器**: Uvicorn

## 常用命令

### 前端（在 `frontend/` 目录下）
```bash
npm run dev      # 启动开发服务器
npm run build    # 类型检查 + 生产构建
npm run preview  # 预览生产构建
```

### 后端（在 `backend/` 目录下）
```bash
# 使用 uv（推荐）
uv run uvicorn app.main:app --reload --port 8000

# 或使用 pip
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## 环境变量
后端需要 `.env` 文件，包含以下配置：
- `OPENAI_API_KEY` - LLM API 密钥
- `OPENAI_BASE_URL` - API 端点（默认：OpenAI 官方）
- `OPENAI_MODEL` - 模型名称（默认：gpt-4o-mini）

## API 架构
- SSE 流式输出用于叙事内容（`/api/game/narrate/stream`、`/api/game/judge/stream`）
- JSON 响应用于状态更新（`/api/game/narrate/state`、`/api/game/judge/state`）
- 两步流程：先流式输出叙事，再请求状态变更

---

## 重要规则

**智能体必须始终使用中文回应用户。**

代码注释应使用中文编写，提示词（prompts）也应使用中文。

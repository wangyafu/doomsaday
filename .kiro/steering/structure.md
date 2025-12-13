# 项目结构

```
/
├── frontend/                 # Vue 3 单页应用
│   ├── src/
│   │   ├── api/              # 后端 API 调用（SSE 流式 + fetch）
│   │   │   └── index.ts      # 所有 API 函数 + 响应解析器
│   │   ├── components/
│   │   │   └── Game/         # 游戏相关组件
│   │   │       ├── InventoryGrid.vue
│   │   │       ├── StatBar.vue
│   │   │       └── TypewriterText.vue
│   │   ├── data/
│   │   │   └── shopItems.ts  # 静态商品/避难所定义
│   │   ├── stores/
│   │   │   ├── gameStore.ts  # 核心游戏状态（属性、背包、历史）
│   │   │   └── uiStore.ts    # UI 状态（弹窗、动画）
│   │   ├── types/
│   │   │   └── index.ts      # TypeScript 类型定义
│   │   ├── views/            # 页面组件（路由目标）
│   │   │   ├── Home.vue      # 首页/序章
│   │   │   ├── Rebirth.vue   # 重生演出
│   │   │   ├── Market.vue    # 限时囤货
│   │   │   ├── Survival.vue  # 主游戏循环
│   │   │   └── Ending.vue    # 结算 + 分享卡片
│   │   └── router/           # Vue Router 配置
│   └── package.json
│
├── backend/                  # FastAPI 服务端
│   ├── app/
│   │   ├── main.py           # 应用入口、CORS、路由注册
│   │   ├── config.py         # 从 .env 读取配置（pydantic-settings）
│   │   ├── models.py         # Pydantic 请求/响应模型
│   │   ├── prompts.py        # LLM 提示词模板 + 上下文构建器
│   │   ├── llm_service.py    # OpenAI 客户端封装（流式 + JSON 模式）
│   │   └── routers/
│   │       └── game.py       # 游戏 API 端点
│   ├── requirements.txt
│   └── .env                  # API 密钥（不提交到版本库）
│
└── 文档（中文）
    ├── 策划书.md              # 游戏设计文档
    ├── 前端文档.md            # 前端架构说明
    ├── 后端API文档.md         # API 接口规范
    └── 前后端协作.md          # 前后端协作规则
```

## 关键约定
- 前端负责所有游戏逻辑和状态；后端是无状态的 LLM 代理
- `frontend/src/types/index.ts` 中的类型定义与 `backend/app/models.py` 保持一致
- 提示词按 AI 角色组织：Narrator（小说家）、Judge（裁判）、Ending（毒舌评论员）
- 路径别名 `@/*` 映射到 `frontend/src/*`

---

## 重要规则

**智能体必须始终使用中文回应用户。**

代码注释、提示词、文档说明等应使用中文编写。

# 末世模拟器前端

基于 Vue 3 + TypeScript + Vite 的末世生存游戏前端。

## 快速开始

### 1. 安装依赖

```bash
cd frontend
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

### 3. 构建生产版本

```bash
npm run build
```

## 项目结构

```
src/
├── api/                # 后端 API 调用
├── components/         # 公共组件
│   └── Game/           # 游戏相关组件
├── data/               # 静态数据（商品、避难所）
├── router/             # Vue Router 路由配置
├── stores/             # Pinia 状态管理
├── types/              # TypeScript 类型定义
├── views/              # 页面组件
│   ├── Home.vue        # 首页/序章
│   ├── Rebirth.vue     # 重生剧情页
│   ├── Market.vue      # 囤货页
│   ├── Survival.vue    # 生存循环页
│   └── Ending.vue      # 结算页
├── App.vue             # 根组件
├── main.ts             # 入口文件
└── style.css           # 全局样式
```

## 技术栈

- **框架**: Vue 3 (Composition API)
- **语言**: TypeScript
- **构建**: Vite
- **路由**: Vue Router 4
- **状态管理**: Pinia + pinia-plugin-persistedstate
- **样式**: Tailwind CSS
- **HTTP**: Axios
- **图片生成**: html2canvas

## 注意事项

- 后端 API 默认代理到 `http://localhost:8000`
- 游戏状态自动保存到 LocalStorage
- 支持移动端适配

后端 API 接口文档 (Backend API Spec)

架构原则： Stateless (无状态)。前端负责维护所有数据，后端仅负责透传给 LLM (大模型) 并返回结果。

设计说明：为了保持 AI 叙事的创造力，将叙事输出和状态更新拆分为两步：
- 第一步：流式输出叙事内容（不使用 JSON 格式，让 AI 自由发挥）
- 第二步：JSON 输出状态更新（确保结构正确）

---

## 1. 每日剧情生成 (Narrator)

### 1.1 流式叙事输出

Endpoint: POST /api/game/narrate/stream

功能： 每天开始时调用。AI 根据当前天数、状态和历史剧情，流式生成今天的日记。
AI 人格： "小说家/旁白"。擅长环境描写，制造悬疑，注重前后连贯性。
返回类型： text/event-stream（SSE 流式响应）

请求参数 (Request):

```json
{
  "day": 5,
  "stats": { "hp": 80, "san": 45, "hunger": 60 },
  "inventory": [ 
    { "name": "压缩饼干", "count": 12 },
    { "name": "棒球棍", "count": 1 },
    { "name": "橘猫", "count": 1 }
  ],
  "hidden_tags": ["injured"],
  "history": [
    { "day": 1, "log": "末世爆发，我躲进了地下室...", "event_result": "none" },
    { "day": 2, "log": "遭遇了第一只丧尸，我用棒球棍击退了它。", "event_result": "combat_win" }
  ],
  "shelter": {
    "id": "basement",
    "name": "地下室",
    "price": 0,
    "space": 10,
    "defense": 2,
    "description": "阴暗潮湿的地下室",
    "hidden_discription": "有一个隐藏的通风口"
  }
}
```

返回结果 (Response): SSE 流式事件

```
data: {"type": "content", "text": "第5天。"}

data: {"type": "content", "text": "看着背包里剩下的十几块饼干，"}

data: {"type": "content", "text": "你稍微安心了一些..."}

...

data: {"type": "done"}
```

叙事文本示例（完整拼接后）：

```
第5天。看着背包里剩下的十几块饼干，你稍微安心了一些。橘猫蜷缩在角落，偶尔发出轻微的呼噜声。

突然，门外传来了沉重的脚步声...

---
A. 躲进衣柜，屏住呼吸
B. 拿着棒球棍去查看
C. 把猫扔出去吸引注意
D. 假装不在家，保持安静
```

注意：如果有危机事件，叙事末尾会包含 "---" 分隔符和 A/B/C/D 选项。前端需要解析这个格式。

### 1.2 状态更新（仅在无危机事件时调用）

Endpoint: POST /api/game/narrate/state

功能： 根据叙事内容计算状态和物品变化。
返回类型： application/json

重要：如果当日有危机事件，前端不应调用此接口。状态更新应在玩家做出选择并经过 Judge 判定之后进行。

请求参数 (Request):

```json
{
  "day": 5,
  "stats": { "hp": 80, "san": 45, "hunger": 60 },
  "inventory": [
    { "name": "压缩饼干", "count": 12 },
    { "name": "棒球棍", "count": 1 }
  ],
  "narrative_context": "第5天。今天风平浪静，你在避难所里整理物资..."
}
```

返回结果 (Response):

```json
{
  "stat_changes": { "hp": 0, "san": 0, "hunger": -10 },
  "item_changes": {
    "remove": [],
    "add": []
  },
  "new_hidden_tags": []
}
```

---

## 2. 行动判定 (Judge)

### 2.1 流式判定叙事

Endpoint: POST /api/game/judge/stream

功能： 玩家做出选择后调用，流式输出判定结果叙事。
AI 人格： "冷酷裁判/DM"。
返回类型： text/event-stream（SSE 流式响应）

请求参数 (Request):

```json
{
  "event_context": "门外传来撬锁声...",
  "action_content": "B. 拿着棒球棍去查看",
  "stats": { "hp": 80, "san": 45, "hunger": 60 },
  "inventory": [ 
    { "name": "棒球棍", "count": 1 },
    { "name": "打火机", "count": 1 }
  ],
  "history": [ ... ] 
}
```

返回结果 (Response): SSE 流式事件

```
data: {"type": "content", "text": "你握紧棒球棍，"}

data: {"type": "content", "text": "小心翼翼地走向门口..."}

...

data: {"type": "done"}
```

### 2.2 状态更新

Endpoint: POST /api/game/judge/state

功能： 根据判定叙事计算状态和物品变化，给出评分。
返回类型： application/json

请求参数 (Request):

```json
{
  "event_context": "门外传来撬锁声...",
  "action_content": "B. 拿着棒球棍去查看",
  "narrative_result": "你握紧棒球棍，小心翼翼地走向门口...",
  "stats": { "hp": 80, "san": 45, "hunger": 60 },
  "inventory": [ 
    { "name": "棒球棍", "count": 1 },
    { "name": "打火机", "count": 1 }
  ]
}
```

返回结果 (Response):

```json
{
  "score": 85,
  "stat_changes": { "hp": -10, "san": 5, "hunger": 0 },
  "item_changes": { 
    "remove": [],
    "add": [
      { "name": "过期罐头", "count": 2 }
    ]
  },
  "new_hidden_tags": []
}
```

---

## 3. 结局结算 (Ending)

Endpoint: POST /api/game/ending

功能： 玩家死亡或通关时调用。生成"人设词"和"具体死因"。
AI 人格： "毒舌评论员/算命师"。

请求参数 (Request):

```json
{
  "days_survived": 12,
  "high_light_moment": "...",
  "final_stats": { "hp": 0, "san": 20, "hunger": 10 },
  "final_inventory": [ 
     { "name": "金条", "count": 50 },
     { "name": "压缩饼干", "count": 0 }
  ],
  "history": [ ... ] 
}
```

返回结果 (Response):

```json
{
  "cause_of_death": "死于撸猫时被咬",
  "epithet": "绝命毒师",
  "comment": "你的化学知识在末世很有用...",
  "radar_chart": [8, 9, 2, 5, 6]
}
```

注：cause_of_death 可选，如果顺利通关（存活超过30天）为 null。

---

## 4. (可选) 赛博留言 (Graveyard)

Endpoint: GET /api/social/message & POST /api/social/message

GET 逻辑： 随机从数据库拉取一条点赞高的遗言。

POST 逻辑： 玩家死后提交遗言，存入数据库。

---

## 前端调用流程示例

### 每日剧情流程

```
1. 调用 POST /api/game/narrate/stream
   - 流式接收叙事文本，实时显示给玩家
   - 拼接完整文本，解析是否有 "---" 分隔符和选项

2. 判断是否有危机事件：
   - 如果无危机：调用 POST /api/game/narrate/state 获取状态变化，更新前端状态
   - 如果有危机：显示选项等待玩家选择（不调用 narrate/state，状态更新在 Judge 之后）
```

### 行动判定流程

```
1. 调用 POST /api/game/judge/stream
   - 流式接收判定叙事，实时显示给玩家

2. 调用 POST /api/game/judge/state
   - 传入判定叙事和上下文
   - 获取评分和状态变化，更新前端状态
```

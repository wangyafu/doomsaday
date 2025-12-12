后端 API 接口文档 (Backend API Spec)

架构原则： Stateless (无状态)。前端负责维护所有数据，后端仅负责透传给 LLM (大模型) 并返回结果。

1. 每日剧情生成 (Narrator)

Endpoint: POST /api/game/narrate

功能： 每天开始时调用。AI 根据当前天数、状态和历史剧情，生成今天的日记。
AI 人格： “小说家/旁白”。擅长环境描写，制造悬疑，注重前后连贯性。

请求参数 (Request):

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

  ]
}


后端处理逻辑 (Backend Logic):

后端不应直接把 history 全部丢给 AI（太长且贵）。

策略： 后端代码应截取 history 的最后 3-5 天，拼接成 Prompt 发送给 LLM。

返回结果 (Response):

{
  "log_text": "第5天。看着背包里剩下的十几块饼干，你稍微安心了一些...", // AI 能识别数量充足
  "has_crisis": true,
  "choices": [
    "A. 躲进衣柜",
    "B. 拿着棒球棍去查看",
    "C. 把猫扔出去吸引注意",
    "D. 假装不在家"
  ]
}


2. 行动判定 (Judge)

Endpoint: POST /api/game/judge

功能： 玩家做出选择后调用。
AI 人格： “冷酷裁判/DM”。

请求参数 (Request):

{
  "event_context": "门外传来撬锁声...",
  "action_content": "把食用油倒在门口...",
  "stats": { ... },
  "inventory": [ 
    { "name": "食用油", "count": 3 },
    { "name": "打火机", "count": 1 }
  ],
  "history": [ ... ] 
}


返回结果 (Response):

{
  "narrative": "...",
  "score": 95,
  "stat_changes": { "hp": 0, "san": 10 },
  "item_changes": { 
    "remove": [
      { "name": "食用油", "count": 1 } // 消耗1瓶
    ],
    "add": [
      { "name": "强盗的背包", "count": 1 },
      { "name": "过期罐头", "count": 2 }
    ]
  },
  "new_hidden_tags": []
}


3. 结局结算 (Summary)

Endpoint: POST /api/game/ending

功能： 玩家死亡或通关时调用。生成“人设词”和“具体死因”。
AI 人格： “毒舌评论员/算命师”。

请求参数 (Request):

{
  "days_survived": 12,
  "high_light_moment": "...",
  "final_stats": { ... },
  "final_inventory": [ 
     { "name": "金条", "count": 50 },
     { "name": "压缩饼干", "count": 0 }
  ],
  "history": [ ... ] 
  
}


后端处理逻辑: * Prompt 指令示例："Review the history and final stats. Determine the specific cause of death (e.g., 'Starvation', 'Zombie Infection', 'Suicide due to insanity'). Then generate a 4-character epithet."

返回结果 (Response):

{
  "cause_of_death": "死于撸猫时被咬",//可选项，如果顺利通关可以没有这一项。
  "epithet": "绝命毒师",
  "comment": "你的化学知识在末世很有用...",
  "radar_chart": [8, 9, 2, 5, 6]
}


4. (可选) 赛博留言 (Graveyard)

Endpoint: GET /api/social/message & POST /api/social/message

GET 逻辑： 随机从数据库拉取一条点赞高的遗言。

POST 逻辑： 玩家死后提交遗言，存入数据库。
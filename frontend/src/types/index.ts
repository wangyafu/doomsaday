// 玩家状态
export interface Stats {
  hp: number      // 生命值
  san: number     // 理智值
  hunger: number  // 饱腹度
}

// 背包物品
export interface InventoryItem {
  name: string
  count: number
}

// 历史记录条目
export interface HistoryEntry {
  day: number
  log: string                    // Narrator 生成的今日事件描述
  player_action?: string | null  // 玩家选择的行动（有危机事件时）
  judge_result?: string | null   // Judge 的判定叙事（有危机事件时）
  event_result: string           // 事件结果：success/fail/none
}

// 商品定义
export interface ShopItem {
  id: string
  name: string
  price: number
  space: number      // 占用空间
  category: 'food' | 'weapon' | 'medical' | 'emotional'
  description: string
  icon: string
}

// 避难所定义
export interface Shelter {
  id: string
  name: string
  price: number
  space: number      // 提供空间
  defense: number    // 防御等级 1-3
  description: string
  hidden_discription: string //向用户隐藏的说明
}

// API 响应类型

// Narrate 状态更新响应（仅在无危机事件时使用）
export interface NarrateStateResponse {
  stat_changes: {
    hp: number
    san: number
    hunger: number
  }
  item_changes: {
    remove: InventoryItem[]
    add: InventoryItem[]
  }
  new_hidden_tags: string[]
  remove_hidden_tags: string[]
}

// Judge 状态更新响应
export interface JudgeStateResponse {
  score: number
  stat_changes: {
    hp: number
    san: number
    hunger: number
  }
  item_changes: {
    remove: InventoryItem[]
    add: InventoryItem[]
  }
  new_hidden_tags: string[]
  remove_hidden_tags: string[]
}

export interface EndingResponse {
  cause_of_death: string | null
  epithet: string
  comment: string
  radar_chart: number[]
}

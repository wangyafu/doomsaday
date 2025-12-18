// 玩家状态
export interface Stats {
  hp: number      // 生命值
  san: number     // 理智值
}

// 职业标签定义
export interface ProfessionTag {
  name: string          // 标签名称（展示给用户）
  description: string   // 标签解释（鼠标悬停时显示）
}

// 职业定义
export interface Profession {
  id: string
  name: string
  icon: string
  description: string           // 展示给用户的描述
  tags?: ProfessionTag[]        // 职业标签（展示给用户，不发送给AI）
  hiddenDescription: string     // 隐藏描述（影响AI剧情，包含tags的实际效果）
  bonusMoney: number            // 额外金钱加成
  bonusHp: number               // 初始HP加成
  bonusSan: number              // 初始SAN加成
  unlockedItems?: string[]      // 解锁的额外商品ID
}

// 背包物品
export interface InventoryItem {
  name: string
  count: number
  description?: string  // 可选：物品描述（对玩家可见）
  hidden?: string       // 可选：隐藏信息（仅供AI参考，包含数值运算法则）
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
  hidden?: string    // 可选：隐藏信息（仅供AI参考，包含数值运算法则）
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

// 末世生存档案
export interface ArchiveRecord {
  id: string
  nickname: string
  epithet: string
  days_survived: number
  is_victory: boolean
  cause_of_death: string | null
  comment: string
  radar_chart: number[]
  profession_name: string | null
  profession_icon: string | null
  created_at: string
}

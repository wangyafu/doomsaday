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
  log: string
  event_result: string
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
export interface NarrateResponse {
  log_text: string
  has_crisis: boolean
  choices: string[] | null
}

export interface JudgeResponse {
  narrative: string
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
}

export interface EndingResponse {
  cause_of_death: string | null
  epithet: string
  comment: string
  radar_chart: number[]
}

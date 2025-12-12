import axios from 'axios'
import type { 
  Stats, 
  InventoryItem, 
  HistoryEntry, 
  Shelter,
  NarrateResponse, 
  JudgeResponse, 
  EndingResponse 
} from '@/types'

const api = axios.create({
  baseURL: '/api',
  timeout: 60000  // AI响应可能较慢
})

/**
 * 每日剧情生成
 */
export async function narrate(params: {
  day: number
  stats: Stats
  inventory: InventoryItem[]
  hidden_tags: string[]
  history: HistoryEntry[]
  shelter?: Shelter | null
}): Promise<NarrateResponse> {
  const { data } = await api.post<NarrateResponse>('/game/narrate', params)
  return data
}

/**
 * 行动判定
 */
export async function judge(params: {
  event_context: string
  action_content: string
  stats: Stats
  inventory: InventoryItem[]
  history: HistoryEntry[]
}): Promise<JudgeResponse> {
  const { data } = await api.post<JudgeResponse>('/game/judge', params)
  return data
}

/**
 * 结局结算
 */
export async function ending(params: {
  days_survived: number
  high_light_moment: string
  final_stats: Stats
  final_inventory: InventoryItem[]
  history: HistoryEntry[]
}): Promise<EndingResponse> {
  const { data } = await api.post<EndingResponse>('/game/ending', params)
  return data
}

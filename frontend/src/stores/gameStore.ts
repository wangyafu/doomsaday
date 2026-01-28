import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Stats, InventoryItem, HistoryEntry, Shelter, Profession } from '@/types'
import { useSettingsStore } from './settingsStore'

export const useGameStore = defineStore('game', () => {
  // ==================== 状态 ====================

  // 当前天数
  const day = ref(1)

  // 玩家状态
  const stats = ref<Stats>({
    hp: 100,
    san: 100
  })

  // 背包物品
  const inventory = ref<InventoryItem[]>([])

  // 隐藏标签（影响剧情）
  const hiddenTags = ref<string[]>([])

  // 历史记录
  const history = ref<HistoryEntry[]>([])

  // 金钱
  const money = ref(6500)

  // 选择的避难所
  const shelter = ref<Shelter | null>(null)

  // 选择的职业
  const profession = ref<Profession | null>(null)

  // ==================== 商业化状态 ====================
  // 是否已赞助
  const is_supporter = ref(false)
  // 每日游玩次数
  const daily_play_count = ref(0)
  // 上次游玩日期 (YYYY-MM-DD)
  const last_play_date = ref('')

  // 当前背包已用空间
  const usedSpace = computed(() => {
    return inventory.value.reduce((sum, item) => sum + item.count, 0)
  })

  // 最大空间（由避难所决定）
  const maxSpace = computed(() => shelter.value?.space ?? 50)

  // 剩余空间
  const remainingSpace = computed(() => maxSpace.value - usedSpace.value)

  // 高光时刻
  const highLightMoment = ref('')

  // 游戏是否结束（HP 或 SAN 归零）
  const isGameOver = computed(() => stats.value.hp <= 0 || stats.value.san <= 0)

  // 是否通关（存活超过20天）
  const isVictory = computed(() => day.value > 20)

  // ==================== 方法 ====================

  // 重置游戏
  function resetGame() {
    day.value = 1
    stats.value = { hp: 100, san: 100 }
    inventory.value = []
    hiddenTags.value = []
    history.value = []
    money.value = 6500
    shelter.value = null
    profession.value = null
    highLightMoment.value = ''
  }

  // 检查并重置每日次数
  function checkDailyReset() {
    const today = new Date().toISOString().split('T')[0]
    if (last_play_date.value !== today) {
      daily_play_count.value = 0
      is_supporter.value = false // 每日重置支持者身份
      last_play_date.value = today
    }
  }

  // 增加游玩次数（仅在使用服务器API时统计）
  function incrementPlayCount() {
    const settingsStore = useSettingsStore()
    // 只有在非自定义模式（使用服务器API）时才统计
    if (settingsStore.isCustomMode) {
      return
    }
    checkDailyReset()
    daily_play_count.value++
  }

  // 获取今日服务器API游玩次数
  function getServerPlayCount(): number {
    checkDailyReset()
    return daily_play_count.value
  }

  // 检查是否需要显示打赏弹窗（服务器API游玩超过2次且非支持者）
  function shouldShowPaymentModal(): boolean {
    return !is_supporter.value && getServerPlayCount() >= 2
  }

  // 设置支持者身份
  function setSupporter(value: boolean) {
    is_supporter.value = value
  }

  // 选择职业（应用职业加成）
  function selectProfession(p: Profession) {
    profession.value = p
    // 应用职业加成
    money.value += p.bonusMoney
    // 允许职业加成突破100上限（龙王等特殊职业）
    // 注意：这里不限制上限，允许超过100
    stats.value.hp = Math.max(1, stats.value.hp + p.bonusHp)
    stats.value.san = Math.max(1, stats.value.san + p.bonusSan)
  }

  // 选择避难所
  function selectShelter(s: Shelter) {
    shelter.value = s
    money.value -= s.price
  }

  // 添加物品到背包
  function addItem(item: InventoryItem) {
    const existing = inventory.value.find(i => i.name === item.name)
    if (existing) {
      existing.count += item.count
    } else {
      inventory.value.push({ ...item })
    }
  }

  // 移除物品
  function removeItem(name: string, count: number) {
    const existing = inventory.value.find(i => i.name === name)
    if (existing) {
      existing.count -= count
      if (existing.count <= 0) {
        inventory.value = inventory.value.filter(i => i.name !== name)
      }
    }
  }

  // 更新状态
  function updateStats(changes: Partial<Stats>) {
    if (changes.hp !== undefined) {
      // 允许HP超过100（职业加成），但不能低于0
      stats.value.hp = Math.max(0, stats.value.hp + changes.hp)
    }
    if (changes.san !== undefined) {
      // 允许SAN超过100（职业加成），但不能低于0
      stats.value.san = Math.max(0, stats.value.san + changes.san)
    }
  }

  // 添加历史记录
  function addHistory(
    log: string,
    eventResult: string = 'none',
    playerAction?: string | null,
    judgeResult?: string | null
  ) {
    history.value.push({
      day: day.value,
      log,
      player_action: playerAction ?? null,
      judge_result: judgeResult ?? null,
      event_result: eventResult
    })
  }

  // 添加隐藏标签
  function addHiddenTag(tag: string) {
    if (!hiddenTags.value.includes(tag)) {
      hiddenTags.value.push(tag)
    }
  }

  // 移除隐藏标签
  function removeHiddenTag(tag: string) {
    const index = hiddenTags.value.indexOf(tag)
    if (index !== -1) {
      hiddenTags.value.splice(index, 1)
    }
  }

  // 设置高光时刻
  function setHighLight(moment: string) {
    highLightMoment.value = moment
  }
  function nextDay() {
    day.value++
  }

  return {
    // 状态
    day,
    stats,
    inventory,
    hiddenTags,
    history,
    money,
    shelter,
    profession,
    usedSpace,
    maxSpace,
    remainingSpace,
    highLightMoment,
    isGameOver,
    isVictory,
    nextDay,
    // 商业化相关
    is_supporter,
    daily_play_count,
    last_play_date,
    checkDailyReset,
    incrementPlayCount,
    getServerPlayCount,
    shouldShowPaymentModal,
    setSupporter,
    // 方法
    resetGame,
    selectProfession,
    selectShelter,
    addItem,
    removeItem,
    updateStats,
    addHistory,
    addHiddenTag,
    removeHiddenTag,
    setHighLight
  }
}, {
  persist: true  // 启用持久化
})

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Stats, InventoryItem } from '@/types'
import { useSettingsStore } from './settingsStore'

// 冰河末世天赋定义
export interface IceAgeTalent {
    id: string
    name: string
    icon: string
    description: string           // 展示给用户的描述
    hiddenDescription: string     // 供AI参考的隐藏描述
}

// 冰河末世避难所定义
export interface IceAgeShelter {
    id: string
    name: string
    price: number
    space: number
    warmth: number    // 防寒等级 1-3
    description: string
    hiddenDescription: string
}

// 每日日志
export interface DayLog {
    day: number
    temperature: number          // 当日气温
    narration: string            // AI生成的叙述
    hasCrisis: boolean           // 是否有危机事件
    choices?: string[]           // 危机事件选项
    playerAction?: string        // 玩家选择
    result?: string              // 结果叙述
    stateSnapshot: Stats         // 当日结束时状态快照
    inventorySnapshot: InventoryItem[]  // 当日结束时背包快照
    resourceChanges?: {          // 当日资源变动
        hp: number
        san: number
        itemsAdded?: InventoryItem[]
        itemsRemoved?: InventoryItem[]
    }
    isRevealed: boolean          // 是否已展示给玩家
}

// 批量生成的待处理日志
export interface PendingDayLog {
    day: number
    temperature: number
    narration: string
    hasCrisis: boolean
    choices?: string[]
    stateUpdate?: {
        hp: number
        san: number
        itemChanges?: {
            remove?: InventoryItem[]
            add?: InventoryItem[]
        }
    }
}

export const useIceAgeStore = defineStore('iceAge', () => {
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

    // 金钱
    const money = ref(8000)

    // 选择的避难所
    const shelter = ref<IceAgeShelter | null>(null)

    // 选中的天赋（3个）
    const selectedTalents = ref<IceAgeTalent[]>([])

    // 所有天数日志（用于从上到下展示）
    const dayLogs = ref<DayLog[]>([])

    // 待展示的批量生成结果
    const pendingDays = ref<PendingDayLog[]>([])

    // 高光时刻
    const highLightMoment = ref('')

    // ==================== 商业化状态 ====================
    const is_supporter = ref(false)
    const daily_play_count = ref(0)
    const last_play_date = ref('')

    // ==================== 计算属性 ====================

    // 当前背包已用空间
    const usedSpace = computed(() => {
        return inventory.value.reduce((sum, item) => sum + item.count, 0)
    })

    // 最大空间（由避难所决定）
    const maxSpace = computed(() => shelter.value?.space ?? 50)

    // 剩余空间
    const remainingSpace = computed(() => maxSpace.value - usedSpace.value)

    // 游戏是否结束（HP 或 SAN 归零）
    const isGameOver = computed(() => stats.value.hp <= 0 || stats.value.san <= 0)

    // 是否通关（存活超过40天）
    const isVictory = computed(() => day.value > 40)

    // 当前气温（根据天数计算）
    // 逻辑对齐 backend/app/prompts/ice_age_common.py
    const currentTemperature = computed(() => {
        let base = -5
        if (day.value <= 1) {
            base = -5
        } else if (day.value <= 10) {
            // 第1-10天：-5°C → -25°C
            base = -5 - Math.floor((day.value - 1) * 2.2)
        } else if (day.value <= 20) {
            // 第10-20天：-25°C → -40°C
            base = -25 - Math.floor((day.value - 10) * 1.5)
        } else {
            // 第20天以后：持续下降至 -55°C
            base = -40 - Math.floor((day.value - 20) * 0.5)
            if (base < -55) base = -55
        }
        return base
    })

    // ==================== 方法 ====================

    // 重置游戏
    function resetGame() {
        day.value = 1
        stats.value = { hp: 100, san: 100 }
        inventory.value = []
        hiddenTags.value = []
        money.value = 8000
        shelter.value = null
        selectedTalents.value = []
        dayLogs.value = []
        pendingDays.value = []
        highLightMoment.value = ''
    }

    // 检查并重置每日次数
    function checkDailyReset() {
        const today = new Date().toISOString().split('T')[0]
        if (last_play_date.value !== today) {
            daily_play_count.value = 0
            is_supporter.value = false
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

    // 选择天赋
    function selectTalents(talents: IceAgeTalent[]) {
        selectedTalents.value = talents.slice(0, 3)
        // 应用天赋加成
        talents.forEach(talent => {
            if (talent.id === 'strong_body') {
                stats.value.hp += 20
            }
            if (talent.id === 'calm_mind') {
                stats.value.san += 20
            }
            if (talent.id === 'hoarder') {
                // 空间加成会在避难所选择后生效
            }
            if (talent.id === 'tycoon') {
                money.value += 2000
            }
        })
    }

    // 选择避难所
    function selectShelter(s: IceAgeShelter) {
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
            stats.value.hp = Math.max(0, stats.value.hp + changes.hp)
        }
        if (changes.san !== undefined) {
            stats.value.san = Math.max(0, stats.value.san + changes.san)
        }
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

    // 进入下一天
    function nextDay() {
        day.value++
    }

    // 添加日志条目
    function addDayLog(log: DayLog) {
        dayLogs.value.push(log)
    }

    // 更新日志条目（用于危机事件结果）
    function updateDayLog(dayNum: number, updates: Partial<DayLog>) {
        const log = dayLogs.value.find(l => l.day === dayNum)
        if (log) {
            Object.assign(log, updates)
        }
    }

    // 添加待处理的批量日志
    function addPendingDays(days: PendingDayLog[]) {
        pendingDays.value.push(...days)
    }

    // 消费下一个待处理日志
    function consumeNextPendingDay(): PendingDayLog | null {
        if (pendingDays.value.length === 0) return null
        return pendingDays.value.shift() || null
    }

    // 检查是否还有待处理日志
    function hasPendingDays(): boolean {
        return pendingDays.value.length > 0
    }

    // 获取最近5天历史（用于API调用）
    function getRecentHistory(count: number = 5) {
        return dayLogs.value.slice(-count).map(log => ({
            day: log.day,
            log: log.narration,
            player_action: log.playerAction || null,
            judge_result: log.result || null,
            event_result: log.hasCrisis ? (log.result ? 'resolved' : 'pending') : 'none'
        }))
    }

    return {
        // 状态
        day,
        stats,
        inventory,
        hiddenTags,
        money,
        shelter,
        selectedTalents,
        dayLogs,
        pendingDays,
        highLightMoment,
        usedSpace,
        maxSpace,
        remainingSpace,
        isGameOver,
        isVictory,
        currentTemperature,
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
        selectTalents,
        selectShelter,
        addItem,
        removeItem,
        updateStats,
        addHiddenTag,
        removeHiddenTag,
        setHighLight,
        nextDay,
        addDayLog,
        updateDayLog,
        addPendingDays,
        consumeNextPendingDay,
        hasPendingDays,
        getRecentHistory
    }
}, {
    persist: true  // 启用持久化
})

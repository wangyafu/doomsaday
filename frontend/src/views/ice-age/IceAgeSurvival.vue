<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useIceAgeStore, type DayLog, type PendingDayLog } from '@/stores/iceAgeStore'
import { iceAgeNarrateStream, iceAgeJudgeStream, parseStateUpdate } from '@/api'

const router = useRouter()
const iceAgeStore = useIceAgeStore()
const currentCrisisDay = ref<number | null>(null)
const customAction = ref('')
const showCustomInput = ref(false)

// 是否正在加载更多天数
const isLoadingMore = ref(false)

// 滚动容器引用
const scrollContainer = ref<HTMLElement | null>(null)

// 检查游戏是否结束
const shouldEnd = computed(() => iceAgeStore.isGameOver || iceAgeStore.isVictory)

// 获取当前需要选择的危机事件
const pendingCrisis = computed(() => {
  const log = iceAgeStore.dayLogs.find(l => l.hasCrisis && !l.playerAction && l.isRevealed)
  return log || null
})

// 调用后端 API 批量生成多天
async function generateBatchDays(): Promise<PendingDayLog[]> {
  const startDay = iceAgeStore.day
  const days: PendingDayLog[] = []

  try {
    let fullText = ''
    for await (const chunk of iceAgeNarrateStream({
      start_day: startDay,
      days_to_generate: 5,
      stats: { hp: iceAgeStore.stats.hp, san: iceAgeStore.stats.san },
      inventory: iceAgeStore.inventory.map(i => ({ name: i.name, count: i.count, description: i.description || '', hidden: i.hidden || '' })),
      hidden_tags: iceAgeStore.hiddenTags,
      history: iceAgeStore.getRecentHistory(5),
      shelter: iceAgeStore.shelter ? { id: iceAgeStore.shelter.id, name: iceAgeStore.shelter.name, warmth: iceAgeStore.shelter.warmth } : null,
      talents: iceAgeStore.selectedTalents.map(t => ({ id: t.id, name: t.name, hiddenDescription: t.hiddenDescription }))
    })) {
      fullText += chunk
    }

    // 解析 JSON 结果
    const jsonMatch = fullText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0])
      if (result.days && Array.isArray(result.days)) {
        for (const d of result.days) {
          const day: PendingDayLog = {
            day: d.day,
            temperature: d.temperature,
            narration: d.narration,
            hasCrisis: d.has_crisis || false,
            choices: d.choices,
            stateUpdate: d.state_update ? {
              hp: d.state_update.hp || 0,
              san: d.state_update.san || 0,
              itemChanges: d.state_update.item_changes
            } : undefined
          }
          days.push(day)
        }
      }
    }
  } catch (error) {
    console.error('生成日志失败，使用备用数据:', error)
    // 备用数据：如果 API 失败，生成简单的历程
    for (let i = 0; i < 3; i++) {
      const dayNum = startDay + i
      days.push({
        day: dayNum,
        temperature: getTemperature(dayNum),
        narration: `第${dayNum}天，你在避难所中度过了平静的一天。窗外的风雪依旧呼啸。`,
        hasCrisis: false,
        stateUpdate: { hp: -1, san: -2 }
      })
    }
  }

  return days.length > 0 ? days : [{
    day: startDay,
    temperature: getTemperature(startDay),
    narration: `第${startDay}天，你在避难所中度过了平静的一天。`,
    hasCrisis: false,
    stateUpdate: { hp: 0, san: -2 }
  }]
}

// 计算气温
function getTemperature(dayNum: number): number {
  if (dayNum <= 1) return 10
  if (dayNum <= 10) return 10 - (dayNum - 1)
  if (dayNum <= 20) return 0 - (dayNum - 10) * 3
  if (dayNum <= 30) return -30 - (dayNum - 20)
  return -40
}

// 加载更多天数
async function loadMoreDays() {
  if (isLoadingMore.value) return
  isLoadingMore.value = true
  
  try {
    const newDays = await generateBatchDays()
    iceAgeStore.addPendingDays(newDays)
  } finally {
    isLoadingMore.value = false
  }
}

// 展示下一天
async function revealNextDay() {
  // 如果有未解决的危机，不能继续
  if (pendingCrisis.value) return
  
  // 检查是否需要加载更多
  if (!iceAgeStore.hasPendingDays()) {
    await loadMoreDays()
  }
  
  // 消费下一个待展示日志
  const pending = iceAgeStore.consumeNextPendingDay()
  if (!pending) return
  
  // 应用状态更新
  if (pending.stateUpdate) {
    iceAgeStore.updateStats({
      hp: pending.stateUpdate.hp,
      san: pending.stateUpdate.san
    })
  }
  
  // 创建DayLog并添加
  const log: DayLog = {
    day: pending.day,
    temperature: pending.temperature,
    narration: pending.narration,
    hasCrisis: pending.hasCrisis,
    choices: pending.choices,
    stateSnapshot: { ...iceAgeStore.stats },
    inventorySnapshot: [...iceAgeStore.inventory],
    isRevealed: true
  }
  
  iceAgeStore.addDayLog(log)
  iceAgeStore.nextDay()
  
  // 检查游戏结束
  if (shouldEnd.value) {
    router.push('/ice-age/ending')
    return
  }
  
  // 滚动到底部
  await nextTick()
  scrollToBottom()
  
  // 如果有危机，设置当前危机日
  if (pending.hasCrisis) {
    currentCrisisDay.value = pending.day
  }
}

// 选择危机事件选项
const isJudging = ref(false)
const judgingText = ref('')

async function selectChoice(choice: string) {
  if (!pendingCrisis.value || isJudging.value) return
  
  isJudging.value = true
  judgingText.value = ''
  
  try {
    let fullText = ''
    for await (const chunk of iceAgeJudgeStream({
      day: pendingCrisis.value.day,
      temperature: pendingCrisis.value.temperature,
      event_context: pendingCrisis.value.narration,
      action_content: choice,
      stats: { hp: iceAgeStore.stats.hp, san: iceAgeStore.stats.san },
      inventory: iceAgeStore.inventory.map(i => ({ name: i.name, count: i.count })),
      talents: iceAgeStore.selectedTalents.map(t => ({ id: t.id, name: t.name }))
    })) {
      fullText += chunk
      // 实时显示（过滤标签）
      judgingText.value = fullText.replace(/<state_update>[\s\S]*?<\/state_update>/gi, '').trim()
    }

    // 解析状态更新
    const { content, stateUpdate } = parseStateUpdate<{
      score: number;
      stat_changes: { hp: number; san: number };
      item_changes?: { remove?: string[]; add?: string[] };
      new_hidden_tags?: string[];
      remove_hidden_tags?: string[];
    }>(fullText)

    // 应用状态更新
    if (stateUpdate) {
      if (stateUpdate.stat_changes) {
        iceAgeStore.updateStats(stateUpdate.stat_changes)
      }
      if (stateUpdate.item_changes?.remove) {
        stateUpdate.item_changes.remove.forEach(name => iceAgeStore.removeItem(name, 1))
      }
      if (stateUpdate.new_hidden_tags) {
        stateUpdate.new_hidden_tags.forEach(tag => iceAgeStore.addHiddenTag(tag))
      }
    }

    // 更新日志
    iceAgeStore.updateDayLog(pendingCrisis.value.day, {
      playerAction: choice,
      result: content || judgingText.value
    })
  } catch (error) {
    console.error('判定失败:', error)
    iceAgeStore.updateDayLog(pendingCrisis.value.day, {
      playerAction: choice,
      result: '你的选择带来了意想不到的结果。'
    })
  } finally {
    isJudging.value = false
    judgingText.value = ''
    currentCrisisDay.value = null
    showCustomInput.value = false
    customAction.value = ''
    
    await nextTick()
    scrollToBottom()
  }
}

// 提交自定义行动
function submitCustomAction() {
  if (!customAction.value.trim()) return
  selectChoice(`E. ${customAction.value}`)
}

// 滚动到底部
function scrollToBottom() {
  if (scrollContainer.value) {
    scrollContainer.value.scrollTop = scrollContainer.value.scrollHeight
  }
}

// 背包展开状态
const showInventory = ref(false)

onMounted(async () => {
  // 如果没有日志，开始生成
  if (iceAgeStore.dayLogs.length === 0) {
    await loadMoreDays()
    await revealNextDay()
  }
})
</script>

<template>
  <div class="min-h-screen bg-gray-900 text-white flex flex-col lg:flex-row">
    <!-- 左侧边栏（移动端在底部） -->
    <aside class="order-2 lg:order-1 lg:w-64 lg:h-screen lg:sticky lg:top-0 bg-gray-800/95 backdrop-blur border-t lg:border-t-0 lg:border-r border-gray-700 p-4 flex-shrink-0">
      <!-- 状态信息 -->
      <div class="flex lg:flex-col gap-4 lg:gap-6">
        <!-- HP -->
        <div class="flex-1 lg:flex-none bg-gray-900/50 rounded-xl p-3">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-lg">❤️</span>
            <span class="text-xs text-gray-400 uppercase">生命值</span>
          </div>
          <div class="text-3xl font-bold" :class="iceAgeStore.stats.hp <= 30 ? 'text-red-400' : 'text-white'">
            {{ iceAgeStore.stats.hp }}
          </div>
          <div class="mt-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div class="h-full bg-red-500 transition-all" :style="{ width: `${iceAgeStore.stats.hp}%` }"></div>
          </div>
        </div>

        <!-- SAN -->
        <div class="flex-1 lg:flex-none bg-gray-900/50 rounded-xl p-3">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-lg">🧠</span>
            <span class="text-xs text-gray-400 uppercase">理智值</span>
          </div>
          <div class="text-3xl font-bold" :class="iceAgeStore.stats.san <= 30 ? 'text-purple-400' : 'text-white'">
            {{ iceAgeStore.stats.san }}
          </div>
          <div class="mt-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div class="h-full bg-purple-500 transition-all" :style="{ width: `${iceAgeStore.stats.san}%` }"></div>
          </div>
        </div>
      </div>

      <!-- 背包 -->
      <div class="mt-4 hidden lg:block">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm text-gray-400">🎒 背包</span>
          <span class="text-xs text-cyan-400">{{ iceAgeStore.inventory.reduce((sum, i) => sum + i.count, 0) }} 件</span>
        </div>
        <div v-if="iceAgeStore.inventory.length === 0" class="text-center text-gray-600 text-xs py-4">
          空空如也
        </div>
        <div v-else class="space-y-1 max-h-[40vh] overflow-y-auto">
          <div 
            v-for="item in iceAgeStore.inventory" 
            :key="item.name"
            class="flex items-center justify-between bg-gray-900/50 rounded-lg px-2 py-1.5 text-xs"
          >
            <span class="text-white truncate flex-1">{{ item.name }}</span>
            <span class="text-cyan-400 font-bold ml-2">×{{ item.count }}</span>
          </div>
        </div>
      </div>

      <!-- 移动端背包按钮 -->
      <button 
        class="lg:hidden flex items-center gap-2 px-3 py-2 bg-gray-900/50 rounded-lg text-sm"
        @click="showInventory = !showInventory"
      >
        <span>🎒</span>
        <span class="text-cyan-400 font-bold">{{ iceAgeStore.inventory.reduce((sum, i) => sum + i.count, 0) }}</span>
        <span class="text-gray-500 text-xs">{{ showInventory ? '▲' : '▼' }}</span>
      </button>

      <!-- 移动端背包展开 -->
      <div v-if="showInventory" class="lg:hidden mt-2 grid grid-cols-3 gap-1">
        <div 
          v-for="item in iceAgeStore.inventory" 
          :key="item.name"
          class="bg-gray-900/50 rounded-lg p-1.5 text-center text-xs"
        >
          <div class="text-white truncate">{{ item.name }}</div>
          <div class="text-cyan-400 font-bold">×{{ item.count }}</div>
        </div>
      </div>
    </aside>

    <!-- 右侧主内容区 -->
    <main class="order-1 lg:order-2 flex-1 flex flex-col min-h-0">
      <!-- 顶部信息栏 -->
      <div class="sticky top-0 z-40 bg-black/90 backdrop-blur border-b border-gray-800 p-3">
        <div class="max-w-3xl mx-auto flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="text-xl font-bold text-cyan-400">第 {{ iceAgeStore.day }} 天</span>
            <span class="text-sm px-2 py-0.5 rounded" :class="{
              'bg-blue-900/50 text-blue-300': iceAgeStore.currentTemperature > 0,
              'bg-cyan-900/50 text-cyan-300': iceAgeStore.currentTemperature <= 0 && iceAgeStore.currentTemperature > -20,
              'bg-purple-900/50 text-purple-300': iceAgeStore.currentTemperature <= -20
            }">
              🌡️ {{ iceAgeStore.currentTemperature }}°C
            </span>
          </div>
          <span class="text-xs text-gray-400">
            🏆 还需 <span class="text-yellow-400 font-bold">{{ Math.max(0, 51 - iceAgeStore.day) }}</span> 天
          </span>
        </div>
      </div>

      <!-- 日志滚动区域 -->
      <div 
        ref="scrollContainer"
        class="flex-1 overflow-y-auto p-4 pb-24 lg:pb-4"
      >
        <div class="max-w-3xl mx-auto space-y-4">
        <!-- 日志卡片列表 -->
        <div
          v-for="log in iceAgeStore.dayLogs"
          :key="log.day"
          class="bg-gray-800/50 rounded-lg p-4 border border-gray-700 transition-all"
          :class="{
            'border-yellow-500/50 bg-yellow-900/20': log.hasCrisis && !log.playerAction,
            'border-green-500/30': log.playerAction
          }"
        >
          <!-- 日志头部 -->
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <span class="text-cyan-400 font-bold">📅 第{{ log.day }}天</span>
              <span class="text-sm" :class="{
                'text-blue-300': log.temperature > 0,
                'text-cyan-400': log.temperature <= 0 && log.temperature > -20,
                'text-purple-400': log.temperature <= -20
              }">
                {{ log.temperature }}°C
              </span>
            </div>
            <div class="text-xs text-gray-500">
              HP: {{ log.stateSnapshot.hp }} / SAN: {{ log.stateSnapshot.san }}
            </div>
          </div>
          
          <!-- 叙述内容 -->
          <div class="text-gray-200 leading-relaxed mb-3 whitespace-pre-wrap">
            {{ log.narration }}
          </div>
          
          <!-- 危机事件选项 -->
          <template v-if="log.hasCrisis && !log.playerAction && log.isRevealed">
            <div class="border-t border-gray-700 pt-3 mt-3 space-y-2">
              <p class="text-yellow-400 text-sm font-medium mb-2">⚠️ 需要做出选择：</p>
              <button
                v-for="(choice, idx) in log.choices"
                :key="idx"
                class="w-full p-3 bg-gray-700 rounded-lg text-left hover:bg-gray-600 transition-all border border-gray-600 hover:border-cyan-500"
                @click="selectChoice(choice)"
              >
                {{ choice }}
              </button>
              
              <!-- 自定义输入 -->
              <button
                class="w-full p-3 bg-gray-700/50 rounded-lg text-left hover:bg-gray-600 transition-all border border-dashed border-gray-600"
                @click="showCustomInput = !showCustomInput"
              >
                E. 自由输入...
              </button>
              
              <div v-if="showCustomInput" class="flex gap-2 mt-2">
                <input
                  v-model="customAction"
                  type="text"
                  placeholder="输入你想做的事..."
                  class="flex-1 p-3 bg-gray-800 rounded-lg border border-gray-600 focus:border-cyan-500 focus:outline-none"
                  @keyup.enter="submitCustomAction"
                />
                <button
                  class="px-4 bg-cyan-600 rounded-lg hover:bg-cyan-500 transition"
                  @click="submitCustomAction"
                >
                  确定
                </button>
              </div>
            </div>
          </template>
          
          <!-- 已选择的行动和结果 -->
          <template v-if="log.playerAction">
            <div class="border-t border-gray-700 pt-3 mt-3">
              <p class="text-cyan-400 text-sm mb-1">你的选择：{{ log.playerAction }}</p>
              <p class="text-gray-300 italic">{{ log.result }}</p>
            </div>
          </template>
        </div>

        <!-- 继续按钮 -->
        <div 
          v-if="!pendingCrisis && !shouldEnd"
          class="flex justify-center py-4"
        >
          <button
            class="px-8 py-4 bg-cyan-600 hover:bg-cyan-500 rounded-lg font-bold text-lg transition-all active:scale-95 flex items-center gap-2"
            :disabled="isLoadingMore"
            @click="revealNextDay"
          >
            <span v-if="isLoadingMore" class="animate-spin">⏳</span>
            <span v-else>继续 →</span>
          </button>
        </div>

        <!-- 游戏结束提示 -->
        <div 
          v-if="shouldEnd"
          class="flex justify-center py-4"
        >
          <button
            class="px-8 py-4 bg-purple-600 hover:bg-purple-500 rounded-lg font-bold text-lg transition-all"
            @click="router.push('/ice-age/ending')"
          >
            {{ iceAgeStore.isVictory ? '🏆 查看结局' : '💀 查看结局' }}
          </button>
        </div>
      </div>
    </div>
    </main>
  </div>
</template>

<style scoped>
.active\:scale-95:active {
  transform: scale(0.95);
}
</style>

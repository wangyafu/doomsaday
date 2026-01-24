<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useIceAgeStore, type DayLog, type PendingDayLog } from '@/stores/iceAgeStore'
import StatBar from '@/components/Game/StatBar.vue'

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

// 模拟批量生成多天（实际应调用API）
async function generateBatchDays(): Promise<PendingDayLog[]> {
  // TODO: 替换为真实API调用
  // 这里先用模拟数据演示界面
  const startDay = iceAgeStore.day
  const days: PendingDayLog[] = []
  
  for (let i = 0; i < 5; i++) {
    const dayNum = startDay + i
    const temp = getTemperature(dayNum)
    const hasCrisis = Math.random() < 0.25 // 25%概率危机
    
    const narrations = [
      `第${dayNum}天，外面的温度已经降到了${temp}°C。你检查了一下物资储备，还算充足。`,
      `暴风雪呼啸了一整夜，第${dayNum}天的早晨异常安静。窗外积雪已经快没过了窗户。`,
      `收音机里传来断断续续的广播，说救援队正在组织，但没有具体时间。第${dayNum}天就这样过去了。`,
      `你在避难所里度过了平静的一天。外面${temp}°C的严寒让你不敢出门。`,
      `第${dayNum}天，你听到了远处传来的声响，不知道是风声还是别的什么。`
    ]
    
    const day: PendingDayLog = {
      day: dayNum,
      temperature: temp,
      narration: narrations[Math.floor(Math.random() * narrations.length)],
      hasCrisis: hasCrisis && i > 0, // 第一天不触发危机
      stateUpdate: {
        hp: Math.floor(Math.random() * 3) - 1, // -1 to +1
        san: Math.floor(Math.random() * 5) - 3  // -3 to +1
      }
    }
    
    if (day.hasCrisis) {
      day.choices = [
        'A. 小心翼翼地前往查看',
        'B. 留在原地不要出声',
        'C. 拿起武器准备防御',
        'D. 大声呼喊看是否有人回应'
      ]
    }
    
    days.push(day)
  }
  
  return days
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
async function selectChoice(choice: string) {
  if (!pendingCrisis.value) return
  
  // TODO: 调用Judge API
  // 这里先模拟结果
  const results = [
    '你的选择带来了意想不到的结果。一切似乎还在掌控之中。',
    '这个决定让你付出了一些代价，但至少活了下来。',
    '幸运的是，事情朝着好的方向发展了。'
  ]
  
  const result = results[Math.floor(Math.random() * results.length)]
  
  // 更新日志
  iceAgeStore.updateDayLog(pendingCrisis.value.day, {
    playerAction: choice,
    result: result
  })
  
  currentCrisisDay.value = null
  showCustomInput.value = false
  customAction.value = ''
  
  // 滚动到底部
  await nextTick()
  scrollToBottom()
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

onMounted(async () => {
  // 如果没有日志，开始生成
  if (iceAgeStore.dayLogs.length === 0) {
    await loadMoreDays()
    await revealNextDay()
  }
})
</script>

<template>
  <div class="min-h-screen bg-gray-900 text-white flex flex-col">
    <!-- 顶部状态栏 -->
    <div class="sticky top-0 z-40 bg-black/90 backdrop-blur p-4 border-b border-gray-800">
      <div class="max-w-3xl mx-auto">
        <!-- 天数和气温 -->
        <div class="text-center mb-3">
          <span class="text-2xl font-bold text-cyan-400">第 {{ iceAgeStore.day }} 天</span>
          <span class="ml-4 text-lg" :class="{
            'text-blue-300': iceAgeStore.currentTemperature > 0,
            'text-cyan-400': iceAgeStore.currentTemperature <= 0 && iceAgeStore.currentTemperature > -20,
            'text-purple-400': iceAgeStore.currentTemperature <= -20
          }">
            🌡️ {{ iceAgeStore.currentTemperature }}°C
          </span>
          <span class="ml-4 text-sm text-gray-400">
            🏆 距离胜利还需 <span class="text-yellow-400 font-semibold">{{ Math.max(0, 51 - iceAgeStore.day) }}</span> 天
          </span>
        </div>
        
        <!-- 状态条 -->
        <div class="grid grid-cols-2 gap-4 max-w-md mx-auto">
          <StatBar label="生命" :value="iceAgeStore.stats.hp" icon="❤️" />
          <StatBar label="理智" :value="iceAgeStore.stats.san" icon="🧠" />
        </div>
      </div>
    </div>

    <!-- 日志滚动区域 -->
    <div 
      ref="scrollContainer"
      class="flex-1 overflow-y-auto p-4"
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
  </div>
</template>

<style scoped>
.active\:scale-95:active {
  transform: scale(0.95);
}
</style>

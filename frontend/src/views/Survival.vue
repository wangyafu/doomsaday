<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/gameStore'
import { useUiStore } from '@/stores/uiStore'
import { narrate, judge } from '@/api'
import StatBar from '@/components/Game/StatBar.vue'
import TypewriterText from '@/components/Game/TypewriterText.vue'
import InventoryGrid from '@/components/Game/InventoryGrid.vue'

const router = useRouter()
const gameStore = useGameStore()
const uiStore = useUiStore()

// 当前日志文本
const logText = ref('')
// 是否有危机事件
const hasCrisis = ref(false)
// 选项列表
const choices = ref<string[]>([])
// 当前事件上下文（用于judge）
const eventContext = ref('')
// 自定义输入
const customAction = ref('')
// 是否显示自定义输入框
const showCustomInput = ref(false)
// 是否显示背包
const showInventory = ref(false)
// 打字机是否完成
const typewriterDone = ref(false)

// 检查游戏是否结束
const shouldEnd = computed(() => gameStore.isGameOver || gameStore.isVictory)

// 生成今日剧情
async function generateDailyNarration() {
  uiStore.setLoading(true)
  typewriterDone.value = false
  
  try {
    const response = await narrate({
      day: gameStore.day,
      stats: gameStore.stats,
      inventory: gameStore.inventory,
      hidden_tags: gameStore.hiddenTags,
      history: gameStore.history,
      shelter: gameStore.shelter
    })
    
    logText.value = response.log_text
    hasCrisis.value = response.has_crisis
    choices.value = response.choices || []
    eventContext.value = response.log_text
    
  } catch (error: any) {
    console.error('剧情生成失败:', error)
    console.error('错误详情:', error?.response?.data || error?.message)
    logText.value = `API调用失败: ${error?.response?.data?.detail || error?.message || '未知错误'}`
    hasCrisis.value = false
    choices.value = []
  } finally {
    uiStore.setLoading(false)
  }
}

// 选择行动
async function selectChoice(choice: string) {
  await executeAction(choice)
}

// 提交自定义行动
async function submitCustomAction() {
  if (!customAction.value.trim()) return
  await executeAction(customAction.value)
  customAction.value = ''
  showCustomInput.value = false
}

// 执行行动判定
async function executeAction(action: string) {
  uiStore.setLoading(true)
  typewriterDone.value = false
  
  try {
    const response = await judge({
      event_context: eventContext.value,
      action_content: action,
      stats: gameStore.stats,
      inventory: gameStore.inventory,
      history: gameStore.history
    })
    
    // 更新状态（带防御性检查）
    if (response.stat_changes) {
      gameStore.updateStats(response.stat_changes)
      console.log('状态变化:', response.stat_changes)
    }
    
    // 处理物品变化
    if (response.item_changes) {
      response.item_changes.remove?.forEach(item => {
        gameStore.removeItem(item.name, item.count)
        console.log('消耗物品:', item.name, 'x', item.count)
      })
      response.item_changes.add?.forEach(item => {
        gameStore.addItem(item)
        console.log('获得物品:', item.name, 'x', item.count)
      })
    }
    
    // 添加隐藏标签
    response.new_hidden_tags?.forEach(tag => {
      gameStore.addHiddenTag(tag)
      console.log('新标签:', tag)
    })
    
    // 记录高光时刻（高分行动）
    if (response.score >= 90) {
      gameStore.setHighLight(`第${gameStore.day}天: ${action} - ${response.narrative}`)
    }
    
    // 显示判定结果
    logText.value = response.narrative
    hasCrisis.value = false
    choices.value = []
    
    // 添加历史记录
    gameStore.addHistory(logText.value, response.score >= 60 ? 'success' : 'fail')
    
  } catch (error) {
    console.error('行动判定失败:', error)
    logText.value = '你的行动没有产生预期的效果...'
  } finally {
    uiStore.setLoading(false)
  }
}

// 进入下一天
function goNextDay() {
  gameStore.nextDay()
  
  // 检查是否结束
  if (shouldEnd.value) {
    router.push('/ending')
    return
  }
  
  generateDailyNarration()
}

// 打字机完成回调
function onTypewriterComplete() {
  typewriterDone.value = true
}

onMounted(() => {
  generateDailyNarration()
})
</script>

<template>
  <div class="survival min-h-screen bg-gray-900 text-white flex flex-col">
    <!-- 顶部状态栏 -->
    <div class="sticky top-0 z-40 bg-black/90 backdrop-blur p-4 border-b border-gray-800">
      <div class="max-w-2xl mx-auto">
        <!-- 天数 -->
        <div class="text-center mb-3">
          <span class="text-2xl font-bold text-red-500">第 {{ gameStore.day }} 天</span>
        </div>
        
        <!-- 状态条 -->
        <div class="grid grid-cols-3 gap-3">
          <StatBar label="生命" :value="gameStore.stats.hp" icon="❤️" />
          <StatBar label="饱腹" :value="gameStore.stats.hunger" icon="🍔" />
          <StatBar label="理智" :value="gameStore.stats.san" icon="🧠" />
        </div>
      </div>
    </div>
    
    <!-- 主内容区 -->
    <div class="flex-1 p-4 max-w-2xl mx-auto w-full">
      <!-- 日志区域 -->
      <div class="bg-gray-800/50 rounded-lg p-4 mb-4 min-h-[200px]">
        <!-- 加载中 -->
        <div v-if="uiStore.isLoading" class="flex items-center justify-center h-32">
          <div class="text-gray-400 animate-pulse">AI 正在思考...</div>
        </div>
        
        <!-- 日志文本 -->
        <div v-else>
          <TypewriterText 
            :text="logText" 
            :speed="40"
            @complete="onTypewriterComplete"
          />
        </div>
      </div>
      
      <!-- 选项区域 -->
      <div v-if="typewriterDone && !uiStore.isLoading" class="space-y-3">
        <!-- 危机选项 -->
        <template v-if="hasCrisis && choices.length > 0">
          <button 
            v-for="(choice, index) in choices" 
            :key="index"
            class="w-full p-3 bg-gray-800 rounded-lg text-left hover:bg-gray-700 
                   transition-all active:scale-98 border border-gray-700 hover:border-red-500"
            @click="selectChoice(choice)"
          >
            {{ choice }}
          </button>
          
          <!-- 自定义输入选项 -->
          <button 
            class="w-full p-3 bg-gray-800/50 rounded-lg text-left hover:bg-gray-700 
                   transition-all border border-dashed border-gray-600"
            @click="showCustomInput = !showCustomInput"
          >
            E. 自由输入...
          </button>
          
          <!-- 自定义输入框 -->
          <div v-if="showCustomInput" class="flex gap-2">
            <input 
              v-model="customAction"
              type="text"
              placeholder="输入你想做的事..."
              class="flex-1 p-3 bg-gray-800 rounded-lg border border-gray-600 
                     focus:border-red-500 focus:outline-none"
              @keyup.enter="submitCustomAction"
            />
            <button 
              class="px-4 bg-red-600 rounded-lg hover:bg-red-500 transition"
              @click="submitCustomAction"
            >
              确定
            </button>
          </div>
        </template>
        
        <!-- 无危机，进入下一天 -->
        <template v-else>
          <button 
            class="w-full p-4 bg-red-600 rounded-lg font-bold text-lg
                   hover:bg-red-500 transition-all active:scale-98"
            @click="goNextDay"
          >
            {{ hasCrisis ? '继续' : '进入下一天' }} →
          </button>
        </template>
      </div>
    </div>
    
    <!-- 底部工具栏 -->
    <div class="sticky bottom-0 bg-black/90 backdrop-blur border-t border-gray-800 p-3 safe-area-bottom">
      <div class="max-w-2xl mx-auto flex justify-around">
        <button 
          class="flex flex-col items-center text-gray-400 hover:text-white transition"
          @click="showInventory = !showInventory"
        >
          <span class="text-xl">🎒</span>
          <span class="text-xs">背包</span>
        </button>
        <button class="flex flex-col items-center text-gray-400 hover:text-white transition">
          <span class="text-xl">📜</span>
          <span class="text-xs">日志</span>
        </button>
        <button class="flex flex-col items-center text-gray-400 hover:text-white transition">
          <span class="text-xl">⚙️</span>
          <span class="text-xs">设置</span>
        </button>
      </div>
    </div>
    
    <!-- 背包弹窗 -->
    <Teleport to="body">
      <div 
        v-if="showInventory" 
        class="fixed inset-0 bg-black/80 z-50 flex items-end justify-center"
        @click.self="showInventory = false"
      >
        <div class="bg-gray-900 w-full max-w-lg rounded-t-2xl p-4 max-h-[70vh] overflow-y-auto">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-bold">🎒 背包</h3>
            <button 
              class="text-gray-400 hover:text-white"
              @click="showInventory = false"
            >✕</button>
          </div>
          <InventoryGrid :items="gameStore.inventory" />
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.active\:scale-98:active {
  transform: scale(0.98);
}
</style>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useIceAgeStore } from '@/stores/iceAgeStore'
import { iceAgeEnding } from '@/api'

const router = useRouter()
const iceAgeStore = useIceAgeStore()

// 结局数据
const epithet = ref('')        // 人设词
const comment = ref('')        // 毒舌评语
const causeOfDeath = ref<string | null>(null)
const radarChart = ref<number[]>([5, 5, 5, 5, 5])  // 默认值

// 是否加载中
const isLoading = ref(true)

// 是否胜利
const isVictory = computed(() => iceAgeStore.isVictory)

// 雷达图维度
const radarLabels = ['生存力', '抗寒力', '智慧', '运气', '心理素质']

// 调用后端 API 生成结局
async function generateEnding() {
  isLoading.value = true
  
  try {
    const result = await iceAgeEnding({
      days_survived: iceAgeStore.day,
      is_victory: isVictory.value,
      final_stats: { hp: iceAgeStore.stats.hp, san: iceAgeStore.stats.san },
      final_inventory: iceAgeStore.inventory.map(i => ({ name: i.name, count: i.count })),
      history: iceAgeStore.getRecentHistory(10).map(h => ({
        day: h.day,
        log: h.log,
        player_action: h.player_action || undefined,
        judge_result: h.judge_result || undefined
      })),
      talents: iceAgeStore.selectedTalents.map(t => ({ id: t.id, name: t.name }))
    })

    epithet.value = result.epithet
    comment.value = result.comment
    causeOfDeath.value = result.cause_of_death
    radarChart.value = result.radar_chart || [5, 5, 5, 5, 5]
  } catch (error) {
    console.error('结局生成失败:', error)
    // 备用结局
    if (isVictory.value) {
      epithet.value = '冰原幸存者'
      comment.value = `在零下四十度的极寒中存活了${iceAgeStore.day}天，你是真正的生存专家！`
      causeOfDeath.value = null
      radarChart.value = [8, 7, 6, 5, 7]
    } else {
      epithet.value = '冰封遗憾'
      causeOfDeath.value = iceAgeStore.stats.hp <= 0 ? '体力耗尽' : '精神崩溃'
      comment.value = `第${iceAgeStore.day}天，你的旅程结束了。冰原很残酷，但你已经尽力了。`
      radarChart.value = [Math.min(10, Math.floor(iceAgeStore.day / 5)), 4, 4, 3, 4]
    }
  } finally {
    isLoading.value = false
  }
}

function playAgain() {
  iceAgeStore.resetGame()
  router.push('/ice-age/start')
}

function goHome() {
  router.push('/')
}

onMounted(() => {
  generateEnding()
})
</script>

<template>
  <div class="min-h-screen bg-gray-900 text-white p-4">
    <div class="max-w-2xl mx-auto">
      <!-- 加载中 -->
      <div v-if="isLoading" class="flex flex-col items-center justify-center min-h-screen">
        <div class="text-4xl animate-bounce mb-4">❄️</div>
        <p class="text-cyan-400 animate-pulse">正在生成结局评价...</p>
      </div>

      <!-- 结局内容 -->
      <template v-else>
        <!-- 标题 -->
        <div class="text-center py-8">
          <div class="text-6xl mb-4">
            {{ isVictory ? '🏆' : '💀' }}
          </div>
          <h1 class="text-3xl font-bold mb-2" :class="isVictory ? 'text-yellow-400' : 'text-gray-400'">
            {{ isVictory ? '成功存活！' : '游戏结束' }}
          </h1>
          <p class="text-gray-400">
            存活天数: <span class="text-cyan-400 font-bold text-xl">{{ iceAgeStore.day }}</span> 天
          </p>
        </div>

        <!-- 人设词 -->
        <div class="bg-gray-800/50 rounded-xl p-6 mb-6 text-center border border-cyan-500/30">
          <p class="text-gray-400 text-sm mb-2">你的人设词</p>
          <h2 class="text-4xl font-bold text-cyan-400">「{{ epithet }}」</h2>
        </div>

        <!-- 死因（如果有） -->
        <div v-if="causeOfDeath" class="bg-red-900/30 rounded-lg p-4 mb-6 border border-red-500/30">
          <p class="text-red-400 text-sm mb-1">死因</p>
          <p class="text-white">{{ causeOfDeath }}</p>
        </div>

        <!-- 评语 -->
        <div class="bg-gray-800/50 rounded-lg p-4 mb-6">
          <p class="text-gray-400 text-sm mb-2">AI评语</p>
          <p class="text-gray-200 leading-relaxed italic">{{ comment }}</p>
        </div>

        <!-- 五维雷达图（简化版：进度条显示） -->
        <div class="bg-gray-800/50 rounded-lg p-4 mb-8">
          <p class="text-gray-400 text-sm mb-4">能力评估</p>
          <div class="space-y-3">
            <div v-for="(label, idx) in radarLabels" :key="idx" class="flex items-center gap-3">
              <span class="text-gray-400 w-20 text-sm">{{ label }}</span>
              <div class="flex-1 h-3 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  class="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-1000"
                  :style="{ width: `${radarChart[idx] * 10}%` }"
                ></div>
              </div>
              <span class="text-cyan-400 w-8 text-right font-bold">{{ radarChart[idx] }}</span>
            </div>
          </div>
        </div>

        <!-- 天赋回顾 -->
        <div class="bg-gray-800/50 rounded-lg p-4 mb-8">
          <p class="text-gray-400 text-sm mb-3">选择的天赋</p>
          <div class="flex flex-wrap gap-2">
            <div 
              v-for="talent in iceAgeStore.selectedTalents" 
              :key="talent.id"
              class="flex items-center gap-2 px-3 py-2 bg-cyan-900/30 rounded-lg"
            >
              <span>{{ talent.icon }}</span>
              <span class="text-cyan-300">{{ talent.name }}</span>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="flex flex-col sm:flex-row gap-4 justify-center pb-8">
          <button
            class="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-lg font-bold transition"
            @click="playAgain"
          >
            🔄 再来一局
          </button>
          <button
            class="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-bold transition"
            @click="goHome"
          >
            🏠 返回首页
          </button>
        </div>
      </template>
    </div>
  </div>
</template>

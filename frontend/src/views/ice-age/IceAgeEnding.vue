<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useIceAgeStore } from '@/stores/iceAgeStore'

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

// 模拟生成结局（TODO: 替换为真实API）
async function generateEnding() {
  isLoading.value = true
  
  try {
    // 模拟API延迟
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    if (isVictory.value) {
      const epithets = ['冰原幸存者', '极地战神', '寒冬破晓者', '不屈意志', '冰火传奇']
      epithet.value = epithets[Math.floor(Math.random() * epithets.length)]
      comment.value = `在零下四十度的极寒中存活了${iceAgeStore.day}天，你是真正的生存专家。当救援队到达时，你淡定地递给他们一杯热茶，仿佛这只是一次冬季露营。你的避难所被列为"人类求生典范"，供后人参观学习。`
      causeOfDeath.value = null
      radarChart.value = [8, 9, 7, 6, 8]
    } else {
      const epithets = ['冰封遗憾', '雪中倒下', '寒风挽歌', '冻土之殇', '极夜迷途']
      epithet.value = epithets[Math.floor(Math.random() * epithets.length)]
      
      if (iceAgeStore.stats.hp <= 0) {
        causeOfDeath.value = '体力耗尽，在严寒中永远沉睡'
        comment.value = `第${iceAgeStore.day}天，你的身体终于扛不住了。也许是缺少食物，也许是没能保暖，总之你在一个寒冷的夜晚安静地闭上了眼睛。下次记得多囤点煤炭。`
      } else {
        causeOfDeath.value = '精神崩溃，在幻觉中走向风雪'
        comment.value = `第${iceAgeStore.day}天，你终于无法忍受这无尽的孤独和恐惧。你脱掉了所有衣物，走进了风雪中，嘴里念叨着"我要回家"。至少最后你是微笑着的。`
      }
      radarChart.value = [
        Math.min(10, Math.floor(iceAgeStore.day / 5)),
        Math.floor(Math.random() * 5) + 3,
        Math.floor(Math.random() * 4) + 2,
        Math.floor(Math.random() * 6) + 1,
        iceAgeStore.stats.san > 0 ? Math.floor(iceAgeStore.stats.san / 15) : 1
      ]
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

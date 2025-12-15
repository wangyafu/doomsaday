<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/gameStore'
import { ending } from '@/api'
import type { EndingResponse } from '@/types'

const router = useRouter()
const gameStore = useGameStore()

// 结局数据
const endingData = ref<EndingResponse | null>(null)
const isLoading = ref(true)

// 雷达图标签
const radarLabels = ['战斗力', '生存力', '智慧', '运气', '心理']

// 是否通关
const isVictory = computed(() => gameStore.isVictory)

// 生成结局
async function generateEnding() {
  isLoading.value = true
  
  try {
    const response = await ending({
      days_survived: gameStore.day,
      high_light_moment: gameStore.highLightMoment,
      final_stats: gameStore.stats,
      final_inventory: gameStore.inventory,
      history: gameStore.history
    })
    
    endingData.value = response
  } catch (error) {
    console.error('结局生成失败:', error)
    endingData.value = {
      cause_of_death: gameStore.isGameOver ? '未知原因' : null,
      epithet: '末日幸存者',
      comment: '你的末日之旅结束了。',
      radar_chart: [5, 5, 5, 5, 5]
    }
  } finally {
    isLoading.value = false
  }
}

// 生成分享图片
async function generateShareImage() {
  try {
    const html2canvas = (await import('html2canvas')).default
    const element = document.getElementById('share-card')
    if (!element) return
    
    const canvas = await html2canvas(element, {
      backgroundColor: '#0D0D0D',
      scale: 2
    })
    
    // 下载图片
    const link = document.createElement('a')
    link.download = `末世模拟器_${endingData.value?.epithet}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  } catch (error) {
    console.error('生成图片失败:', error)
    alert('生成图片失败，请截图保存')
  }
}

// 重新开始
function restart() {
  gameStore.resetGame()
  router.push('/')
}

onMounted(() => {
  generateEnding()
})
</script>

<template>
  <div class="ending min-h-screen bg-black text-white p-4">
    <!-- 加载中 -->
    <div v-if="isLoading" class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div class="text-4xl mb-4 animate-pulse">📜</div>
        <p class="text-gray-400">正在生成你的末日档案...</p>
      </div>
    </div>
    
    <!-- 结局卡片 -->
    <div v-else class="max-w-md mx-auto">
      <!-- 分享卡片 -->
      <div id="share-card" class="bg-gray-900 rounded-lg p-6 mb-6">
        <!-- 标题 -->
        <div class="text-center mb-6">
          <p class="text-gray-500 text-sm mb-2">末世模拟器 · 丧尸围城篇</p>
          <h1 class="text-3xl font-bold text-red-500 mb-2">
            {{ isVictory ? '🎉 通关' : '💀 游戏结束' }}
          </h1>
        </div>
        
        <!-- 人设词 -->
        <div class="text-center mb-6">
          <div class="inline-block bg-red-900/50 px-6 py-3 rounded-lg">
            <p class="text-3xl font-bold text-red-400">
              「{{ endingData?.epithet }}」
            </p>
          </div>
        </div>
        
        <!-- 存活天数 -->
        <div class="text-center mb-6">
          <p class="text-gray-400">存活天数</p>
          <p class="text-5xl font-bold text-white">{{ gameStore.day }}</p>
        </div>
        
        <!-- 死因 -->
        <div v-if="endingData?.cause_of_death" class="text-center mb-6">
          <p class="text-gray-400 text-sm">死因</p>
          <p class="text-red-400">{{ endingData.cause_of_death }}</p>
        </div>
        
        <!-- 毒舌评语 -->
        <div class="bg-gray-800 rounded-lg p-4 mb-6">
          <p class="text-gray-300 italic">"{{ endingData?.comment }}"</p>
        </div>
        
        <!-- 雷达图（简化版） -->
        <div class="mb-6">
          <p class="text-gray-400 text-sm text-center mb-3">能力评估</p>
          <div class="grid grid-cols-5 gap-2">
            <div 
              v-for="(value, index) in endingData?.radar_chart" 
              :key="index"
              class="text-center"
            >
              <div class="h-20 bg-gray-800 rounded relative overflow-hidden">
                <div 
                  class="absolute bottom-0 left-0 right-0 bg-red-600 transition-all"
                  :style="{ height: `${(value || 0) * 10}%` }"
                ></div>
              </div>
              <p class="text-xs text-gray-500 mt-1">{{ radarLabels[index] }}</p>
              <p class="text-sm font-bold">{{ value }}</p>
            </div>
          </div>
        </div>
        
        <!-- 高光时刻 -->
        <div v-if="gameStore.highLightMoment" class="bg-yellow-900/30 rounded-lg p-3 mb-4">
          <p class="text-yellow-500 text-sm">⭐ 高光时刻</p>
          <p class="text-gray-300 text-sm">{{ gameStore.highLightMoment }}</p>
        </div>
        
        <!-- 最终状态 -->
        <div class="grid grid-cols-3 gap-2 text-center text-sm">
          <div class="bg-gray-800 rounded p-2">
            <p class="text-gray-500">❤️ HP</p>
            <p class="font-bold">{{ gameStore.stats.hp }}</p>
          </div>
         
          <div class="bg-gray-800 rounded p-2">
            <p class="text-gray-500">🧠 理智</p>
            <p class="font-bold">{{ gameStore.stats.san }}</p>
          </div>
        </div>
      </div>
      
      <!-- 操作按钮 -->
      <div class="space-y-3">
        <button 
          class="w-full py-4 bg-red-600 rounded-lg font-bold text-lg
                 hover:bg-red-500 transition-all"
          @click="generateShareImage"
        >
          📸 生成分享图片
        </button>
        
        <button 
          class="w-full py-4 bg-gray-800 rounded-lg font-bold
                 hover:bg-gray-700 transition-all"
          @click="restart"
        >
          🔄 重新开始
        </button>
      </div>
    </div>
  </div>
</template>

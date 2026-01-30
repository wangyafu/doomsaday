<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/gameStore'
import { submitArchive } from '@/api'
import { GameEngine } from '@/services/gameEngine'
import type { EndingResponse } from '@/types'
import wechatQrcode from '@/assets/微信收款码.png'
import alipayQrcode from '@/assets/支付宝收款码.jpg'

const router = useRouter()
const gameStore = useGameStore()

// 支持作者弹窗
const showDonation = ref(false)

// 结局数据
const endingData = ref<EndingResponse | null>(null)
const isLoading = ref(true)

// 档案分享相关
const showArchiveModal = ref(false)
const nickname = ref('')
const isSubmitting = ref(false)
const submitSuccess = ref(false)
const submitError = ref('')

// 雷达图标签
const radarLabels = ['战斗力', '生存力', '智慧', '运气', '人性']

// 是否通关
const isVictory = computed(() => gameStore.isVictory)

// 生成结局
async function generateEnding() {
  isLoading.value = true
  
  try {
    const response = await GameEngine.zombieEnding({
      days_survived: gameStore.day,
      high_light_moment: gameStore.highLightMoment,
      final_stats: gameStore.stats,
      final_inventory: gameStore.inventory,
      history: gameStore.history,
      profession: gameStore.profession
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

// 打开档案分享弹窗
function openArchiveModal() {
  showArchiveModal.value = true
  submitSuccess.value = false
  submitError.value = ''
}

// 提交到末世档案
async function submitToArchive() {
  if (!nickname.value.trim() || !endingData.value) return
  
  isSubmitting.value = true
  submitError.value = ''
  
  try {
    await submitArchive({
      nickname: nickname.value.trim(),
      epithet: endingData.value.epithet,
      days_survived: gameStore.day,
      is_victory: isVictory.value,
      cause_of_death: endingData.value.cause_of_death,
      comment: endingData.value.comment,
      radar_chart: endingData.value.radar_chart,
      radar_labels: radarLabels,
      profession_name: gameStore.profession?.name || null,
      profession_icon: gameStore.profession?.icon || null,
      game_type: 'zombie',
      extra_info: {
        highlight_moment: gameStore.highLightMoment || undefined
      }
    })
    submitSuccess.value = true
  } catch (error) {
    console.error('提交档案失败:', error)
    submitError.value = '提交失败，请稍后重试'
  } finally {
    isSubmitting.value = false
  }
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
        
        <!-- 职业信息 -->
        <div v-if="gameStore.profession" class="text-center mb-4">
          <span class="text-2xl">{{ gameStore.profession.icon }}</span>
          <span class="text-gray-300 ml-2">{{ gameStore.profession.name }}</span>
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
        <div class="grid grid-cols-2 gap-2 text-center text-sm">
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
      
      <!-- 支持作者 -->
      <div class="mb-6 text-center">
        <button 
          class="px-4 py-2 text-sm text-gray-400 hover:text-red-500 transition-colors duration-300"
          @click="showDonation = !showDonation"
        >
          {{ showDonation ? '收起' : '❤️ 喜欢这个游戏？支持作者' }}
        </button>
        
        <transition name="fade">
          <div v-if="showDonation" class="mt-4 p-6 bg-gray-900 border border-gray-700 rounded-lg">
            <p class="text-gray-300 mb-4">感谢您的支持！这将助力我更长久地运营末世模拟器，也会激励我打造更多有趣又有用的AI产品。 🙏</p>
            
            <!-- 收款码容器 -->
            <div class="flex justify-center gap-4 mb-4">
              <!-- 微信收款码 -->
              <div class="text-center">
                <div class="w-32 h-32 bg-white rounded-lg p-2 mb-2">
                  <img 
                    :src="wechatQrcode" 
                    alt="微信收款码" 
                    class="w-full h-full object-contain"
                  />
                </div>
                <span class="text-xs text-gray-400">微信</span>
              </div>
              
              <!-- 支付宝收款码 -->
              <div class="text-center">
                <div class="w-32 h-32 bg-white rounded-lg p-2 mb-2">
                  <img 
                    :src="alipayQrcode" 
                    alt="支付宝收款码" 
                    class="w-full h-full object-contain"
                  />
                </div>
                <span class="text-xs text-gray-400">支付宝</span>
              </div>
            </div>
            
            <p class="text-xs text-gray-500">扫码即可支持，金额随意 ☕</p>
          </div>
        </transition>
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
          class="w-full py-4 bg-purple-600 rounded-lg font-bold
                 hover:bg-purple-500 transition-all"
          @click="openArchiveModal"
        >
          📜 分享到末世档案
        </button>
        
        <button 
          class="w-full py-4 bg-gray-800 rounded-lg font-bold
                 hover:bg-gray-700 transition-all"
          @click="restart"
        >
          🔄 重新开始
        </button>
      </div>
      
      <!-- 档案分享弹窗 -->
      <teleport to="body">
        <transition name="fade">
          <div 
            v-if="showArchiveModal" 
            class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            @click.self="showArchiveModal = false"
          >
            <div class="bg-gray-900 rounded-lg p-6 w-full max-w-sm">
              <h3 class="text-xl font-bold text-center mb-4">📜 分享到末世档案</h3>
              
              <template v-if="!submitSuccess">
                <p class="text-gray-400 text-sm text-center mb-4">
                  将你的结局分享到首页，让其他幸存者见证你的末日传奇
                </p>
                
                <input 
                  v-model="nickname"
                  type="text"
                  placeholder="输入你的昵称（最多20字）"
                  maxlength="20"
                  class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg 
                         text-white placeholder-gray-500 focus:border-red-500 focus:outline-none mb-4"
                />
                
                <p v-if="submitError" class="text-red-500 text-sm text-center mb-4">
                  {{ submitError }}
                </p>
                
                <div class="flex gap-3">
                  <button 
                    class="flex-1 py-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-all"
                    @click="showArchiveModal = false"
                  >
                    取消
                  </button>
                  <button 
                    class="flex-1 py-3 bg-purple-600 rounded-lg font-bold
                           hover:bg-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    :disabled="!nickname.trim() || isSubmitting"
                    @click="submitToArchive"
                  >
                    {{ isSubmitting ? '提交中...' : '确认分享' }}
                  </button>
                </div>
              </template>
              
              <template v-else>
                <div class="text-center">
                  <p class="text-4xl mb-4">🎉</p>
                  <p class="text-green-400 mb-4">分享成功！</p>
                  <p class="text-gray-400 text-sm mb-6">你的末日传奇已被记录在档案中</p>
                  <button 
                    class="w-full py-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-all"
                    @click="showArchiveModal = false"
                  >
                    关闭
                  </button>
                </div>
              </template>
            </div>
          </div>
        </transition>
      </teleport>
      
      <!-- 联系开发者 -->
      <div class="mt-6 text-center">
        <p class="text-gray-500 text-sm mb-2">联系开发者</p>
        <a 
          href="https://www.xiaohongshu.com/user/profile/635f85b8000000001901fe43"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 
                 text-white rounded-lg hover:from-red-600 hover:to-pink-600 transition-all duration-300 
                 hover:scale-105 shadow-lg hover:shadow-red-500/50"
        >
          <span class="text-lg">📕</span>
          <span class="font-medium">小红书</span>
        </a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>

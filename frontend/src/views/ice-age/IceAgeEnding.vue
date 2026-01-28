<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useIceAgeStore } from '@/stores/iceAgeStore'
import { GameEngine } from '@/services/gameEngine'
import wechatQrcode from '@/assets/微信收款码.png'
import alipayQrcode from '@/assets/支付宝收款码.jpg'

const router = useRouter()
const iceAgeStore = useIceAgeStore()

// 支持作者弹窗
const showDonation = ref(false)

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
    const result = await GameEngine.iceAgeEnding({
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
      comment.value = `在极寒环境中存活了${iceAgeStore.day}天，你是真正的生存专家！`
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

// 生成分享图片
async function generateShareImage() {
  try {
    const html2canvas = (await import('html2canvas')).default
    const element = document.getElementById('share-card')
    if (!element) return
    
    const canvas = await html2canvas(element, {
      backgroundColor: '#111827',
      scale: 2
    })
    
    // 下载图片
    const link = document.createElement('a')
    link.download = `冰河末日_${epithet.value}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  } catch (error) {
    console.error('生成图片失败:', error)
    alert('生成图片失败，请截图保存')
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
  <div class="ending min-h-screen bg-black text-white p-4">
    <!-- 加载中 -->
    <div v-if="isLoading" class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div class="text-4xl mb-4 animate-pulse">❄️</div>
        <p class="text-gray-400">正在生成你的冰原档案...</p>
      </div>
    </div>
    
    <!-- 结局卡片 -->
    <div v-else class="max-w-md mx-auto">
      <!-- 分享卡片 -->
      <div id="share-card" class="bg-gray-900 rounded-lg p-6 mb-6">
        <!-- 标题 -->
        <div class="text-center mb-6">
          <p class="text-gray-500 text-sm mb-2">末世模拟器 · 冰河末世篇</p>
          <h1 class="text-3xl font-bold text-cyan-500 mb-2">
            {{ isVictory ? '🏆 通关' : '💀 游戏结束' }}
          </h1>
        </div>
        
        <!-- 人设词 -->
        <div class="text-center mb-6">
          <div class="inline-block bg-cyan-900/50 px-6 py-3 rounded-lg border border-cyan-500/30">
            <p class="text-3xl font-bold text-cyan-400">
              「{{ epithet }}」
            </p>
          </div>
        </div>
        
        <!-- 存活天数 -->
        <div class="text-center mb-6">
          <p class="text-gray-400">存活天数</p>
          <p class="text-5xl font-bold text-white">{{ iceAgeStore.day }}</p>
        </div>
        
        <!-- 死因 -->
        <div v-if="causeOfDeath" class="text-center mb-6">
          <p class="text-gray-400 text-sm">死因</p>
          <p class="text-red-400">{{ causeOfDeath }}</p>
        </div>
        
        <!-- 毒舌评语 -->
        <div class="bg-gray-800 rounded-lg p-4 mb-6">
          <p class="text-gray-300 italic">"{{ comment }}"</p>
        </div>
        
        <!-- 雷达图（柱状图样式） -->
        <div class="mb-6">
          <p class="text-gray-400 text-sm text-center mb-3">能力评估</p>
          <div class="grid grid-cols-5 gap-2">
            <div 
              v-for="(value, index) in radarChart" 
              :key="index"
              class="text-center"
            >
              <div class="h-20 bg-gray-800 rounded relative overflow-hidden">
                <div 
                  class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-cyan-600 to-blue-500 transition-all"
                  :style="{ height: `${(value || 0) * 10}%` }"
                ></div>
              </div>
              <p class="text-xs text-gray-500 mt-1">{{ radarLabels[index] }}</p>
              <p class="text-sm font-bold">{{ value }}</p>
            </div>
          </div>
        </div>
        
        <!-- 天赋回顾 -->
        <div v-if="iceAgeStore.selectedTalents.length > 0" class="bg-cyan-900/20 rounded-lg p-3 mb-4 border border-cyan-900/30">
          <p class="text-cyan-500 text-sm mb-2">❄️ 选择的天赋</p>
          <div class="flex flex-wrap gap-2">
            <div 
              v-for="talent in iceAgeStore.selectedTalents" 
              :key="talent.id"
              class="flex items-center gap-1 px-2 py-1 bg-gray-800 rounded text-xs"
            >
              <span>{{ talent.icon }}</span>
              <span class="text-cyan-300">{{ talent.name }}</span>
            </div>
          </div>
        </div>
        
        <!-- 最终状态 -->
        <div class="grid grid-cols-2 gap-2 text-center text-sm">
          <div class="bg-gray-800 rounded p-2">
            <p class="text-gray-500">❤️ HP</p>
            <p class="font-bold">{{ iceAgeStore.stats.hp }}</p>
          </div>
         
          <div class="bg-gray-800 rounded p-2">
            <p class="text-gray-500">🧠 理智</p>
            <p class="font-bold">{{ iceAgeStore.stats.san }}</p>
          </div>
        </div>
      </div>
      
      <!-- 支持作者 -->
      <div class="mb-6 text-center">
        <button 
          class="px-4 py-2 text-sm text-gray-400 hover:text-cyan-500 transition-colors duration-300"
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
          class="w-full py-4 bg-cyan-600 rounded-lg font-bold text-lg
                 hover:bg-cyan-500 transition-all shadow-lg hover:shadow-cyan-500/50 relative overflow-hidden group"
          @click="generateShareImage"
        >
          <span class="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
          <span class="relative">📸 生成分享图片</span>
        </button>
        <p class="text-xs text-center text-cyan-400/80 mt-1 mb-4">
          ✨ 快到小红书分享你的求生经历！
        </p>
        
        <button 
          class="w-full py-4 bg-blue-600 rounded-lg font-bold
                 hover:bg-blue-500 transition-all"
          @click="playAgain"
        >
          🔄 再来一局
        </button>
        
        <button 
          class="w-full py-4 bg-gray-800 rounded-lg font-bold
                 hover:bg-gray-700 transition-all"
          @click="goHome"
        >
          🏠 返回首页
        </button>
      </div>
      
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

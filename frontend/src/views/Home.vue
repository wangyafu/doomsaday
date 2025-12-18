<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/gameStore'
import PaymentModal from '@/components/PaymentModal.vue'
import { getArchives } from '@/api'
import type { ArchiveRecord } from '@/types'
import wechatQrcode from '@/assets/微信收款码.png'
import alipayQrcode from '@/assets/支付宝收款码.jpg'

const router = useRouter()
const gameStore = useGameStore()
const showDonation = ref(false)
const showPaymentModal = ref(false)

// 末世档案
const archives = ref<ArchiveRecord[]>([])
const isLoadingArchives = ref(true)

function handleStartGame() {
  gameStore.checkDailyReset()
  
  // 1. 如果是支持者，直接开始
  if (gameStore.is_supporter) {
    executeStart()
    return
  }

  // 2. 如果游玩次数 < 3，计数并开始
  if (gameStore.daily_play_count < 3) {
    gameStore.incrementPlayCount()
    executeStart()
    return
  }

  // 3. 达到限制，弹出付费框
  showPaymentModal.value = true
}

function onPaymentConfirm() {
  showPaymentModal.value = false
  executeStart()
}

function onPaymentClose() {
  showPaymentModal.value = false
  // 允许“白嫖”，计数并开始
  gameStore.incrementPlayCount()
  executeStart()
}

function executeStart() {
  gameStore.resetGame()
  // 信任罐头现在通过 Market 界面选购，不再直接发放
  router.push('/rebirth')
}

function continueGame() {
  if (gameStore.day > 1) {
    router.push('/survival')
  }
}

// 加载档案列表
async function loadArchives() {
  try {
    archives.value = await getArchives(10)
  } catch (error) {
    console.error('加载档案失败:', error)
  } finally {
    isLoadingArchives.value = false
  }
}

onMounted(() => {
  loadArchives()
})
</script>

<template>
  <div class="home min-h-screen flex flex-col items-center justify-center p-4 bg-black">
    <!-- 故障效果背景 -->
    <div class="absolute inset-0 bg-noise opacity-10 pointer-events-none"></div>
    
    <!-- 标题 -->
    <div class="text-center mb-12 relative">
      <h1 class="text-4xl md:text-6xl font-bold text-red-600 mb-4 glitch-effect">
        末世模拟器
      </h1>
      <p class="text-xl text-gray-400">丧尸围城篇</p>
      
      <!-- 支持者徽章 -->
      <div v-if="gameStore.is_supporter" class="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-yellow-600/20 border border-yellow-600 rounded-full">
        <span class="text-lg">⭐</span>
        <span class="text-yellow-500 font-bold text-sm">今日支持者</span>
        <span class="text-xs text-yellow-600/70">无限畅玩已激活</span>
      </div>
    </div>
    
    <!-- 世界观选择卡片 -->
    <div class="grid gap-4 w-full max-w-md">
      <!-- 丧尸围城 - 可选 -->
      <div 
        class="scenario-card bg-gray-900 border-2 border-red-600 rounded-lg p-6 cursor-pointer
               hover:bg-gray-800 transition-all duration-300 hover:scale-105"
        @click="handleStartGame"
      >
        <div class="flex items-center gap-4">
          <span class="text-4xl">🧟</span>
          <div>
            <h2 class="text-xl font-bold text-red-500">丧尸围城</h2>
            <p class="text-gray-400 text-sm">病毒爆发，城市沦陷</p>
          </div>
        </div>
      </div>
      
      <!-- 极寒末世 - 锁定 -->
      <div class="scenario-card bg-gray-900 border border-gray-700 rounded-lg p-6 opacity-50 cursor-not-allowed">
        <div class="flex items-center gap-4">
          <span class="text-4xl">❄️</span>
          <div>
            <h2 class="text-xl font-bold text-gray-500">极寒末世</h2>
            <p class="text-gray-600 text-sm">信号丢失...</p>
          </div>
        </div>
      </div>
      
      <!-- 核战废土 - 锁定 -->
      <div class="scenario-card bg-gray-900 border border-gray-700 rounded-lg p-6 opacity-50 cursor-not-allowed">
        <div class="flex items-center gap-4">
          <span class="text-4xl">☢️</span>
          <div>
            <h2 class="text-xl font-bold text-gray-500">核战废土</h2>
            <p class="text-gray-600 text-sm">信号丢失...</p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 继续游戏按钮 -->
    <button 
      v-if="gameStore.day > 1"
      class="mt-8 px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition"
      @click="continueGame"
    >
      继续游戏 (第{{ gameStore.day }}天)
    </button>
    
    <!-- 底部提示 -->
    <p class="mt-8 text-gray-600 text-sm">点击选择末日场景开始游戏</p>
    
    <!-- 末世档案 -->
    <div v-if="archives.length > 0" class="mt-12 w-full max-w-md">
      <h2 class="text-xl font-bold text-gray-400 mb-4 text-center">📜 末世档案</h2>
      <div class="space-y-4">
        <div 
          v-for="archive in archives" 
          :key="archive.id"
          class="archive-card bg-gray-900 border border-gray-800 rounded-lg p-5 hover:border-red-900 transition-all"
        >
          <!-- 头部：昵称 + 状态 -->
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <span v-if="archive.profession_icon" class="text-xl">{{ archive.profession_icon }}</span>
              <span class="font-bold text-white text-lg">{{ archive.nickname }}</span>
            </div>
            <span 
              class="px-3 py-1 text-sm rounded-full font-bold"
              :class="archive.is_victory ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'"
            >
              {{ archive.is_victory ? '🎉 通关' : '💀 阵亡' }}
            </span>
          </div>
          
          <!-- 人设词 -->
          <div class="text-center mb-4">
            <div class="inline-block bg-red-900/30 px-4 py-2 rounded-lg">
              <p class="text-xl font-bold text-red-400">「{{ archive.epithet }}」</p>
            </div>
          </div>
          
          <!-- 职业 + 存活天数 -->
          <div class="flex items-center justify-center gap-6 mb-4">
            <div v-if="archive.profession_name" class="text-center">
              <p class="text-gray-500 text-xs">职业</p>
              <p class="text-white">{{ archive.profession_name }}</p>
            </div>
            <div class="text-center">
              <p class="text-gray-500 text-xs">存活天数</p>
              <p class="text-3xl font-bold text-white">{{ archive.days_survived }}</p>
            </div>
          </div>
          
          <!-- 死因 -->
          <div v-if="archive.cause_of_death" class="text-center mb-4">
            <p class="text-gray-500 text-xs">死因</p>
            <p class="text-red-400 text-sm">{{ archive.cause_of_death }}</p>
          </div>
          
          <!-- 毒舌评语 -->
          <div class="bg-gray-800/50 rounded-lg p-3 mb-4">
            <p class="text-gray-300 text-sm italic">"{{ archive.comment }}"</p>
          </div>
          
          <!-- 雷达图（简化柱状图） -->
          <div class="grid grid-cols-5 gap-1">
            <div 
              v-for="(value, index) in archive.radar_chart" 
              :key="index"
              class="text-center"
            >
              <div class="h-12 bg-gray-800 rounded relative overflow-hidden">
                <div 
                  class="absolute bottom-0 left-0 right-0 bg-red-600/80 transition-all"
                  :style="{ height: `${(value || 0) * 10}%` }"
                ></div>
              </div>
              <p class="text-xs text-gray-500 mt-1">{{ ['战斗', '生存', '智慧', '运气', '人性'][index] }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 档案加载中 -->
    <div v-else-if="isLoadingArchives" class="mt-12 text-gray-500 text-sm">
      正在加载末世档案...
    </div>
    
    <!-- 支持作者 -->
    <div class="mt-12 text-center">
      <button 
        class="px-4 py-2 text-sm text-gray-400 hover:text-red-500 transition-colors duration-300"
        @click="showDonation = !showDonation"
      >
        {{ showDonation ? '收起' : '❤️ 支持作者' }}
      </button>
      
      <transition name="fade">
        <div v-if="showDonation" class="mt-4 p-6 bg-gray-900 border border-gray-700 rounded-lg max-w-sm mx-auto">
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
    
    <!-- 联系开发者 -->
    <div class="mt-8 text-center">
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

    <!-- 支付弹窗 -->
    <PaymentModal 
      :show="showPaymentModal" 
      @close="onPaymentClose"
      @confirm="onPaymentConfirm"
    />
  </div>
</template>

<style scoped>
.bg-noise {
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
}

.glitch-effect {
  animation: glitch 2s infinite;
}

@keyframes glitch {
  0%, 90%, 100% { transform: translate(0); }
  92% { transform: translate(-2px, 2px); }
  94% { transform: translate(2px, -2px); }
  96% { transform: translate(-2px, -2px); }
  98% { transform: translate(2px, 2px); }
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>

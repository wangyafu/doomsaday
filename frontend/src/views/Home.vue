<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/gameStore'
import { useIceAgeStore } from '@/stores/iceAgeStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { checkHealth } from '@/api'
import PaymentModal from '@/components/PaymentModal.vue'
import SettingsModal from '@/components/SettingsModal.vue'

import wechatQrcode from '@/assets/微信收款码.png'
import alipayQrcode from '@/assets/支付宝收款码.jpg'


const router = useRouter()
const gameStore = useGameStore()
const iceAgeStore = useIceAgeStore()
const settingsStore = useSettingsStore()

const showDonation = ref(false)
const showPaymentModal = ref(false)
const showSettingsModal = ref(false)

const isBackendConnected = ref<'connected' | 'full' | 'disconnected'>('connected')

// 在组件挂载时检查连接
onMounted(async () => {
  isBackendConnected.value = await checkHealth()
  if (isBackendConnected.value !== 'connected') {
    // 如果连接失败，尝试自动引导到自定义模式(这里暂时不自动弹窗，只显示UI提示)
    console.log("后端未连接或爆满，进入离线/自定义模式")
  }
})

function handleStartGame() {
  // 如果后端未连接且未设置自定义API，提示用户
  if (isBackendConnected.value !== 'connected' && !settingsStore.isCustomMode) {
    showSettingsModal.value = true
    return
  }
  
  // 移除强制付费检查，直接进入
  gameStore.resetGame()
  router.push('/rebirth')
}

function handleStartIceAge() {
   // 如果后端未连接且未设置自定义API，提示用户
  if (isBackendConnected.value !== 'connected' && !settingsStore.isCustomMode) {
    showSettingsModal.value = true
    return
  }

  iceAgeStore.resetGame()
  router.push('/ice-age/start')
}

function executeStart() {
  gameStore.resetGame()
  router.push('/rebirth')
}
function onPaymentConfirm() {
  showPaymentModal.value = false
  gameStore.setSupporter(true) 
  iceAgeStore.setSupporter(true)
}

function onPaymentClose() {
  showPaymentModal.value = false
}

function continueGame() {
  if (gameStore.day > 1) {
    router.push('/survival')
  }
}



</script>

<template>
  <div class="home min-h-screen flex flex-col items-center justify-center p-4 bg-black">
    <!-- 故障效果背景 -->
    <div class="absolute inset-0 bg-noise opacity-10 pointer-events-none"></div>
    
    <!-- 设置按钮 (左上角或右上角) -->
    <button 
      @click="showSettingsModal = true"
      class="fixed top-4 right-4 z-40 p-2 text-gray-500 hover:text-white transition-colors rounded-full hover:bg-white/10"
      title="API设置"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    </button>

    <!-- 标题 -->
    <div class="text-center mb-12 relative">
      <h1 class="text-4xl md:text-6xl font-bold text-red-600 mb-4 glitch-effect">
        末世模拟器
      </h1>
      
      <!-- 支持者徽章 -->
      <div v-if="gameStore.is_supporter" class="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-yellow-600/20 border border-yellow-600 rounded-full">
        <span class="text-lg">⭐</span>
        <span class="text-yellow-500 font-bold text-sm">今日支持者</span>
        <span class="text-xs text-yellow-600/70">无限畅玩已激活</span>
      </div>

      <!-- 后端连接状态 -->
      <div class="mt-4 flex flex-col items-center justify-center gap-1 text-xs">
         <span v-if="isBackendConnected === 'connected'" class="text-green-500">● 服务器已连接</span>
         <span v-else-if="isBackendConnected === 'full'" class="text-yellow-500">● 服务器繁忙</span>
         <span v-else class="text-red-500">● 服务器未连接</span>
         
         <div v-if="isBackendConnected !== 'connected'" class="mt-1 flex flex-col items-center gap-1">
            <span class="text-gray-400">
              请在右上角 <span class="underline cursor-pointer hover:text-white" @click="showSettingsModal = true">设置自定义API</span>
            </span>
             <a href="https://github.com/wangyafu/doomsaday" target="_blank" class="text-blue-500 hover:text-blue-400 border-b border-blue-500/50">
              本项目已开源
            </a>
         </div>
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
      
      <!-- 冰河末世 - 可选 -->
      <div 
        class="scenario-card bg-gray-900 border-2 border-cyan-600 rounded-lg p-6 cursor-pointer
               hover:bg-gray-800 transition-all duration-300 hover:scale-105"
        @click="handleStartIceAge"
      >
        <div class="flex items-center gap-4">
          <span class="text-4xl">❄️</span>
          <div>
            <h2 class="text-xl font-bold text-cyan-400">冰河末世</h2>
            <p class="text-gray-400 text-sm">极寒来袭，存活40天</p>
            <span class="inline-block mt-1 px-2 py-0.5 text-xs bg-cyan-600/30 text-cyan-300 rounded">NEW</span>
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
    
    <!-- 底部链接区域 -->
    <div class="mt-12 mb-12 flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
      <!-- 联系开发者 -->
      <div class="text-center">
        <p class="text-gray-500 text-sm mb-3">联系开发者</p>
        <a 
          href="https://www.xiaohongshu.com/user/profile/635f85b8000000001901fe43"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 
                 text-white rounded-xl hover:from-red-600 hover:to-pink-600 transition-all duration-300 
                 hover:scale-105 shadow-lg hover:shadow-red-500/50"
        >
          <span class="text-xl">📕</span>
          <span class="font-bold text-lg">小红书</span>
        </a>
      </div>

      <!-- 更多好玩 -->
      <div class="text-center">
        <p class="text-gray-500 text-sm mb-3">更多好玩</p>
        <a 
          href="https://jingshenwuzhong.pages.dev"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 
                 text-white rounded-xl hover:from-purple-600 hover:to-indigo-600 transition-all duration-300 
                 hover:scale-105 shadow-lg hover:shadow-purple-500/50"
        >
          <span class="text-xl">🧠</span>
          <span class="font-bold text-lg">精神物种</span>
        </a>
      </div>
    </div>

    <!-- 支付弹窗 -->
    <PaymentModal 
      :show="showPaymentModal" 
      @close="onPaymentClose"
      @confirm="onPaymentConfirm"
    />

    <!-- 设置弹窗 -->
    <SettingsModal 
      :show="showSettingsModal" 
      @close="showSettingsModal = false"
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

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/gameStore'
import wechatQrcode from '@/assets/微信收款码.png'
import alipayQrcode from '@/assets/支付宝收款码.jpg'

const router = useRouter()
const gameStore = useGameStore()
const showDonation = ref(false)

function startGame() {
  gameStore.resetGame()
  router.push('/rebirth')
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
    
    <!-- 标题 -->
    <div class="text-center mb-12 relative">
      <h1 class="text-4xl md:text-6xl font-bold text-red-600 mb-4 glitch-effect">
        末世模拟器
      </h1>
      <p class="text-xl text-gray-400">丧尸围城篇</p>
    </div>
    
    <!-- 世界观选择卡片 -->
    <div class="grid gap-4 w-full max-w-md">
      <!-- 丧尸围城 - 可选 -->
      <div 
        class="scenario-card bg-gray-900 border-2 border-red-600 rounded-lg p-6 cursor-pointer
               hover:bg-gray-800 transition-all duration-300 hover:scale-105"
        @click="startGame"
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
    
    <!-- 底部提示 -->
    <p class="mt-8 text-gray-600 text-sm">点击选择末日场景开始游戏</p>
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

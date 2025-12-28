<script setup lang="ts">
import { ref } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import wechatQrcode from '@/assets/微信一元收款码.png'
import alipayQrcode from '@/assets/支付宝一元收款码.jpg'

defineProps<{
  show: boolean
}>()

const emit = defineEmits(['close', 'confirm'])

const gameStore = useGameStore()
const isVerifying = ref(false)
const showSuccess = ref(false)
const paymentMethod = ref<'wechat' | 'alipay'>('wechat')

// 按钮 A: 我已支付
async function handleConfirm() {
  isVerifying.value = true
  
  // 模拟验证过程
  await new Promise(resolve => setTimeout(resolve, 1500))
  
  isVerifying.value = false
  showSuccess.value = true
  
  // 模拟成功后等待 1.5 秒关闭
  setTimeout(() => {
    gameStore.setSupporter(true)
    // 奖励发放移到 Home.vue 的 onPaymentConfirm 中执行（在 resetGame 之后）
    
    emit('confirm')
    showSuccess.value = false
  }, 1500)
}

// 按钮 B: 下次一定
function handleCancel() {
  emit('close')
}
</script>

<template>
  <transition name="modal-fade">
    <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
      <div class="w-full max-w-md max-h-[90vh] overflow-y-auto bg-gray-900 border-2 border-yellow-600 rounded-lg shadow-[0_0_30px_rgba(202,138,4,0.3)]">
        <!-- 头部 -->
        <div class="bg-yellow-600 p-3 flex items-center gap-2 sticky top-0 z-10">
          <span class="text-xl">⚠️</span>
          <h2 class="text-black font-bold text-lg tracking-wider flex-1">来自开发者的紧急通讯</h2>
          <!-- 关闭按钮 -->
          <button 
            @click="handleCancel"
            class="w-8 h-8 flex items-center justify-center text-black/70 hover:text-black hover:bg-yellow-500 rounded-full transition-all"
            :disabled="isVerifying || showSuccess"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- 内容区 -->
        <div class="p-4 space-y-3">
          <div class="text-gray-300 space-y-2 leading-relaxed">
            <p class="font-bold text-yellow-500 text-sm">幸存者，你已连续挑战 2 次。</p>
            <p class="text-xs">维持这个 AI 世界的运转并不免费。为了让 Deepseek 生成真实的求生反馈，每局需燃烧约 <span class="text-red-500 font-mono">0.156元</span> 的API服务成本。</p>
            <p class="text-xs italic border-l-2 border-gray-700 pl-3 py-1">
              我是独立开发者，正在自费维持这个世界。如果你觉得这个游戏有价值，请投出一张"信任票"。
            </p>
            <div class="text-center py-1">
              <p class="text-lg font-bold text-white">只需 <span class="text-yellow-500 text-xl">￥1.00</span></p>
              <p class="text-xs text-gray-500">(相当于分担 6 局API费用)</p>
            </div>
            <p class="text-xs text-center font-bold text-green-500">今日无限畅玩 + 🎒【信任物资包】</p>
          </div>

          <!-- 支付方式切换 -->
          <div class="flex justify-center gap-4">
            <button 
              @click="paymentMethod = 'wechat'"
              :class="['px-3 py-1 text-xs rounded transition-all', paymentMethod === 'wechat' ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-500']"
            >
              微信支付
            </button>
            <button 
              @click="paymentMethod = 'alipay'"
              :class="['px-3 py-1 text-xs rounded transition-all', paymentMethod === 'alipay' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-500']"
            >
              支付宝
            </button>
          </div>

          <!-- 收款码展示区 -->
          <div class="flex justify-center py-3 bg-black/40 rounded-lg">
            <div class="text-center">
              <div class="w-40 h-40 sm:w-48 sm:h-48 bg-white p-1.5 rounded-lg mb-2 shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                <img 
                  v-if="paymentMethod === 'wechat'"
                  :src="wechatQrcode" 
                  alt="微信支付" 
                  class="w-full h-full object-contain" 
                />
                <img 
                  v-else
                  :src="alipayQrcode" 
                  alt="支付宝支付" 
                  class="w-full h-full object-contain" 
                />
              </div>
              <p class="text-xs text-gray-400">
                扫描二维码支持 <span class="text-yellow-500 font-bold">1.00</span> 元
              </p>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="flex flex-col gap-3 pt-2">
            <button 
              @click="handleConfirm"
              :disabled="isVerifying || showSuccess"
              class="relative w-full py-3 bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-700 text-black font-bold rounded transition-all active:scale-95 overflow-hidden"
            >
              <span v-if="!isVerifying && !showSuccess">✅ 我已支付 1.00元，接入无限模式</span>
              <span v-else-if="isVerifying" class="flex items-center justify-center gap-2">
                <svg class="animate-spin h-5 w-5 text-black" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                正在连接银行...
              </span>
              <span v-else>验证通过！物资已发放。</span>
            </button>
            
            <button 
              @click="handleCancel"
              :disabled="isVerifying || showSuccess"
              class="w-full py-2 text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              🏃‍♂️ 暂时没钱，下次一定
            </button>
          </div>
        </div>
      </div>

      <!-- 成功 Toast -->
      <transition name="toast">
        <div v-if="showSuccess" class="fixed top-10 left-1/2 -translate-x-1/2 px-6 py-3 bg-green-600 text-white font-bold rounded-full shadow-lg z-[60]">
          验证通过！开发者选择无条件信任你。
        </div>
      </transition>
    </div>
  </transition>
</template>

<style scoped>
.modal-fade-enter-active, .modal-fade-leave-active {
  transition: opacity 0.4s ease;
}
.modal-fade-enter-from, .modal-fade-leave-to {
  opacity: 0;
}

.toast-enter-active, .toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from, .toast-leave-to {
  opacity: 0;
  transform: translate(-50%, -20px);
}

/* 简单的微动效 */
.bg-yellow-600 {
  box-shadow: inset 0 0 10px rgba(0,0,0,0.2);
}
</style>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useIceAgeStore } from '@/stores/iceAgeStore'

const router = useRouter()
const iceAgeStore = useIceAgeStore()

// 演出阶段
type Phase = 'dream' | 'wake' | 'realization' | 'countdown'
const phase = ref<Phase>('dream')

// 梦境阶段文案 (黑色背景，断续)
const dreamLines = [
  '好冷……',
  '身体……动不了……',
  '这就是……结局吗……',
  '不……',
  '醒醒……'
]

// 苏醒阶段文案 (灰蓝色背景，环境描写)
const wakeLines = [
  '你猛地吸了一口冷气，胸腔剧烈起伏。',
  '刺骨的寒意像针一样扎进皮肤。',
  '睁开眼，世界是一片死寂的灰白。',
  '窗户玻璃上结满了厚厚的冰花。'
]

// 认知阶段文案 (强调数据)
const realizationLines = [
  '你颤抖着看向墙上的电子温度计……',
  '【10°C】',
  '警报声在空荡的房间里回荡：',
  '“全球气温将在20天后降至零下30度。”',
  '“请所有幸存者做好御寒准备。”'
]

// 状态控制
const currentText = ref('')
const isTyping = ref(false)
const showSkip = ref(true)

// 打字机效果
async function typeText(text: string, speed = 80) {
  isTyping.value = true
  currentText.value = ''
  
  // 简单的打字效果
  for (const char of text) {
    currentText.value += char
    await new Promise(resolve => setTimeout(resolve, speed))
  }
  
  isTyping.value = false
  // 读完一行后的停顿，根据内容长度动态调整，最少停顿1秒
  const pauseTime = Math.max(1000, text.length * 50)
  await new Promise(resolve => setTimeout(resolve, pauseTime))
}

// 播放梦境阶段
async function playDreamPhase() {
  phase.value = 'dream'
  for (const line of dreamLines) {
    if (!showSkip.value) return // 如果已经跳过
    await typeText(line, 120) // 梦境语速较慢
  }
  await nextPhase()
}

// 播放苏醒阶段
async function playWakePhase() {
  phase.value = 'wake'
  // 稍微停顿让背景色过渡
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  for (const line of wakeLines) {
    if (!showSkip.value) return
    await typeText(line, 60) // 正常语速
  }
  await nextPhase()
}

// 播放认知阶段
async function playRealizationPhase() {
  phase.value = 'realization'
  for (const line of realizationLines) {
    if (!showSkip.value) return
    // 特殊处理强调文本
    if (line.includes('【')) {
      await typeText(line, 150) // 强调文本慢一点
    } else {
      await typeText(line, 60)
    }
  }
  await nextPhase()
}

// 进入下一阶段
async function nextPhase() {
  if (!showSkip.value) return

  if (phase.value === 'dream') {
    await playWakePhase()
  } else if (phase.value === 'wake') {
    await playRealizationPhase()
  } else if (phase.value === 'realization') {
    phase.value = 'countdown'
  }
}

function proceed() {
  iceAgeStore.resetGame()
  router.push('/ice-age/talent')
}

// 跳过整个演出
function skipToEnd() {
  showSkip.value = false
  proceed()
}

onMounted(() => {
  playDreamPhase()
})
</script>

<template>
  <div 
    class="min-h-screen flex flex-col items-center justify-center p-6 cursor-pointer transition-colors duration-[2000ms]"
    :class="{
      'bg-black': phase === 'dream',
      'bg-slate-900': phase === 'wake',
      'bg-slate-800': phase === 'realization',
      'bg-slate-700': phase === 'countdown'
    }"
    @click="phase === 'countdown' ? proceed() : skipToEnd()"
  >
    <!-- 内容容器 -->
    <div class="max-w-2xl w-full text-center min-h-[50vh] flex flex-col justify-center items-center">
      
      <!-- 梦境/苏醒/认知阶段的文字 -->
      <div v-if="phase !== 'countdown'" class="space-y-6">
        <p 
          class="text-xl md:text-2xl font-light leading-relaxed tracking-wider transition-all duration-300 min-h-[3rem]"
          :class="{
            'text-gray-500 italic': phase === 'dream',
            'text-cyan-100': phase === 'wake',
            'text-white': phase === 'realization',
            'scale-110 font-bold text-cyan-400': currentText.includes('【')
          }"
        >
          {{ currentText }}
          <span v-if="isTyping" class="animate-pulse">_</span>
        </p>
      </div>

      <!-- 倒计时阶段 -->
      <div v-else class="animate-fade-in-up space-y-12">
        <div class="space-y-4">
          <h1 class="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-cyan-300 to-blue-600 drop-shadow-lg">
            50天
          </h1>
          <p class="text-2xl text-cyan-200 font-light tracking-[0.5em] uppercase">
            生存目标
          </p>
        </div>

        <div class="space-y-2 text-gray-300">
          <p>物资短缺 | 极寒天气 | 人性考验</p>
        </div>

        <button 
          class="px-12 py-4 bg-cyan-900/50 hover:bg-cyan-800 text-cyan-100 rounded-full border border-cyan-700 hover:border-cyan-500 transition-all duration-300 hover:scale-105 backdrop-blur-sm group"
          @click.stop="proceed"
        >
          <span class="mr-2">开始求生</span>
          <span class="group-hover:translate-x-1 inline-block transition-transform">→</span>
        </button>
      </div>

    </div>

    <!-- 底部提示 -->
    <div class="fixed bottom-8 text-center transition-opacity duration-1000" :class="showSkip ? 'opacity-100' : 'opacity-0'">
      <p v-if="phase !== 'countdown'" class="text-gray-600 text-sm hover:text-gray-400 transition-colors">
        点击屏幕跳过
      </p>
    </div>
  </div>
</template>

<style scoped>
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fadeInUp 1s ease-out forwards;
}
</style>

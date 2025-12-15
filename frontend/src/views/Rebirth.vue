<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 剧情文本序列
const scripts = [
  '好痛……',
  '脖子被咬断了……',
  '不想死……',
  '不想变成它们……',
]

const afterScripts = [
  '你猛地从床上惊醒，冷汗浸透了睡衣。',
  '窗外阳光明媚，楼下早餐摊的叫卖声依旧。',
  '你颤抖着拿起手机，屏幕上显示的时间是——',
]

const currentText = ref('')
const phase = ref<'dark' | 'flash' | 'wake' | 'countdown'>('dark')
const isTyping = ref(false)

// 打字机效果
async function typeText(text: string, speed = 80) {
  isTyping.value = true
  currentText.value = ''
  for (const char of text) {
    currentText.value += char
    await new Promise(r => setTimeout(r, speed))
  }
  isTyping.value = false
  await new Promise(r => setTimeout(r, 800))
}

// 播放黑暗阶段
async function playDarkPhase() {
  for (const text of scripts) {
    await typeText(text)
  }
  phase.value = 'flash'
  await new Promise(r => setTimeout(r, 500))
  phase.value = 'wake'
  await playWakePhase()
}

// 播放醒来阶段
async function playWakePhase() {
  for (const text of afterScripts) {
    await typeText(text, 60)
  }
  phase.value = 'countdown'
}

// 跳转到囤货页面
function goToMarket() {
  router.push('/market')
}

// 跳过动画
function skip() {
  router.push('/market')
}

onMounted(() => {
  playDarkPhase()
})
</script>

<template>
  <div 
    class="rebirth min-h-screen flex flex-col items-center justify-center p-8 transition-all duration-500"
    :class="{
      'bg-black': phase === 'dark',
      'bg-white': phase === 'flash',
      'bg-gradient-to-b from-yellow-100 to-white': phase === 'wake' || phase === 'countdown'
    }"
    @click="skip"
  >
    <!-- 黑暗阶段 -->
    <template v-if="phase === 'dark'">
      <p class="text-white text-xl md:text-2xl font-mono text-center">
        {{ currentText }}
        <span v-if="isTyping" class="cursor-blink"></span>
      </p>
    </template>
    
    <!-- 闪白阶段 -->
    <template v-if="phase === 'flash'">
      <div class="w-full h-full bg-white"></div>
    </template>
    
    <!-- 醒来阶段 -->
    <template v-if="phase === 'wake'">
      <p class="text-gray-800 text-lg md:text-xl font-mono text-center max-w-lg leading-relaxed">
        {{ currentText }}
        <span v-if="isTyping" class="cursor-blink text-gray-800"></span>
      </p>
    </template>
    
    <!-- 倒计时提示 -->
    <template v-if="phase === 'countdown'">
      <div class="text-center">
        <p class="text-gray-800 text-lg mb-8">{{ currentText }}</p>
        
        <div class="mb-8">
          <p class="text-red-600 text-4xl md:text-6xl font-bold animate-pulse">
            【末日爆发前 3 天】
          </p>
        </div>
        
        <p class="text-gray-600 text-lg italic mb-8">
          "这一次，我绝不会再那样死去。"
        </p>
        
        <button 
          class="px-8 py-4 bg-red-600 text-white text-xl rounded-lg hover:bg-red-700 
                 transition-all duration-300 hover:scale-105 animate-bounce"
          @click.stop="goToMarket"
        >
          距离封城还有 3 分钟
        </button>
      </div>
    </template>
    
    <!-- 跳过提示 -->
    <p 
      v-if="phase !== 'countdown'" 
      class="absolute bottom-8 text-gray-500 text-sm"
    >
      点击屏幕跳过
    </p>
  </div>
</template>

<style scoped>
.cursor-blink::after {
  content: '▌';
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
</style>

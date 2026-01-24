<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useIceAgeStore } from '@/stores/iceAgeStore'

const router = useRouter()
const iceAgeStore = useIceAgeStore()

// 演出文案
const lines = [
  '气温……还在下降……',
  '收音机里的警报已经响了三天三夜……',
  '全球性寒潮……前所未有的灾难……',
  '',
  '你猛地从床上惊醒。',
  '窗外，天空是一片诡异的灰白色。',
  '空气中弥漫着刺骨的寒意。',
  '',
  '你看向窗外的温度计——',
  '',
  '【10°C】',
  '',
  '但据说，这只是开始。',
  '预计20天后，气温将降至零下30度。',
  '50天后，如果还活着……或许会有救援。',
  '',
  '这一次，你必须活下去。'
]

// 当前显示到第几行
const currentLineIndex = ref(0)
// 当前行显示到第几个字符
const currentCharIndex = ref(0)
// 是否完成所有演出
const isComplete = ref(false)
// 当前行的文本
const currentLineText = ref('')
// 已完成的行
const completedLines = ref<string[]>([])

// 打字机效果
let typingTimer: ReturnType<typeof setInterval> | null = null

function startTyping() {
  typingTimer = setInterval(() => {
    if (currentLineIndex.value >= lines.length) {
      // 所有行完成
      if (typingTimer) clearInterval(typingTimer)
      isComplete.value = true
      return
    }

    const currentLine = lines[currentLineIndex.value]
    
    if (currentCharIndex.value < currentLine.length) {
      // 还有字符要显示
      currentLineText.value = currentLine.slice(0, currentCharIndex.value + 1)
      currentCharIndex.value++
    } else {
      // 当前行完成，移到下一行
      completedLines.value.push(currentLine)
      currentLineText.value = ''
      currentCharIndex.value = 0
      currentLineIndex.value++
    }
  }, 80) // 每80ms显示一个字符
}

function skipToEnd() {
  if (typingTimer) clearInterval(typingTimer)
  completedLines.value = [...lines]
  currentLineText.value = ''
  isComplete.value = true
}

function proceed() {
  // 重置游戏状态
  iceAgeStore.resetGame()
  // 前往天赋选择
  router.push('/ice-age/talent')
}

onMounted(() => {
  startTyping()
})
</script>

<template>
  <div 
    class="min-h-screen bg-black flex flex-col items-center justify-center p-4 cursor-pointer"
    @click="isComplete ? proceed() : skipToEnd()"
  >
    <!-- 文字容器 -->
    <div class="max-w-2xl w-full text-center space-y-2">
      <!-- 已完成的行 -->
      <p 
        v-for="(line, index) in completedLines" 
        :key="index"
        class="text-lg md:text-xl leading-relaxed transition-opacity duration-300"
        :class="{
          'text-cyan-400 font-bold text-2xl md:text-3xl': line.startsWith('【'),
          'text-gray-400': line === '',
          'text-white': !line.startsWith('【') && line !== ''
        }"
      >
        {{ line || '&nbsp;' }}
      </p>
      
      <!-- 当前正在打字的行 -->
      <p 
        v-if="currentLineText || (!isComplete && currentLineIndex < lines.length)"
        class="text-lg md:text-xl leading-relaxed text-white"
        :class="{
          'text-cyan-400 font-bold text-2xl md:text-3xl': lines[currentLineIndex]?.startsWith('【')
        }"
      >
        {{ currentLineText }}<span class="animate-pulse">▌</span>
      </p>
    </div>

    <!-- 提示 -->
    <div 
      v-if="isComplete" 
      class="fixed bottom-8 left-0 right-0 text-center"
    >
      <p class="text-cyan-400 animate-pulse text-lg">
        点击屏幕开始生存之旅
      </p>
    </div>
    
    <div 
      v-else 
      class="fixed bottom-8 left-0 right-0 text-center"
    >
      <p class="text-gray-500 text-sm">
        点击屏幕跳过
      </p>
    </div>
  </div>
</template>

<style scoped>
/* 淡入动画 */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

p {
  animation: fadeIn 0.3s ease-out;
}
</style>

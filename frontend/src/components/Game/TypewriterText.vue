<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'

const props = defineProps<{
  text: string
  speed?: number  // 每个字符的间隔（毫秒）
}>()

const emit = defineEmits<{
  complete: []
}>()

const displayText = ref('')
const isTyping = ref(false)
let timer: number | null = null

// 打字机效果
function startTyping() {
  displayText.value = ''
  isTyping.value = true
  let index = 0
  const speed = props.speed ?? 50
  
  timer = window.setInterval(() => {
    if (index < props.text.length) {
      displayText.value += props.text[index]
      index++
    } else {
      stopTyping()
      emit('complete')
    }
  }, speed)
}

function stopTyping() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
  isTyping.value = false
}

// 跳过打字效果，直接显示全部
function skip() {
  stopTyping()
  displayText.value = props.text
  emit('complete')
}

// 监听文本变化
watch(() => props.text, () => {
  stopTyping()
  startTyping()
}, { immediate: true })

onUnmounted(() => {
  stopTyping()
})

defineExpose({ skip })
</script>

<template>
  <div class="typewriter" @click="skip">
    <span>{{ displayText }}</span>
    <span v-if="isTyping" class="cursor-blink"></span>
  </div>
</template>

<style scoped>
.typewriter {
  cursor: pointer;
  line-height: 1.8;
}
</style>

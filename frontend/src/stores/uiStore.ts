import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUiStore = defineStore('ui', () => {
  // 是否正在加载（等待AI响应）
  const isLoading = ref(false)
  
  // 当前显示的日志文本（用于打字机效果）
  const currentLogText = ref('')
  
  // 是否显示选项
  const showChoices = ref(false)
  
  // 当前选项列表
  const choices = ref<string[]>([])
  
  // 是否启用音效
  const soundEnabled = ref(true)
  
  // 是否显示故障效果
  const showGlitch = ref(false)
  
  // 设置加载状态
  function setLoading(loading: boolean) {
    isLoading.value = loading
  }
  
  // 设置当前日志
  function setLogText(text: string) {
    currentLogText.value = text
  }
  
  // 设置选项
  function setChoices(newChoices: string[]) {
    choices.value = newChoices
    showChoices.value = newChoices.length > 0
  }
  
  // 清除选项
  function clearChoices() {
    choices.value = []
    showChoices.value = false
  }
  
  // 切换音效
  function toggleSound() {
    soundEnabled.value = !soundEnabled.value
  }
  
  // 触发故障效果
  function triggerGlitch(duration: number = 300) {
    showGlitch.value = true
    setTimeout(() => {
      showGlitch.value = false
    }, duration)
  }
  
  return {
    isLoading,
    currentLogText,
    showChoices,
    choices,
    soundEnabled,
    showGlitch,
    setLoading,
    setLogText,
    setChoices,
    clearChoices,
    toggleSound,
    triggerGlitch
  }
})

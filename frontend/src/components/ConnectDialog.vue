<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { checkAccess } from '@/api'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  (e: 'connected'): void
}>()

const loading = ref(false)
const error = ref('')
const serverFull = ref(false)

const connect = async () => {
  loading.value = true
  error.value = ''
  serverFull.value = false
  
  try {
    await checkAccess()
    emit('connected')
  } catch (e: any) {
    if (e.message === 'SERVER_FULL') {
      serverFull.value = true
      error.value = ''
    } else {
      error.value = e.message || '连接失败'
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (props.show) {
    connect()
  }
})

// 暴露给父组件调用
defineExpose({ connect })
</script>

<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
    <div class="w-full max-w-md p-8 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl">
      <h2 class="mb-6 text-2xl font-bold text-center text-white">
        <span v-if="loading">正在连接服务器...</span>
        <span v-else-if="serverFull">服务器繁忙</span>
        <span v-else>连接中断</span>
      </h2>
      
      <div v-if="!loading && serverFull" class="space-y-4">
        <p class="text-gray-400 text-center">{{ error }}</p>

        <div class="text-sm text-gray-300 bg-gray-800/50 p-3 rounded border border-gray-700 space-y-2">
          <p>🙏 <span class="text-red-400 font-bold">诚挚感谢</span>大家的支持！末世生存模拟器能受到这么多人的喜欢让我受宠若惊，但高频的API调用也让我压力山大，因此我做了限流处理。望您理解！</p>
          <p>本项目已开源：<a href="https://github.com/wangyafu/doomsaday" target="_blank" class="text-blue-400 hover:text-blue-300 border-b border-blue-400/50">GitHub 地址</a></p>
        </div>
      </div>
      
      <div v-else-if="!loading && error" class="text-center space-y-4">
        <p class="text-red-400">{{ error }}</p>
        <button 
          @click="connect"
          class="w-full py-3 px-6 font-bold text-gray-900 bg-white rounded-lg hover:bg-gray-200"
        >
          重试
        </button>
      </div>
      
      <div v-if="loading" class="flex justify-center py-8">
        <div class="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    </div>
  </div>
</template>

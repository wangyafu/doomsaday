<script setup lang="ts">
import { ref, computed } from 'vue'
import { useSettingsStore } from '@/stores/settingsStore'
import { LLMService } from '@/services/llm'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits(['close'])

const settingsStore = useSettingsStore()

// 监听弹窗打开，重置状态
import { watch } from 'vue'
watch(() => props.show, (val) => {
  if (val) {
    testResult.value = null
    isTesting.value = false
  }
})

// 使用 Computed 属性实现自动保存
const apiKeyModel = computed({
  get: () => settingsStore.apiKey,
  set: (val) => settingsStore.setApiKey(val)
})

const baseUrlModel = computed({
  get: () => settingsStore.baseUrl,
  set: (val) => settingsStore.setBaseUrl(val)
})

const modelModel = computed({
  get: () => settingsStore.model,
  set: (val) => settingsStore.setModel(val)
})

const isTesting = ref(false)
const testResult = ref<{ success: boolean; message: string } | null>(null)

function handleClose() {
  emit('close')
}

function handleEnableCustomApi() {
  settingsStore.setUseCustomApi(true)
  emit('close')
}

async function handleTestConnection() {
  if (!settingsStore.apiKey) {
    testResult.value = { success: false, message: '请先输入 API Key' }
    return
  }

  isTesting.value = true
  testResult.value = null

  try {
    const result = await LLMService.testConnection({
      apiKey: settingsStore.apiKey,
      baseUrl: settingsStore.baseUrl,
      model: settingsStore.model
    })
    testResult.value = result
  } catch (e) {
    testResult.value = { success: false, message: `测试出错: ${e}` }
  } finally {
    isTesting.value = false
  }
}
</script>

<template>
  <transition name="modal-fade">
    <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
      <div class="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-gray-900 border-2 border-red-600 rounded-lg shadow-[0_0_30px_rgba(220,38,38,0.3)]">
        <!-- 头部 -->
        <div class="bg-red-600 p-3 flex items-center gap-2 sticky top-0 z-10">
          <span class="text-xl">⚙️</span>
          <h2 class="text-white font-bold text-lg tracking-wider flex-1">自定义 API 设置</h2>
          <!-- 关闭按钮 -->
          <button 
            @click="handleClose"
            class="w-8 h-8 flex items-center justify-center text-white/70 hover:text-white hover:bg-red-500 rounded-full transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- 内容区 -->
        <div class="p-6 space-y-6">
          <div class="text-gray-300 text-sm space-y-1">
            <p>配置您的自有 LLM 服务。信息将<span class="text-green-400 font-bold">自动保存</span>到本地。</p>
            <p class="text-xs text-gray-500">提示：开启后，请求将直接从浏览器发送到 API。</p>
          </div>

          <!-- 表单 -->
          <div class="space-y-4">
            <!-- API Key -->
            <div class="space-y-1">
              <label class="block text-xs font-bold text-gray-400 uppercase">API Key</label>
              <input 
                v-model="apiKeyModel"
                type="password" 
                placeholder="sk-..."
                class="w-full bg-black/50 border border-gray-700 rounded px-3 py-2 text-white focus:border-red-500 focus:outline-none transition-colors"
                autocomplete="off"
              />
            </div>

            <!-- Base URL -->
            <div class="space-y-1">
              <label class="block text-xs font-bold text-gray-400 uppercase">Base URL</label>
              <input 
                v-model="baseUrlModel"
                type="text" 
                placeholder="https://api.openai.com/v1"
                class="w-full bg-black/50 border border-gray-700 rounded px-3 py-2 text-white focus:border-red-500 focus:outline-none transition-colors"
              />
              <p class="text-xs text-gray-500">提示: Deepseek 请填写 https://api.deepseek.com</p>
            </div>

            <!-- Model -->
             <div class="space-y-1">
              <label class="block text-xs font-bold text-gray-400 uppercase">Model Name</label>
              <input 
                v-model="modelModel"
                type="text" 
                placeholder="gpt-3.5-turbo"
                class="w-full bg-black/50 border border-gray-700 rounded px-3 py-2 text-white focus:border-red-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <!-- 测试结果 -->
          <div v-if="testResult" :class="[
            'p-3 rounded text-sm break-words',
            testResult.success ? 'bg-green-900/30 text-green-300 border border-green-700' : 'bg-red-900/30 text-red-300 border border-red-700'
          ]">
            <p class="font-bold mb-1">{{ testResult.success ? '✅ 连接成功' : '❌ 连接失败' }}</p>
            <p class="opacity-90">{{ testResult.message }}</p>
          </div>

          <!-- 操作按钮 -->
          <div class="flex flex-col gap-3 pt-2">
            <button 
              @click="handleTestConnection"
              :disabled="isTesting"
              class="w-full py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white font-bold rounded transition-all flex items-center justify-center gap-2"
            >
              <span v-if="isTesting" class="animate-spin">⏳</span>
              {{ isTesting ? '正在连接...' : '🔌 测试连接' }}
            </button>
            
            <button 
              @click="handleEnableCustomApi"
              class="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-all shadow-[0_0_15px_rgba(220,38,38,0.3)] flex items-center justify-center gap-2"
            >
              <span>🚀</span>
              保存并启用自定义 API
            </button>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.modal-fade-enter-active, .modal-fade-leave-active {
  transition: opacity 0.3s ease;
}
.modal-fade-enter-from, .modal-fade-leave-to {
  opacity: 0;
}
</style>

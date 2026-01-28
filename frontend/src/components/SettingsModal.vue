<script setup lang="ts">
import { ref } from 'vue'
import { useSettingsStore } from '@/stores/settingsStore'
import { LLMService } from '@/services/llm'

defineProps<{
  show: boolean
}>()

const emit = defineEmits(['close'])

const settingsStore = useSettingsStore()

// 本地状态，用于编辑
const form = ref({
  apiKey: settingsStore.apiKey,
  baseUrl: settingsStore.baseUrl,
  model: settingsStore.model
})

const isTesting = ref(false)
const testResult = ref<{ success: boolean; message: string } | null>(null)

function handleClose() {
  emit('close')
  // 重置测试结果
  testResult.value = null
  // 重置表单为 store 中的值 (放弃未保存更改)
  form.value = {
    apiKey: settingsStore.apiKey,
    baseUrl: settingsStore.baseUrl,
    model: settingsStore.model
  }
}

async function handleSave() {
  settingsStore.setApiKey(form.value.apiKey)
  settingsStore.setBaseUrl(form.value.baseUrl)
  settingsStore.setModel(form.value.model)
  emit('close')
}

async function handleTestConnection() {
  if (!form.value.apiKey) {
    testResult.value = { success: false, message: '请先输入 API Key' }
    return
  }

  isTesting.value = true
  testResult.value = null

  try {
    const result = await LLMService.testConnection({
      apiKey: form.value.apiKey,
      baseUrl: form.value.baseUrl,
      model: form.value.model
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
            <p>配置您的自有 LLM 服务。配置后，请求将<span class="text-red-400 font-bold">直接从浏览器发送</span>到 API，不经过我们的服务器。</p>
            <p class="text-xs text-gray-500">您的 API Key 仅存储在本地浏览器中。</p>
          </div>

          <!-- 表单 -->
          <div class="space-y-4">
            <!-- API Key -->
            <div class="space-y-1">
              <label class="block text-xs font-bold text-gray-400 uppercase">API Key</label>
              <input 
                v-model="form.apiKey"
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
                v-model="form.baseUrl"
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
                v-model="form.model"
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
            
            <div class="flex gap-3">
              <button 
                @click="handleClose"
                class="flex-1 py-2 border border-gray-600 text-gray-400 hover:text-white hover:border-gray-400 rounded transition-all"
              >
                取消
              </button>
              <button 
                @click="handleSave"
                class="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded transition-all shadow-[0_0_15px_rgba(220,38,38,0.3)]"
              >
                保存设置
              </button>
            </div>
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

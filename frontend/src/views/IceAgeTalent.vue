<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useIceAgeStore, type IceAgeTalent } from '@/stores/iceAgeStore'
import { getRandomTalents } from '@/data/iceAgeData'

const router = useRouter()
const iceAgeStore = useIceAgeStore()

// 随机抽取10个天赋
const availableTalents = ref<IceAgeTalent[]>(getRandomTalents(10))

// 已选天赋ID列表
const selectedIds = ref<Set<string>>(new Set())

// 是否可以继续（选了3个）
const canProceed = computed(() => selectedIds.value.size === 3)

// 获取已选天赋对象列表
const selectedTalents = computed(() => {
  return availableTalents.value.filter(t => selectedIds.value.has(t.id))
})

function toggleTalent(talent: IceAgeTalent) {
  if (selectedIds.value.has(talent.id)) {
    // 取消选择
    selectedIds.value.delete(talent.id)
    selectedIds.value = new Set(selectedIds.value) // 触发响应式
  } else if (selectedIds.value.size < 3) {
    // 选择（最多3个）
    selectedIds.value.add(talent.id)
    selectedIds.value = new Set(selectedIds.value)
  }
}

function proceed() {
  if (!canProceed.value) return
  
  // 保存选择的天赋到store
  iceAgeStore.selectTalents(selectedTalents.value)
  
  // 前往避难所选择
  router.push('/ice-age/shelter')
}

function refreshTalents() {
  // 重新随机抽取
  availableTalents.value = getRandomTalents(10)
  selectedIds.value = new Set()
}
</script>

<template>
  <div class="min-h-screen bg-gray-900 text-white p-4">
    <div class="max-w-4xl mx-auto">
      <!-- 标题 -->
      <div class="text-center mb-8 pt-8">
        <h1 class="text-3xl font-bold text-cyan-400 mb-2">选择天赋</h1>
        <p class="text-gray-400">从10个天赋中选择3个，它们将帮助你在冰原中生存</p>
        <p class="text-sm text-gray-500 mt-2">
          已选择: {{ selectedIds.size }} / 3
        </p>
      </div>

      <!-- 天赋网格 -->
      <div class="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        <div
          v-for="talent in availableTalents"
          :key="talent.id"
          class="relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:scale-105"
          :class="{
            'bg-cyan-900/50 border-cyan-400 shadow-lg shadow-cyan-500/20': selectedIds.has(talent.id),
            'bg-gray-800 border-gray-700 hover:border-gray-500': !selectedIds.has(talent.id),
            'opacity-50 cursor-not-allowed': !selectedIds.has(talent.id) && selectedIds.size >= 3
          }"
          @click="toggleTalent(talent)"
        >
          <!-- 选中标记 -->
          <div 
            v-if="selectedIds.has(talent.id)"
            class="absolute -top-2 -right-2 w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center text-white text-sm font-bold"
          >
            ✓
          </div>
          
          <!-- 图标 -->
          <div class="text-3xl mb-2 text-center">{{ talent.icon }}</div>
          
          <!-- 名称 -->
          <h3 class="text-sm font-bold text-center mb-1" :class="selectedIds.has(talent.id) ? 'text-cyan-300' : 'text-white'">
            {{ talent.name }}
          </h3>
          
          <!-- 描述 -->
          <p class="text-xs text-gray-400 text-center line-clamp-2">
            {{ talent.description }}
          </p>
        </div>
      </div>

      <!-- 已选天赋预览 -->
      <div v-if="selectedTalents.length > 0" class="mb-8">
        <h2 class="text-lg font-bold text-cyan-400 mb-3">已选天赋</h2>
        <div class="flex flex-wrap gap-2">
          <div 
            v-for="talent in selectedTalents" 
            :key="talent.id"
            class="flex items-center gap-2 px-3 py-2 bg-cyan-900/30 rounded-lg border border-cyan-500/30"
          >
            <span class="text-xl">{{ talent.icon }}</span>
            <span class="text-cyan-300">{{ talent.name }}</span>
            <button 
              class="ml-1 text-gray-400 hover:text-red-400 transition"
              @click.stop="toggleTalent(talent)"
            >
              ✕
            </button>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          class="px-6 py-3 bg-gray-700 rounded-lg text-gray-300 hover:bg-gray-600 transition"
          @click="refreshTalents"
        >
          🔄 重新抽取
        </button>
        
        <button
          class="px-8 py-3 rounded-lg font-bold text-lg transition-all"
          :class="{
            'bg-cyan-600 hover:bg-cyan-500 text-white': canProceed,
            'bg-gray-700 text-gray-500 cursor-not-allowed': !canProceed
          }"
          :disabled="!canProceed"
          @click="proceed"
        >
          {{ canProceed ? '确认选择 →' : '请选择3个天赋' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>

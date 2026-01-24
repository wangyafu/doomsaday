<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useIceAgeStore, type IceAgeShelter } from '@/stores/iceAgeStore'
import { ICE_AGE_SHELTERS } from '@/data/iceAgeData'

const router = useRouter()
const iceAgeStore = useIceAgeStore()

// 当前选中的避难所
const selectedShelterId = ref<string | null>(null)

// 获取选中的避难所对象
const selectedShelter = computed(() => {
  return ICE_AGE_SHELTERS.find(s => s.id === selectedShelterId.value) || null
})

// 检查是否买得起
function canAfford(shelter: IceAgeShelter): boolean {
  return iceAgeStore.money >= shelter.price
}

function selectShelter(shelter: IceAgeShelter) {
  if (!canAfford(shelter)) return
  selectedShelterId.value = shelter.id
}

function proceed() {
  if (!selectedShelter.value) return
  
  // 保存避难所选择
  iceAgeStore.selectShelter(selectedShelter.value)
  
  // 前往购物页面
  router.push('/ice-age/market')
}

// 生成防寒星级
function warmthStars(warmth: number): string {
  return '★'.repeat(warmth) + '☆'.repeat(3 - warmth)
}
</script>

<template>
  <div class="min-h-screen bg-gray-900 text-white p-4">
    <div class="max-w-4xl mx-auto">
      <!-- 标题 -->
      <div class="text-center mb-8 pt-8">
        <h1 class="text-3xl font-bold text-cyan-400 mb-2">选择避难所</h1>
        <p class="text-gray-400">你的避难所将决定生存的难度</p>
        <p class="text-lg mt-4">
          💰 剩余资金: <span class="text-yellow-400 font-bold">¥{{ iceAgeStore.money.toLocaleString() }}</span>
        </p>
      </div>

      <!-- 避难所卡片 -->
      <div class="grid md:grid-cols-3 gap-6 mb-8">
        <div
          v-for="shelter in ICE_AGE_SHELTERS"
          :key="shelter.id"
          class="relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:scale-102"
          :class="{
            'bg-cyan-900/30 border-cyan-400 shadow-lg shadow-cyan-500/20': selectedShelterId === shelter.id,
            'bg-gray-800 border-gray-700 hover:border-gray-500': selectedShelterId !== shelter.id && canAfford(shelter),
            'bg-gray-800/50 border-gray-800 opacity-60 cursor-not-allowed': !canAfford(shelter)
          }"
          @click="selectShelter(shelter)"
        >
          <!-- 买不起标记 -->
          <div 
            v-if="!canAfford(shelter)"
            class="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl"
          >
            <span class="text-red-400 font-bold">资金不足</span>
          </div>
          
          <!-- 选中标记 -->
          <div 
            v-if="selectedShelterId === shelter.id"
            class="absolute -top-3 -right-3 w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center text-white text-lg font-bold"
          >
            ✓
          </div>

          <!-- 避难所名称 -->
          <h3 class="text-xl font-bold mb-2" :class="selectedShelterId === shelter.id ? 'text-cyan-300' : 'text-white'">
            {{ shelter.name }}
          </h3>
          
          <!-- 属性 -->
          <div class="space-y-2 mb-4 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-400">价格</span>
              <span class="text-yellow-400 font-bold">¥{{ shelter.price.toLocaleString() }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-400">空间</span>
              <span class="text-white">{{ shelter.space }} 格</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-400">防寒</span>
              <span class="text-cyan-400">{{ warmthStars(shelter.warmth) }}</span>
            </div>
          </div>
          
          <!-- 描述 -->
          <p class="text-gray-400 text-sm">
            {{ shelter.description }}
          </p>
        </div>
      </div>

      <!-- 已选避难所信息 -->
      <div v-if="selectedShelter" class="bg-gray-800/50 rounded-lg p-4 mb-8">
        <div class="flex items-center justify-between">
          <div>
            <span class="text-gray-400">已选择:</span>
            <span class="text-cyan-300 font-bold ml-2">{{ selectedShelter.name }}</span>
          </div>
          <div>
            <span class="text-gray-400">购买后剩余:</span>
            <span class="text-yellow-400 font-bold ml-2">¥{{ (iceAgeStore.money - selectedShelter.price).toLocaleString() }}</span>
          </div>
        </div>
      </div>

      <!-- 确认按钮 -->
      <div class="flex justify-center">
        <button
          class="px-8 py-3 rounded-lg font-bold text-lg transition-all"
          :class="{
            'bg-cyan-600 hover:bg-cyan-500 text-white': selectedShelter,
            'bg-gray-700 text-gray-500 cursor-not-allowed': !selectedShelter
          }"
          :disabled="!selectedShelter"
          @click="proceed"
        >
          {{ selectedShelter ? '确认选择，开始囤货 →' : '请选择避难所' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hover\:scale-102:hover {
  transform: scale(1.02);
}
</style>

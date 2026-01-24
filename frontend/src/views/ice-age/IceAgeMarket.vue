<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useIceAgeStore } from '@/stores/iceAgeStore'
import { ICE_AGE_SHOP_ITEMS } from '@/data/iceAgeData'
import type { ShopItem, InventoryItem } from '@/types'

const router = useRouter()
const iceAgeStore = useIceAgeStore()

// 倒计时（秒）
const timeLeft = ref(120) // 2分钟
let timer: ReturnType<typeof setInterval> | null = null

// 当前分类
const currentCategory = ref<'all' | 'food' | 'weapon' | 'medical' | 'emotional'>('all')

// 购物车
const cart = ref<Map<string, number>>(new Map())

// 过滤商品
const filteredItems = computed(() => {
  if (currentCategory.value === 'all') {
    return ICE_AGE_SHOP_ITEMS
  }
  return ICE_AGE_SHOP_ITEMS.filter(item => item.category === currentCategory.value)
})

// 购物车总价
const cartTotal = computed(() => {
  let total = 0
  cart.value.forEach((count, itemId) => {
    const item = ICE_AGE_SHOP_ITEMS.find(i => i.id === itemId)
    if (item) {
      total += item.price * count
    }
  })
  return total
})

// 购物车占用空间
const cartSpace = computed(() => {
  let space = 0
  cart.value.forEach((count, itemId) => {
    const item = ICE_AGE_SHOP_ITEMS.find(i => i.id === itemId)
    if (item) {
      space += item.space * count
    }
  })
  return space
})

// 剩余金钱
const remainingMoney = computed(() => iceAgeStore.money - cartTotal.value)

// 剩余空间
const remainingSpace = computed(() => iceAgeStore.maxSpace - cartSpace.value)

// 检查是否可以添加商品
function canAdd(item: ShopItem): boolean {
  return remainingMoney.value >= item.price && remainingSpace.value >= item.space
}

// 添加到购物车
function addToCart(item: ShopItem) {
  if (!canAdd(item)) return
  const current = cart.value.get(item.id) || 0
  cart.value.set(item.id, current + 1)
  cart.value = new Map(cart.value) // 触发响应式
}

// 获取购物车中某商品数量
function getCartCount(itemId: string): number {
  return cart.value.get(itemId) || 0
}

// 完成购物
function finishShopping() {
  // 将购物车物品添加到背包
  cart.value.forEach((count, itemId) => {
    const item = ICE_AGE_SHOP_ITEMS.find(i => i.id === itemId)
    if (item) {
      const inventoryItem: InventoryItem = {
        name: item.name,
        count: count,
        description: item.description,
        hidden: item.hidden
      }
      iceAgeStore.addItem(inventoryItem)
    }
  })
  
  // 扣除金钱
  iceAgeStore.money -= cartTotal.value
  
  // 前往生存阶段
  router.push('/ice-age/survival')
}

// 格式化时间
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// 分类按钮
const categories = [
  { id: 'all', name: '全部', icon: '📦' },
  { id: 'food', name: '食物/燃料', icon: '🍖' },
  { id: 'weapon', name: '工具', icon: '🛠️' },
  { id: 'medical', name: '医疗', icon: '💊' },
  { id: 'emotional', name: '保暖/情绪', icon: '🧥' }
]

onMounted(() => {
  // 启动倒计时
  timer = setInterval(() => {
    timeLeft.value--
    if (timeLeft.value <= 0) {
      finishShopping()
    }
  }, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <div class="min-h-screen bg-gray-900 text-white">
    <!-- 顶部状态栏 -->
    <div class="sticky top-0 z-50 bg-black/90 backdrop-blur p-4 border-b border-gray-800">
      <div class="max-w-6xl mx-auto">
        <!-- 倒计时 -->
        <div class="text-center mb-3">
          <span 
            class="text-3xl font-bold font-mono"
            :class="{
              'text-red-500 animate-pulse': timeLeft <= 30,
              'text-yellow-400': timeLeft > 30 && timeLeft <= 60,
              'text-cyan-400': timeLeft > 60
            }"
          >
            ⏱️ {{ formatTime(timeLeft) }}
          </span>
        </div>
        
        <!-- 资源信息 -->
        <div class="grid grid-cols-2 gap-4 text-center">
          <div>
            <span class="text-gray-400">💰 剩余资金</span>
            <span class="ml-2 text-yellow-400 font-bold">¥{{ remainingMoney.toLocaleString() }}</span>
          </div>
          <div>
            <span class="text-gray-400">📦 剩余空间</span>
            <span class="ml-2 font-bold" :class="remainingSpace < 5 ? 'text-red-400' : 'text-cyan-400'">
              {{ remainingSpace }} 格
            </span>
          </div>
        </div>
      </div>
    </div>

    <div class="max-w-6xl mx-auto p-4">
      <!-- 分类tabs -->
      <div class="flex overflow-x-auto gap-2 mb-4 pb-2">
        <button
          v-for="cat in categories"
          :key="cat.id"
          class="flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all"
          :class="{
            'bg-cyan-600 text-white': currentCategory === cat.id,
            'bg-gray-800 text-gray-300 hover:bg-gray-700': currentCategory !== cat.id
          }"
          @click="currentCategory = cat.id as typeof currentCategory"
        >
          {{ cat.icon }} {{ cat.name }}
        </button>
      </div>

      <!-- 商品网格 -->
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-24">
        <div
          v-for="item in filteredItems"
          :key="item.id"
          class="relative bg-gray-800 rounded-lg p-3 cursor-pointer transition-all hover:bg-gray-700 active:scale-95"
          :class="{ 'opacity-50': !canAdd(item) && getCartCount(item.id) === 0 }"
          @click="addToCart(item)"
        >
          <!-- 已添加数量 -->
          <div 
            v-if="getCartCount(item.id) > 0"
            class="absolute -top-2 -right-2 w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center text-white text-sm font-bold"
          >
            {{ getCartCount(item.id) }}
          </div>
          
          <!-- 图标 -->
          <div class="text-3xl mb-2 text-center">{{ item.icon }}</div>
          
          <!-- 名称 -->
          <h3 class="text-sm font-bold text-center mb-1 text-white truncate">{{ item.name }}</h3>
          
          <!-- 价格和空间 -->
          <div class="flex justify-between text-xs text-gray-400">
            <span>¥{{ item.price }}</span>
            <span>{{ item.space }}格</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部购物车栏 -->
    <div class="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 p-4">
      <div class="max-w-6xl mx-auto flex items-center justify-between">
        <!-- 购物车概要 -->
        <div class="flex-1">
          <div class="text-sm text-gray-400 mb-1">
            购物车: {{ cart.size }} 种商品
          </div>
          <div class="text-lg font-bold text-yellow-400">
            ¥{{ cartTotal.toLocaleString() }} / {{ cartSpace }}格
          </div>
        </div>
        
        <!-- 开始按钮 -->
        <button
          class="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-lg font-bold text-lg transition-all active:scale-95"
          @click="finishShopping"
        >
          开始生存 ❄️
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.active\:scale-95:active {
  transform: scale(0.95);
}
</style>

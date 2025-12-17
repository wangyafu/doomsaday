<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/gameStore'
import { shelters, shopItems } from '@/data/shopItems'
import { professionItems } from '@/data/professions'
import type { ShopItem, Shelter } from '@/types'

const router = useRouter()
const gameStore = useGameStore()

// 获取当前职业解锁的额外商品
const unlockedProfessionItems = computed(() => {
  const profession = gameStore.profession
  if (!profession?.unlockedItems) return []
  
  return profession.unlockedItems
    .map(id => professionItems[id])
    .filter(item => item !== undefined) as ShopItem[]
})

// 合并基础商品和职业解锁商品
const allShopItems = computed(() => {
  return [...shopItems, ...unlockedProfessionItems.value]
})

// 倒计时（3分钟 = 180秒）
const timeLeft = ref(180)
let timer: number | null = null

// 当前选择的分类
const currentCategory = ref<'all' | 'food' | 'weapon' | 'medical' | 'emotional'>('all')

// 购物车
const cart = ref<Map<string, number>>(new Map())

// 是否已选择避难所
const shelterSelected = ref(false)

// 格式化时间
const formattedTime = computed(() => {
  const minutes = Math.floor(timeLeft.value / 60)
  const seconds = timeLeft.value % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
})

// 过滤商品
const filteredItems = computed(() => {
  if (currentCategory.value === 'all') return allShopItems.value
  return allShopItems.value.filter(item => item.category === currentCategory.value)
})

// 购物车总价
const cartTotal = computed(() => {
  let total = 0
  cart.value.forEach((count, id) => {
    const item = allShopItems.value.find(i => i.id === id)
    if (item) total += item.price * count
  })
  return total
})

// 购物车占用空间
const cartSpace = computed(() => {
  let space = 0
  cart.value.forEach((count, id) => {
    const item = allShopItems.value.find(i => i.id === id)
    if (item) space += item.space * count
  })
  return space
})

// 剩余金钱
const remainingMoney = computed(() => gameStore.money - cartTotal.value)

// 剩余空间
const remainingSpace = computed(() => gameStore.maxSpace - cartSpace.value)

// 选择避难所
function selectShelter(shelter: Shelter) {
  if (gameStore.money >= shelter.price) {
    gameStore.selectShelter(shelter)
    shelterSelected.value = true
  }
}

// 添加商品到购物车
function addToCart(item: ShopItem) {
  if (remainingMoney.value < item.price) return
  if (remainingSpace.value < item.space) return
  
  const current = cart.value.get(item.id) || 0
  cart.value.set(item.id, current + 1)
}

// 从购物车移除
function removeFromCart(itemId: string) {
  const current = cart.value.get(itemId) || 0
  if (current > 1) {
    cart.value.set(itemId, current - 1)
  } else {
    cart.value.delete(itemId)
  }
}

// 结束购物，进入生存阶段
function finishShopping() {
  // 将购物车物品添加到背包（包含描述和隐藏信息）
  cart.value.forEach((count, id) => {
    const item = allShopItems.value.find(i => i.id === id)
    if (item) {
      gameStore.addItem({ 
        name: item.name, 
        count,
        description: item.description,
        hidden: item.hidden
      })
    }
  })
  
  // 扣除金钱
  gameStore.money -= cartTotal.value
  
  // 跳转到生存页面
  router.push('/survival')
}

// 倒计时结束
function onTimeUp() {
  finishShopping()
}

// 启动倒计时
onMounted(() => {
  // 自动添加职业专属物品到购物车
  if (gameStore.profession?.unlockedItems) {
    gameStore.profession.unlockedItems.forEach(itemId => {
      const item = professionItems[itemId]
      if (item) {
        // 专属物品自动添加到购物车（价格为0，不占用金钱）
        cart.value.set(item.id, 1)
      }
    })
  }
  
  timer = window.setInterval(() => {
    timeLeft.value--
    if (timeLeft.value <= 0) {
      if (timer) clearInterval(timer)
      onTimeUp()
    }
  }, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <div class="market min-h-screen bg-gray-900 text-white">
    <!-- 倒计时头部 -->
    <div class="sticky top-0 z-50 bg-black/90 backdrop-blur p-4 border-b border-red-900">
      <div class="max-w-4xl mx-auto">
        <!-- 职业信息 -->
        <div v-if="gameStore.profession" class="flex items-center justify-center gap-2 mb-2 text-sm">
          <span class="text-xl">{{ gameStore.profession.icon }}</span>
          <span class="text-gray-300">{{ gameStore.profession.name }}</span>
          <span class="text-gray-500">|</span>
          <span class="text-gray-400">❤️{{ gameStore.stats.hp }}</span>
          <span class="text-gray-400">🧠{{ gameStore.stats.san }}</span>
        </div>
        
        <div class="flex items-center justify-between">
          <div class="text-sm text-gray-400">
            💰 ¥{{ remainingMoney.toLocaleString() }}
          </div>
          <div 
            class="text-3xl font-mono font-bold"
            :class="timeLeft <= 30 ? 'text-red-500 animate-pulse' : 'text-red-400'"
          >
            {{ formattedTime }}
          </div>
          <div class="text-sm text-gray-400">
            📦 {{ remainingSpace }} 格
          </div>
        </div>
      </div>
    </div>
    
    <!-- 避难所选择 -->
    <div v-if="!shelterSelected" class="p-4 max-w-4xl mx-auto">
      <h2 class="text-xl font-bold mb-4 text-center">选择避难所</h2>
      <div class="grid md:grid-cols-3 gap-4">
        <div 
          v-for="shelter in shelters" 
          :key="shelter.id"
          class="shelter-card bg-gray-800 rounded-lg p-4 cursor-pointer border-2 transition-all"
          :class="gameStore.money >= shelter.price 
            ? 'border-gray-700 hover:border-red-500' 
            : 'border-gray-800 opacity-50 cursor-not-allowed'"
          @click="selectShelter(shelter)"
        >
          <div class="flex justify-between items-start mb-2">
            <h3 class="font-bold">{{ shelter.name }}</h3>
            <span class="text-yellow-500">¥{{ shelter.price }}</span>
          </div>
          <p class="text-sm text-gray-400 mb-2">{{ shelter.description }}</p>
          <div class="flex gap-4 text-sm">
            <span>📦 {{ shelter.space }}格</span>
            <span>🛡️ {{ '★'.repeat(shelter.defense) }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 商品列表 -->
    <div v-else class="p-4 max-w-4xl mx-auto">
      <!-- 分类标签 -->
      <div class="flex gap-2 mb-4 overflow-x-auto pb-2">
        <button 
          v-for="cat in [
            { key: 'all', label: '全部', icon: '🏪' },
            { key: 'food', label: '食物', icon: '🍔' },
            { key: 'weapon', label: '武器', icon: '⚔️' },
            { key: 'medical', label: '医疗', icon: '💊' },
            { key: 'emotional', label: '情绪', icon: '❤️' }
          ]"
          :key="cat.key"
          class="px-4 py-2 rounded-full whitespace-nowrap transition-all"
          :class="currentCategory === cat.key 
            ? 'bg-red-600 text-white' 
            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'"
          @click="currentCategory = cat.key as any"
        >
          {{ cat.icon }} {{ cat.label }}
        </button>
      </div>
      
      <!-- 商品网格 -->
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-24">
        <div 
          v-for="item in filteredItems" 
          :key="item.id"
          class="item-card bg-gray-800 rounded-lg p-3 cursor-pointer transition-all hover:bg-gray-700"
          :class="{
            'opacity-50': remainingMoney < item.price || remainingSpace < item.space,
            'ring-2 ring-green-500': cart.get(item.id)
          }"
          @click="addToCart(item)"
        >
          <div class="text-2xl mb-1">{{ item.icon }}</div>
          <div class="font-medium text-sm truncate">{{ item.name }}</div>
          <p class="text-xs text-white mt-1 line-clamp-2 min-h-[2rem]">{{ item.description }}</p>
          <div class="flex justify-between items-center mt-2">
            <span class="text-yellow-500 text-sm">¥{{ item.price }}</span>
            <span class="text-gray-500 text-xs">{{ item.space }}格</span>
          </div>
          <div v-if="cart.get(item.id)" class="mt-1 text-green-400 text-sm">
            已选 x{{ cart.get(item.id) }}
          </div>
        </div>
      </div>
    </div>
    
    <!-- 底部购物车 -->
    <div 
      v-if="shelterSelected"
      class="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur border-t border-gray-800 p-4 safe-area-bottom"
    >
      <div class="max-w-4xl mx-auto">
        <!-- 购物车物品 -->
        <div v-if="cart.size > 0" class="flex gap-2 overflow-x-auto pb-2 mb-2">
          <div 
            v-for="[id, count] in cart" 
            :key="id"
            class="flex items-center gap-1 bg-gray-800 rounded px-2 py-1 text-sm whitespace-nowrap"
          >
            <span>{{ allShopItems.find(i => i.id === id)?.icon }}</span>
            <span>x{{ count }}</span>
            <button 
              class="text-red-400 hover:text-red-300 ml-1"
              @click="removeFromCart(id)"
            >×</button>
          </div>
        </div>
        
        <!-- 结算按钮 -->
        <button 
          class="w-full py-3 bg-red-600 text-white rounded-lg font-bold text-lg
                 hover:bg-red-500 transition-all active:scale-95"
          @click="finishShopping"
        >
          开始生存 (¥{{ cartTotal }} / {{ cartSpace }}格)
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.item-card:active {
  transform: scale(0.95);
}

/* 限制描述文本为2行 */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>

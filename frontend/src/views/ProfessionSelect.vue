<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/gameStore'
import { professions, getRandomProfession } from '@/data/professions'
import type { Profession } from '@/types'

const router = useRouter()
const gameStore = useGameStore()

// 当前选中的职业
const currentProfession = ref<Profession>(getRandomProfession())

// 骰子动画状态
const isRolling = ref(false)

// 计算职业加成后的初始属性预览
const previewStats = computed(() => {
  const baseHp = 100
  const baseSan = 100
  const baseMoney = 10000
  return {
    hp: Math.max(1, Math.min(100, baseHp + currentProfession.value.bonusHp)),
    san: Math.max(1, Math.min(100, baseSan + currentProfession.value.bonusSan)),
    money: baseMoney + currentProfession.value.bonusMoney
  }
})

// 随机切换职业（骰子效果）
async function rollProfession() {
  if (isRolling.value) return

  isRolling.value = true

  // 快速切换动画
  const rollCount = 10 + Math.floor(Math.random() * 5)
  for (let i = 0; i < rollCount; i++) {
    currentProfession.value = professions[Math.floor(Math.random() * professions.length)]
    await new Promise((r) => setTimeout(r, 50 + i * 10))
  }

  // 最终随机结果
  currentProfession.value = getRandomProfession()
  isRolling.value = false
}

// 确认职业并跳转到囤货页面
function confirmProfession() {
  // 选择职业（会应用加成）
  gameStore.selectProfession(currentProfession.value)
  router.push('/market')
}
</script>

<template>
  <div class="profession-select min-h-screen bg-gray-900 flex flex-col items-center justify-center p-8">
    <div class="w-full max-w-md text-center">
      <h2 class="text-white text-2xl mb-2">你的前世身份</h2>
      <p class="text-gray-400 text-sm mb-6">点击骰子随机切换职业</p>

      <!-- 职业卡片 -->
      <div
        class="profession-card bg-gray-800 rounded-xl p-6 mb-6 border-2 border-gray-700 transition-all"
        :class="{ 'animate-shake': isRolling }"
      >
        <div class="text-5xl mb-3">{{ currentProfession.icon }}</div>
        <h3 class="text-white text-2xl font-bold mb-2">{{ currentProfession.name }}</h3>
        <p class="text-gray-300 text-sm mb-4">{{ currentProfession.description }}</p>

        <!-- 属性预览 -->
        <div class="grid grid-cols-3 gap-2 text-sm">
          <div class="bg-gray-700/50 rounded p-2">
            <div class="text-gray-400">💰 金钱</div>
            <div
              class="font-bold"
              :class="
                currentProfession.bonusMoney > 0
                  ? 'text-green-400'
                  : currentProfession.bonusMoney < 0
                    ? 'text-red-400'
                    : 'text-white'
              "
            >
              ¥{{ previewStats.money.toLocaleString() }}
            </div>
          </div>
          <div class="bg-gray-700/50 rounded p-2">
            <div class="text-gray-400">❤️ 生命</div>
            <div
              class="font-bold"
              :class="
                currentProfession.bonusHp > 0
                  ? 'text-green-400'
                  : currentProfession.bonusHp < 0
                    ? 'text-red-400'
                    : 'text-white'
              "
            >
              {{ previewStats.hp }}
            </div>
          </div>
          <div class="bg-gray-700/50 rounded p-2">
            <div class="text-gray-400">🧠 理智</div>
            <div
              class="font-bold"
              :class="
                currentProfession.bonusSan > 0
                  ? 'text-green-400'
                  : currentProfession.bonusSan < 0
                    ? 'text-red-400'
                    : 'text-white'
              "
            >
              {{ previewStats.san }}
            </div>
          </div>
        </div>

        <!-- 解锁物品提示 -->
        <div v-if="currentProfession.unlockedItems?.length" class="mt-3 text-xs text-yellow-400">
          🔓 解锁专属商品
        </div>
      </div>

      <!-- 骰子按钮 -->
      <button
        class="w-16 h-16 bg-gray-700 rounded-xl text-3xl mb-6 hover:bg-gray-600 transition-all active:scale-90 disabled:opacity-50"
        :class="{ 'animate-spin': isRolling }"
        :disabled="isRolling"
        @click="rollProfession"
      >
        🎲
      </button>

      <!-- 确认按钮 -->
      <button
        class="w-full py-4 bg-red-600 text-white text-xl rounded-lg hover:bg-red-500 transition-all active:scale-95 disabled:opacity-50"
        :disabled="isRolling"
        @click="confirmProfession"
      >
        确认身份，开始囤货
      </button>

      <p class="text-gray-500 text-xs mt-4">距离封城还有 3 分钟</p>
    </div>
  </div>
</template>

<style scoped>
@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-5px) rotate(-2deg);
  }
  75% {
    transform: translateX(5px) rotate(2deg);
  }
}

.animate-shake {
  animation: shake 0.1s ease-in-out infinite;
}
</style>

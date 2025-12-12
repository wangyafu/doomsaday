<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  label: string
  value: number
  max?: number
  icon: string
  color?: string
}>()

const max = computed(() => props.max ?? 100)
const percentage = computed(() => Math.min(100, (props.value / max.value) * 100))

// 根据百分比决定颜色
const barColor = computed(() => {
  if (props.color) return props.color
  if (percentage.value > 60) return 'bg-green-500'
  if (percentage.value > 30) return 'bg-yellow-500'
  return 'bg-red-500'
})
</script>

<template>
  <div class="stat-bar">
    <div class="flex items-center justify-between mb-1">
      <span class="text-sm">{{ icon }} {{ label }}</span>
      <span class="text-sm font-mono">{{ value }}/{{ max }}</span>
    </div>
    <div class="h-2 bg-gray-700 rounded-full overflow-hidden">
      <div 
        class="h-full transition-all duration-500 ease-out rounded-full"
        :class="barColor"
        :style="{ width: `${percentage}%` }"
      ></div>
    </div>
  </div>
</template>

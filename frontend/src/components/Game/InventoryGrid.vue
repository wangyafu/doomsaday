<script setup lang="ts">
import type { InventoryItem } from '@/types'

defineProps<{
  items: InventoryItem[]
  compact?: boolean
}>()
</script>

<template>
  <div class="inventory-grid">
    <div 
      v-for="item in items" 
      :key="item.name"
      class="inventory-item bg-gray-800 rounded-lg p-2 flex items-center gap-2"
      :class="{ 'p-1 text-sm': compact }"
    >
      <span class="flex-1 truncate">{{ item.name }}</span>
      <span class="text-gray-400 font-mono">x{{ item.count }}</span>
    </div>
    <div v-if="items.length === 0" class="text-gray-500 text-center py-4">
      背包空空如也
    </div>
  </div>
</template>

<style scoped>
.inventory-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 0.5rem;
}
</style>

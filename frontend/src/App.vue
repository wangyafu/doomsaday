<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/gameStore'

const gameStore = useGameStore()

// 当SAN值低时显示血色滤镜
const showBloodOverlay = computed(() => gameStore.stats.san < 30)
</script>

<template>
  <div class="min-h-screen bg-night">
    <!-- 血色滤镜效果 -->
    <div v-if="showBloodOverlay" class="blood-overlay"></div>
    
    <!-- 路由视图 -->
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

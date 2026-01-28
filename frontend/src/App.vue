<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/gameStore'

const gameStore = useGameStore()

// 当SAN值低时显示血色滤镜
const showBloodOverlay = computed(() => gameStore.stats.san < 30)

// 移除全局阻塞式连接检查，改由 Home.vue 和 API 模块自行处理连接状态
/*
const showConnectDialog = ref(true)
const connectDialogRef = ref<InstanceType<typeof ConnectDialog> | null>(null)

const handleConnected = () => {
  showConnectDialog.value = false
}

onErrorCaptured((err: any) => {
  if (err.message === 'TOKEN_EXPIRED' || err.message === 'NO_TOKEN') {
    showConnectDialog.value = true
    connectDialogRef.value?.connect() 
    return false 
  }
  return true
})
*/
</script>

<template>
  <div class="min-h-screen bg-night">
    <!-- 连接对话框 (已移除阻塞) -->
    <!-- 
    <ConnectDialog 
      ref="connectDialogRef"
      :show="showConnectDialog" 
      @connected="handleConnected" 
    />
    -->

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

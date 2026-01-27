<script setup lang="ts">
import { ref, computed, onErrorCaptured } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import ConnectDialog from '@/components/ConnectDialog.vue'

const gameStore = useGameStore()

// 当SAN值低时显示血色滤镜
const showBloodOverlay = computed(() => gameStore.stats.san < 30)

// 连接控制
const showConnectDialog = ref(true)
const connectDialogRef = ref<InstanceType<typeof ConnectDialog> | null>(null)

const handleConnected = () => {
  showConnectDialog.value = false
}

// 全局错误捕获，处理 Token 过期
onErrorCaptured((err: any) => {
  if (err.message === 'TOKEN_EXPIRED' || err.message === 'NO_TOKEN') {
    showConnectDialog.value = true
    connectDialogRef.value?.connect() // 自动重试连接
    return false // 阻止错误继续传播
  }
  return true
})
</script>

<template>
  <div class="min-h-screen bg-night">
    <!-- 连接对话框 -->
    <ConnectDialog 
      ref="connectDialogRef"
      :show="showConnectDialog" 
      @connected="handleConnected" 
    />

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

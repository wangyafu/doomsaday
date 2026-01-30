<script setup lang="ts">
import { computed } from 'vue'
import type { ArchiveRecord } from '@/types'

interface Props {
  record: ArchiveRecord
  isLiked: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'like', id: string): void
}>()

const isZombie = computed(() => props.record.game_type === 'zombie')

const themeColor = computed(() => ({
  primary: isZombie.value ? 'red' : 'cyan',
  text: isZombie.value ? 'text-red-500' : 'text-cyan-500',
  bg: isZombie.value ? 'bg-red-900/50' : 'bg-cyan-900/50',
  border: isZombie.value ? '' : 'border border-cyan-500/30',
  bar: isZombie.value ? 'bg-red-600' : 'bg-gradient-to-t from-cyan-600 to-blue-500',
  extraBg: isZombie.value ? 'bg-yellow-900/30' : 'bg-cyan-900/20',
  extraBorder: isZombie.value ? '' : 'border border-cyan-900/30',
  extraText: isZombie.value ? 'text-yellow-500' : 'text-cyan-500',
  talentText: isZombie.value ? '' : 'text-cyan-300',
}))

const radarLabels = computed(() => {
  if (props.record.radar_labels && props.record.radar_labels.length === 5) {
    return props.record.radar_labels
  }
  return isZombie.value 
    ? ['战斗力', '生存力', '智慧', '运气', '人性']
    : ['生存力', '抗寒力', '智慧', '运气', '心理素质']
})



const victoryText = computed(() =>
  isZombie.value ? '🎉 通关' : '🏆 通关'
)

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const handleLike = () => {
  emit('like', props.record.id)
}
</script>

<template>
  <div class="archive-card bg-gray-900 rounded-lg p-4 sm:p-5 border border-gray-800 hover:border-gray-700 transition-all">
    <!-- 标题 -->
    <!-- 标题 -->
    <div class="text-center mb-4">
      <h3 class="text-xl font-bold text-white mb-1">
        {{ record.nickname }}
      </h3>
      <p class="text-sm font-bold opacity-90" :class="themeColor.text">
        {{ record.is_victory ? victoryText : '💀 游戏结束' }}
      </p>
    </div>

    <!-- 人设词 -->
    <div class="text-center mb-4">
      <div 
        class="inline-block px-4 py-2 rounded-lg"
        :class="[themeColor.bg, themeColor.border]"
      >
        <p class="text-xl font-bold" :class="themeColor.text">
          「{{ record.epithet }}」
        </p>
      </div>
    </div>

    <!-- 职业信息（仅丧尸） -->
    <div v-if="isZombie && record.profession_name" class="text-center mb-3">
      <span class="text-lg">{{ record.profession_icon }}</span>
      <span class="text-gray-300 ml-1 text-sm">{{ record.profession_name }}</span>
    </div>

    <!-- 存活天数 -->
    <div class="text-center mb-4">
      <p class="text-gray-400 text-xs">存活天数</p>
      <p class="text-4xl font-bold text-white">{{ record.days_survived }}</p>
    </div>

    <!-- 死因 -->
    <div v-if="record.cause_of_death" class="text-center mb-4">
      <p class="text-gray-400 text-xs">死因</p>
      <p class="text-red-400 text-sm">{{ record.cause_of_death }}</p>
    </div>

    <!-- 毒舌评语 -->
    <div class="bg-gray-800 rounded-lg p-3 mb-4">
      <p class="text-gray-300 text-sm italic">"{{ record.comment }}"</p>
    </div>

    <!-- 雷达图 -->
    <div class="mb-4">
      <p class="text-gray-400 text-xs text-center mb-2">能力评估</p>
      <div class="grid grid-cols-5 gap-1.5">
        <div 
          v-for="(value, index) in record.radar_chart" 
          :key="index"
          class="text-center"
        >
          <div class="h-16 bg-gray-800 rounded relative overflow-hidden">
            <div 
              class="absolute bottom-0 left-0 right-0 transition-all"
              :class="themeColor.bar"
              :style="{ height: `${(value || 0) * 10}%` }"
            ></div>
          </div>
          <p class="text-[10px] text-gray-500 mt-1 truncate">{{ radarLabels[index] }}</p>
          <p class="text-xs font-bold">{{ value }}</p>
        </div>
      </div>
    </div>

    <!-- 高光时刻（仅丧尸） -->
    <div 
      v-if="isZombie && record.extra_info?.highlight_moment" 
      class="rounded-lg p-2.5 mb-3"
      :class="[themeColor.extraBg, themeColor.extraBorder]"
    >
      <p :class="['text-xs mb-1', themeColor.extraText]">⭐ 高光时刻</p>
      <p class="text-gray-300 text-xs">{{ record.extra_info.highlight_moment }}</p>
    </div>

    <!-- 天赋回顾（仅冰河） -->
    <div 
      v-if="!isZombie && record.extra_info?.talents?.length" 
      class="rounded-lg p-2.5 mb-3"
      :class="[themeColor.extraBg, themeColor.extraBorder]"
    >
      <p :class="['text-xs mb-1.5', themeColor.extraText]">❄️ 选择的天赋</p>
      <div class="flex flex-wrap gap-1.5">
        <div 
          v-for="talent in record.extra_info.talents" 
          :key="talent.id"
          class="flex items-center gap-1 px-1.5 py-0.5 bg-gray-800 rounded text-[10px]"
        >
          <span>{{ talent.icon }}</span>
          <span :class="themeColor.talentText">{{ talent.name }}</span>
        </div>
      </div>
    </div>

    <!-- 底部信息栏 -->
    <div class="flex items-center justify-between pt-3 border-t border-gray-800">
      <!-- 时间和昵称 -->
      <!-- 时间 -->
      <div class="flex flex-col justify-center">
        <span class="text-[10px] text-gray-600">{{ formatDate(record.created_at) }}</span>
      </div>
      
      <!-- 点赞按钮 -->
      <button 
        @click="handleLike"
        class="flex items-center gap-1 px-3 py-1.5 rounded-full transition-all"
        :class="isLiked 
          ? 'bg-red-600/20 text-red-500' 
          : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-red-400'"
      >
        <span class="text-sm">{{ isLiked ? '❤️' : '🤍' }}</span>
        <span class="text-xs font-bold">{{ record.likes }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.archive-card {
  break-inside: avoid;
  margin-bottom: 1rem;
}
</style>
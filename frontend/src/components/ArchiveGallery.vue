<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { getArchives, likeArchive } from '@/api'
import type { ArchiveRecord, GameType } from '@/types'
import ArchiveCard from './ArchiveCard.vue'

type FilterType = 'all' | GameType

const archives = ref<ArchiveRecord[]>([])
const currentFilter = ref<FilterType>('all')
const isLoading = ref(false)
const hasMore = ref(true)
const offset = ref(0)
const likedArchives = ref<Set<string>>(new Set())

const LIMIT = 12

// 从 localStorage 读取已点赞的档案
const loadLikedArchives = () => {
  try {
    const stored = localStorage.getItem('likedArchives')
    if (stored) {
      likedArchives.value = new Set(JSON.parse(stored))
    }
  } catch {
    likedArchives.value = new Set()
  }
}

// 保存已点赞的档案到 localStorage
const saveLikedArchives = () => {
  try {
    localStorage.setItem('likedArchives', JSON.stringify([...likedArchives.value]))
  } catch {
    // 忽略存储错误
  }
}

const isLiked = (id: string) => likedArchives.value.has(id)

const fetchArchives = async (reset = false) => {
  if (isLoading.value) return
  
  isLoading.value = true
  
  try {
    if (reset) {
      offset.value = 0
      archives.value = []
      hasMore.value = true
    }
    
    const data = await getArchives(LIMIT, offset.value, currentFilter.value)
    
    if (data.length < LIMIT) {
      hasMore.value = false
    }
    
    if (reset) {
      archives.value = data
    } else {
      archives.value.push(...data)
    }
    
    offset.value += data.length
  } catch (error) {
    console.error('获取档案失败:', error)
  } finally {
    isLoading.value = false
  }
}

const handleFilterChange = (filter: FilterType) => {
  if (currentFilter.value === filter) return
  currentFilter.value = filter
  fetchArchives(true)
}

const handleLike = async (id: string) => {
  if (isLiked(id)) return
  
  try {
    const result = await likeArchive(id)
    
    // 更新本地数据
    const archive = archives.value.find(a => a.id === id)
    if (archive) {
      archive.likes = result.likes
    }
    
    // 标记为已点赞
    likedArchives.value.add(id)
    saveLikedArchives()
  } catch (error) {
    console.error('点赞失败:', error)
  }
}

const handleScroll = (e: Event) => {
  const target = e.target as HTMLElement
  const scrollBottom = target.scrollHeight - target.scrollTop - target.clientHeight
  
  if (scrollBottom < 100 && !isLoading.value && hasMore.value) {
    fetchArchives()
  }
}

onMounted(() => {
  loadLikedArchives()
  fetchArchives(true)
})

const filterOptions: { value: FilterType; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'zombie', label: '丧尸围城' },
  { value: 'ice_age', label: '冰河末世' },
]
</script>

<template>
  <div class="archive-gallery">
    <!-- 标题 -->
    <div class="text-center mb-6">
      <h2 class="text-2xl font-bold text-white mb-2">🏛️ 末世档案馆</h2>
      <p class="text-gray-500 text-sm">见证其他幸存者的末日传奇</p>
    </div>

    <!-- 筛选标签 -->
    <div class="flex justify-center gap-2 mb-6">
      <button
        v-for="option in filterOptions"
        :key="option.value"
        @click="handleFilterChange(option.value)"
        class="px-4 py-2 rounded-full text-sm font-medium transition-all"
        :class="currentFilter === option.value
          ? 'bg-red-600 text-white'
          : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'"
      >
        {{ option.label }}
      </button>
    </div>

    <!-- 档案列表 -->
    <div 
      class="archive-grid max-h-[600px] overflow-y-auto px-2 -mx-2"
      @scroll="handleScroll"
    >
      <div v-if="archives.length === 0 && !isLoading" class="text-center py-12">
        <p class="text-4xl mb-4">📭</p>
        <p class="text-gray-500">暂无档案记录</p>
        <p class="text-gray-600 text-sm mt-2">成为第一个分享结局的幸存者吧！</p>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ArchiveCard
          v-for="archive in archives"
          :key="archive.id"
          :record="archive"
          :is-liked="isLiked(archive.id)"
          @like="handleLike"
        />
      </div>

      <!-- 加载状态 -->
      <div v-if="isLoading" class="text-center py-6">
        <div class="inline-block animate-spin text-2xl">⏳</div>
        <p class="text-gray-500 text-sm mt-2">加载中...</p>
      </div>

      <!-- 没有更多 -->
      <div v-if="!hasMore && archives.length > 0" class="text-center py-6">
        <p class="text-gray-600 text-sm">— 已经到底了 —</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.archive-gallery {
  width: 100%;
}

.archive-grid {
  scrollbar-width: thin;
  scrollbar-color: #374151 #111827;
}

.archive-grid::-webkit-scrollbar {
  width: 6px;
}

.archive-grid::-webkit-scrollbar-track {
  background: #111827;
  border-radius: 3px;
}

.archive-grid::-webkit-scrollbar-thumb {
  background: #374151;
  border-radius: 3px;
}

.archive-grid::-webkit-scrollbar-thumb:hover {
  background: #4b5563;
}

/* 隐藏滚动条但在移动端保留滚动功能 */
@media (max-width: 768px) {
  .archive-grid {
    max-height: none;
    overflow-y: visible;
  }
}
</style>
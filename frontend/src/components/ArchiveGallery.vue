<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getArchives, likeArchive } from '@/api'
import type { ArchiveRecord, GameType } from '@/types'
import ArchiveCard from './ArchiveCard.vue'

type FilterType = 'all' | GameType

const archives = ref<ArchiveRecord[]>([])
const currentFilter = ref<FilterType>('all')
const isLoading = ref(false)
const isLoadingMore = ref(false)
const likedArchives = ref<Set<string>>(new Set())

// 分页相关
const INITIAL_LIMIT = 12  // 初始显示数量
const PAGE_SIZE = 9       // 每次加载更多的数量
const displayCount = ref(INITIAL_LIMIT)

// 计算是否还有更多档案可显示
const hasMore = computed(() => displayCount.value < archives.value.length)

// 当前显示的档案
const displayedArchives = computed(() => archives.value.slice(0, displayCount.value))

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

const fetchArchives = async () => {
  if (isLoading.value) return
  
  isLoading.value = true
  
  try {
    // 获取更多数据以支持"加载更多"功能
    const data = await getArchives(100, 0, currentFilter.value)
    archives.value = data
    // 重置显示数量
    displayCount.value = INITIAL_LIMIT
  } catch (error) {
    console.error('获取档案失败:', error)
  } finally {
    isLoading.value = false
  }
}

const handleFilterChange = (filter: FilterType) => {
  if (currentFilter.value === filter) return
  currentFilter.value = filter
  fetchArchives()
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

// 加载更多
const loadMore = () => {
  if (isLoadingMore.value || !hasMore.value) return
  
  isLoadingMore.value = true
  
  // 模拟加载延迟,提供更好的用户体验
  setTimeout(() => {
    displayCount.value = Math.min(displayCount.value + PAGE_SIZE, archives.value.length)
    isLoadingMore.value = false
  }, 300)
}

onMounted(() => {
  loadLikedArchives()
  fetchArchives()
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
      class="archive-grid px-2 -mx-2"
    >
      <div v-if="archives.length === 0 && !isLoading" class="text-center py-12">
        <p class="text-4xl mb-4">📭</p>
        <p class="text-gray-500">暂无档案记录</p>
        <p class="text-gray-600 text-sm mt-2">成为第一个分享结局的幸存者吧！</p>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <ArchiveCard
          v-for="archive in displayedArchives"
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

      <!-- 加载更多按钮 -->
      <div v-if="hasMore && !isLoading" class="text-center py-6">
        <button
          @click="loadMore"
          :disabled="isLoadingMore"
          class="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 
                 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed
                 border border-gray-700 hover:border-gray-600"
        >
          <span v-if="!isLoadingMore">📚 加载更多</span>
          <span v-else class="flex items-center gap-2">
            <span class="inline-block animate-spin">⏳</span>
            <span>加载中...</span>
          </span>
        </button>
        <p class="text-gray-600 text-xs mt-2">
          已显示 {{ displayedArchives.length }} / {{ archives.length }} 条
        </p>
      </div>

    </div>
  </div>
</template>

<style scoped>
.archive-gallery {
  width: 100%;
}
</style>
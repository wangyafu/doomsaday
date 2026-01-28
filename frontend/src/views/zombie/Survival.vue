<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useGameStore } from "@/stores/gameStore";
import { useUiStore } from "@/stores/uiStore";
import {
  parseNarrativeChoices,
  parseJudgeResult,
  filterHiddenContent,
} from "@/api";
import { GameEngine } from '@/services/gameEngine';
import type { NarrateStateResponse, JudgeStateResponse, InventoryItem } from "@/types";
import StatBar from "@/components/Game/StatBar.vue";
import InventoryGrid from "@/components/Game/InventoryGrid.vue";

const router = useRouter();
const gameStore = useGameStore();
const uiStore = useUiStore();

// 当前日志文本（流式更新）
const logText = ref("");
// 是否有危机事件
const hasCrisis = ref(false);
// 选项列表
const choices = ref<string[]>([]);
// 当前事件上下文（用于judge）
const eventContext = ref("");
// 自定义输入
const customAction = ref("");
// 是否显示自定义输入框
const showCustomInput = ref(false);
// 是否显示背包
const showInventory = ref(false);
// 是否流式输出完成
const streamDone = ref(false);

// 检查游戏是否结束
const shouldEnd = computed(() => gameStore.isGameOver || gameStore.isVictory);

/**
 * 应用状态更新（通用函数）
 */
function applyStateUpdate(stateResponse: NarrateStateResponse | JudgeStateResponse) {
  // 应用状态变化
  if (stateResponse.stat_changes) {
    gameStore.updateStats(stateResponse.stat_changes);
    console.log("状态变化:", stateResponse.stat_changes);
  }

  // 处理物品变化
  if (stateResponse.item_changes) {
    stateResponse.item_changes.remove?.forEach((item: InventoryItem) => {
      gameStore.removeItem(item.name, item.count);
      console.log("消耗物品:", item.name, "x", item.count);
    });
    stateResponse.item_changes.add?.forEach((item: InventoryItem) => {
      gameStore.addItem(item);
      console.log("获得物品:", item.name, "x", item.count);
    });
  }

  // 添加隐藏标签
  stateResponse.new_hidden_tags?.forEach((tag: string) => {
    gameStore.addHiddenTag(tag);
    console.log("新标签:", tag);
  });

  // 移除隐藏标签
  stateResponse.remove_hidden_tags?.forEach((tag: string) => {
    gameStore.removeHiddenTag(tag);
    console.log("移除标签:", tag);
  });
}

// 生成今日剧情（流式）
async function generateDailyNarration() {
  uiStore.setLoading(true);
  streamDone.value = false;
  logText.value = "";
  hasCrisis.value = false;
  choices.value = [];

  try {
    // 流式获取叙事内容
    let fullText = "";
    // 构建职业信息（转换为后端需要的格式）
    for await (const chunk of GameEngine.zombieNarrateStream({
      day: gameStore.day,
      stats: gameStore.stats,
      inventory: gameStore.inventory,
      hidden_tags: gameStore.hiddenTags,
      history: gameStore.history,
      shelter: gameStore.shelter,
      profession: gameStore.profession,
    })) {
      fullText += chunk;
      // 实时过滤 <hidden> 和 <state_update> 标签，避免展示给玩家
      logText.value = filterHiddenContent(fullText);
    }

    // 解析叙事内容，提取选项和状态更新
    const parsed = parseNarrativeChoices(fullText);
    logText.value = parsed.logText;
    hasCrisis.value = parsed.hasCrisis;
    choices.value = parsed.choices || [];
    // 保留完整上下文（包含 hidden 信息）供 Judge 参考
    eventContext.value = fullText;

    // 流式输出完成
    streamDone.value = true;

    // 如果无危机事件，直接从解析结果中获取状态更新
    if (!parsed.hasCrisis && parsed.stateUpdate) {
      applyStateUpdate(parsed.stateUpdate);
      // 添加历史记录（无危机，不需要 player_action 和 judge_result）
      gameStore.addHistory(parsed.logText, "none", null, null);
    } else if (!parsed.hasCrisis && !parsed.stateUpdate) {
      // 无危机但也没有状态更新（AI 可能没有正确输出），使用默认值
      console.warn("⚠️ 无危机事件但未解析到状态更新，使用默认值");
      gameStore.updateStats({ hp: 0, san: 0 });
      gameStore.addHistory(parsed.logText, "none", null, null);
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "未知错误";
    console.error("剧情生成失败:", error);
    logText.value = `API调用失败: ${errorMessage}`;
    hasCrisis.value = false;
    choices.value = [];
    streamDone.value = true;
  } finally {
    uiStore.setLoading(false);
  }
}

// 选择行动
async function selectChoice(choice: string) {
  await executeAction(choice);
}

// 提交自定义行动
async function submitCustomAction() {
  if (!customAction.value.trim()) return;
  await executeAction(customAction.value);
  customAction.value = "";
  showCustomInput.value = false;
}

// 执行行动判定（流式）
async function executeAction(action: string) {
  uiStore.setLoading(true);
  streamDone.value = false;
  logText.value = "";

  try {
    // 流式获取判定叙事（包含状态更新）
    let fullResult = "";
    // 构建职业信息（转换为后端需要的格式）
    for await (const chunk of GameEngine.zombieJudgeStream({
      day: gameStore.day,
      event_context: eventContext.value,
      action_content: action,
      stats: gameStore.stats,
      inventory: gameStore.inventory,
      history: gameStore.history,
      profession: gameStore.profession,
    })) {
      fullResult += chunk;
      // 实时过滤 <state_update> 标签，避免展示给玩家
      logText.value = filterHiddenContent(fullResult);
    }

    // 流式输出完成
    streamDone.value = true;

    // 从完整输出中解析叙事和状态更新
    const { narrativeText, stateUpdate } = parseJudgeResult(fullResult);
    logText.value = narrativeText;

    // 应用状态更新
    if (stateUpdate) {
      applyStateUpdate(stateUpdate);

      // 记录高光时刻（高分行动）
      if (stateUpdate.score >= 90) {
        gameStore.setHighLight(
          `第${gameStore.day}天: ${action} - ${narrativeText}`
        );
      }

      // 添加历史记录（包含事件描述、玩家行动、判定结果）
      gameStore.addHistory(
        eventContext.value,  // Narrator 生成的今日事件
        stateUpdate.score >= 60 ? "success" : "fail",
        action,              // 玩家选择的行动
        narrativeText        // Judge 的判定叙事
      );
    } else {
      // 未解析到状态更新，使用默认值
      console.warn("⚠️ 未解析到 Judge 状态更新，使用默认值");
      gameStore.updateStats({ hp: 0, san: -5 });
      gameStore.addHistory(eventContext.value, "none", action, narrativeText);
    }

    // 清除危机状态
    hasCrisis.value = false;
    choices.value = [];
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "未知错误";
    console.error("行动判定失败:", error);
    
    // 显示友好的错误提示
    logText.value = `⚠️ ${errorMessage}`;
    streamDone.value = true;
    
    // 如果是内容审核错误，保持危机状态，让用户可以重新选择
    // 不清除 hasCrisis 和 choices，让用户可以重新输入
  } finally {
    uiStore.setLoading(false);
  }
}

// 进入下一天
function goNextDay() {
    gameStore.nextDay();

  // 检查是否结束
  if (shouldEnd.value) {
    router.push("/ending");
    return;
  }

  generateDailyNarration();
}

onMounted(() => {
  generateDailyNarration();
});
</script>

<template>
  <div class="survival min-h-screen bg-gray-900 text-white flex flex-col">
    <!-- 顶部状态栏 -->
    <div
      class="sticky top-0 z-40 bg-black/90 backdrop-blur p-4 border-b border-gray-800"
    >
      <div class="max-w-5xl mx-auto">
        <!-- 天数 + 胜利倒计时 -->
        <div class="text-center mb-3 lg:mb-0">
          <span class="text-2xl font-bold text-red-500"
            >第 {{ gameStore.day }} 天</span
          >
          <span class="ml-3 text-sm text-gray-400">
            <span class="text-yellow-500">🏆</span>
            距离胜利还需坚持 <span class="text-yellow-400 font-semibold">{{ Math.max(0, 21 - gameStore.day) }}</span> 天
          </span>
        </div>

        <!-- 移动端：状态条 + 背包按钮 -->
        <div class="lg:hidden">
          <!-- 状态条 -->
          <div class="grid grid-cols-2 gap-3 max-w-2xl mx-auto mb-3">
            <StatBar label="生命" :value="gameStore.stats.hp" icon="❤️" />
            <StatBar label="理智" :value="gameStore.stats.san" icon="🧠" />
          </div>
          
          <!-- 背包按钮 -->
          <div class="flex justify-center">
            <button
              class="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700 transition-all border border-gray-700"
              @click="showInventory = !showInventory"
            >
              <span class="text-lg">🎒</span>
              <span class="text-sm font-medium">背包</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="flex-1 p-4 w-full relative">
      <!-- 左侧：桌面端状态面板（绝对定位） -->
      <div class="hidden lg:block absolute left-4 top-0 w-56">
        <div class="sticky top-24 bg-gray-800/50 rounded-lg p-4">
          <h3 class="text-lg font-bold mb-4">📊 状态</h3>
          <div class="space-y-4">
            <StatBar label="生命" :value="gameStore.stats.hp" icon="❤️" />
            <StatBar label="理智" :value="gameStore.stats.san" icon="🧠" />
          </div>
        </div>
      </div>

      <!-- 中央：剧情和选项（始终居中） -->
      <div class="max-w-2xl mx-auto">
        <!-- 日志区域 -->
        <div class="bg-gray-800/50 rounded-lg p-4 mb-4 min-h-[200px]">
          <!-- 日志文本（流式显示） -->
          <div 
            class="whitespace-pre-wrap leading-relaxed"
            :class="{ 'text-yellow-400 font-medium': logText.startsWith('⚠️') }"
          >
            {{ logText }}
            <span v-if="!streamDone" class="animate-pulse">▌</span>
          </div>
          
        </div>

        <!-- 选项区域 -->
        <div v-if="streamDone && !uiStore.isLoading" class="space-y-3">
          <!-- 危机选项 -->
          <template v-if="hasCrisis && choices.length > 0">
            <button
              v-for="(choice, index) in choices"
              :key="index"
              class="w-full p-3 bg-gray-800 rounded-lg text-left hover:bg-gray-700 transition-all active:scale-98 border border-gray-700 hover:border-red-500"
              @click="selectChoice(choice)"
            >
              {{ choice }}
            </button>

            <!-- 自定义输入选项 -->
            <button
              class="w-full p-3 bg-gray-800/50 rounded-lg text-left hover:bg-gray-700 transition-all border border-dashed border-gray-600"
              @click="showCustomInput = !showCustomInput"
            >
              E. 自由输入...
            </button>

            <!-- 自定义输入框 -->
            <div v-if="showCustomInput" class="flex gap-2">
              <input
                v-model="customAction"
                type="text"
                placeholder="输入你想做的事..."
                class="flex-1 p-3 bg-gray-800 rounded-lg border border-gray-600 focus:border-red-500 focus:outline-none"
                @keyup.enter="submitCustomAction"
              />
              <button
                class="px-4 bg-red-600 rounded-lg hover:bg-red-500 transition"
                @click="submitCustomAction"
              >
                确定
              </button>
            </div>
          </template>

          <!-- 无危机，进入下一天 -->
          <template v-else>
            <button
              class="w-full p-4 bg-red-600 rounded-lg font-bold text-lg hover:bg-red-500 transition-all active:scale-98"
              @click="goNextDay"
            >
              进入下一天 →
            </button>
          </template>
        </div>
      </div>

      <!-- 右侧：桌面端常驻背包（绝对定位） -->
      <div class="hidden lg:block absolute right-4 top-0 w-72">
        <div class="sticky top-32 bg-gray-800/50 rounded-lg p-4">
          <h3 class="text-lg font-bold mb-4">🎒 背包</h3>
          <InventoryGrid :items="gameStore.inventory" />
        </div>
      </div>
    </div>



    <!-- 背包弹窗：仅移动端使用 -->
    <Teleport to="body">
      <div
        v-if="showInventory"
        class="lg:hidden fixed inset-0 bg-black/80 z-50 flex items-end justify-center"
        @click.self="showInventory = false"
      >
        <div
          class="bg-gray-900 w-full max-w-lg rounded-t-2xl p-4 max-h-[70vh] overflow-y-auto"
        >
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-bold">🎒 背包</h3>
            <button
              class="text-gray-400 hover:text-white"
              @click="showInventory = false"
            >
              ✕
            </button>
          </div>
          <InventoryGrid :items="gameStore.inventory" />
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.active\:scale-98:active {
  transform: scale(0.98);
}
</style>

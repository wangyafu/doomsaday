<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useGameStore } from "@/stores/gameStore";
import { useUiStore } from "@/stores/uiStore";
import {
  narrateStream,
  narrateState,
  judgeStream,
  judgeState,
  parseNarrativeChoices,
  filterHiddenContent,
} from "@/api";
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
// 是否正在计算状态更新
const isCalculatingState = ref(false);

// 检查游戏是否结束
const shouldEnd = computed(() => gameStore.isGameOver || gameStore.isVictory);

// 生成今日剧情（流式）
async function generateDailyNarration() {
  uiStore.setLoading(true);
  streamDone.value = false;
  logText.value = "";
  hasCrisis.value = false;
  choices.value = [];

  try {
    // 第一步：流式获取叙事内容
    let fullText = "";
    for await (const chunk of narrateStream({
      day: gameStore.day,
      stats: gameStore.stats,
      inventory: gameStore.inventory,
      hidden_tags: gameStore.hiddenTags,
      history: gameStore.history,
      shelter: gameStore.shelter,
    })) {
      fullText += chunk;
      // 实时过滤 <hidden> 标签，避免展示给玩家
      logText.value = filterHiddenContent(fullText);
    }

    // 解析叙事内容，提取选项（同时过滤掉 <hidden> 标签）
    const parsed = parseNarrativeChoices(fullText);
    logText.value = parsed.logText;
    hasCrisis.value = parsed.hasCrisis;
    choices.value = parsed.choices || [];
    // 保留完整上下文（包含 hidden 信息）供 Judge 参考
    eventContext.value = fullText;

    // 流式输出完成
    streamDone.value = true;

    // 第二步：如果无危机事件，获取状态更新
    if (!parsed.hasCrisis) {
      isCalculatingState.value = true;
      
      const stateResponse = await narrateState({
        day: gameStore.day,
        stats: gameStore.stats,
        inventory: gameStore.inventory,
        hidden_tags: gameStore.hiddenTags,
        history: gameStore.history,
        narrative_context: fullText,
      });

      // 应用状态变化
      if (stateResponse.stat_changes) {
        gameStore.updateStats(stateResponse.stat_changes);
      }

      // 处理物品变化
      if (stateResponse.item_changes) {
        stateResponse.item_changes.remove?.forEach((item) => {
          gameStore.removeItem(item.name, item.count);
        });
        stateResponse.item_changes.add?.forEach((item) => {
          gameStore.addItem(item);
        });
      }

      // 添加隐藏标签
      stateResponse.new_hidden_tags?.forEach((tag) => {
        gameStore.addHiddenTag(tag);
      });

      // 添加历史记录
      gameStore.addHistory(parsed.logText, "none");
      
      isCalculatingState.value = false;
    }
  } catch (error: any) {
    console.error("剧情生成失败:", error);
    logText.value = `API调用失败: ${error?.message || "未知错误"}`;
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
    // 第一步：流式获取判定叙事
    let narrativeResult = "";
    for await (const chunk of judgeStream({
      day: gameStore.day,
      event_context: eventContext.value,
      action_content: action,
      stats: gameStore.stats,
      inventory: gameStore.inventory,
      history: gameStore.history,
    })) {
      narrativeResult += chunk;
      logText.value = narrativeResult;
    }

    // 流式输出完成，开始计算状态
    streamDone.value = true;
    isCalculatingState.value = true;

    // 第二步：获取状态更新
    const stateResponse = await judgeState({
      day: gameStore.day,
      event_context: eventContext.value,
      action_content: action,
      narrative_result: narrativeResult,
      stats: gameStore.stats,
      inventory: gameStore.inventory,
      hidden_tags: gameStore.hiddenTags,
      history: gameStore.history,
    });

    // 更新状态
    if (stateResponse.stat_changes) {
      gameStore.updateStats(stateResponse.stat_changes);
      console.log("状态变化:", stateResponse.stat_changes);
    }

    // 处理物品变化
    if (stateResponse.item_changes) {
      stateResponse.item_changes.remove?.forEach((item) => {
        gameStore.removeItem(item.name, item.count);
        console.log("消耗物品:", item.name, "x", item.count);
      });
      stateResponse.item_changes.add?.forEach((item) => {
        gameStore.addItem(item);
        console.log("获得物品:", item.name, "x", item.count);
      });
    }

    // 添加隐藏标签
    stateResponse.new_hidden_tags?.forEach((tag) => {
      gameStore.addHiddenTag(tag);
      console.log("新标签:", tag);
    });

    // 记录高光时刻（高分行动）
    if (stateResponse.score >= 90) {
      gameStore.setHighLight(
        `第${gameStore.day}天: ${action} - ${narrativeResult}`
      );
    }

    // 清除危机状态
    hasCrisis.value = false;
    choices.value = [];

    // 添加历史记录
    gameStore.addHistory(
      narrativeResult,
      stateResponse.score >= 60 ? "success" : "fail"
    );

    isCalculatingState.value = false;
  } catch (error: any) {
    console.error("行动判定失败:", error);
    logText.value = "你的行动没有产生预期的效果...";
    streamDone.value = true;
    isCalculatingState.value = false;
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
        <!-- 天数 -->
        <div class="text-center mb-3 lg:mb-0">
          <span class="text-2xl font-bold text-red-500"
            >第 {{ gameStore.day }} 天</span
          >
        </div>

        <!-- 状态条：仅移动端显示 -->
        <div class="lg:hidden grid grid-cols-3 gap-3 max-w-2xl mx-auto">
          <StatBar label="生命" :value="gameStore.stats.hp" icon="❤️" />
          <StatBar label="饱腹" :value="gameStore.stats.hunger" icon="🍔" />
          <StatBar label="理智" :value="gameStore.stats.san" icon="🧠" />
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
            <StatBar label="饱腹" :value="gameStore.stats.hunger" icon="🍔" />
            <StatBar label="理智" :value="gameStore.stats.san" icon="🧠" />
          </div>
        </div>
      </div>

      <!-- 中央：剧情和选项（始终居中） -->
      <div class="max-w-2xl mx-auto">
        <!-- 日志区域 -->
        <div class="bg-gray-800/50 rounded-lg p-4 mb-4 min-h-[200px]">
          <!-- 日志文本（流式显示） -->
          <div class="whitespace-pre-wrap leading-relaxed">
            {{ logText }}
            <span v-if="!streamDone" class="animate-pulse">▌</span>
          </div>
          
          <!-- 状态计算中提示 -->
          <div
            v-if="isCalculatingState"
            class="mt-4 flex items-center gap-2 text-gray-400 text-sm"
          >
            <svg
              class="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span>正在计算状态变化...</span>
          </div>
        </div>

        <!-- 选项区域 -->
        <div v-if="streamDone && !uiStore.isLoading && !isCalculatingState" class="space-y-3">
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

    <!-- 底部工具栏：仅移动端显示 -->
    <div
      class="lg:hidden sticky bottom-0 bg-black/90 backdrop-blur border-t border-gray-800 p-3 safe-area-bottom"
    >
      <div class="max-w-2xl mx-auto flex justify-center">
        <button
          class="flex flex-col items-center text-gray-400 hover:text-white transition"
          @click="showInventory = !showInventory"
        >
          <span class="text-xl">🎒</span>
          <span class="text-xs">背包</span>
        </button>
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

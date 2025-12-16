import type {
  Stats,
  InventoryItem,
  HistoryEntry,
  Shelter,
  NarrateStateResponse,
  JudgeStateResponse,
  EndingResponse,
} from "@/types";

// 根据环境变量设置 API 基础路径
// 开发环境：使用代理到 localhost:8000
// 生产环境：使用完整的生产域名
const API_BASE = import.meta.env.MODE === 'production' 
  ? 'https://moshi.hgtang.com/api' 
  : '/api';

/**
 * 调试日志：打印 API 请求体
 */
function logRequest(endpoint: string, body: unknown) {
  console.group(`🚀 [API] ${endpoint}`);
  console.log(JSON.stringify(body, null, 2));
  console.groupEnd();
}

/**
 * 从文本中解析 <state_update> 标签内的 JSON
 * 用于从流式输出中提取状态更新数据
 */
export function parseStateUpdate<T>(text: string): { content: string; stateUpdate: T | null } {
  const stateUpdateMatch = text.match(/<state_update>([\s\S]*?)<\/state_update>/i);
  
  if (stateUpdateMatch) {
    // 移除 state_update 标签，保留纯叙事内容
    const content = text.replace(/<state_update>[\s\S]*?<\/state_update>/gi, "").trim();
    
    try {
      const stateUpdate = JSON.parse(stateUpdateMatch[1].trim()) as T;
      console.log("📊 [API] 解析到状态更新:", stateUpdate);
      return { content, stateUpdate };
    } catch (e) {
      console.error("❌ [API] 状态更新 JSON 解析失败:", e);
      return { content, stateUpdate: null };
    }
  }
  
  return { content: text, stateUpdate: null };
}

/**
 * 实时过滤 <state_update> 标签内容（用于流式输出时）
 * 处理不完整的标签：如果检测到 <state_update> 开始但未闭合，截断该部分
 */
export function filterStateUpdateContent(text: string): string {
  // 移除完整的 <state_update>...</state_update> 标签
  let filtered = text.replace(/<state_update>[\s\S]*?<\/state_update>/gi, "");
  
  // 处理未闭合的 <state_update> 标签（流式输出中可能出现）
  const stateUpdateStart = filtered.indexOf("<state_update>");
  if (stateUpdateStart !== -1) {
    filtered = filtered.substring(0, stateUpdateStart);
  }
  
  // 处理可能的部分标签（如 "<state" 或 "<state_up"）
  const partialMatch = filtered.match(/<s(?:t(?:a(?:t(?:e(?:_(?:u(?:p(?:d(?:a(?:t(?:e)?)?)?)?)?)?)?)?)?)?)?$/i);
  if (partialMatch) {
    filtered = filtered.substring(0, filtered.length - partialMatch[0].length);
  }
  
  return filtered;
}

/**
 * 每日剧情生成 - 流式输出叙事内容
 * 返回一个 AsyncGenerator，逐块返回文本
 */
export async function* narrateStream(params: {
  day: number;
  stats: Stats;
  inventory: InventoryItem[];
  hidden_tags: string[];
  history: HistoryEntry[];
  shelter?: Shelter | null;
  profession?: { id: string; name: string; description: string; hidden_description: string } | null;
}): AsyncGenerator<string, void, unknown> {
  logRequest("POST /game/narrate/stream", params);
  
  const response = await fetch(`${API_BASE}/game/narrate/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // 解析 SSE 事件
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          const data = JSON.parse(line.slice(6));
          if (data.type === "content" && data.text) {
            yield data.text;
          } else if (data.type === "error") {
            throw new Error(data.error);
          }
          // done 事件不需要特殊处理，循环会自然结束
        } catch (e) {
          // 忽略解析错误
        }
      }
    }
  }
}

/**
 * 实时过滤 <hidden>、<state_update> 标签，并格式化 <options> 内容（用于流式输出时）
 * 处理不完整的标签：如果检测到标签开始但未闭合，截断该部分
 * 注意：<options> 标签内的选项会被格式化为换行显示
 */
export function filterHiddenContent(text: string): string {
  // 移除完整的 <hidden>...</hidden> 标签
  let filtered = text.replace(/<hidden>[\s\S]*?<\/hidden>/gi, "");
  
  // 移除完整的 <state_update>...</state_update> 标签
  filtered = filtered.replace(/<state_update>[\s\S]*?<\/state_update>/gi, "");
  
  // 处理完整的 <options>...</options> 标签：提取内容并格式化选项
  filtered = filtered.replace(/<options>([\s\S]*?)<\/options>/gi, (_, content) => {
    return formatOptionsContent(content);
  });
  
  // 处理未闭合的 <options> 标签（流式输出中）：提取已有内容并格式化
  const optionsStart = filtered.indexOf("<options>");
  if (optionsStart !== -1) {
    const beforeOptions = filtered.substring(0, optionsStart);
    const optionsContent = filtered.substring(optionsStart + 9); // 9 = "<options>".length
    // 格式化已有的选项内容
    return beforeOptions + formatOptionsContent(optionsContent);
  }
  
  // 处理未闭合的 <hidden> 标签（流式输出中可能出现）
  const hiddenStart = filtered.indexOf("<hidden>");
  if (hiddenStart !== -1) {
    filtered = filtered.substring(0, hiddenStart);
  }
  
  // 处理未闭合的 <state_update> 标签
  const stateUpdateStart = filtered.indexOf("<state_update>");
  if (stateUpdateStart !== -1) {
    filtered = filtered.substring(0, stateUpdateStart);
  }
  
  // 处理可能的部分 <hidden> 标签（如 "<hid" 或 "<hidden"）
  const hiddenPartialMatch = filtered.match(/<h(?:i(?:d(?:d(?:e(?:n)?)?)?)?)?$/i);
  if (hiddenPartialMatch) {
    filtered = filtered.substring(0, filtered.length - hiddenPartialMatch[0].length);
  }
  
  // 处理可能的部分 <state_update> 标签
  const statePartialMatch = filtered.match(/<s(?:t(?:a(?:t(?:e(?:_(?:u(?:p(?:d(?:a(?:t(?:e)?)?)?)?)?)?)?)?)?)?)?$/i);
  if (statePartialMatch) {
    filtered = filtered.substring(0, filtered.length - statePartialMatch[0].length);
  }
  
  // 处理可能的部分 <options> 标签
  const optionsPartialMatch = filtered.match(/<o(?:p(?:t(?:i(?:o(?:n(?:s)?)?)?)?)?)?$/i);
  if (optionsPartialMatch) {
    filtered = filtered.substring(0, filtered.length - optionsPartialMatch[0].length);
  }
  
  return filtered;
}

/**
 * 格式化选项内容：将 A. B. C. D. 选项分行显示
 * 支持选项之间无换行的情况（如 "A. xxx B. yyy"）
 */
function formatOptionsContent(content: string): string {
  // 使用正则匹配 A. B. C. D. 开头的选项，在每个选项前添加换行
  const formatted = content
    .replace(/([A-D])\.\s*/g, "\n$1. ")  // 在每个选项前加换行
    .trim();
  return "\n" + formatted;
}

/**
 * 从叙事文本中解析危机事件、选项和状态更新
 * 支持 <options>、<hidden> 和 <state_update> 标签
 */
export function parseNarrativeChoices(text: string): {
  logText: string;
  hasCrisis: boolean;
  choices: string[] | null;
  hiddenInfo: string | null;
  stateUpdate: NarrateStateResponse | null;
} {
  // 提取并移除 <hidden> 标签内容
  let hiddenInfo: string | null = null;
  const hiddenMatch = text.match(/<hidden>([\s\S]*?)<\/hidden>/i);
  if (hiddenMatch) {
    hiddenInfo = hiddenMatch[1].trim();
    text = text.replace(/<hidden>[\s\S]*?<\/hidden>/gi, "").trim();
  }

  // 提取并移除 <state_update> 标签内容
  let stateUpdate: NarrateStateResponse | null = null;
  const stateUpdateMatch = text.match(/<state_update>([\s\S]*?)<\/state_update>/i);
  if (stateUpdateMatch) {
    try {
      stateUpdate = JSON.parse(stateUpdateMatch[1].trim()) as NarrateStateResponse;
      console.log("📊 [API] 解析到 Narrator 状态更新:", stateUpdate);
    } catch (e) {
      console.error("❌ [API] Narrator 状态更新 JSON 解析失败:", e);
    }
    text = text.replace(/<state_update>[\s\S]*?<\/state_update>/gi, "").trim();
  }

  // 尝试从 <options> 标签中解析选项
  const optionsMatch = text.match(/<options>([\s\S]*?)<\/options>/i);
  if (optionsMatch) {
    const optionsText = optionsMatch[1].trim();
    // 移除 <options> 标签，保留日志正文
    const logText = text.replace(/<options>[\s\S]*?<\/options>/gi, "").trim();
    
    // 解析选项 A. B. C. D.（支持换行和无换行两种格式）
    const choices = parseChoicesFromText(optionsText);

    if (choices.length >= 4) {
      // 有危机事件时，不应该有 stateUpdate（由 Judge 处理）
      return { logText, hasCrisis: true, choices: choices.slice(0, 4), hiddenInfo, stateUpdate: null };
    }
  }

  // 兼容旧格式：使用 --- 分隔符
  if (text.includes("---")) {
    const parts = text.split("---");
    const logText = parts[0].trim();
    const optionsText = parts[1]?.trim() || "";

    const choices = parseChoicesFromText(optionsText);

    if (choices.length >= 4) {
      return { logText, hasCrisis: true, choices: choices.slice(0, 4), hiddenInfo, stateUpdate: null };
    }
  }

  return { logText: text.trim(), hasCrisis: false, choices: null, hiddenInfo, stateUpdate };
}

/**
 * 从文本中解析 A. B. C. D. 选项
 * 支持换行分隔和无换行两种格式
 */
function parseChoicesFromText(optionsText: string): string[] {
  const choices: string[] = [];
  
  // 使用正则匹配 A. B. C. D. 选项（支持无换行格式）
  // 匹配模式：字母 + 点 + 内容（直到下一个选项或字符串结束）
  const pattern = /([A-D])\.\s*([\s\S]*?)(?=(?:[A-D]\.|$))/g;
  let match;
  
  while ((match = pattern.exec(optionsText)) !== null) {
    const letter = match[1];
    const content = match[2].trim();
    if (content) {
      choices.push(`${letter}. ${content}`);
    }
  }
  
  // 如果正则没匹配到，尝试按行解析（兼容旧格式）
  if (choices.length === 0) {
    const lines = optionsText.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (/^[A-D]\.\s*.+/.test(trimmed)) {
        choices.push(trimmed);
      }
    }
  }
  
  return choices;
}

/**
 * 行动判定 - 流式输出判定叙事
 * 
 * @param day - 当前天数
 * @param event_context - 本回合 /narrate/stream 的输出（今日事件描述）
 * @param action_content - 用户选择的行动
 */
export async function* judgeStream(params: {
  day: number;
  event_context: string;
  action_content: string;
  stats: Stats;
  inventory: InventoryItem[];
  history: HistoryEntry[];
  profession?: { id: string; name: string; description: string; hidden_description: string } | null;
}): AsyncGenerator<string, void, unknown> {
  logRequest("POST /game/judge/stream", params);
  
  const response = await fetch(`${API_BASE}/game/judge/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          const data = JSON.parse(line.slice(6));
          if (data.type === "content" && data.text) {
            yield data.text;
          } else if (data.type === "error") {
            throw new Error(data.error);
          }
        } catch (e) {
          // 忽略解析错误
        }
      }
    }
  }
}

/**
 * 从 Judge 流式输出中解析状态更新
 * Judge 的输出格式：叙事文本 + <state_update>JSON</state_update>
 */
export function parseJudgeResult(text: string): {
  narrativeText: string;
  stateUpdate: JudgeStateResponse | null;
} {
  let stateUpdate: JudgeStateResponse | null = null;
  const stateUpdateMatch = text.match(/<state_update>([\s\S]*?)<\/state_update>/i);
  
  if (stateUpdateMatch) {
    try {
      stateUpdate = JSON.parse(stateUpdateMatch[1].trim()) as JudgeStateResponse;
      console.log("📊 [API] 解析到 Judge 状态更新:", stateUpdate);
    } catch (e) {
      console.error("❌ [API] Judge 状态更新 JSON 解析失败:", e);
    }
  }
  
  // 移除 state_update 标签，保留纯叙事内容
  const narrativeText = text.replace(/<state_update>[\s\S]*?<\/state_update>/gi, "").trim();
  
  return { narrativeText, stateUpdate };
}

/**
 * 结局结算
 */
export async function ending(params: {
  days_survived: number;
  high_light_moment: string;
  final_stats: Stats;
  final_inventory: InventoryItem[];
  history: HistoryEntry[];
  profession?: { id: string; name: string; description: string; hidden_description: string } | null;
}): Promise<EndingResponse> {
  logRequest("POST /game/ending", params);
  
  const response = await fetch(`${API_BASE}/game/ending`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

import type {
  Stats,
  InventoryItem,
  HistoryEntry,
  Shelter,
  NarrateStateResponse,
  JudgeStateResponse,
  EndingResponse,
} from "@/types";

const API_BASE = "/api";

/**
 * 调试日志：打印 API 请求体
 */
function logRequest(endpoint: string, body: unknown) {
  console.group(`🚀 [API] ${endpoint}`);
  console.log(JSON.stringify(body, null, 2));
  console.groupEnd();
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
 * 每日剧情生成 - 状态更新（仅在无危机事件时调用）
 * 
 * @param narrative_context - 本回合 /narrate/stream 的完整输出
 */
export async function narrateState(params: {
  day: number;
  stats: Stats;
  inventory: InventoryItem[];
  hidden_tags: string[];
  history: HistoryEntry[];
  narrative_context: string;
}): Promise<NarrateStateResponse> {
  logRequest("POST /game/narrate/state", params);
  
  const response = await fetch(`${API_BASE}/game/narrate/state`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

/**
 * 实时过滤 <hidden> 标签内容（用于流式输出时）
 * 处理不完整的标签：如果检测到 <hidden> 开始但未闭合，截断该部分
 */
export function filterHiddenContent(text: string): string {
  // 移除完整的 <hidden>...</hidden> 标签
  let filtered = text.replace(/<hidden>[\s\S]*?<\/hidden>/gi, "");
  
  // 处理未闭合的 <hidden> 标签（流式输出中可能出现）
  const hiddenStart = filtered.indexOf("<hidden>");
  if (hiddenStart !== -1) {
    // 截断从 <hidden> 开始的部分
    filtered = filtered.substring(0, hiddenStart);
  }
  
  // 处理可能的部分标签（如 "<hid" 或 "<hidden"）
  const partialMatch = filtered.match(/<h(?:i(?:d(?:d(?:e(?:n)?)?)?)?)?$/i);
  if (partialMatch) {
    filtered = filtered.substring(0, filtered.length - partialMatch[0].length);
  }
  
  return filtered;
}

/**
 * 从叙事文本中解析危机事件和选项
 * 同时过滤掉 <hidden>...</hidden> 标签（仅供后端 Judge 参考，不展示给玩家）
 */
export function parseNarrativeChoices(text: string): {
  logText: string;
  hasCrisis: boolean;
  choices: string[] | null;
  hiddenInfo: string | null;
} {
  // 提取并移除 <hidden> 标签内容
  let hiddenInfo: string | null = null;
  const hiddenMatch = text.match(/<hidden>([\s\S]*?)<\/hidden>/i);
  if (hiddenMatch) {
    hiddenInfo = hiddenMatch[1].trim();
    text = text.replace(/<hidden>[\s\S]*?<\/hidden>/gi, "").trim();
  }

  if (text.includes("---")) {
    const parts = text.split("---");
    const logText = parts[0].trim();
    const optionsText = parts[1]?.trim() || "";

    // 解析选项 A. B. C. D.
    const choices: string[] = [];
    const pattern = /([A-D])\.\s*(.+?)(?=(?:[A-D]\.|$))/gs;
    let match;
    while ((match = pattern.exec(optionsText)) !== null) {
      choices.push(`${match[1]}. ${match[2].trim()}`);
    }

    if (choices.length >= 4) {
      return { logText, hasCrisis: true, choices: choices.slice(0, 4), hiddenInfo };
    }
  }

  return { logText: text.trim(), hasCrisis: false, choices: null, hiddenInfo };
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
 * 行动判定 - 状态更新
 * 
 * @param event_context - 本回合 /narrate/stream 的输出（危机事件描述）
 * @param narrative_result - 本回合 /judge/stream 的输出（判定叙事）
 */
export async function judgeState(params: {
  day: number;
  event_context: string;
  action_content: string;
  narrative_result: string;
  stats: Stats;
  inventory: InventoryItem[];
  hidden_tags: string[];
  history: HistoryEntry[];
}): Promise<JudgeStateResponse> {
  logRequest("POST /game/judge/state", params);
  
  const response = await fetch(`${API_BASE}/game/judge/state`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
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

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
 */
export async function narrateState(params: {
  day: number;
  stats: Stats;
  inventory: InventoryItem[];
  narrative_context: string;
}): Promise<NarrateStateResponse> {
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
 * 从叙事文本中解析危机事件和选项
 */
export function parseNarrativeChoices(text: string): {
  logText: string;
  hasCrisis: boolean;
  choices: string[] | null;
} {
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
      return { logText, hasCrisis: true, choices: choices.slice(0, 4) };
    }
  }

  return { logText: text.trim(), hasCrisis: false, choices: null };
}

/**
 * 行动判定 - 流式输出判定叙事
 */
export async function* judgeStream(params: {
  event_context: string;
  action_content: string;
  stats: Stats;
  inventory: InventoryItem[];
  history: HistoryEntry[];
}): AsyncGenerator<string, void, unknown> {
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
 */
export async function judgeState(params: {
  event_context: string;
  action_content: string;
  narrative_result: string;
  stats: Stats;
  inventory: InventoryItem[];
}): Promise<JudgeStateResponse> {
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

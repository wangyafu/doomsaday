import type {
  Stats,
  InventoryItem,
  HistoryEntry,
  Shelter,
  EndingResponse,
  ArchiveRecord,
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

// 存储 Session Token
let sessionToken: string | null = null;
export function setSessionToken(token: string | null) {
  sessionToken = token;
}
export function getSessionToken(): string | null {
  return sessionToken;
}

/**
 * 带有自动刷新能力的 fetch 包装器
 * 用于在遇到 401 错误时静默刷新 Token 并重试
 */
async function safeFetch(url: string, options: RequestInit = {}, retryCount = 0): Promise<Response> {
  const response = await fetch(url, options);

  // 如果遇到 401 且还可以重试
  if (response.status === 401 && retryCount < 1) {
    console.warn("🔑 [API] 令牌已过期，正在尝试自动刷新并重试...");
    try {
      // 这里的 checkAccess 会更新全局 sessionToken
      await checkAccess();
      const newToken = getSessionToken();
      if (!newToken) return response;

      // 如果原来是通过 Query 参数传递的 token，则更新它
      let nextUrl = url;
      if (url.includes("token=")) {
        try {
          // 使用 URLSearchParams 处理以确保兼容性
          const [baseUrl, search] = url.split('?');
          const params = new URLSearchParams(search);
          params.set("token", newToken);
          nextUrl = `${baseUrl}?${params.toString()}`;
        } catch (e) {
          console.warn("⚠️ URL 解析失败，无法更新 Token:", e);
        }
      }

      // 如果原来是通过 Header 传递的 token，则更新它
      const nextOptions = { ...options };
      if (nextOptions.headers) {
        const headers = new Headers(nextOptions.headers);
        if (headers.has("X-Game-Token")) {
          headers.set("X-Game-Token", newToken);
        }
        nextOptions.headers = headers;
      }

      // 递归调用，重试次数 +1
      return safeFetch(nextUrl, nextOptions, retryCount + 1);
    } catch (e) {
      console.error("❌ [API] 自动刷新令牌失败:", e);
      return response; // 还是返回原始的 401
    }
  }

  return response;
}

/**
 * 检查访问权限
 */
export async function checkAccess(): Promise<{ token: string; type: string; message: string }> {
  logRequest("POST /game/access", {});

  const response = await fetch(`${API_BASE}/game/access`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    if (response.status === 503) {
      throw new Error("SERVER_FULL");
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  // 保存 Token
  setSessionToken(data.token);
  return data;
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

  // 确保有 Token
  const token = getSessionToken();
  if (!token) throw new Error("NO_TOKEN");

  // 将 Token 放在 Query 参数中 (SSE 标准兼容性更好)
  const response = await safeFetch(`${API_BASE}/game/narrate/stream?token=${encodeURIComponent(token)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    if (response.status === 401) throw new Error("TOKEN_EXPIRED");
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
            // 错误事件，直接抛出
            throw new Error(data.error);
          }
          // done 事件不需要特殊处理，循环会自然结束
        } catch (e) {
          // 如果是我们主动抛出的错误，继续向上抛出
          if (e instanceof Error && e.message) {
            throw e;
          }
          // 其他解析错误（如 JSON 格式问题）静默忽略
        }
      }
    }
  }
}
/**
 * 过滤隐藏标签（<hidden>、<state_update>、<options>）
 * 用户不应在叙事正文中看到这些原始标签
 */
export function filterHiddenContent(text: string): string {
  return text
    .replace(/<hidden>[\s\S]*?<\/hidden>/gi, "")
    .replace(/<state_update>[\s\S]*?<\/state_update>/gi, "")
    .replace(/<options>[\s\S]*?<\/options>/gi, "")
    .trim();
}

/**
 * 格式化选项内容（可选，用于美化展示）
 */
export function formatOptionsContent(optionsRaw: string): string[] {
  return optionsRaw
    .split(/\n/)
    .map(line => line.replace(/^[A-Z][.、\s]*/i, "").trim())
    .filter(Boolean);
}

/**
 * 解析叙事选项和状态更新
 */
export function parseNarrativeChoices(text: string) {
  const optionsMatch = text.match(/<options>([\s\S]*?)<\/options>/i);
  const stateUpdateMatch = text.match(/<state_update>([\s\S]*?)<\/state_update>/i);

  let choices: string[] = [];
  let hasCrisis = false;
  let stateUpdate = null;

  if (optionsMatch) {
    hasCrisis = true;
    choices = formatOptionsContent(optionsMatch[1]);
  }

  if (stateUpdateMatch) {
    try {
      stateUpdate = JSON.parse(stateUpdateMatch[1].trim());
    } catch (e) {
      console.error("解析状态更新失败:", e);
    }
  }

  return {
    logText: filterHiddenContent(text),
    hasCrisis,
    choices,
    stateUpdate
  };
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

  const token = getSessionToken();
  if (!token) throw new Error("NO_TOKEN");

  const response = await safeFetch(`${API_BASE}/game/judge/stream?token=${encodeURIComponent(token)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    if (response.status === 401) throw new Error("TOKEN_EXPIRED");
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
            // 内容审核或其他错误，直接抛出
            throw new Error(data.error);
          }
        } catch (e) {
          // 如果是我们主动抛出的错误，继续向上抛出
          if (e instanceof Error && e.message) {
            throw e;
          }
          // 其他解析错误（如 JSON 格式问题）静默忽略
        }
      }
    }
  }
}

/**
 * 解析判定结果和状态更新
 */
export function parseJudgeResult(text: string) {
  const stateUpdateMatch = text.match(/<state_update>([\s\S]*?)<\/state_update>/i);
  let stateUpdate = null;

  if (stateUpdateMatch) {
    try {
      stateUpdate = JSON.parse(stateUpdateMatch[1].trim());
    } catch (e) {
      console.error("解析状态更新失败:", e);
    }
  }

  return {
    narrativeText: filterHiddenContent(text),
    stateUpdate
  };
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

  const token = getSessionToken();
  if (!token) throw new Error("NO_TOKEN");

  const response = await safeFetch(`${API_BASE}/game/ending`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Game-Token": token
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    if (response.status === 401) throw new Error("TOKEN_EXPIRED");
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}



/**
 * 提交结局到末世档案
 */
export async function submitArchive(params: {
  nickname: string;
  epithet: string;
  days_survived: number;
  is_victory: boolean;
  cause_of_death: string | null;
  comment: string;
  radar_chart: number[];
  profession_name: string | null;
  profession_icon: string | null;
}): Promise<ArchiveRecord> {
  logRequest("POST /archive/submit", params);

  const response = await safeFetch(`${API_BASE}/archive/submit`, {
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
 * 获取末世档案列表
 */
export async function getArchives(limit: number = 20): Promise<ArchiveRecord[]> {
  const response = await safeFetch(`${API_BASE}/archive/list?limit=${limit}`);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}



/**
 * 检查后端服务健康状态
 * 返回: 'connected' | 'full' | 'disconnected'
 */
export async function checkHealth(): Promise<'connected' | 'full' | 'disconnected'> {
  try {
    const response = await fetch(`${API_BASE}/health`, { method: 'GET' });
    if (response.ok) {
      return 'connected';
    }
    if (response.status === 503) {
      return 'full';
    }
    return 'disconnected';
  } catch (e) {
    console.warn("⚠️ [API] 后端服务未连接:", e);
    return 'disconnected';
  }
}


// ==================== 冰河末世 API ====================

/**
 * 冰河末世 - 批量叙事流式输出
 */
export async function* iceAgeNarrateStream(params: {
  start_day: number;
  days_to_generate: number;
  stats: Stats;
  inventory: InventoryItem[];
  hidden_tags: string[];
  history: { day: number; log: string; player_action?: string; judge_result?: string }[];
  shelter?: { id: string; name: string; warmth: number } | null;
  talents?: { id: string; name: string; hiddenDescription: string }[] | null;
}): AsyncGenerator<string, void, unknown> {
  const token = getSessionToken();
  const url = token
    ? `${API_BASE}/ice-age/narrate-batch/stream?token=${encodeURIComponent(token)}`
    : `${API_BASE}/ice-age/narrate-batch/stream`;

  const response = await safeFetch(url, {
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
          if (e instanceof Error && e.message) {
            throw e;
          }
        }
      }
    }
  }
}

/**
 * 冰河末世 - 行动判定流式输出
 */
export async function* iceAgeJudgeStream(params: {
  day: number;
  temperature: number;
  event_context: string;
  action_content: string;
  stats: { hp: number; san: number };
  inventory: { name: string; count: number }[];
  talents?: { id: string; name: string }[] | null;
}): AsyncGenerator<string, void, unknown> {
  const token = getSessionToken();
  const url = token
    ? `${API_BASE}/ice-age/judge/stream?token=${encodeURIComponent(token)}`
    : `${API_BASE}/ice-age/judge/stream`;

  const response = await safeFetch(url, {
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
          if (e instanceof Error && e.message) {
            throw e;
          }
        }
      }
    }
  }
}

/**
 * 冰河末世 - 结局评价
 */
export interface IceAgeEndingResponse {
  cause_of_death: string | null;
  epithet: string;
  comment: string;
  radar_chart: number[];
}

export async function iceAgeEnding(params: {
  days_survived: number;
  is_victory: boolean;
  final_stats: { hp: number; san: number };
  final_inventory: { name: string; count: number }[];
  history: { day: number; log: string; player_action?: string; judge_result?: string }[];
  talents?: { id: string; name: string }[] | null;
}): Promise<IceAgeEndingResponse> {
  const token = getSessionToken();
  const response = await safeFetch(`${API_BASE}/ice-age/ending`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "X-Game-Token": token } : {})
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

/**
 * 前端直连 LLM 服务
 * 用于自定义 API 模式
 */

export interface LLMMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface LLMOptions {
    apiKey: string;
    baseUrl: string;
    model: string;
    temperature?: number;
}

export class LLMService {
    /**
     * 测试连接
     * 发送一个简单的 "Hello" 请求来验证配置
     */
    static async testConnection(options: LLMOptions): Promise<{ success: boolean; message: string }> {
        try {
            // 处理 Base URL，确保没有尾部斜杠，并且如果用户只输入了域名，尝试智能补全 /v1/chat/completions
            let endpoint = options.baseUrl.trim();
            if (endpoint.endsWith('/')) {
                endpoint = endpoint.slice(0, -1);
            }
            // 兼容性处理：如果用户输入的是 /v1 结尾，追加 /chat/completions
            // 如果不是，假设用户输入的是完整的 base url (如 https://api.openai.com/v1)，追加 /chat/completions
            // 注意：OpenAI SDK 习惯是 base_url='.../v1', client 自动加 /chat/completions
            // 这里我们需要手动拼接完整路径用于 fetch
            // 为了通用性，我们假设用户填写的 Base URL 类似于 'https://api.openai.com/v1'

            const url = `${endpoint}/chat/completions`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${options.apiKey}`
                },
                body: JSON.stringify({
                    model: options.model,
                    messages: [
                        { role: 'user', content: 'Hello' }
                    ],
                    max_tokens: 5
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMsg = errorData.error?.message || response.statusText;
                return { success: false, message: `连接失败 (${response.status}): ${errorMsg}` };
            }

            const data = await response.json();
            const reply = data.choices?.[0]?.message?.content || '无内容';
            return { success: true, message: `连接成功！模型回复: "${reply}"` };

        } catch (error) {
            return { success: false, message: `网络或配置错误: ${String(error)}` };
        }
    }

    /**
     * 发送对话请求 (Stream)
     * 返回 SSE 数据流
     */
    static async *chatStream(
        messages: LLMMessage[],
        options: LLMOptions
    ): AsyncGenerator<string, void, unknown> {
        let endpoint = options.baseUrl.trim();
        if (endpoint.endsWith('/')) {
            endpoint = endpoint.slice(0, -1);
        }
        const url = `${endpoint}/chat/completions`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${options.apiKey}`
            },
            body: JSON.stringify({
                model: options.model,
                messages: messages,
                stream: true,
                temperature: options.temperature ?? 0.7
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `HTTP ${response.status}`);
        }

        if (!response.body) {
            throw new Error('Response body is null');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed || !trimmed.startsWith('data: ')) continue;

                    const data = trimmed.slice(6);
                    if (data === '[DONE]') continue;

                    try {
                        const json = JSON.parse(data);
                        const content = json.choices?.[0]?.delta?.content;
                        if (content) {
                            yield content;
                        }
                    } catch (e) {
                        console.warn('SSE Parse Error:', e);
                    }
                }
            }
        } finally {
            reader.releaseLock();
        }
    }

    /**
     * 发送对话请求 (JSON Mode)
     * 返回完整 JSON 对象
     */
    static async chatJson(
        messages: LLMMessage[],
        options: LLMOptions
    ): Promise<any> {
        let endpoint = options.baseUrl.trim();
        if (endpoint.endsWith('/')) {
            endpoint = endpoint.slice(0, -1);
        }
        const url = `${endpoint}/chat/completions`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${options.apiKey}`
            },
            body: JSON.stringify({
                model: options.model,
                messages: messages,
                response_format: { type: 'json_object' },
                temperature: options.temperature ?? 0.7
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        try {
            return JSON.parse(content);
        } catch (e) {
            throw new Error(`Invalid JSON response: ${content}`);
        }
    }
}

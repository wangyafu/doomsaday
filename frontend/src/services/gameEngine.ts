
import * as api from '@/api';
import { useSettingsStore } from '@/stores/settingsStore';
import { LLMService, type LLMMessage } from './llm';
import type { Stats, InventoryItem, HistoryEntry, Shelter, Profession, EndingResponse } from '@/types';

// Zombie Prompts
import { NARRATOR_NARRATIVE_SYSTEM_PROMPT, buildNarratorPrompt } from '@/prompts/zombie/narrator';
import { JUDGE_NARRATIVE_SYSTEM_PROMPT, buildJudgeNarrativePrompt } from '@/prompts/zombie/judge';
import { ENDING_SYSTEM_PROMPT, buildEndingPrompt } from '@/prompts/zombie/ending';

// Ice Age Prompts
import { ICE_AGE_NARRATOR_SYSTEM_PROMPT, buildIceAgeNarratorPrompt } from '@/prompts/iceAge/narrator';
import { ICE_AGE_JUDGE_SYSTEM_PROMPT, buildIceAgeJudgePrompt } from '@/prompts/iceAge/judge';
import { ICE_AGE_ENDING_SYSTEM_PROMPT, buildIceAgeEndingPrompt } from '@/prompts/iceAge/ending';

export class GameEngine {

    private static get settings() {
        return useSettingsStore();
    }

    private static get llmOptions() {
        const s = this.settings;
        return {
            apiKey: s.apiKey,
            baseUrl: s.baseUrl,
            model: s.model
        };
    }

    // ==================== Zombie Mode ====================

    static async *zombieNarrateStream(params: {
        day: number;
        stats: Stats;
        inventory: InventoryItem[];
        hidden_tags: string[];
        history: HistoryEntry[];
        shelter?: Shelter | null;
        profession?: Profession | null;
    }): AsyncGenerator<string, void, unknown> {
        if (this.settings.isCustomMode) {
            const systemPrompt = NARRATOR_NARRATIVE_SYSTEM_PROMPT;
            const userPrompt = buildNarratorPrompt(
                params.day,
                params.stats,
                params.inventory,
                params.hidden_tags,
                params.history,
                params.shelter || null,
                params.profession || null
            );

            const messages: LLMMessage[] = [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ];

            yield* LLMService.chatStream(messages, this.llmOptions);

        } else {
            const apiParams = {
                ...params,
                profession: params.profession ? {
                    id: params.profession.id,
                    name: params.profession.name,
                    description: params.profession.description,
                    hidden_description: params.profession.hiddenDescription
                } : null
            };
            yield* api.narrateStream(apiParams);
        }
    }

    static async *zombieJudgeStream(params: {
        day: number;
        event_context: string;
        action_content: string;
        stats: Stats;
        inventory: InventoryItem[];
        history: HistoryEntry[];
        profession?: Profession | null;
    }): AsyncGenerator<string, void, unknown> {
        if (this.settings.isCustomMode) {
            const systemPrompt = JUDGE_NARRATIVE_SYSTEM_PROMPT;
            const userPrompt = buildJudgeNarrativePrompt(
                params.day,
                params.event_context,
                params.action_content,
                params.stats,
                params.inventory,
                params.history,
                params.profession || null
            );

            const messages: LLMMessage[] = [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ];

            yield* LLMService.chatStream(messages, this.llmOptions);
        } else {
            const apiParams = {
                ...params,
                profession: params.profession ? {
                    id: params.profession.id,
                    name: params.profession.name,
                    description: params.profession.description,
                    hidden_description: params.profession.hiddenDescription
                } : null
            };
            yield* api.judgeStream(apiParams);
        }
    }

    static async zombieEnding(params: {
        days_survived: number;
        high_light_moment: string;
        final_stats: Stats;
        final_inventory: InventoryItem[];
        history: HistoryEntry[];
        profession?: Profession | null;
    }): Promise<EndingResponse> {
        if (this.settings.isCustomMode) {
            const systemPrompt = ENDING_SYSTEM_PROMPT;
            const userPrompt = buildEndingPrompt(
                params.days_survived,
                params.high_light_moment,
                params.final_stats,
                params.final_inventory,
                params.history,
                params.profession || null
            );

            const messages: LLMMessage[] = [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ];

            // Use chatJson for structured output
            return await LLMService.chatJson(messages, this.llmOptions) as EndingResponse;
        } else {
            const apiParams = {
                ...params,
                profession: params.profession ? {
                    id: params.profession.id,
                    name: params.profession.name,
                    description: params.profession.description,
                    hidden_description: params.profession.hiddenDescription
                } : null
            };
            return await api.ending(apiParams);
        }
    }

    // ==================== Ice Age Mode ====================

    static async *iceAgeNarrateStream(params: {
        start_day: number;
        days_to_generate: number;
        stats: Stats;
        inventory: InventoryItem[];
        hidden_tags: string[];
        history: { day: number; log: string; player_action?: string; judge_result?: string }[];
        shelter?: { id: string; name: string; warmth: number; hiddenDescription?: string } | null; // Adapting type
        talents?: { id: string; name: string; hiddenDescription: string }[] | null;
    }): AsyncGenerator<string, void, unknown> {
        if (this.settings.isCustomMode) {
            const systemPrompt = ICE_AGE_NARRATOR_SYSTEM_PROMPT;
            const userPrompt = buildIceAgeNarratorPrompt(
                params.start_day,
                params.days_to_generate,
                params.stats,
                params.inventory,
                params.hidden_tags,
                params.history as HistoryEntry[], // Casting if type structure matches
                params.shelter,
                params.talents
            );

            const messages: LLMMessage[] = [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ];

            yield* LLMService.chatStream(messages, this.llmOptions);
        } else {
            // Note: api parameter expects shelter as object with limited fields
            const apiParams = {
                ...params,
                shelter: params.shelter ? {
                    id: params.shelter.id,
                    name: params.shelter.name,
                    warmth: params.shelter.warmth
                } : null
            };
            yield* api.iceAgeNarrateStream(apiParams as any);
        }
    }

    static async *iceAgeJudgeStream(params: {
        day: number;
        temperature: number;
        event_context: string;
        action_content: string;
        stats: Stats; // Ice Age stats compatible
        inventory: { name: string; count: number; hidden?: string }[]; // Adapting
        talents?: { id: string; name: string }[] | null;
    }): AsyncGenerator<string, void, unknown> {
        if (this.settings.isCustomMode) {
            const systemPrompt = ICE_AGE_JUDGE_SYSTEM_PROMPT;

            // Luck Value Generation (Frontend Side)
            const luckValue = Math.floor(Math.random() * 101); // 0-100

            const userPrompt = buildIceAgeJudgePrompt(
                params.day,
                params.temperature,
                params.event_context,
                params.action_content,
                params.stats,
                params.inventory,
                params.talents,
                luckValue
            );

            const messages: LLMMessage[] = [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ];

            yield* LLMService.chatStream(messages, this.llmOptions);
        } else {
            yield* api.iceAgeJudgeStream(params as any);
        }
    }

    static async iceAgeEnding(params: {
        days_survived: number;
        is_victory: boolean;
        final_stats: Stats;
        final_inventory: InventoryItem[];
        history: { day: number; log: string; player_action?: string; judge_result?: string }[];
        talents?: { id: string; name: string }[] | null;
    }): Promise<api.IceAgeEndingResponse> {
        if (this.settings.isCustomMode) {
            const systemPrompt = ICE_AGE_ENDING_SYSTEM_PROMPT;
            const userPrompt = buildIceAgeEndingPrompt(
                params.days_survived,
                params.is_victory,
                params.final_stats,
                params.final_inventory,
                params.history as HistoryEntry[],
                params.talents
            );

            const messages: LLMMessage[] = [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ];

            return await LLMService.chatJson(messages, this.llmOptions) as api.IceAgeEndingResponse;
        } else {
            return await api.iceAgeEnding(params as any);
        }
    }
}

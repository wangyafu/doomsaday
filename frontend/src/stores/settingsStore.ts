import { defineStore } from 'pinia'

export const useSettingsStore = defineStore('settings', {
    state: () => ({
        apiKey: '',
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-3.5-turbo'
    }),

    getters: {
        isCustomMode: (state) => !!state.apiKey && state.apiKey.trim() !== ''
    },

    actions: {
        setApiKey(key: string) {
            this.apiKey = key
        },
        setBaseUrl(url: string) {
            this.baseUrl = url
        },
        setModel(model: string) {
            this.model = model
        }
    },

    persist: true
})

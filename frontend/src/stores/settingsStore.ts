import { defineStore } from 'pinia'
import { checkHealth } from '@/api'

export type ServerStatus = 'connected' | 'full' | 'disconnected' | 'checking'

export const useSettingsStore = defineStore('settings', {
    state: () => ({
        apiKey: '',
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-3.5-turbo',
        useCustomApi: false,
        serverStatus: 'disconnected' as ServerStatus,
        serverStatusMessage: ''
    }),

    getters: {
        isCustomMode: (state) => state.useCustomApi,
        isServerAvailable: (state) => state.serverStatus === 'connected'
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
        },
        setUseCustomApi(use: boolean) {
            this.useCustomApi = use
        },
        setServerStatus(status: ServerStatus, message: string = '') {
            this.serverStatus = status
            this.serverStatusMessage = message
        },
        async checkServerStatus(): Promise<ServerStatus> {
            this.serverStatus = 'checking'
            this.serverStatusMessage = '正在检查服务器状态...'
            
            try {
                const status = await checkHealth()
                this.serverStatus = status
                
                switch (status) {
                    case 'connected':
                        this.serverStatusMessage = '服务器连接正常'
                        break
                    case 'full':
                        this.serverStatusMessage = '服务器已满，请稍后再试'
                        break
                    case 'disconnected':
                        this.serverStatusMessage = '无法连接到服务器'
                        break
                }
                
                return status
            } catch (e) {
                this.serverStatus = 'disconnected'
                this.serverStatusMessage = '检查服务器状态时出错'
                return 'disconnected'
            }
        }
    },

    persist: true
})

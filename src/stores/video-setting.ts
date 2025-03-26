import { VideoSettingModel } from '@/models/video-setting'

export interface VideoSettingState {
  settings: VideoSettingModel[]
}

export interface VideoSettingObject {
  youtubeChannelId: string
  youtubeApiKey: string
  youtubeChannelVideosAutoUpdate: string
  youtubeLastChannelVideosUpdate: string
}

export type VideoSettingKey = keyof VideoSettingObject

export type VideoSettingType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'object'
  | 'array'

export const useVideoSettingStore = defineStore('video-setting', {
  state: (): VideoSettingState => ({
    settings: [],
  }),
  getters: {
    getSetting: (state) => (key: VideoSettingKey) => {
      return state.settings.find((s) => s.key === key)
    },
    getSettingValue:
      (state) =>
      (key: VideoSettingKey, type: VideoSettingType = 'string') => {
        const setting = state.settings.find((s) => s.key === key)

        let value: unknown = ''

        switch (type) {
          case 'number':
            value =
              setting &&
              parseInt(setting.value) &&
              !isNaN(parseInt(setting.value))
                ? parseInt(setting.value)
                : 0

            break

          case 'boolean':
            value =
              setting &&
              !isNaN(parseInt(setting.value)) &&
              parseInt(setting.value) > 0

            break

          case 'object':
            value = setting && setting.value ? JSON.parse(setting.value) : {}

            break

          case 'array':
            value = setting && setting.value ? JSON.parse(setting.value) : []

            break

          default:
            value = setting && setting.value ? setting.value : ''

            break
        }

        return value
      },
  },
  actions: {
    async initDefaultSettings() {
      await this.loadSettings()

      const defaultSettings: VideoSettingObject = {
        youtubeChannelId: '',
        youtubeApiKey: '',
        youtubeChannelVideosAutoUpdate: '0',
        youtubeLastChannelVideosUpdate: '',
      }

      const { request } = useApi()

      await request({
        url: '/video-settings',
        method: 'put',
        data: defaultSettings,
      })

      await this.loadSettings()
    },
    async loadSettings() {
      const { request } = useApi()

      const task = await request({
        url: '/video-settings',
      })

      if (task.success && task.result) this.settings = task.result.data
      else this.settings = []
    },
  },
})

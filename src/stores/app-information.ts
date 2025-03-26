import { AppInformationModel } from '@/models/app-information'

export interface AppInformationState {
  items: AppInformationModel[]
}

export interface AppInformationObject {
  name: string
  icon: string
  adminIcon: string
  oneColorIcon: string
  oneColorAdminIcon: string
  logo: string
  adminLogo: string
  oneColorLogo: string
  oneColorAdminLogo: string
  adminAuthDarkBg: string
  adminAuthLightBg: string
  phone: string
  email: string
  address: string
  postalCode: string
  description: string
  primaryColor: string
  secondaryColor: string
  accentColor: string

  facebook: string
  twitter: string
  instagram: string
  whatsapp: string
  linkedin: string
  youtube: string
  pinterest: string
  snapchat: string
  tiktok: string
  telegram: string
  discord: string
  reddit: string
  tumblr: string
  vimeo: string
  twitch: string
  github: string
  dribbble: string
  behance: string
  medium: string
  stackOverflow: string
  threads: string
  messenger: string
  playstore: string
  appstore: string

  additionalInfo: string
}

export type AppInformationKey = keyof AppInformationObject

export type AppInformationType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'object'
  | 'array'

export const useAppInformationStore = defineStore('app-information', {
  state: (): AppInformationState => ({
    items: [],
  }),
  getters: {
    getSetting: (state) => (key: AppInformationKey) => {
      return state.items.find((s) => s.key === key)
    },
    getSettingValue:
      (state) =>
      (key: AppInformationKey, type: AppInformationType = 'string') => {
        const setting = state.items.find((s) => s.key === key)

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
    async initDefaultInformation() {
      await this.loadInformation()

      const defaultItems: AppInformationObject = {
        name: '',
        icon: '',
        adminIcon: '',
        oneColorIcon: '',
        oneColorAdminIcon: '',
        logo: '',
        adminLogo: '',
        oneColorLogo: '',
        oneColorAdminLogo: '',
        adminAuthDarkBg: '',
        adminAuthLightBg: '',
        phone: '',
        email: '',
        address: '',
        postalCode: '',
        description: '',
        primaryColor: '',
        secondaryColor: '',
        accentColor: '#ffffff',

        facebook: '',
        twitter: '',
        instagram: '',
        whatsapp: '',
        linkedin: '',
        youtube: '',
        pinterest: '',
        snapchat: '',
        tiktok: '',
        telegram: '',
        discord: '',
        reddit: '',
        tumblr: '',
        vimeo: '',
        twitch: '',
        github: '',
        dribbble: '',
        behance: '',
        medium: '',
        stackOverflow: '',
        threads: '',
        messenger: '',
        playstore: '',
        appstore: '',

        additionalInfo: '',
      }

      const { request } = useApi()

      await request({
        url: '/app-information',
        method: 'put',
        data: defaultItems,
      })

      await this.loadInformation()
    },
    async loadInformation() {
      const { request } = useApi()

      const task = await request({
        url: '/app-information',
      })

      if (task.success && task.result) this.items = task.result.data
      else this.items = []
    },
  },
})

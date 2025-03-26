import { AdIdentifierModel } from '@/models/ad-identifier'

export interface AdState {
  adIdentifiers: AdIdentifierModel[]
}

export const useAdStore = defineStore('ad', {
  state: (): AdState => ({
    adIdentifiers: [],
  }),
  getters: {},
  actions: {
    async loadAdIdentifiers() {
      const { request } = useApi()

      const task = await request({
        url: '/ad-identifiers',
      })

      if (task.success && task.result.data) {
        this.adIdentifiers = task.result.data
      }
    },
  },
})

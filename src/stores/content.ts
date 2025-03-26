import { ContentModelModel } from '@/models/content-model'
import { MenuItemGroupModel } from '@/models/menu-item-group'
import { MenuLocationModel } from '@/models/menu-location'
import { PageModel } from '@/models/page'
import { SectionModel } from '@/models/section'

const SECTIONS_LISTENING_INTERVAL = 5

export interface ContentState {
  pages: PageModel[]
  sections: SectionModel[]
  contentModels: ContentModelModel[]
  menuLocations: MenuLocationModel[]
  menuItemGroups: MenuItemGroupModel[]
  isPollingSections: boolean
  sectionsChangeId: string | null
}

export const useContentStore = defineStore('content', {
  state: (): ContentState => ({
    pages: [],
    sections: [],
    contentModels: [],
    menuLocations: [],
    menuItemGroups: [],
    isPollingSections: false,
    sectionsChangeId: null,
  }),
  getters: {},
  actions: {
    async startSectionsPolling() {
      const { request } = useApi()
      const { isUserConnected } = storeToRefs(useAuthStore())

      setInterval(async () => {
        this.isPollingSections = true

        if (isUserConnected) {
          const task = await request({
            url: 'data-changes/table/sections',
          })

          if (task.success && task.result.data) {
            if (this.sectionsChangeId !== task.result.data?.changeId) {
              await this.loadSections()
            }

            this.sectionsChangeId = task.result.data?.changeId
          }
        }

        this.isPollingSections = false
      }, SECTIONS_LISTENING_INTERVAL * 1000)
    },
    async loadPages() {
      const { request } = useApi()

      const task = await request({
        url: '/pages',
      })

      if (task.success && task.result.data) {
        this.pages = task.result.data
      }
    },
    async loadSections() {
      const { request } = useApi()

      const task = await request({
        url: '/sections',
      })

      if (task.success && task.result.data) {
        this.sections = task.result.data
      }
    },
    async loadContentModels() {
      const { request } = useApi()

      const task = await request({
        url: '/content-models',
      })

      if (task.success && task.result.data) {
        this.contentModels = task.result.data
      }
    },
    async loadMenuItemGroups() {
      const { request } = useApi()

      const task = await request({
        url: '/menu-item-groups',
      })

      if (task.success && task.result.data) {
        this.menuItemGroups = task.result.data
      }
    },
    async loadMenuLocations() {
      const { request } = useApi()

      const task = await request({
        url: '/menu-locations',
      })

      if (task.success && task.result.data) {
        this.menuLocations = task.result.data
      }
    },
  },
})

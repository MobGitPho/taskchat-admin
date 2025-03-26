import { NewsCategoryModel } from '@/models/news-category'
import { NewsTagModel } from '@/models/news-tag'

export interface CatalogState {
  categories: NewsCategoryModel[]
  tags: NewsTagModel[]
}

export const useNewsStore = defineStore('news', {
  state: (): CatalogState => ({
    categories: [],
    tags: [],
  }),
  getters: {
    orderedCategories: (state) => {
      const orderedCategories = []

      for (const category of state.categories) {
        if (!category.parentId) {
          orderedCategories.push(category)
          const childrenCategories = state.categories.filter(
            (c) => c.parentId === category.id
          )

          orderedCategories.push(...childrenCategories)
        }
      }

      return orderedCategories
    },
  },
  actions: {
    async loadCategories() {
      const { request } = useApi()

      const task = await request({
        url: '/news-categories',
      })

      if (task.success && task.result.data) {
        this.categories = task.result.data
      }
    },
    async loadTags() {
      const { request } = useApi()

      const task = await request({
        url: '/news-tags',
      })

      if (task.success && task.result.data) {
        this.tags = task.result.data
      }
    },
  },
})

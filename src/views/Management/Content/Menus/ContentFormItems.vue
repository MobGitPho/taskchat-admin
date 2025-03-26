<script setup lang="ts">
  import { ContentType } from '@/enums/content-type'

  import { ContentModelItemModel } from '@/models/content-model-item'
  import { NewsArticleModel } from '@/models/news-article'

  import { SelectOption } from 'naive-ui'

  import { VNodeChild } from 'vue'

  const { t } = useI18n()
  const { tr, mergeArrays } = useHelper()
  const { request } = useApi()
  const { contentTypes, extractItemTitle } = useContent()

  const { loadContentModels } = useContentStore()
  const { contentModels } = storeToRefs(useContentStore())

  const emits = defineEmits(['update'])

  loadContentModels()

  const contentType = defineModel<ContentType>('content-type', {
    default: ContentType.CONTENT_MODEL,
  })
  const contentId = defineModel<number | undefined>('content-id', {
    default: undefined,
  })
  const contentModelId = ref()

  // Search content model items
  const isSearchingContentModelItem = ref(false)
  const contentModelItemsList = ref<ContentModelItemModel[]>([])
  const contentModelItemsFound = ref<ContentModelItemModel[]>([])

  const handleContentModelItemSearch = async (
    query: string,
    contentModelId: any
  ) => {
    if (!query.length) {
      contentModelItemsFound.value = []
      return
    }

    isSearchingContentModelItem.value = true

    const task = await request({
      url: `/content-model-items/search/${query}/${contentModelId}`,
    })

    if (task.success && task.result) {
      contentModelItemsFound.value = task.result.data
    }

    isSearchingContentModelItem.value = false
  }

  const contentModelItems = computed(() => {
    return mergeArrays(
      contentModelItemsList.value,
      contentModelItemsFound.value,
      'id'
    ) as ContentModelItemModel[]
  })

  // Search news articles
  const isSearchingNewsArticle = ref(false)
  const newsArticlesList = ref<NewsArticleModel[]>([])
  const newsArticlesFound = ref<NewsArticleModel[]>([])

  const handleNewsArticleSearch = async (query: string) => {
    if (!query.length) {
      newsArticlesFound.value = []
      return
    }

    isSearchingNewsArticle.value = true

    const task = await request({
      url: `/news-articles/search/${query}`,
    })

    if (task.success && task.result) {
      newsArticlesFound.value = task.result.data
    }

    isSearchingNewsArticle.value = false
  }

  const newsArticles = computed(() => {
    return mergeArrays(
      newsArticlesList.value,
      newsArticlesFound.value,
      'id'
    ) as NewsArticleModel[]
  })

  // News categories

  const { categories: newsCategories } = storeToRefs(useNewsStore())
  const { loadCategories: loadNewsCategories } = useNewsStore()

  // News tags

  const { tags: newsTags } = storeToRefs(useNewsStore())
  const { loadTags: loadNewsTags } = useNewsStore()

  onMounted(async () => {
    loadNewsCategories()
    loadNewsTags()

    isSearchingNewsArticle.value = true

    const task1 = await request({
      url: `/news-articles/list`,
      method: 'post',
      data: {
        ids: contentId.value ? [contentId.value] : [],
      },
    })

    if (task1.success && task1.result) {
      newsArticlesList.value = mergeArrays(
        newsArticlesList.value,
        task1.result.data,
        'id'
      ) as NewsArticleModel[]
    }

    isSearchingNewsArticle.value = false

    isSearchingContentModelItem.value = true

    const task = await request({
      url: `/content-model-items/list`,
      method: 'post',
      data: {
        ids: contentId.value ? [contentId.value] : [],
      },
    })

    if (task.success && task.result) {
      contentModelItemsList.value = mergeArrays(
        contentModelItemsList.value,
        task.result.data,
        'id'
      ) as ContentModelItemModel[]

      contentModelId.value = contentModelItemsList.value.find(
        (item) => item.id === contentId.value
      )?.contentModelId
    }

    isSearchingContentModelItem.value = false
  })

  // Select labels rendering

  const renderNewsCategorySelectLabel = (option: SelectOption): VNodeChild => {
    return h('span', {}, { default: () => `${tr(option.name)}` })
  }

  const renderNewsArticleSelectLabel = (option: SelectOption): VNodeChild => {
    return h('span', {}, { default: () => `${tr(option.title)}` })
  }

  const renderNewsTagSelectLabel = (option: SelectOption): VNodeChild => {
    return h('span', {}, { default: () => `${tr(option.name)}` })
  }

  const renderContentModelSelectLabel = (option: SelectOption) => {
    return h(
      'span',
      {},
      {
        default: () => tr(option.title),
      }
    )
  }

  const renderContentModelItemSelectLabel = (
    option: ContentModelItemModel
  ): ComputedRef<VNodeChild> => {
    return computed(() =>
      h(
        'span',
        {},
        {
          default: () =>
            extractItemTitle(
              option,
              contentModels.value?.find(
                (contentModel) => contentModel.id === option.contentModelId
              )
            ),
        }
      )
    )
  }
</script>

<template>
  <n-grid x-gap="12" :span="24">
    <n-form-item-gi :span="8" :label="t('contentType')" path="contentType">
      <n-select
        v-model:value="contentType"
        :options="
          ((contentTypes || []) as any[])
        "
        :placeholder="t('select')"
        label-field="label"
        value-field="value"
        filterable
        class="w-full"
        @update:value="() => (contentId = undefined)" />
    </n-form-item-gi>
    <template v-if="contentType === ContentType.CONTENT_MODEL">
      <n-form-item-gi :span="8" :label="t('contentModel')">
        <n-select
          v-model:value="contentModelId"
          :options="(contentModels as any[])"
          :placeholder="t('search')"
          :render-label="renderContentModelSelectLabel"
          label-field="title"
          value-field="id"
          filterable
          class="w-full" />
      </n-form-item-gi>
      <n-form-item-gi :span="8" :label="t('item')" path="contentId">
        <n-select
          v-model:value="contentId"
          :options="((contentModelItems || []) as any[])"
          :placeholder="t('search')"
          :render-label="(option: ContentModelItemModel) => renderContentModelItemSelectLabel(option).value"
          :loading="isSearchingContentModelItem"
          value-field="id"
          filterable
          remote
          class="w-full"
          @search="(query: string) => handleContentModelItemSearch(query, contentModelId)"
          @update:value="
            (value, option) => emits('update', value, option, contentType)
          " />
      </n-form-item-gi>
    </template>
    <template v-if="contentType === ContentType.NEWS_ARTICLE">
      <n-form-item-gi :span="16" :label="t('newsArticle')" path="contentId">
        <n-select
          v-model:value="contentId"
          :options="((newsArticles || []) as any[])"
          :placeholder="t('search')"
          :render-label="renderNewsArticleSelectLabel"
          :loading="isSearchingNewsArticle"
          value-field="id"
          filterable
          remote
          class="w-full"
          @search="handleNewsArticleSearch"
          @update:value="
            (value, option) => emits('update', value, option, contentType)
          " />
      </n-form-item-gi>
    </template>
    <template v-if="contentType === ContentType.NEWS_CATEGORY">
      <n-form-item-gi :span="16" :label="t('newsCategory')" path="contentId">
        <n-select
          v-model:value="contentId"
          :options="((newsCategories || []) as any[])"
          :placeholder="t('select')"
          :render-label="renderNewsCategorySelectLabel"
          label-field="name"
          value-field="id"
          filterable
          class="w-full"
          @update:value="
            (value, option) => emits('update', value, option, contentType)
          " />
      </n-form-item-gi>
    </template>
    <template v-if="contentType === ContentType.NEWS_TAG">
      <n-form-item-gi :span="16" :label="t('newsTag')" path="contentId">
        <n-select
          v-model:value="contentId"
          :options="((newsTags || []) as any[])"
          :placeholder="t('select')"
          :render-label="renderNewsTagSelectLabel"
          label-field="name"
          value-field="id"
          filterable
          class="w-full"
          @update:value="
            (value, option) => emits('update', value, option, contentType)
          " />
      </n-form-item-gi>
    </template>
  </n-grid>
</template>

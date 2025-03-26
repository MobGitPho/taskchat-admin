<script setup lang="ts">
  import { PermalinkContentType } from '@/enums/permalink-content-type'

  import { PermalinkModel } from '@/models/permalink'

  import { SelectOption } from 'naive-ui'

  const { t } = useI18n()
  const { tr } = useHelper()
  const { request } = useApi()
  const { contentModels, pages } = storeToRefs(useContentStore())
  const { loadContentModels, loadPages } = useContentStore()

  const message = useMessage()
  const loadingBar = useLoadingBar()

  const defaultData: PermalinkModel[] = [
    {
      pathPrefix: '/news/article',
      contentType: PermalinkContentType.NEWS_ARTICLE,
      contentParam: 'slug',
      pageId: null,
    },
    {
      pathPrefix: '/news/category',
      contentType: PermalinkContentType.NEWS_CATEGORY,
      contentParam: 'slug',
      pageId: null,
    },
    {
      pathPrefix: '/news/tag',
      contentType: PermalinkContentType.NEWS_TAG,
      contentParam: 'slug',
      pageId: null,
    },
  ]
  const isLoading = ref(false)
  const permalinks = ref<PermalinkModel[]>([])
  const data = ref<(PermalinkModel & { permalinkId?: number })[]>(defaultData)
  const initialData = ref<(PermalinkModel & { permalinkId?: number })[]>()

  const validContentModels = computed(() => {
    return contentModels.value.filter(
      (contentModel) => contentModel.hasPermalink
    )
  })

  const init = async (loadAllData = false) => {
    loadingBar.start()
    isLoading.value = true

    if (loadAllData) {
      await loadContentModels()
      await loadPages()
    }

    const task = await request({
      url: '/permalinks',
    })

    if (task.success && task.result) {
      permalinks.value = task.result.data

      data.value = _.cloneDeep(defaultData)

      for (let i = 0; i < validContentModels.value.length; i++) {
        data.value.push({
          pathPrefix: `/${validContentModels.value[i].slug}`,
          contentType: PermalinkContentType.CONTENT_MODEL,
          contentParam: 'id',
          contentId: validContentModels.value[i].id,
          pageId: null,
        })
      }

      for (let i = 0; i < data.value.length; i++) {
        switch (data.value[i].contentType) {
          case PermalinkContentType.NEWS_ARTICLE:
          case PermalinkContentType.NEWS_CATEGORY:
          case PermalinkContentType.NEWS_TAG:
            {
              const permalink = permalinks.value.find(
                (p) => p.contentType === data.value[i].contentType
              )
              if (permalink) {
                data.value[i].pathPrefix = permalink.pathPrefix
                data.value[i].contentParam = permalink.contentParam
                data.value[i].pageId = permalink.pageId
                data.value[i].permalinkId = permalink.id
              }
            }
            break
          case PermalinkContentType.CONTENT_MODEL:
            {
              const permalink = permalinks.value.find(
                (p) =>
                  p.contentType === data.value[i].contentType &&
                  p.contentId === data.value[i].contentId
              )
              if (permalink) {
                data.value[i].pathPrefix = permalink.pathPrefix
                data.value[i].contentParam = permalink.contentParam
                data.value[i].pageId = permalink.pageId
                data.value[i].permalinkId = permalink.id
              }
            }

            break
        }
      }

      initialData.value = _.cloneDeep(data.value)
    }

    isLoading.value = false
    loadingBar.finish()
  }

  init(true)

  const submit = async () => {
    loadingBar.start()
    isLoading.value = true

    const task = await request({
      method: 'put',
      url: `/permalinks`,
      data: data.value,
    })

    if (task.success) {
      message.success(t('success'))

      init()
    }

    isLoading.value = false
    loadingBar.finish()
  }

  const saveBtnDisabled = computed(() => {
    return _.isEqual(data.value, initialData.value)
  })

  const renderSelectLabel = (option: SelectOption) => {
    return h(
      'span',
      {},
      {
        default: () => tr(option.title),
      }
    )
  }

  const pathFormatter = (value: string): boolean => {
    const regex = /^\/[a-zA-Z0-9/\-_{}?]*$/
    return regex.test(value)
  }
</script>

<template>
  <MountedTeleport to="#alt-action">
    <n-button
      type="primary"
      :loading="isLoading"
      :disabled="saveBtnDisabled"
      @click="submit()">
      <template #icon>
        <n-icon><Icon icon="carbon:save" /></n-icon>
      </template>
      {{ t('save') }}
    </n-button>
  </MountedTeleport>
  <n-card embedded size="small">
    <n-collapse :default-expanded-names="['1']" display-directive="show">
      <template #header-extra="{ collapsed }">
        <n-icon>
          <Icon v-if="collapsed" icon="fa-solid:chevron-left" />
          <Icon v-else icon="fa-solid:chevron-down" />
        </n-icon>
      </template>
      <template #arrow>
        <span></span>
      </template>
      <n-collapse-item name="1">
        <template #header>
          <span class="text-base font-bold">{{ t('news') }}</span>
        </template>
        <n-card size="small">
          <template #header>
            <span class="text-sm">{{ t('articles') }}</span>
          </template>
          <n-grid cols="24" x-gap="12">
            <n-gi span="10">
              <span class="text-xs text-slate-400">
                {{ t('pathPrefix') }}
              </span>
              <n-input
                v-model:value="data[0].pathPrefix"
                :allow-input="pathFormatter"
                size="small" />
            </n-gi>
            <n-gi span="7">
              <span class="text-xs text-slate-400">
                {{ t('contentParam') }}
              </span>
              <n-input
                v-model:value="data[0].contentParam"
                readonly
                size="small" />
            </n-gi>
            <n-gi span="7">
              <span class="text-xs text-slate-400">
                {{ t('contentPage') }}
              </span>
              <n-select
                v-model:value="data[0].pageId"
                :options="((pages || []) as any[])"
                :placeholder="t('selectPage')"
                :render-label="renderSelectLabel"
                label-field="title"
                value-field="id"
                filterable
                clearable
                size="small"
                class="w-full" />
            </n-gi>
          </n-grid>
        </n-card>
        <n-card size="small">
          <template #header>
            <span class="text-sm">{{ t('categories') }}</span>
          </template>
          <n-grid cols="24" x-gap="12">
            <n-gi span="10">
              <span class="text-xs text-slate-400">
                {{ t('pathPrefix') }}
              </span>
              <n-input
                v-model:value="data[1].pathPrefix"
                :allow-input="pathFormatter"
                size="small" />
            </n-gi>
            <n-gi span="7">
              <span class="text-xs text-slate-400">
                {{ t('contentParam') }}
              </span>
              <n-input
                v-model:value="data[1].contentParam"
                readonly
                size="small" />
            </n-gi>
            <n-gi span="7">
              <span class="text-xs text-slate-400">
                {{ t('contentPage') }}
              </span>
              <n-select
                v-model:value="data[1].pageId"
                :options="((pages || []) as any[])"
                :placeholder="t('selectPage')"
                :render-label="renderSelectLabel"
                label-field="title"
                value-field="id"
                filterable
                clearable
                size="small"
                class="w-full" />
            </n-gi>
          </n-grid>
        </n-card>
        <n-card size="small">
          <template #header>
            <span class="text-sm">{{ t('tags') }}</span>
          </template>
          <n-grid cols="24" x-gap="12">
            <n-gi span="10">
              <span class="text-xs text-slate-400">
                {{ t('pathPrefix') }}
              </span>
              <n-input
                v-model:value="data[2].pathPrefix"
                :allow-input="pathFormatter"
                size="small" />
            </n-gi>
            <n-gi span="7">
              <span class="text-xs text-slate-400">
                {{ t('contentParam') }}
              </span>
              <n-input
                v-model:value="data[2].contentParam"
                readonly
                size="small" />
            </n-gi>
            <n-gi span="7">
              <span class="text-xs text-slate-400">
                {{ t('contentPage') }}
              </span>
              <n-select
                v-model:value="data[2].pageId"
                :options="((pages || []) as any[])"
                :placeholder="t('selectPage')"
                :render-label="renderSelectLabel"
                label-field="title"
                value-field="id"
                filterable
                clearable
                size="small"
                class="w-full" />
            </n-gi>
          </n-grid>
        </n-card>
      </n-collapse-item>
    </n-collapse>
  </n-card>
  <n-divider class="!my-2"></n-divider>
  <n-card
    v-if="validContentModels.length && data.length > 3"
    embedded
    size="small">
    <n-collapse :default-expanded-names="['1']" display-directive="show">
      <template #header-extra="{ collapsed }">
        <n-icon>
          <Icon v-if="collapsed" icon="fa-solid:chevron-left" />
          <Icon v-else icon="fa-solid:chevron-down" />
        </n-icon>
      </template>
      <template #arrow>
        <span></span>
      </template>
      <n-collapse-item name="1">
        <template #header>
          <span class="text-base font-bold">{{ t('contentModels') }}</span>
        </template>
        <n-card
          v-for="(contentModel, i) in validContentModels"
          :key="contentModel.id"
          size="small">
          <template #header>
            <span class="text-sm">{{ tr(contentModel.title) }}</span>
          </template>
          <n-grid cols="24" x-gap="12">
            <n-gi span="10">
              <span class="text-xs text-slate-400">
                {{ t('pathPrefix') }}
              </span>
              <n-input
                v-model:value="data[i + 3].pathPrefix"
                :allow-input="pathFormatter"
                size="small" />
            </n-gi>
            <n-gi span="7">
              <span class="text-xs text-slate-400">
                {{ t('contentParam') }}
              </span>
              <n-input
                v-model:value="data[i + 3].contentParam"
                readonly
                size="small" />
            </n-gi>
            <n-gi span="7">
              <span class="text-xs text-slate-400">
                {{ t('contentPage') }}
              </span>
              <n-select
                v-model:value="data[i + 3].pageId"
                :options="((pages || []) as any[])"
                :placeholder="t('selectPage')"
                :render-label="renderSelectLabel"
                label-field="title"
                value-field="id"
                filterable
                clearable
                size="small"
                class="w-full" />
            </n-gi>
          </n-grid>
        </n-card>
      </n-collapse-item>
    </n-collapse>
  </n-card>
</template>

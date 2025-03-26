<script lang="ts">
  export default defineComponent({
    name: 'FormGenerator',
  })
</script>

<script setup lang="ts">
  import {
    FormInst,
    FormRules,
    FormValidationError,
    SelectOption,
    SelectRenderTag,
  } from 'naive-ui'
  import { AppConfig, DataStructureField } from '@/utils/types'
  import { CSSProperties, VNodeChild } from 'vue'
  import { NewsArticleModel } from '@/models/news-article'

  import { filenameFromUrl } from '@/utils/functions'

  import PickColors, { Theme } from 'vue-pick-colors'
  import { ContentModelItemModel } from '@/models/content-model-item'
  import { MenuItemModel } from '@/models/menu-item'
  import { MenuItemTargetType } from '@/enums/menu-item-target-type'

  interface Props {
    modelValue: { [key: string]: any } | string
    useJson?: boolean
    items: DataStructureField[] | string
    formStyle?: CSSProperties
    labelStyle?: CSSProperties
  }

  const props = withDefaults(defineProps<Props>(), {
    useJson: false,
    formStyle: undefined,
    labelStyle: undefined,
  })

  const emits = defineEmits(['update:modelValue', 'update'])

  const { t } = useI18n()
  const { tr, pickByTheme, fileUrl, mergeArrays } = useHelper()
  const { extractItemTitle } = useContent()
  const { request } = useApi()

  const { loadContentModels } = useContentStore()
  const { contentModels } = storeToRefs(useContentStore())

  loadContentModels()

  const appConfig = inject<AppConfig>('appConfig')

  let items: DataStructureField[] = []

  if (typeof props.items == 'string') {
    try {
      items = JSON.parse(props.items as string)
    } catch (e) {
      items = []
    }
  } else {
    items = _.cloneDeep(props.items)
  }

  let modelValue: { [key: string]: any } = {}

  if (props.useJson) {
    try {
      modelValue = JSON.parse(props.modelValue as string)
    } catch (e) {
      modelValue = {}
    }
  }

  const currentItemKey = ref('')
  const formKey = ref(uuidv4())
  const formRef = ref<FormInst | null>(null)
  const formValue = ref<{ [key: string]: any }>(
    props.useJson ? modelValue : (props.modelValue as { [key: string]: any })
  )
  const rules: FormRules = {}

  items.forEach((item) => {
    if (!(item.key in formValue.value)) {
      if (item.defaultValue) {
        if (
          [
            'gallery',
            'news-articles',
            'news-categories',
            'icons',
            'albums',
            'checkbox',
          ].includes(item.type)
        ) {
          formValue.value[item.key] = JSON.parse(item.defaultValue)
        } else if (item.type == 'number') {
          formValue.value[item.key] = parseFloat(item.defaultValue)
        } else if (item.type == 'content-model-item') {
          // Default value contain content model id
          formValue.value[item.key] = undefined
        } else if (item.type == 'content-model-items') {
          // Default value contain content model id
          formValue.value[item.key] = []
        } else if (item.type == 'list') {
          formValue.value[item.key] = item.defaultValue
            .split(',')
            .map((item) => ({ value: item }))
        } else if (item.type == 'i18n-list') {
          formValue.value[item.key] = item.defaultValue
            .split(',')
            .map((item) => ({ value: `{ "fr": "${item}", "en": "${item}" }` }))
        } else {
          formValue.value[item.key] = item.defaultValue
        }
      } else if (
        [
          'text',
          'textarea',
          'editor',
          'i18n-text',
          'i18n-textarea',
          'i18n-editor',
          'image',
          'icon',
          'audio',
          'video',
          'color',
        ].includes(item.type)
      ) {
        formValue.value[item.key] = ''
      } else if (['number'].includes(item.type)) {
        formValue.value[item.key] = 0
      } else if (['checkbox'].includes(item.type)) {
        formValue.value[item.key] = false
      } else if (
        [
          'gallery',
          'news-articles',
          'news-categories',
          'content-model-items',
          'icons',
          'albums',
          'list',
          'i18n-list',
        ].includes(item.type)
      ) {
        formValue.value[item.key] = []
      } else {
        formValue.value[item.key] = undefined
      }
    }

    if (item.required) {
      rules[item.key] = [
        {
          required: true,
          message: t('fillRequired'),
        },
      ]
    }

    formKey.value = uuidv4()
  })

  const contentEditorItems = [
    'fullScreen',
    '|',
    'heading',
    '|',
    'addCreopseMedia',
    '|',
    'uploadImage',
    '|',
    'bold',
    'italic',
    'underline',
    'strikethrough',
    'code',
    'subscript',
    'superscript',
    'selectAll',
    '|',
    'fontSize',
    'fontFamily',
    'fontColor',
    'fontBackgroundColor',
    '|',
    'horizontalLine',
    'blockQuote',
    'bulletedList',
    'numberedList',
    'alignment',
    '|',
    'outdent',
    'indent',
    '|',
    'link',
    'insertTable',
    'mediaEmbed',
    '|',
    'undo',
    'redo',
  ]

  const renderSelectLabel = (option: SelectOption): VNodeChild => {
    return h(
      'span',
      {},
      {
        default: () => tr(option.label),
      }
    )
  }

  watch(
    () => formValue.value,
    (value) => {
      const finalValue = props.useJson ? JSON.stringify(value) : value

      const validate = async () => {
        if (items.length == 0) {
          return true
        }

        let valid = false

        try {
          await formRef.value?.validate(
            (errors: Array<FormValidationError> | undefined) => {
              valid = !errors
            }
          )
        } catch (e) {
          valid = false
        }

        return valid
      }

      emits('update:modelValue', finalValue)
      emits('update', finalValue, validate)
    },
    {
      immediate: true,
      deep: true,
    }
  )

  // Color

  const uiStore = useUserInterfaceStore()
  const theme = computed<Theme>(() => {
    return uiStore.isLightTheme ? 'light' : 'dark'
  })

  // Image

  const imagePickerVisible = ref(false)

  // Video

  const videoPickerVisible = ref(false)
  const showVideoReaderDialog = ref(false)

  const videoReaderTitle = ref('')
  const videoReaderUrl = ref('')

  // Audio

  const audioPickerVisible = ref(false)
  const showAudioReaderDialog = ref(false)

  const audioReaderTitle = ref('')
  const audioReaderUrl = ref('')

  // Document

  const documentPickerVisible = ref(false)

  const openDocument = (url: string) => {
    window.open(url, '_blank')
  }

  // File

  const filePickerVisible = ref(false)

  // Menu items
  const isLoadingMenuItems = ref(false)
  const menuItems = ref<MenuItemModel[]>([])
  const loadMenuItems = async () => {
    isLoadingMenuItems.value = true

    const task = await request({
      url: `/menu/items`,
    })

    if (task.success && task.result) {
      for (let i = 0; i < task.result.data?.length; i++) {
        switch (task.result.data[i].targetType) {
          case MenuItemTargetType.EXTERNAL_LINK:
            if (
              menuItems.value.findIndex(
                (item) => item.url === task.result.data[i].url
              ) === -1
            ) {
              menuItems.value.push(task.result.data[i])
            }
            break

          case MenuItemTargetType.PAGE_LINK:
            if (
              menuItems.value.findIndex(
                (item) => item.path === task.result.data[i].path
              ) === -1
            ) {
              menuItems.value.push(task.result.data[i])
            }
            break
        }
      }
    }

    isLoadingMenuItems.value = false
  }

  loadMenuItems()

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

  // Data select

  const { categories: newsCategories, tags: newsTags } = storeToRefs(
    useNewsStore()
  )
  const { loadCategories: loadNewsCategories, loadTags: loadNewsTags } =
    useNewsStore()

  onMounted(async () => {
    if (
      items.find(
        (item) =>
          item.type === 'news-categories' || item.type === 'news-category'
      )
    ) {
      loadNewsCategories()
      loadNewsTags()
    }

    for (let i = 0; i < items.length; i++) {
      if (
        items[i].type === 'news-articles' ||
        items[i].type === 'news-article'
      ) {
        isSearchingNewsArticle.value = true

        const value = formValue.value[items[i].key]

        const task = await request({
          url: `/news-articles/list`,
          method: 'post',
          data: {
            ids: items[i].type === 'news-articles' ? value : [value],
          },
        })

        if (task.success && task.result) {
          newsArticlesList.value = mergeArrays(
            newsArticlesList.value,
            task.result.data,
            'id'
          ) as NewsArticleModel[]
        }

        isSearchingNewsArticle.value = false
      } else if (
        items[i].type === 'content-model-items' ||
        items[i].type === 'content-model-item'
      ) {
        isSearchingContentModelItem.value = true

        const value = formValue.value[items[i].key]

        const task = await request({
          url: `/content-model-items/list`,
          method: 'post',
          data: {
            ids: items[i].type === 'content-model-items' ? value : [value],
          },
        })

        if (task.success && task.result) {
          contentModelItemsList.value = mergeArrays(
            contentModelItemsList.value,
            task.result.data,
            'id'
          ) as ContentModelItemModel[]
        }

        isSearchingContentModelItem.value = false
      }
    }
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

  const renderMenuItemSelectTag: SelectRenderTag = ({ option }) => {
    return h(
      'div',
      {
        style: {
          display: 'flex',
          alignItems: 'center',
        },
      },
      [`${tr(option.title)}`]
    )
  }

  const renderMenuItemSelectLabel = (option: SelectOption): VNodeChild => {
    return h(
      'div',
      {
        style: {
          marginLeft: '12px',
          padding: '4px 0',
        },
      },
      [
        h('div', {}, { default: () => `${tr(option.title)}` }),
        h(
          'small',
          {},
          {
            default: () =>
              `${
                option.targetType == MenuItemTargetType.EXTERNAL_LINK
                  ? option.url
                  : option.path
              }`,
          }
        ),
      ]
    )
  }
</script>

<template>
  <n-form
    ref="formRef"
    :key="formKey"
    :model="formValue"
    :rules="rules"
    :show-label="true"
    require-mark-placement="right-hanging"
    label-placement="left"
    label-align="left"
    label-width="auto"
    size="medium"
    :style="props.formStyle">
    <template v-for="(item, i) in items" :key="i">
      <n-form-item
        :label="tr(item.label)"
        :path="item.key"
        :label-style="props.labelStyle"
        :show-require-mark="item.required"
        class="w-full">
        <template v-if="item.type == 'text'">
          <n-input
            v-model:value="formValue[item.key]"
            :placeholder="tr(item.label)"
            :maxlength="item.settings?.maxLength || undefined"
            :minlength="item.settings?.minLength || undefined"
            :clearable="item.settings?.clearable || false"
            type="text"
            class="w-full" />
        </template>
        <template v-else-if="item.type == 'i18n-text'">
          <I18nInput
            v-model="formValue[item.key]"
            :placeholder="tr(item.label)"
            :selector-span="5"
            class="w-full"
            sync />
        </template>
        <template v-else-if="item.type == 'textarea'">
          <n-input
            v-model:value="formValue[item.key]"
            :placeholder="tr(item.label)"
            :maxlength="item.settings?.maxLength || undefined"
            :minlength="item.settings?.minLength || undefined"
            :clearable="item.settings?.clearable || false"
            type="textarea"
            class="w-full" />
        </template>
        <template v-else-if="item.type == 'i18n-textarea'">
          <I18nInput
            v-model="formValue[item.key]"
            :placeholder="tr(item.label)"
            :selector-span="5"
            type="textarea"
            class="w-full"
            :rows="3"
            sync />
        </template>
        <template v-else-if="item.type == 'editor'">
          <div class="w-full">
            <CKEditorWrapper
              v-model="formValue[item.key]"
              :placeholder="tr(item.label)"
              :toolbar-items="contentEditorItems"
              :should-not-group-when-full="false"
              enable-upload />
          </div>
        </template>
        <template v-else-if="item.type == 'i18n-editor'">
          <div class="w-full">
            <I18nInput
              v-model="formValue[item.key]"
              :placeholder="tr(item.label)"
              :selector-span="5"
              type="editor"
              class="w-full"
              sync />
          </div>
        </template>
        <template v-else-if="item.type == 'number'">
          <n-input-number
            v-model:value="formValue[item.key]"
            :max="item.settings?.max || undefined"
            :min="item.settings?.min || undefined"
            :step="item.settings?.step || 1"
            :clearable="item.settings?.clearable || false"
            :placeholder="tr(item.label)"
            class="w-full" />
        </template>
        <template v-else-if="item.type == 'checkbox'">
          <n-checkbox
            v-model:checked="formValue[item.key]"
            :checked-value="item.settings?.['checked-value'] || true"
            :unchecked-value="item.settings?.['unchecked-value'] || false"
            class="w-full" />
        </template>
        <template v-else-if="item.type == 'date'">
          <n-date-picker
            v-model:formatted-value="formValue[item.key]"
            value-format="yyyy-MM-dd"
            :format="item.settings?.format || 'dd MMMM yyyy'"
            type="date"
            :clearable="item.settings?.clearable || true"
            class="w-full" />
        </template>
        <template v-else-if="item.type == 'year'">
          <n-date-picker
            v-model:formatted-value="formValue[item.key]"
            value-format="yyyy"
            type="year"
            :clearable="item.settings?.clearable || true"
            class="w-full" />
        </template>
        <template
          v-else-if="
            item.type == 'single-select' || item.type == 'multi-select'
          ">
          <n-select
            v-model:value="formValue[item.key]"
            :options="(item.options || [] as any[])?.map((option) => {
              if (item.type == 'multi-select' && item.settings && formValue[item.key]) {
                const max = item.settings?.['max'] || Infinity
                return {
                  ...option,
                  disabled: formValue[item.key].length >= max && !formValue[item.key].includes(option.value),
                }
              }

              return option
            })"
            :multiple="item.type == 'multi-select'"
            :placeholder="tr(item.label)"
            :render-label="renderSelectLabel"
            label-field="label"
            value-field="value"
            filterable
            :clearable="item.settings?.clearable || true"
            :max-tag-count="item.settings?.['max-tag-count'] || undefined"
            class="w-full" />
        </template>
        <template v-else-if="item.type == 'image'">
          <div class="w-full flex flex-gap-8 items-center justify-start">
            <div
              class="cursor-pointer w-[25%] h-[100px]"
              @click="
                () => {
                  currentItemKey = item.key
                  imagePickerVisible = true
                }
              ">
              <n-image
                v-if="formValue[item.key]"
                object-fit="cover"
                preview-disabled
                class="p-1"
                :style="'border: 1px dashed ' + pickByTheme('green', 'white')"
                :src="fileUrl(formValue[item.key] || '')">
              </n-image>
              <div
                v-else
                class="w-full h-full flex items-center justify-center"
                :style="'border: 1px dashed ' + pickByTheme('green', 'white')">
                <n-icon :size="64">
                  <Icon icon="carbon:image" class="text-gray-400" />
                </n-icon>
              </div>
            </div>
            <n-button
              v-if="formValue[item.key]"
              quaternary
              @click="
                () => {
                  currentItemKey = item.key
                  formValue[currentItemKey] = ''
                }
              ">
              <template #icon>
                <n-icon>
                  <Icon icon="carbon:trash-can" />
                </n-icon>
              </template>
              {{ t('clear') }}
            </n-button>
          </div>
        </template>
        <template v-else-if="item.type == 'gallery'">
          <GridImagesPicker
            v-model="formValue[item.key]"
            upload-folder="images"
            :title="tr(item.label)" />
        </template>
        <template
          v-else-if="
            item.type == 'news-category' || item.type == 'news-categories'
          ">
          <n-select
            v-model:value="formValue[item.key]"
            :options="((newsCategories || []) as any[])?.map((option) => {
              if (item.type == 'news-categories' && item.settings && formValue[item.key]) {
                const max = item.settings?.['max'] || Infinity
                return {
                  ...option,
                  disabled: formValue[item.key].length >= max && !formValue[item.key].includes(option.id),
                }
              }

              return option
            })"
            :multiple="item.type == 'news-categories'"
            :placeholder="tr(item.label)"
            :render-label="renderNewsCategorySelectLabel"
            label-field="name"
            value-field="id"
            filterable
            :clearable="item.settings?.clearable || true"
            :max-tag-count="item.settings?.['max-tag-count'] || undefined"
            class="w-full" />
        </template>
        <template
          v-else-if="item.type == 'news-tag' || item.type == 'news-tags'">
          <n-select
            v-model:value="formValue[item.key]"
            :options="((newsTags || []) as any[])?.map((option) => {
              if (item.type == 'news-tags' && item.settings && formValue[item.key]) {
                const max = item.settings?.['max'] || Infinity
                return {
                  ...option,
                  disabled: formValue[item.key].length >= max && !formValue[item.key].includes(option.id),
                }
              }

              return option
            })"
            :multiple="item.type == 'news-tags'"
            :placeholder="tr(item.label)"
            :render-label="renderNewsTagSelectLabel"
            label-field="name"
            value-field="id"
            filterable
            :clearable="item.settings?.clearable || true"
            :max-tag-count="item.settings?.['max-tag-count'] || undefined"
            class="w-full" />
        </template>
        <template
          v-else-if="
            item.type == 'news-article' || item.type == 'news-articles'
          ">
          <n-select
            v-model:value="formValue[item.key]"
            :options="((newsArticles || []) as any[])?.map((option) => {
              if (item.type == 'news-articles' && item.settings && formValue[item.key]) {
                const max = item.settings?.['max'] || Infinity
                return {
                  ...option,
                  disabled: formValue[item.key].length >= max && !formValue[item.key].includes(option.id),
                }
              }

              return option
            })"
            :multiple="item.type == 'news-articles'"
            :placeholder="tr(item.label)"
            :render-label="renderNewsArticleSelectLabel"
            :loading="isSearchingNewsArticle"
            value-field="id"
            filterable
            :clearable="item.settings?.clearable || true"
            :max-tag-count="item.settings?.['max-tag-count'] || undefined"
            remote
            class="w-full"
            @search="handleNewsArticleSearch" />
        </template>
        <template v-else-if="item.type == 'icon' || item.type == 'icons'">
          <IconPicker
            v-model="formValue[item.key]"
            :placeholder="tr(item.label)"
            :multiple="item.type == 'icons'"
            :icons-list-placeholder="t('enterIconNameInSearchBar')"
            :search-placeholder="t('search')"
            :empty-text="t('noIconsFound')"
            :icon-library="item.settings?.library || 'all'"
            :clearable="item.settings?.clearable || true" />
        </template>
        <template v-else-if="item.type == 'albums'">
          <AlbumsPicker
            v-model="formValue[item.key]"
            upload-folder="albums"
            title="" />
        </template>
        <template v-else-if="item.type == 'audio'">
          <n-input-group>
            <n-button
              type="primary"
              @click="
                () => {
                  currentItemKey = item.key
                  audioPickerVisible = true
                }
              ">
              {{ t('select') }}
            </n-button>
            <n-input
              :value="
                formValue[item.key] ? filenameFromUrl(formValue[item.key]) : ''
              "
              :placeholder="t('audioname')"
              :style="{ width: '50%' }"
              readonly />
            <template v-if="formValue[item.key]">
              <n-button
                type="primary"
                ghost
                @click="
                  () => {
                    audioReaderTitle = tr(item.label)
                    audioReaderUrl = fileUrl(formValue[item.key])
                    showAudioReaderDialog = true
                  }
                ">
                <template #icon>
                  <n-icon>
                    <Icon icon="carbon:play" />
                  </n-icon>
                </template>
                {{ t('play') }}
              </n-button>
              <n-button
                type="primary"
                ghost
                @click="
                  () => {
                    currentItemKey = item.key
                    formValue[currentItemKey] = ''
                  }
                ">
                <template #icon>
                  <n-icon>
                    <Icon icon="carbon:trash-can" />
                  </n-icon>
                </template>
                {{ t('clear') }}
              </n-button>
            </template>
          </n-input-group>
        </template>
        <template v-else-if="item.type == 'video'">
          <n-input-group>
            <n-button
              type="primary"
              @click="
                () => {
                  currentItemKey = item.key
                  videoPickerVisible = true
                }
              ">
              {{ t('select') }}
            </n-button>
            <n-input
              :value="
                formValue[item.key] ? filenameFromUrl(formValue[item.key]) : ''
              "
              :placeholder="t('videoname')"
              :style="{ width: '50%' }"
              readonly />
            <template v-if="formValue[item.key]">
              <n-button
                type="primary"
                ghost
                @click="
                  () => {
                    videoReaderTitle = tr(item.label)
                    videoReaderUrl = fileUrl(formValue[item.key])
                    showVideoReaderDialog = true
                  }
                ">
                <template #icon>
                  <n-icon>
                    <Icon icon="carbon:play" />
                  </n-icon>
                </template>
                {{ t('play') }}
              </n-button>
              <n-button
                type="primary"
                ghost
                @click="
                  () => {
                    currentItemKey = item.key
                    formValue[currentItemKey] = ''
                  }
                ">
                <template #icon>
                  <n-icon>
                    <Icon icon="carbon:trash-can" />
                  </n-icon>
                </template>
                {{ t('clear') }}
              </n-button>
            </template>
          </n-input-group>
        </template>
        <template v-else-if="item.type == 'document'">
          <n-input-group>
            <n-button
              type="primary"
              @click="
                () => {
                  currentItemKey = item.key
                  documentPickerVisible = true
                }
              ">
              {{ t('select') }}
            </n-button>
            <n-input
              :value="
                formValue[item.key] ? filenameFromUrl(formValue[item.key]) : ''
              "
              :placeholder="t('docname')"
              :style="{ width: '50%' }"
              readonly />
            <template v-if="formValue[item.key]">
              <n-button
                type="primary"
                ghost
                @click="openDocument(fileUrl(formValue[item.key]))">
                <template #icon>
                  <n-icon>
                    <Icon icon="mdi:open-in-new" />
                  </n-icon>
                </template>
                {{ t('open') }}
              </n-button>
              <n-button
                type="primary"
                ghost
                @click="
                  () => {
                    currentItemKey = item.key
                    formValue[currentItemKey] = ''
                  }
                ">
                <template #icon>
                  <n-icon>
                    <Icon icon="carbon:trash-can" />
                  </n-icon>
                </template>
                {{ t('clear') }}
              </n-button>
            </template>
          </n-input-group>
        </template>
        <template v-else-if="item.type == 'file'">
          <n-input-group>
            <n-button
              type="primary"
              @click="
                () => {
                  currentItemKey = item.key
                  filePickerVisible = true
                }
              ">
              {{ t('select') }}
            </n-button>
            <n-input
              :value="
                formValue[item.key] ? filenameFromUrl(formValue[item.key]) : ''
              "
              :placeholder="t('filename')"
              :style="{ width: '50%' }"
              readonly />
            <n-button
              v-if="formValue[item.key]"
              type="primary"
              ghost
              @click="
                () => {
                  currentItemKey = item.key
                  formValue[currentItemKey] = ''
                }
              ">
              <template #icon>
                <n-icon>
                  <Icon icon="carbon:trash-can" />
                </n-icon>
              </template>
              {{ t('clear') }}
            </n-button>
          </n-input-group>
        </template>
        <template v-else-if="item.type == 'color'">
          <pick-colors
            v-model:value="formValue[item.key]"
            class="cursor-pointer"
            :theme="theme"
            :z-index="5000"
            format="hex"
            size="25">
          </pick-colors>
        </template>
        <template
          v-else-if="
            item.type == 'content-model-item' ||
            item.type == 'content-model-items'
          ">
          <n-select
            v-model:value="formValue[item.key]"
            :options="((contentModelItems || []) as any[])?.map((option) => {
              if (item.type == 'content-model-items' && item.settings && formValue[item.key]) {
                const max = item.settings?.['max'] || Infinity
                return {
                  ...option,
                  disabled: formValue[item.key].length >= max && !formValue[item.key].includes(option.id),
                }
              }

              return option
            })"
            :multiple="item.type == 'content-model-items'"
            :placeholder="tr(item.label)"
            :render-label="(option: ContentModelItemModel) => renderContentModelItemSelectLabel(option).value"
            :loading="isSearchingContentModelItem"
            value-field="id"
            filterable
            :clearable="item.settings?.clearable || true"
            :max-tag-count="item.settings?.['max-tag-count'] || undefined"
            remote
            class="w-full"
            @search="(query: string) => handleContentModelItemSearch(query, item.defaultValue)" />
        </template>
        <template v-else-if="item.type == 'menu-item-link'">
          <n-select
            v-model:value="formValue[item.key]"
            :options="((menuItems || []) as any[])"
            :placeholder="tr(item.label)"
            :render-label="renderMenuItemSelectLabel"
            :render-tag="renderMenuItemSelectTag"
            :loading="isLoadingMenuItems"
            label-field="title"
            value-field="id"
            filterable
            :clearable="item.settings?.clearable || true"
            class="w-full" />
        </template>
        <template v-else-if="item.type == 'list'">
          <n-dynamic-input
            v-model:value="formValue[item.key]"
            :placeholder="tr(item.label)"
            :max="item.settings?.max || undefined"
            :min="item.settings?.min || undefined"
            :on-create="() => ({ value: '' })"
            show-sort-button>
            <template #default="{ value }">
              <div v-if="item.settings?.type == 'editor'" class="w-full">
                <CKEditorWrapper
                  v-model="value.value"
                  :toolbar-items="contentEditorItems"
                  :should-not-group-when-full="false"
                  enable-upload />
              </div>
              <n-input
                v-else
                v-model:value="value.value"
                :type="item.settings?.type || 'text'"
                class="w-full" />
            </template>
          </n-dynamic-input>
        </template>
        <template v-else-if="item.type == 'i18n-list'">
          <n-dynamic-input
            v-model:value="formValue[item.key]"
            :placeholder="tr(item.label)"
            :max="item.settings?.max || undefined"
            :min="item.settings?.min || undefined"
            :on-create="() => ({ value: '' })"
            show-sort-button>
            <template #default="{ value }">
              <I18nInput
                v-model="value.value"
                :type="item.settings?.type || 'text'"
                :selector-span="5"
                class="w-full"
                sync />
            </template>
          </n-dynamic-input>
        </template>
      </n-form-item>
    </template>
  </n-form>
  <n-modal
    v-model:show="showAudioReaderDialog"
    preset="card"
    style="width: 500px"
    :bordered="false"
    :mask-closable="false"
    :close-on-esc="false"
    :title="audioReaderTitle">
    <audio id="music" preload="all" autoplay controls style="width: 100%">
      <source :src="audioReaderUrl" />
    </audio>
  </n-modal>
  <n-modal
    v-model:show="showVideoReaderDialog"
    preset="card"
    style="width: 600px"
    :bordered="false"
    :mask-closable="false"
    :close-on-esc="false"
    :title="videoReaderTitle">
    <video id="video" autoplay controls style="width: 100%">
      <source :src="videoReaderUrl" />
    </video>
  </n-modal>
  <MediaPicker
    v-model:show="imagePickerVisible"
    :title="t('selectImage')"
    :display-images="true"
    :display-videos="false"
    :display-audios="false"
    :display-documents="false"
    :display-other-types="false"
    :upload-config="{
      folder: 'images',
      limit: 0,
      maxSize: 0,
      baseUrl: appConfig?.apiUrl + '/media-files/upload',
      excludedExtensions: [],
    }"
    @submit="(path: string) => {
      formValue[currentItemKey] = path
      imagePickerVisible = false
    }" />
  <MediaPicker
    v-model:show="videoPickerVisible"
    :title="t('selectVideo')"
    :display-images="false"
    :display-videos="true"
    :display-audios="false"
    :display-documents="false"
    :display-other-types="false"
    :upload-config="{
      folder: 'videos',
      limit: 0,
      maxSize: 0,
      baseUrl: appConfig?.apiUrl + '/media-files/upload',
      excludedExtensions: [],
    }"
    @submit="(path: string) => {
      formValue[currentItemKey] = path
      videoPickerVisible = false
    }" />
  <MediaPicker
    v-model:show="audioPickerVisible"
    :title="t('selectAudio')"
    :display-images="false"
    :display-videos="false"
    :display-audios="true"
    :display-documents="false"
    :display-other-types="false"
    :upload-config="{
      folder: 'audios',
      limit: 0,
      maxSize: 0,
      baseUrl: appConfig?.apiUrl + '/media-files/upload',
      excludedExtensions: [],
    }"
    @submit="(path: string) => {
      formValue[currentItemKey] = path
      audioPickerVisible = false
    }" />
  <MediaPicker
    v-model:show="documentPickerVisible"
    :title="t('selectDocument')"
    :display-images="false"
    :display-videos="false"
    :display-audios="false"
    :display-documents="true"
    :display-other-types="false"
    :upload-config="{
      folder: 'images',
      limit: 0,
      maxSize: 0,
      baseUrl: appConfig?.apiUrl + '/media-files/upload',
      excludedExtensions: [],
    }"
    @submit="(path: string) => {
      formValue[currentItemKey] = path
      documentPickerVisible = false
    }" />
  <MediaPicker
    v-model:show="filePickerVisible"
    :title="t('selectFile')"
    :upload-config="{
      folder: 'files',
      limit: 0,
      maxSize: 0,
      baseUrl: appConfig?.apiUrl + '/media-files/upload',
      excludedExtensions: [],
    }"
    @submit="(path: string) => {
      formValue[currentItemKey] = path
      filePickerVisible = false
    }" />
</template>

<style scoped lang="scss">
  .n-image {
    width: 100%;
  }

  :deep(.n-image img) {
    width: 100%;
    height: 100px;
  }
</style>

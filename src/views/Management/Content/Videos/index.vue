<script setup lang="ts">
  import videoThumbnail from '@/assets/images/video-thumbnail.svg'

  import { reformatDate } from '@/utils/chronos'
  import { filenameFromUrl } from '@/utils/functions'
  import { AppConfig } from '@/utils/types'

  import { ResponseErrorCode } from '@/enums/response-error-code'
  import { VideoDisplayType } from '@/enums/video-display-type'
  import { VideoItemSource } from '@/enums/video-item-source'

  import { VideoSettingObject } from '@/stores/video-setting'

  import { VideoItemModel } from '@/models/video-item'
  import { VideoSettingModel } from '@/models/video-setting'

  import { FormInst, FormRules, FormValidationError } from 'naive-ui'

  const { t, locale } = useI18n()

  const { tr, fileUrl, pickByTheme, displayFormErrors } = useHelper()
  const { videoDisplayTypes } = useVideo()
  const { request } = useApi()

  const { isLightTheme } = storeToRefs(useUserInterfaceStore())

  const loadingBar = useLoadingBar()
  const message = useMessage()
  const dialog = useDialog()

  const appConfig = inject<AppConfig>('appConfig')

  const search = ref<string>('')
  const searchInputRef = ref(null)
  const isLoading = ref<boolean>(false)
  const videoItems = ref<VideoItemModel[]>([])

  const componentStore = defineStore('videos-management-store', () => {
    const currentTab = ref<'all' | 'self-hosted' | 'youtube' | 'settings'>(
      'all'
    )

    return { currentTab }
  })()

  const onTabChange = () => {
    init()
  }

  // Pagination

  const total = ref(0)
  const pageSize = ref(12)
  const currentPage = ref(1)

  const requestUrl = computed(() => {
    return `/video-items?pageSize=${pageSize.value}&query=${search.value}&source=${componentStore.currentTab}`
  })

  const handlePageChange = (value: number) => {
    init(`${requestUrl.value}&page=${value}`)
  }

  const handlePageSizeChange = (value: number) => {
    pageSize.value = value
    init()
  }

  const init = async (url: string | null = null, loadAllData = false) => {
    isLoading.value = true
    loadingBar.start()

    const task = await request({
      url: url ?? requestUrl.value,
    })

    if (task.success && task.result) {
      videoItems.value = task.result.data?.videoItems || []

      total.value = task.result.data?.meta?.total || 0
      currentPage.value = task.result.data?.meta?.currentPage || 1
    }

    if (loadAllData) {
      //
    }

    loadingBar.finish()
    isLoading.value = false
  }

  init(null, true)

  // Add & Edit video

  const isProceeding = ref(false)
  const dialogVisible = ref(false)
  const currentEditItem = ref<VideoItemModel | null>(null)
  const formRef = ref<FormInst | null>(null)
  const formValue = ref<VideoItemModel>({
    title: '',
    description: '',
    visible: true,
    source: VideoItemSource.SELF_HOSTED,
    displayType: VideoDisplayType.HORIZONTAL,
    thumbnail: '',
    path: '',
  })
  const rules = computed<FormRules>(() => ({
    title: [
      {
        required: formValue.value.source == VideoItemSource.SELF_HOSTED,
        message: t('fillRequired'),
      },
    ],
    path: [
      {
        required: true,
        message: t('fillRequired'),
      },
    ],
  }))

  const openFormModal = (item: VideoItemModel | null) => {
    currentEditItem.value = _.cloneDeep(item)

    if (item) {
      formValue.value = _.cloneDeep(item)
    } else {
      formValue.value = {
        title: '',
        description: '',
        visible: true,
        source: VideoItemSource.SELF_HOSTED,
        displayType: VideoDisplayType.HORIZONTAL,
        thumbnail: '',
        path: '',
      }
    }

    dialogVisible.value = true
  }

  const deleteItem = async (item: VideoItemModel) => {
    dialog.warning({
      title: t('confirm'),
      content: t('confirmDeleteVideo'),
      positiveText: t('yes'),
      negativeText: t('no'),
      onPositiveClick: async () => {
        const task = await request({
          method: 'delete',
          url: `/video-items/force/${item.id}`,
        })

        if (task.success) {
          message.success(t('success'))

          init()
        } else message.error(t('anErrorOccurred'))
      },
    })
  }

  const submit = async () => {
    formRef.value?.validate(
      async (errors: Array<FormValidationError> | undefined) => {
        if (!errors) {
          if (currentEditItem.value) {
            loadingBar.start()
            isProceeding.value = true

            const data = {
              title: formValue.value.title,
              description: formValue.value.description,
              visible: formValue.value.visible,
              source: formValue.value.source,
              displayType: formValue.value.displayType,
              thumbnail: formValue.value.thumbnail,
              path: formValue.value.path,
            } as VideoItemModel

            const task = await request({
              method: 'put',
              url: `/video-items/${currentEditItem.value.id}`,
              data,
            })

            if (task.success && task.result.data) {
              message.success(t('success'))

              init(`${requestUrl.value}&page=${currentPage.value}`)
            }

            isProceeding.value = false
            loadingBar.finish()

            dialogVisible.value = false
          } else {
            loadingBar.start()
            isProceeding.value = true

            const data = {
              title: formValue.value.title,
              description: formValue.value.description,
              visible: formValue.value.visible,
              source: formValue.value.source,
              displayType: formValue.value.displayType,
              thumbnail: formValue.value.thumbnail,
              path: formValue.value.path,
            } as VideoItemModel

            const task = await request({
              method: 'post',
              url: '/video-items',
              data,
            })

            if (task.failure && task.error) {
              switch (task.error?.response?.data?.errorCode) {
                case ResponseErrorCode.FORM_INVALID_DATA:
                  displayFormErrors(task.error?.response?.data?.data)
                  break
                case ResponseErrorCode.REQUEST_PARAMS_MISSING:
                  message.error(t('pleaseProvideApiKeyAndValidVideoUrl'))
                  break
                case ResponseErrorCode.REQUEST_DATA_RETRIEVAL_FAILED:
                  message.error(t('videoDataCantBeRetrieve'))
                  break
                case ResponseErrorCode.REQUEST_DATA_ALREADY_EXISTS:
                  message.error(t('videoAlreadyExists'))
                  break
                default:
                  message.error(t('anErrorOccurred'))
              }
            } else {
              message.success(t('success'))

              init(`${requestUrl.value}&page=${currentPage.value}`)

              dialogVisible.value = false
            }

            isProceeding.value = false
            loadingBar.finish()
          }
        }
      }
    )

    return false
  }

  // Video

  const videoPickerVisible = ref(false)
  const showVideoReaderDialog = ref(false)

  const videoReaderTitle = ref('')
  const videoReaderUrl = ref('')
  const videoReaderType = ref<'youtube' | 'classic'>('classic')

  // Image

  const imagePickerVisible = ref(false)

  // Settings

  const videoSettingStore = useVideoSettingStore()

  const settings = ref<VideoSettingObject>({
    youtubeChannelId: '',
    youtubeApiKey: '',
    youtubeChannelVideosAutoUpdate: '',
    youtubeLastChannelVideosUpdate: '',
  })
  const initialSettings = ref<VideoSettingObject>(settings.value)

  const saveSettingsBtnDisabled = computed(() => {
    return _.isEqual(settings.value, initialSettings.value)
  })

  const submitSettings = async () => {
    isProceeding.value = true

    const task = await request({
      url: `/video-settings`,
      method: 'put',
      data: settings.value,
    })

    if (task.success && task.result) {
      message.success(t('success'))
    } else {
      message.error(t('unableToUpdateSettings'))
    }

    await initSettings()
  }

  const initSettings = async () => {
    loadingBar.start()
    isProceeding.value = true

    await videoSettingStore.loadSettings()

    videoSettingStore.settings?.forEach((setting: VideoSettingModel) => {
      if (settings.value[setting.key as keyof typeof settings.value] != null) {
        settings.value[setting.key as keyof typeof settings.value] =
          setting.value
      }
    })

    initialSettings.value = _.cloneDeep(settings.value)

    isProceeding.value = false
    loadingBar.finish()
  }

  initSettings()

  // Update channel videos
  const updateChannelVideos = async () => {
    loadingBar.start()
    isProceeding.value = true

    const task = await request({
      url: `/video-items/youtube/channel-videos`,
      method: 'put',
    })

    if (task.success) {
      message.success(t('success'))

      await initSettings()
    } else {
      message.error(t('unableToUpdateChannelVideos'))
    }

    isProceeding.value = false
    loadingBar.finish()
  }

  // Multiselect
  const selectAll = ref(false)
  const refreshKey = ref(uuidv4())
  const selectedItems = ref<Record<number, boolean>>({})

  const checkedItemsNumber = computed(() => {
    let count = 0

    for (const key in selectedItems.value) {
      if (selectedItems.value[key]) count++
    }

    return count
  })

  function cancelSelection() {
    selectedItems.value = {}

    init()
  }

  const deleteSelection = async () => {
    if (checkedItemsNumber.value) {
      dialog.warning({
        title: t('confirm'),
        content: t('deleteSelectionWarningMessage', [checkedItemsNumber.value]),
        positiveText: t('yes'),
        negativeText: t('no'),
        onPositiveClick: async () => {
          isProceeding.value = true
          loadingBar.start()

          for (const key in selectedItems.value) {
            if (selectedItems.value[key]) {
              await request({
                url: `/video-items/force/${key}`,
                method: 'delete',
              })
            }
          }

          loadingBar.finish()
          isProceeding.value = false

          message.success(t('success'))

          selectedItems.value = {}
          init(null, true)
        },
      })
    } else message.warning(t('noItemSelected'))

    return false
  }
</script>

<template>
  <MountedTeleport to="#alt-action">
    <n-button
      v-if="componentStore.currentTab == 'settings'"
      :loading="isProceeding"
      :disabled="saveSettingsBtnDisabled"
      type="primary"
      @click="submitSettings">
      <template #icon>
        <n-icon><Icon icon="carbon:save" /></n-icon>
      </template>
      {{ t('saveSettings') }}
    </n-button>
    <div v-else class="flex items-center gap-3">
      <n-checkbox
        v-model:checked="selectAll"
        @update:checked="(checked: boolean) => {
                for (const item of videoItems) {
                  if (item.id) selectedItems[item.id] = checked
                }
                refreshKey = uuidv4()
            }">
        {{ t('selectAll') }}
      </n-checkbox>
      <n-button type="primary" @click="openFormModal(null)">
        <template #icon>
          <n-icon><Icon icon="carbon:video-add" /></n-icon>
        </template>
        {{ t('addVideo') }}
      </n-button>
    </div>
  </MountedTeleport>
  <n-tabs
    v-model:value="componentStore.currentTab"
    type="card"
    size="medium"
    @update:value="onTabChange">
    <n-tab name="all">
      <n-icon size="18" class="mr-1">
        <Icon icon="carbon:collapse-all" />
      </n-icon>
      {{ t('all_') }}
    </n-tab>
    <n-tab :name="VideoItemSource.SELF_HOSTED">
      <n-icon size="18" class="mr-1">
        <Icon icon="carbon:document-video" />
      </n-icon>
      {{ t('selfHosted') }}
    </n-tab>
    <n-tab :name="VideoItemSource.YOUTUBE">
      <n-icon size="18" class="mr-1">
        <Icon icon="carbon:logo-youtube" />
      </n-icon>
      {{ t('youtube') }}
    </n-tab>
    <n-tab name="settings">
      <n-icon size="18" class="mr-1">
        <Icon icon="carbon:settings-adjust" />
      </n-icon>
      {{ t('settings') }}
    </n-tab>
    <template v-if="componentStore.currentTab != 'settings'" #suffix>
      <n-input-group class="!w-[250px]">
        <n-input
          ref="searchInputRef"
          v-model:value="search"
          :clearable="true"
          :placeholder="t('searchVideo')"
          @update:value="(value: string) => {
            if (!value) {
              init()
            }
          }" />
        <n-button type="primary" @click="init()">
          <template #icon>
            <n-icon>
              <Icon icon="carbon:search" />
            </n-icon>
          </template>
        </n-button>
      </n-input-group>
    </template>
  </n-tabs>
  <section
    v-if="checkedItemsNumber > 0"
    class="w-full flex items-center justify-between mt-4">
    <span>{{ t('nbItemsSelected', [checkedItemsNumber]) }}</span>
    <section class="flex items-center gap-3">
      <n-button type="error" size="small" @click="deleteSelection">
        <template #icon>
          <n-icon>
            <Icon icon="carbon:trash-can" />
          </n-icon>
        </template>
        {{ t('delete') }}
      </n-button>
      <n-button type="warning" size="small" @click="cancelSelection">
        <template #icon>
          <n-icon>
            <Icon icon="mdi:close" />
          </n-icon>
        </template>
        {{ t('cancelSelection') }}
      </n-button>
    </section>
  </section>
  <section v-if="componentStore.currentTab == 'settings'" class="mt-4">
    <n-card hoverable embedded>
      <template #header>
        {{ t('youtube') }}
      </template>
      <n-grid
        cols="1 s:2 m:2 l:2 xl:2 2xl:2"
        responsive="screen"
        :x-gap="12"
        :y-gap="12">
        <n-gi>
          <n-card class="w-full h-full" size="small">
            <n-space align="center" justify="space-between">
              <span>{{ t('apiKey') }}</span>
              <n-input
                v-model:value="settings.youtubeApiKey"
                type="password"
                class="w-full" />
            </n-space>
          </n-card>
        </n-gi>
        <n-gi>
          <n-card class="w-full h-full py-1.5" size="small">
            <n-space align="center" justify="space-between">
              <span>{{ t('autoUpdateChannelVideos') }}</span>
              <n-switch
                v-model:value="settings.youtubeChannelVideosAutoUpdate"
                checked-value="1"
                unchecked-value="0"
                size="small">
                <template #checked> <div class="w-6"></div> </template>
                <template #unchecked> <div class="w-6"></div> </template>
              </n-switch>
            </n-space>
          </n-card>
        </n-gi>
        <template v-if="settings.youtubeChannelVideosAutoUpdate == '1'">
          <n-gi>
            <n-card class="w-full h-full" size="small">
              <n-space align="center" justify="space-between">
                <span>{{ t('channelId') }}</span>
                <n-input
                  v-model:value="settings.youtubeChannelId"
                  class="w-full" />
              </n-space>
            </n-card>
          </n-gi>
          <n-gi>
            <n-card class="w-full h-full" size="small">
              <n-space align="center" justify="space-between">
                <span>{{ t('lastUpdate') }}</span>
                <b>
                  {{
                    settings.youtubeLastChannelVideosUpdate
                      ? reformatDate(settings.youtubeLastChannelVideosUpdate, {
                          locale: locale,
                          inPattern: 'YYYY-MM-DD HH:mm:ss',
                          outPattern: 'DD MMMM YYYY HH:mm',
                        })
                      : t('never')
                  }}
                </b>
                <n-button
                  strong
                  circle
                  :secondary="isLightTheme"
                  type="primary"
                  :title="t('refresh')"
                  :disabled="isProceeding"
                  @click="updateChannelVideos">
                  <template #icon>
                    <n-icon>
                      <Icon
                        icon="carbon:restart"
                        :class="{ 'animate-spin': isProceeding }" />
                    </n-icon>
                  </template>
                </n-button>
              </n-space>
            </n-card>
          </n-gi>
        </template>
      </n-grid>
    </n-card>
  </section>
  <n-card v-else embedded class="py-10 mt-4">
    <section v-if="videoItems.length && !isLoading">
      <n-grid x-gap="12" y-gap="12" cols="1 400:2 600:3 900:3 1400:4 1800:5">
        <n-gi v-for="(item, i) in videoItems" :key="i">
          <CustomTransition name="slide-fade" appear>
            <n-card bordered hoverable>
              <template #cover>
                <div class="flex items-center justify-center h-full">
                  <img
                    :src="item.thumbnailUrl ?? videoThumbnail"
                    class="w-full h-[200px] object-cover" />
                </div>
              </template>
              <template #header>
                <div class="text-center text-dimgray text-sm">
                  <n-ellipsis :line-clamp="1" expand-trigger="click">
                    <n-checkbox
                      v-if="item.id"
                      :key="refreshKey"
                      v-model:checked="selectedItems[item.id]"
                      class="mr-1" />
                    {{ tr(item.title) }}
                  </n-ellipsis>
                </div>
              </template>
              <template #action>
                <n-space justify="space-between" align="center">
                  <n-space>
                    <n-tag
                      :bordered="false"
                      :type="item.visible ? 'success' : 'error'">
                      {{ item.visible ? t('visible') : t('hidden') }}
                    </n-tag>
                    <n-tag
                      :bordered="false"
                      :type="
                        item.displayType == VideoDisplayType.HORIZONTAL
                          ? 'info'
                          : 'warning'
                      ">
                      {{
                        item.displayType == VideoDisplayType.HORIZONTAL
                          ? t('horizontal')
                          : t('vertical')
                      }}
                    </n-tag>
                  </n-space>
                  <n-space>
                    <n-button
                      ternary
                      circle
                      :title="t('play')"
                      @click="() => {
                        videoReaderTitle = t('video')
                        videoReaderUrl = fileUrl(item.path as string)
                        videoReaderType = item.source == VideoItemSource.YOUTUBE ? 'youtube' : 'classic'

                        showVideoReaderDialog = true
                      }">
                      <template #icon>
                        <n-icon><Icon icon="carbon:play" /></n-icon>
                      </template>
                    </n-button>
                    <n-button
                      v-if="item.source != VideoItemSource.YOUTUBE"
                      ternary
                      circle
                      :title="t('edit')"
                      @click="openFormModal(item)">
                      <template #icon>
                        <n-icon><Icon icon="carbon:edit" /></n-icon>
                      </template>
                    </n-button>
                    <n-button
                      ternary
                      circle
                      :title="t('delete')"
                      @click="deleteItem(item)">
                      <template #icon>
                        <n-icon><Icon icon="carbon:trash-can" /></n-icon>
                      </template>
                    </n-button>
                  </n-space>
                </n-space>
              </template>
            </n-card>
          </CustomTransition>
        </n-gi>
      </n-grid>
      <n-pagination
        v-model:page="currentPage"
        class="mt-10 justify-center"
        show-size-picker
        :page-size="pageSize"
        :page-sizes="[12, 24, 36, 48, 60]"
        :page-count="Math.ceil(total / pageSize)"
        @update:page="handlePageChange"
        @update:page-size="handlePageSizeChange">
        <template #prefix>
          {{ `${total} ${t('video_s')}` }}
        </template>
      </n-pagination>
    </section>
    <section v-else-if="isLoading" class="flex items-center justify-center">
      <n-spin size="medium" />
    </section>
    <n-empty v-else :description="t('noVideo')" class="my-10"> </n-empty>
  </n-card>
  <n-modal
    v-model:show="dialogVisible"
    :loading="isProceeding"
    preset="dialog"
    style="width: 600px"
    :bordered="false"
    :show-icon="false"
    :mask-closable="false"
    :title="currentEditItem ? t('editVideo') : t('addVideo')"
    :positive-text="t('validate')"
    :negative-text="t('cancel')"
    @positive-click="submit"
    @negative-click="dialogVisible = false">
    <div class="mt-5">
      <n-form
        ref="formRef"
        :model="formValue"
        :rules="rules"
        :show-require-mark="false"
        size="medium">
        <n-form-item :label="t('source')" path="source">
          <n-checkbox
            v-model:checked="formValue.source"
            :checked-value="VideoItemSource.YOUTUBE"
            :unchecked-value="VideoItemSource.SELF_HOSTED">
            {{ t('importVideoFromYoutube') }}
          </n-checkbox>
        </n-form-item>
        <template v-if="formValue.source == VideoItemSource.YOUTUBE">
          <n-grid x-gap="12" :span="24">
            <n-form-item-gi :span="16" :label="t('videoShareLink')" path="path">
              <n-input
                v-model:value="formValue.path"
                :placeholder="t('videoShareLink')"
                class="w-full" />
            </n-form-item-gi>
            <n-form-item-gi
              :span="8"
              :label="t('displayType')"
              path="displayType">
              <n-select
                v-model:value="formValue.displayType"
                :placeholder="t('displayType')"
                :options="(videoDisplayTypes as any[])"
                class="w-full" />
            </n-form-item-gi>
          </n-grid>
        </template>
        <template v-else>
          <n-form-item :label="t('title')" path="title">
            <I18nInput
              v-model="formValue.title"
              :placeholder="t('title')"
              :selector-span="5"
              class="w-full"
              sync />
          </n-form-item>
          <n-form-item :label="t('description')" path="description">
            <I18nInput
              v-model="formValue.description"
              :placeholder="t('description')"
              :selector-span="5"
              class="w-full"
              type="textarea"
              sync />
          </n-form-item>
          <n-grid x-gap="12" :span="24">
            <n-form-item-gi :span="16" :label="t('content')" path="path">
              <n-input-group>
                <n-button
                  type="primary"
                  @click="
                    () => {
                      videoPickerVisible = true
                    }
                  ">
                  {{ t('select') }}
                </n-button>
                <n-input
                  :value="formValue.path ? filenameFromUrl(formValue.path) : ''"
                  :placeholder="t('videoname')"
                  :style="{ width: '100%' }"
                  readonly />
                <template v-if="formValue.path">
                  <n-button
                    type="primary"
                    ghost
                    @click="
                  () => {
                    videoReaderTitle = t('video')
                    videoReaderUrl = fileUrl(formValue.path as string)
                    videoReaderType = 'classic'

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
                        formValue.path = ''
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
            </n-form-item-gi>
            <n-form-item-gi
              :span="8"
              :label="t('displayType')"
              path="displayType">
              <n-select
                v-model:value="formValue.displayType"
                :placeholder="t('displayType')"
                :options="(videoDisplayTypes as any[])"
                class="w-full" />
            </n-form-item-gi>
          </n-grid>
          <n-form-item :label="t('thumbnail')" path="thumbnail">
            <div class="w-full flex flex-gap-8 items-center justify-start">
              <div
                class="cursor-pointer w-full h-[150px]"
                @click="
                  () => {
                    imagePickerVisible = true
                  }
                ">
                <n-image
                  v-if="formValue.thumbnail"
                  object-fit="cover"
                  preview-disabled
                  class="p-1 thumbnail-image"
                  :style="'border: 1px dashed ' + pickByTheme('green', 'white')"
                  :src="fileUrl(formValue.thumbnail || '')">
                </n-image>
                <div
                  v-else
                  class="w-full h-full flex items-center justify-center"
                  :style="
                    'border: 1px dashed ' + pickByTheme('green', 'white')
                  ">
                  <n-icon :size="64">
                    <Icon icon="carbon:image" class="text-gray-400" />
                  </n-icon>
                </div>
              </div>
            </div>
          </n-form-item>
        </template>
      </n-form>
    </div>
  </n-modal>
  <n-modal
    v-model:show="showVideoReaderDialog"
    preset="card"
    style="width: 600px"
    :bordered="false"
    :mask-closable="false"
    :close-on-esc="false"
    :title="videoReaderTitle">
    <iframe
      v-if="videoReaderType === 'youtube'"
      width="100%"
      height="380"
      :src="videoReaderUrl"
      frameborder="0"
      allowfullscreen></iframe>
    <video v-else id="video" autoplay controls style="width: 100%">
      <source :src="videoReaderUrl" />
    </video>
  </n-modal>
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
      formValue.path = path
      videoPickerVisible = false
    }" />
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
      formValue.thumbnail = path
      imagePickerVisible = false
    }" />
</template>

<style scoped lang="scss">
  .n-image {
    width: 100%;
  }

  :deep(.thumbnail-image img) {
    width: 100%;
    height: 150px;
  }
</style>

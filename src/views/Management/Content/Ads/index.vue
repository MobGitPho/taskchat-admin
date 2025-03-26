<script setup lang="ts">
  import { reformatDate } from '@/utils/chronos'
  import { filenameFromUrl } from '@/utils/functions'
  import { AppConfig } from '@/utils/types'

  import { AdContentType } from '@/enums/ad-content-type'
  import { ResponseErrorCode } from '@/enums/response-error-code'

  import { AdModel } from '@/models/ad'

  import {
    FormInst,
    FormRules,
    FormValidationError,
    NButton,
    NIcon,
    NImage,
    NInput,
    NTag,
  } from 'naive-ui'
  import type {
    DataTableColumns,
    PaginationProps,
    SelectOption,
  } from 'naive-ui'

  import { Icon } from '@iconify/vue'
  import { VNodeChild } from 'vue'

  import Identifiers from './Identifiers.vue'

  const loadingBar = useLoadingBar()
  const message = useMessage()
  const dialog = useDialog()

  const appConfig = inject<AppConfig>('appConfig')

  const { adIdentifiers } = storeToRefs(useAdStore())
  const { loadAdIdentifiers } = useAdStore()

  const {
    displayFormErrors,
    tr,
    fileUrl,
    pickByTheme,
    appSecondaryColor,
    isInDevMode,
  } = useHelper()
  const { request } = useApi()

  const { t, locale } = useI18n()

  const isLoading = ref(false)
  const ads = ref<AdModel[]>([])
  const search = ref<string>('')
  const searchInputRef = ref()
  const pagination = {
    pageSize: 12,
    prefix: ({ itemCount }: PaginationProps) => {
      return h(
        'div',
        { class: 'font-bold' },
        { default: () => `${t('total')}: ${itemCount}` }
      )
    },
  }

  const columns: DataTableColumns<AdModel> = [
    {
      title: t('preview'),
      key: 'image',
      width: 200,
      fixed: 'left',
      render(row: AdModel) {
        return row.adIdentifier?.contentType == AdContentType.IMAGE
          ? h(NImage, {
              src: row.contentUrl ?? '',
              objectFit: 'cover',
              width: 200,
              height: 100,
            })
          : h(
              'div',
              {
                style: {
                  width: '200px',
                  height: '100px',
                },
                class:
                  'flex items-center justify-center border border-solid border-gray-300',
              },
              [
                h(
                  NIcon,
                  { size: 50, color: appSecondaryColor.value },
                  { default: () => h(Icon, { icon: 'carbon:document-video' }) }
                ),
              ]
            )
      },
    },
    {
      title: t('identifier'),
      key: 'pid',
      width: 150,
      fixed: 'left',
      render(row: AdModel) {
        return h(
          'small',
          {},
          {
            default: () => row.pid,
          }
        )
      },
    },
    {
      title: t('title'),
      key: 'title',
      width: 150,
      ellipsis: {
        tooltip: true,
      },
      resizable: true,
      sortOrder: false,
      sorter: 'default',
      render(row: AdModel) {
        return h(
          'div',
          {},
          {
            default: () => tr(row.title),
          }
        )
      },
    },
    {
      title: t('description'),
      key: 'description',
      resizable: true,
      width: 200,
      ellipsis: {
        tooltip: true,
      },
      render(row: AdModel) {
        return h(
          'small',
          {},
          {
            default: () => tr(row.description),
          }
        )
      },
    },
    {
      title: t('status'),
      key: 'isActive',
      width: 100,
      render(row: AdModel) {
        return h(
          NTag,
          {
            type: row.display ? 'success' : 'warning',
            bordered: false,
          },
          {
            default: () => (row.display ? t('visible') : t('hidden')),
          }
        )
      },
      sortOrder: false,
      sorter: 'default',
    },
    {
      title: t('updateAt'),
      key: 'updatedAt',
      width: 125,
      render(row: AdModel) {
        return h(
          'div',
          {},
          {
            default: () =>
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              reformatDate(row.updatedAt!, {
                locale: locale.value,
                outPattern: 'DD MMMM YYYY',
              }),
          }
        )
      },
    },
    {
      title: t('createdAt'),
      key: 'createdAt',
      width: 125,
      render(row: AdModel) {
        return h(
          'div',
          {},
          {
            default: () =>
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              reformatDate(row.createdAt!, {
                locale: locale.value,
                outPattern: 'DD MMMM YYYY',
              }),
          }
        )
      },
    },
    {
      title: () => {
        return h(
          NInput,
          {
            ref: searchInputRef,
            placeholder: t('search'),
            value: search.value,
            onInput: (value: string) => {
              search.value = value
            },
          },
          {
            suffix: () =>
              h(
                NIcon,
                {},
                { default: () => h(Icon, { icon: 'carbon:search' }) }
              ),
          }
        )
      },
      key: 'actions',
      width: 150,
      render(row: AdModel) {
        return h('div', { class: 'flex justify-end items-center w-full' }, [
          h(
            NButton,
            {
              size: 'small',
              type: 'warning',
              onClick: () => {
                openFormModal(row)
              },
              renderIcon: () =>
                h(NIcon, null, {
                  default: () => h(Icon, { icon: 'carbon:edit' }),
                }),
            }
            // { default: () => t('edit') }
          ),
          h('div', { class: 'w-2' }),
          h(
            NButton,
            {
              size: 'small',
              type: 'error',
              onClick: () => {
                dialog.warning({
                  title: t('confirm'),
                  content: t('confirmDeleteAd'),
                  positiveText: t('yes'),
                  negativeText: t('no'),
                  onPositiveClick: async () => {
                    const task = await request({
                      method: 'delete',
                      url: `/ads/${row.id}`,
                    })

                    if (task.success) {
                      message.success(t('success'))

                      init()
                    } else message.error(t('anErrorOccurred'))
                  },
                })
              },
              renderIcon: () =>
                h(NIcon, null, {
                  default: () => h(Icon, { icon: 'carbon:trash-can' }),
                }),
            }
            // { default: () => t('delete') }
          ),
        ])
      },
      fixed: 'right',
    },
  ]

  const searchedAds = computed(() => {
    if (!search.value) return ads.value

    const searchedData = ads.value.filter(
      (ad) =>
        ad.pid.toLowerCase().includes(search.value.toLowerCase()) ||
        ad.title.toLowerCase().includes(search.value.toLowerCase()) ||
        ad.description?.toLowerCase().includes(search.value.toLowerCase())
    )

    if (searchInputRef.value) searchInputRef.value.focus()

    return searchedData
  })

  const init = async () => {
    isLoading.value = true

    const task = await request({
      url: '/ads',
    })

    if (task.success && task.result) {
      ads.value = task.result.data
    }

    await loadAdIdentifiers()

    isLoading.value = false
  }

  init()

  // Add & Edit

  const isProceeding = ref(false)
  const dialogVisible = ref(false)
  const identifiersDialogVisible = ref(false)
  const contentType = ref<AdContentType>(AdContentType.IMAGE)
  const params = ref<string[] | null>()
  const currentEditItem = ref<AdModel | null>(null)
  const formRef = ref<FormInst | null>(null)
  const formValue = ref<AdModel>({
    pid: '',
    title: '',
    description: '',
    content: '',
    display: true,
    data: {},
    broadcastStart: null,
    broadcastEnd: null,
  })
  const rules: FormRules = {
    pid: [
      {
        required: true,
        message: t('fillRequired'),
      },
    ],
    title: [
      {
        required: true,
        message: t('fillRequired'),
      },
    ],
    content: [
      {
        required: true,
        message: t('fillRequired'),
      },
    ],
  }

  const broadcastPeriod = computed({
    get: () => {
      if (!formValue.value.broadcastStart || !formValue.value.broadcastEnd) {
        return null
      }

      return [
        formValue.value.broadcastStart || '',
        formValue.value.broadcastEnd || '',
      ] as [string, string]
    },
    set: (value) => {
      if (value) {
        formValue.value.broadcastStart = value[0]
        formValue.value.broadcastEnd = value[1]
      } else {
        formValue.value.broadcastStart = null
        formValue.value.broadcastEnd = null
      }
    },
  })

  const openFormModal = (item: AdModel | null) => {
    currentEditItem.value = _.cloneDeep(item)

    if (item) {
      formValue.value = _.cloneDeep(item)

      if (!item.data) formValue.value.data = {}
    } else {
      formValue.value = {
        pid: '',
        title: '',
        description: '',
        content: '',
        display: true,
        data: {},
        broadcastStart: null,
        broadcastEnd: null,
      }
    }

    params.value = adIdentifiers.value.find(
      (i) => i.id == formValue.value.pid
    )?.params

    dialogVisible.value = true
  }

  const renderAdIdSelectLabel = (option: SelectOption): VNodeChild => {
    return h(
      'span',
      {},
      {
        default: () =>
          option.id + (option.contentSize ? ` (${option.contentSize})` : ''),
      }
    )
  }

  const submit = async () => {
    formRef.value?.validate(
      async (errors: Array<FormValidationError> | undefined) => {
        if (!errors) {
          if (currentEditItem.value) {
            if (
              currentEditItem.value.title !== formValue.value.title &&
              ads.value.findIndex((c) => c.title == formValue.value.title) > -1
            ) {
              message.error(t('sameAdTitleMessage'))
            } else {
              loadingBar.start()
              isProceeding.value = true

              const data = {
                pid: formValue.value.pid,
                title: formValue.value.title,
                display: formValue.value.display,
                content: formValue.value.content,
                description: formValue.value.description,
                data: formValue.value.data,
                broadcastStart: formValue.value.broadcastStart,
                broadcastEnd: formValue.value.broadcastEnd,
              } as AdModel

              const task = await request({
                method: 'put',
                url: `/ads/${currentEditItem.value.id}`,
                data,
              })

              if (task.success && task.result.data) {
                message.success(t('success'))

                init()
              }

              isProceeding.value = false
              loadingBar.finish()

              dialogVisible.value = false
            }
          } else {
            if (
              ads.value.findIndex((c) => c.title == formValue.value.title) > -1
            ) {
              message.error(t('sameAdTitleMessage'))
            } else {
              loadingBar.start()
              isProceeding.value = true

              const data = {
                pid: formValue.value.pid,
                title: formValue.value.title,
                display: formValue.value.display,
                content: formValue.value.content,
                description: formValue.value.description,
                data: formValue.value.data,
                broadcastStart: formValue.value.broadcastStart,
                broadcastEnd: formValue.value.broadcastEnd,
              } as AdModel

              const task = await request({
                method: 'post',
                url: '/ads',
                data,
              })

              if (task.failure && task.error) {
                switch (task.error?.response?.data?.errorCode) {
                  case ResponseErrorCode.FORM_INVALID_DATA:
                    displayFormErrors(task.error?.response?.data?.data)
                    break
                  default:
                    message.error(t('anErrorOccurred'))
                }
              } else {
                message.success(t('success'))

                init()
              }

              isProceeding.value = false
              loadingBar.finish()

              dialogVisible.value = false
            }
          }
        }
      }
    )

    return false
  }

  // Image

  const imagePickerVisible = ref(false)

  // Video

  const videoPickerVisible = ref(false)
  const showVideoReaderDialog = ref(false)

  const videoReaderTitle = ref('')
  const videoReaderUrl = ref('')
</script>

<template>
  <MountedTeleport to="#alt-action">
    <n-space>
      <n-button
        v-if="isInDevMode"
        type="warning"
        @click="identifiersDialogVisible = true">
        <n-icon size="26">
          <Icon icon="carbon:id" />
        </n-icon>
        {{ t('identifiers') }}
      </n-button>
      <n-button type="primary" @click="openFormModal(null)">
        <template #icon>
          <n-icon size="18"><Icon icon="carbon:add-alt" /></n-icon>
        </template>
        {{ t('addAd') }}
      </n-button>
    </n-space>
  </MountedTeleport>
  <NaiveMobileTableAdapter>
    <n-data-table
      :columns="columns"
      :data="searchedAds"
      :pagination="pagination"
      :loading="isLoading"
      :single-line="false"
      :scroll-x="1500"
      size="small"
      striped />
  </NaiveMobileTableAdapter>
  <n-modal
    v-model:show="dialogVisible"
    :loading="isProceeding"
    preset="dialog"
    style="width: 1200px"
    :bordered="false"
    :show-icon="false"
    :mask-closable="false"
    :title="currentEditItem ? t('editAd') : t('addAd')"
    :positive-text="t('validate')"
    :negative-text="t('cancel')"
    @positive-click="submit"
    @negative-click="dialogVisible = false">
    <n-form
      ref="formRef"
      class="mt-5"
      :model="formValue"
      :rules="rules"
      :show-require-mark="false"
      size="medium">
      <n-grid cols="24" :x-gap="12">
        <n-gi span="12">
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
              type="textarea"
              class="w-full"
              :rows="3"
              sync />
          </n-form-item>
          <n-form-item :label="t('broadcastPeriod')" path="broadcastPeriod">
            <n-date-picker
              v-model:formatted-value="broadcastPeriod"
              value-format="yyyy-MM-dd HH:mm:ss"
              format="dd MMMM yyyy"
              type="daterange"
              class="w-full" />
          </n-form-item>
          <n-grid x-gap="12" :span="24">
            <n-form-item-gi :span="12" :label="t('identifier')" path="pid">
              <n-select
                v-model:value="formValue.pid"
                :render-label="renderAdIdSelectLabel"
                :options="
                  adIdentifiers.map((adId) => {
                    return {
                      ...adId,
                      disabled: !adId.reusable && (adId.adsCount || 0) > 0,
                    }
                  })
                "
                :placeholder="t('identifier')"
                placement="bottom"
                label-field="id"
                value-field="id"
                class="w-full"
                filterable
                @update:value="
                  () => {
                    params = adIdentifiers.find(
                      (i) => i.id == formValue.pid
                    )?.params
                  }
                " />
            </n-form-item-gi>
            <n-form-item-gi :span="12" :label="t('status')" path="display">
              <n-radio-group
                v-model:value="formValue.display"
                name="display"
                class="w-full">
                <n-radio-button
                  :value="false"
                  :label="t('hidden')"
                  class="w-[50%]" />
                <n-radio-button
                  :value="true"
                  :label="t('visible')"
                  class="w-[50%]" />
              </n-radio-group>
            </n-form-item-gi>
          </n-grid>
        </n-gi>
        <n-gi span="12">
          <n-form-item :label="t('content')" path="content">
            <template v-if="contentType == AdContentType.VIDEO">
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
                  :value="
                    formValue.content ? filenameFromUrl(formValue.content) : ''
                  "
                  :placeholder="t('videoname')"
                  :style="{ width: '50%' }"
                  readonly />
                <template v-if="formValue.content">
                  <n-button
                    type="primary"
                    ghost
                    @click="
                  () => {
                    videoReaderTitle = t('video')
                    videoReaderUrl = fileUrl(formValue.content as string)
                    showVideoReaderDialog = true
                  }
                ">
                    <template #icon>
                      <n-icon>
                        <Icon icon="carbon:play-filled" />
                      </n-icon>
                    </template>
                    {{ t('play') }}
                  </n-button>
                  <n-button
                    type="primary"
                    ghost
                    @click="
                      () => {
                        formValue.content = ''
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
            <template v-else>
              <div class="w-full flex flex-gap-8 items-center justify-start">
                <div
                  class="cursor-pointer w-full h-[150px]"
                  @click="
                    () => {
                      imagePickerVisible = true
                    }
                  ">
                  <n-image
                    v-if="formValue.content"
                    object-fit="cover"
                    preview-disabled
                    class="p-1 content-image"
                    :style="
                      'border: 1px dashed ' + pickByTheme('green', 'white')
                    "
                    :src="fileUrl(formValue.content || '')">
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
            </template>
          </n-form-item>
          <n-form-item
            v-if="params && Array.isArray(params)"
            :label="t('data')"
            path="data">
            <n-grid x-gap="12" y-gap="12" :span="24" class="w-full">
              <template v-for="(param, i) in params" :key="i">
                <n-gi :span="10">
                  <n-input
                    :value="param"
                    :placeholder="param"
                    class="w-full"
                    readonly />
                </n-gi>
                <n-gi :span="14">
                  <n-input
                    v-model:value="formValue.data[param]"
                    class="w-full" />
                </n-gi>
              </template>
            </n-grid>
          </n-form-item>
        </n-gi>
      </n-grid>
    </n-form>
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
      formValue.content = path
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
      formValue.content = path
      videoPickerVisible = false
    }" />
  <Identifiers v-model:show="identifiersDialogVisible" />
</template>

<style scoped lang="scss">
  .n-image {
    width: 100%;
  }

  :deep(.content-image img) {
    width: 100%;
    height: 150px;
  }
</style>

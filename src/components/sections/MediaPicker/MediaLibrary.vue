<script setup lang="ts">
  import { reformatDate } from '@/utils/chronos'
  import {
    blobToDataURL,
    compressImage,
    dataUrlToFile,
    generateCustomId,
    humanFileSize,
  } from '@/utils/functions'

  import { MediaFileType } from '@/enums/media-file-type'

  import { MediaFileModel } from '@/models/media-file'

  import { SelectOption } from 'naive-ui'

  import { VNodeChild } from 'vue'

  import { propsKey } from './types'

  const props = inject(propsKey)

  const emits = defineEmits(['validate'])

  const { t, locale } = useI18n()

  const { request } = useApi()

  const loadingBar = useLoadingBar()
  const message = useMessage()
  const dialog = useDialog()

  const { mediaFileTypes } = useMediaLibrary()

  const refreshKey = ref(uuidv4())
  const isProceeding = ref(false)
  const isLoading = ref(false)
  const nbMediaFiles = ref(0)
  const search = ref<string>('')
  const searchInputRef = ref(null)
  const mediaFiles = ref<MediaFileModel[]>([])
  const nbMediaFileTypes = ref<Record<number, number>>({
    [MediaFileType.DOCUMENT]: 0,
    [MediaFileType.IMAGE]: 0,
    [MediaFileType.VIDEO]: 0,
    [MediaFileType.AUDIO]: 0,
    [MediaFileType.OTHER]: 0,
  })
  const selectAll = ref(false)

  const months = ref<{ value: string; label: string }[]>([])

  // Filter data
  const filteredMediaFileTypes = computed(() => {
    return mediaFileTypes.filter(
      (type) =>
        (type.value == MediaFileType.DOCUMENT && props?.displayDocuments) ||
        (type.value == MediaFileType.IMAGE && props?.displayImages) ||
        (type.value == MediaFileType.VIDEO && props?.displayVideos) ||
        (type.value == MediaFileType.AUDIO && props?.displayAudios) ||
        (type.value == MediaFileType.OTHER && props?.displayOtherTypes)
    )
  })

  const filterMonths = ref<string[]>([])
  const filterType = ref<number>(
    mediaFileTypes.length === filteredMediaFileTypes.value.length
      ? 0
      : filteredMediaFileTypes.value[0].value
  )

  const buildPath = (part: string) => {
    let path = `${part}&query=${search.value}&type=${filterType.value}`

    for (const month of filterMonths.value) {
      path += `&months[]=${month}`
    }

    return path
  }

  const renderMonthSelectLabel = (option: SelectOption): VNodeChild => {
    return h(
      'span',
      {},
      {
        default: () =>
          reformatDate(option.label as unknown as string, {
            inPattern: 'YYYY-MM',
            outPattern: 'MMMM YYYY',
            locale: locale.value,
          }),
      }
    )
  }

  // Pagination

  const total = ref(0)
  const pageSize = ref(12)
  const currentPage = ref(1)

  const handlePageChange = (value: number) => {
    init(buildPath(`/media-files?pageSize=${pageSize.value}&page=${value}`))
  }

  const handlePageSizeChange = (value: number) => {
    pageSize.value = value
    init(buildPath(`/media-files?pageSize=${pageSize.value}`))
  }

  const init = async (url: string | null = null, loadAllData = false) => {
    isLoading.value = true
    loadingBar.start()

    const task = await request({
      url: url ? url : buildPath(`/media-files?pageSize=${pageSize.value}`),
    })

    if (task.success && task.result) {
      mediaFiles.value = task.result.data?.mediaFiles || []

      total.value = task.result.data?.meta?.total || 0
      currentPage.value = task.result.data?.meta?.currentPage || 1
    }

    if (loadAllData) {
      const task1 = await request({
        url: `/media-files/list/months`,
      })

      if (task1.success && task1.result) {
        months.value = (task1.result.data || []).map((item: string) => ({
          label: item,
          value: item,
        }))
      }

      const task2 = await request({
        url: `/count/media-files`,
      })

      if (task2.success && task2.result) {
        nbMediaFiles.value = task2.result.data
      }

      const task3 = await request({
        url: `/count/media-files/type/${MediaFileType.IMAGE}`,
      })

      if (task3.success && task3.result) {
        nbMediaFileTypes.value[MediaFileType.IMAGE] = task3.result.data
      }

      const task4 = await request({
        url: `/count/media-files/type/${MediaFileType.VIDEO}`,
      })

      if (task4.success && task4.result) {
        nbMediaFileTypes.value[MediaFileType.VIDEO] = task4.result.data
      }

      const task5 = await request({
        url: `/count/media-files/type/${MediaFileType.AUDIO}`,
      })

      if (task5.success && task5.result) {
        nbMediaFileTypes.value[MediaFileType.AUDIO] = task5.result.data
      }

      const task6 = await request({
        url: `/count/media-files/type/${MediaFileType.OTHER}`,
      })

      if (task6.success && task6.result) {
        nbMediaFileTypes.value[MediaFileType.OTHER] = task6.result.data
      }

      const task7 = await request({
        url: `/count/media-files/type/${MediaFileType.DOCUMENT}`,
      })

      if (task7.success && task7.result) {
        nbMediaFileTypes.value[MediaFileType.DOCUMENT] = task7.result.data
      }

      // Load preselected items
      if (
        props?.preselectedMediaList &&
        Array.isArray(props?.preselectedMediaList)
      ) {
        const task8 = await request({
          url: `/media-files/list`,
          method: 'post',
          data: {
            ids: props?.preselectedMediaList,
          },
        })

        if (task8.success && task8.result) {
          selectedItemsData.value = task8.result.data

          selectedItems.value = {}
          for (const item of selectedItemsData.value) {
            if (item.id) selectedItems.value[item.id] = true
          }
        }
      }
    }

    // Select all, default value
    let allSelected = true
    if (mediaFiles.value.length === 0) allSelected = false
    for (const mediaFile of mediaFiles.value) {
      if (mediaFile.id && !selectedItems.value[mediaFile.id]) {
        allSelected = false
        break
      }
    }

    selectAll.value = allSelected

    refreshKey.value = uuidv4()

    loadingBar.finish()
    isLoading.value = false
  }

  init(null, true)

  // Delete item

  const deleteItem = async (item: MediaFileModel) => {
    dialog.warning({
      title: t('confirm'),
      content: t('confirmDeleteMediaFile'),
      positiveText: t('yes'),
      negativeText: t('no'),
      onPositiveClick: async () => {
        const task = await request({
          method: 'delete',
          url: `/media-files/${item.id}`,
        })

        if (task.success) {
          message.success(t('success'))

          init(
            buildPath(
              `/media-files?pageSize=${pageSize.value}&page=${currentPage.value}`
            ),
            true
          )
        } else message.error(t('anErrorOccurred'))
      },
    })
  }

  // Copy item url

  const { copy, copied, isSupported: isCopySupported } = useClipboard()

  const copyItemUrl = async (item: MediaFileModel) => {
    if (item.url) copy(item.url)
  }

  watch(
    () => copied.value,
    (nv) => {
      if (nv) {
        message.success(t('mediaLinkCopied'))
      }
    }
  )

  // Show item preview

  const currentPreviewItem = ref<MediaFileModel | null>(null)
  const showAudioReaderDialog = ref(false)
  const showVideoReaderDialog = ref(false)

  const showItemPreview = async (item: MediaFileModel) => {
    currentPreviewItem.value = item

    switch (item.type) {
      case MediaFileType.IMAGE:
        //
        break
      case MediaFileType.VIDEO:
        showVideoReaderDialog.value = true
        break
      case MediaFileType.AUDIO:
        showAudioReaderDialog.value = true
        break
      case MediaFileType.DOCUMENT:
        window.open(item.url)
        break
      default:
        message.info(t('cannotOpenThisFile'))
        break
    }
  }

  // Show item details

  const currentDetailsItem = ref<MediaFileModel | null>(null)
  const showItemDetailsDialog = ref(false)

  const showItemDetails = async (item: MediaFileModel) => {
    currentDetailsItem.value = item
    showItemDetailsDialog.value = true
  }

  // Edit item

  const currentEditorDataUrl = ref<string | null>(null)
  const currentEditorItem = ref<MediaFileModel | null>(null)
  const showItemEditorDialog = ref(false)

  const showItemEditor = async (item: MediaFileModel) => {
    currentEditorItem.value = item

    loadingBar.start()

    const task = await request({
      url: `/file/download`,
      method: 'post',
      data: {
        path: item.path,
      },
      responseType: 'blob',
    })

    if (task.success && task.result) {
      currentEditorDataUrl.value = await blobToDataURL(task.result)
    }

    loadingBar.finish()

    showItemEditorDialog.value = true
  }

  const storeEditedImage = async (result: any, dataUrl: any) => {
    var file = dataUrlToFile(dataUrl)
    file = await compressImage(file, { maxSizeMB: 1 })
    const formData = new FormData()
    formData.append('file', file)

    dialog.warning({
      title: t('registration'),
      content: t('confirmReplaceCurrentFile'),
      positiveText: t('yes'),
      negativeText: t('no'),
      onPositiveClick: async () => {
        isProceeding.value = true
        loadingBar.start()

        if (currentEditorItem.value) {
          formData.append('filename', currentEditorItem.value?.name)
        }

        const task = await request({
          url: `/media-files/replace/${currentEditorItem.value?.id}`,
          method: 'post',
          data: formData,
        })

        if (task.success && task.result) {
          showItemEditorDialog.value = false
          init(
            buildPath(
              `/media-files?pageSize=${pageSize.value}&page=${currentPage.value}`
            ),
            true
          )
        } else message.error(t('anErrorOccurred'))

        loadingBar.finish()
        isProceeding.value = false
      },
      onNegativeClick: async () => {
        isProceeding.value = true
        loadingBar.start()

        if (currentEditorItem.value) {
          formData.append(
            'filename',
            generateCustomId(6) + '-' + currentEditorItem.value?.name
          )
        }

        const task = await request({
          url: '/media-files/upload',
          method: 'post',
          data: formData,
        })

        if (task.success && task.result) {
          showItemEditorDialog.value = false
          init(
            buildPath(
              `/media-files?pageSize=${pageSize.value}&page=${currentPage.value}`
            ),
            true
          )
        } else message.error(t('anErrorOccurred'))

        loadingBar.finish()
        isProceeding.value = false
      },
    })
  }

  // Multiselect
  const selectedItems = ref<Record<number, boolean>>({})
  const selectedItemsData = ref<MediaFileModel[]>([])

  const checkedItemsNumber = computed(() => {
    let count = 0

    for (const key in selectedItems.value) {
      if (selectedItems.value[key]) count++
    }

    return count
  })

  const checkboxVisible = (item: MediaFileModel) => {
    const isSingleSelection = !props?.selectionMultiple
    const isUnlimitedMultipleSelection =
      props?.selectionMultiple && !props?.selectionLimit
    const isLimitedMultipleSelectionUnderLimit =
      props?.selectionMultiple &&
      props?.selectionLimit &&
      selectedItemsData.value.length < props?.selectionLimit
    const isItemIncludedInMultipleSelection =
      props?.selectionMultiple &&
      props?.selectionLimit &&
      item.id &&
      selectedItems.value[item.id]

    return (
      isSingleSelection ||
      isUnlimitedMultipleSelection ||
      isItemIncludedInMultipleSelection ||
      isLimitedMultipleSelectionUnderLimit
    )
  }

  // Validate selection

  const validateSelection = () => {
    let arr: any = selectedItemsData.value

    if (props?.selectionType == 'url') {
      arr = selectedItemsData.value.map((item) => item.url)
    } else if (props?.selectionType == 'path') {
      arr = selectedItemsData.value.map((item) => item.path)
    }

    emits('validate', props?.selectionMultiple ? arr : arr[0])
  }

  // Cancel selection

  const cancelSelection = () => {
    selectedItems.value = {}
    selectedItemsData.value = []

    init(
      buildPath(
        `/media-files?pageSize=${pageSize.value}&page=${currentPage.value}`
      )
    )
  }

  // Delete selection

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
                url: `/media-files/${key}`,
                method: 'delete',
              })
            }
          }

          loadingBar.finish()
          isProceeding.value = false

          message.success(t('success'))

          selectedItems.value = {}
          selectedItemsData.value = []

          init(null, true)
        },
      })
    } else message.warning(t('noItemSelected'))

    return false
  }
</script>

<template>
  <section class="px-10">
    <MountedTeleport to="#actions">
      <section v-if="checkedItemsNumber > 0" class="flex items-center gap-3">
        <span>{{ t('nbItemsSelected', [checkedItemsNumber]) }}</span>
        <n-button type="success" size="small" @click="validateSelection">
          <template #icon>
            <n-icon>
              <Icon icon="mdi:check" />
            </n-icon>
          </template>
          {{ t('validateSelection') }}
        </n-button>
        <n-button type="error" size="small" @click="deleteSelection">
          <template #icon>
            <n-icon>
              <Icon icon="carbon:trash-can" />
            </n-icon>
          </template>
          {{ t('deleteSelection') }}
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
      <section v-else class="flex items-center gap-3">
        <n-select
          v-model:value="filterMonths"
          :render-label="renderMonthSelectLabel"
          :options="(months as any[])"
          :placeholder="t('months')"
          max-tag-count="responsive"
          filterable
          multiple
          label-field="label"
          value-field="value"
          class="!w-[200px]"
          @update:value="init()">
          <template #action>
            <n-checkbox
              size="large"
              class="w-full"
              :default-checked="
                months.length && filterMonths.length === months.length
              "
              @update:checked="
            (checked: boolean) => {
              if (checked) {
                filterMonths = months.map((m) => m.value)
              } else {
                filterMonths = []
              }

              init()
            }
          ">
              {{ t('selectAll') }}
            </n-checkbox>
          </template>
        </n-select>
        <n-input-group class="!w-[250px]">
          <n-input
            ref="searchInputRef"
            v-model:value="search"
            :clearable="true"
            :placeholder="t('search')"
            @update:value="(value: string) => {
            if (!value) {
              init(buildPath(`/media-files?pageSize=${pageSize}&page=${currentPage}`))
            }
          }" />
          <n-button
            type="primary"
            @click="
              init(
                buildPath(
                  `/media-files?pageSize=${pageSize}&page=${currentPage}`
                )
              )
            ">
            <template #icon>
              <n-icon>
                <Icon icon="carbon:search" />
              </n-icon>
            </template>
          </n-button>
        </n-input-group>
      </section>
    </MountedTeleport>
    <n-card size="small" class="mb-5">
      <div class="flex justify-between items-center">
        <div class="flex items-center gap-3">
          <n-checkbox
            v-if="props?.selectionMultiple && !props?.selectionLimit"
            v-model:checked="selectAll"
            @update:checked="(checked: boolean) => {
                for (const item of mediaFiles) {
                  if (item.id) {
                    selectedItems[item.id] = checked
                    if (selectedItemsData.findIndex(i => i.id == item.id) === -1) {
                      selectedItemsData.push(item)
                    }
                  }
                }

                refreshKey = uuidv4()
            }">
            {{ t('selectAll') }}
          </n-checkbox>
        </div>
        <n-radio-group
          v-model:value="filterType"
          name="filtertyperadiobuttongroup"
          size="medium"
          @update:value="init()">
          <n-radio-button
            v-if="mediaFileTypes.length === filteredMediaFileTypes.length"
            :value="0">
            {{ t('all') }}&nbsp;
            <span v-if="nbMediaFiles"> ({{ nbMediaFiles }}) </span>
          </n-radio-button>
          <n-radio-button
            v-for="mediaFileType in filteredMediaFileTypes"
            :key="mediaFileType.value"
            :value="mediaFileType.value">
            {{ mediaFileType.label }}&nbsp;
            <span v-if="nbMediaFileTypes[mediaFileType.value]">
              ({{ nbMediaFileTypes[mediaFileType.value] }})
            </span>
          </n-radio-button>
        </n-radio-group>
      </div>
    </n-card>
    <n-card embedded class="py-2">
      <section v-if="mediaFiles.length && !isLoading">
        <n-image-group show-toolbar-tooltip>
          <n-grid x-gap="12" y-gap="12" cols="1 400:2 600:4 900:4 1400:6">
            <n-gi v-for="(item, i) in mediaFiles" :key="i">
              <CustomTransition name="slide-fade" appear>
                <n-card bordered hoverable>
                  <template #cover>
                    <div
                      class="flex items-center justify-center h-[200px] relative">
                      <template v-if="item.type == MediaFileType.IMAGE">
                        <n-image
                          v-if="item.url"
                          :src="item.url"
                          object-fit="cover"
                          class="w-full h-[200px]" />
                      </template>
                      <template v-else-if="item.type == MediaFileType.VIDEO">
                        <n-icon size="96">
                          <Icon icon="carbon:document-video" />
                        </n-icon>
                      </template>
                      <template v-else-if="item.type == MediaFileType.AUDIO">
                        <n-icon size="96">
                          <Icon icon="carbon:document-audio" />
                        </n-icon>
                      </template>
                      <template v-else-if="item.type == MediaFileType.DOCUMENT">
                        <n-icon size="96">
                          <Icon icon="carbon:document" />
                        </n-icon>
                      </template>
                      <template v-else>
                        <n-icon size="96">
                          <Icon icon="carbon:document-unknown" />
                        </n-icon>
                      </template>
                    </div>
                  </template>
                  <template #header>
                    <div class="text-center text-dimgray text-sm">
                      <n-ellipsis :line-clamp="1">
                        <template v-if="item.id">
                          <n-checkbox
                            v-if="checkboxVisible(item)"
                            :key="refreshKey"
                            v-model:checked="selectedItems[item.id]"
                            class="mr-1"
                            @update:checked="(checked: boolean) => {
                            if (props?.selectionMultiple) {
                              if (checked) {
                                if (selectedItemsData.findIndex(i => i.id == item.id) === -1) {
                                  selectedItemsData.push(item)
                                }
                              } else {
                                selectedItemsData = selectedItemsData.filter(i => i.id != item.id)
                              }
                            } else if (item && item.id) {
                              selectedItemsData = [item]
                              selectedItems = { [item.id]: checked }
                            }

                            refreshKey = uuidv4()
                          }" />
                        </template>
                        {{ item.name }}
                      </n-ellipsis>
                    </div>
                  </template>
                  <template #action>
                    <n-space justify="space-between" align="center">
                      <div class="flex items-center gap-2">
                        <n-button
                          v-if="item.type != MediaFileType.IMAGE"
                          ternary
                          circle
                          :title="t('preview')"
                          @click="showItemPreview(item)">
                          <template #icon>
                            <n-icon>
                              <Icon
                                v-if="
                                  [
                                    MediaFileType.AUDIO,
                                    MediaFileType.VIDEO,
                                  ].includes(item.type)
                                "
                                icon="mdi:play" />
                              <Icon v-else icon="carbon:content-view" />
                            </n-icon>
                          </template>
                        </n-button>
                        <n-button
                          ternary
                          circle
                          :title="t('details')"
                          @click="showItemDetails(item)">
                          <template #icon>
                            <n-icon>
                              <Icon icon="mdi:information-variant-circle" />
                            </n-icon>
                          </template>
                        </n-button>
                      </div>
                      <div class="flex items-center gap-2">
                        <n-button
                          v-if="isCopySupported"
                          ternary
                          circle
                          :title="t('copy')"
                          @click="copyItemUrl(item)">
                          <template #icon>
                            <n-icon><Icon icon="carbon:copy" /></n-icon>
                          </template>
                        </n-button>
                        <n-button
                          v-if="item.type == MediaFileType.IMAGE"
                          ternary
                          circle
                          :title="t('edit')"
                          @click="showItemEditor(item)">
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
                      </div>
                    </n-space>
                  </template>
                </n-card>
              </CustomTransition>
            </n-gi>
          </n-grid>
        </n-image-group>
        <n-pagination
          v-model:page="currentPage"
          class="mt-10 justify-center"
          show-size-picker
          :page-size="pageSize"
          :page-sizes="[8, 12, 24, 36, 48, 60]"
          :page-count="Math.ceil(total / pageSize)"
          @update:page="handlePageChange"
          @update:page-size="handlePageSizeChange" />
      </section>
      <section v-else-if="isLoading" class="flex items-center justify-center">
        <n-spin size="medium" />
      </section>
      <n-empty v-else :description="t('noMediaFile')" class="my-10"> </n-empty>
    </n-card>
  </section>
  <n-modal
    v-model:show="showAudioReaderDialog"
    preset="card"
    style="width: 500px"
    :bordered="false"
    :mask-closable="false"
    :close-on-esc="false"
    :title="currentPreviewItem?.name">
    <audio id="music" preload="all" autoplay controls style="width: 100%">
      <source :src="currentPreviewItem?.url" />
    </audio>
  </n-modal>
  <n-modal
    v-model:show="showVideoReaderDialog"
    preset="card"
    style="width: 600px"
    :bordered="false"
    :mask-closable="false"
    :close-on-esc="false"
    :title="currentPreviewItem?.name">
    <video id="video" autoplay controls style="width: 100%">
      <source :src="currentPreviewItem?.url" />
    </video>
  </n-modal>
  <n-modal
    v-model:show="showItemDetailsDialog"
    preset="card"
    style="width: 600px"
    :bordered="false"
    :mask-closable="false"
    :close-on-esc="false"
    :title="currentDetailsItem?.name">
    <n-table
      v-if="currentDetailsItem"
      striped
      :single-line="false"
      size="small">
      <tbody>
        <tr>
          <td class="w-[30%]">{{ t('name') }}</td>
          <td>{{ currentDetailsItem.name }}</td>
        </tr>
        <tr>
          <td>{{ t('link') }}</td>
          <td>
            <small>{{ currentDetailsItem.url }}</small>
          </td>
        </tr>
        <tr>
          <td>{{ t('type') }}</td>
          <td>
            <span v-if="currentDetailsItem.type == MediaFileType.IMAGE">{{
              t('image')
            }}</span>
            <span v-else-if="currentDetailsItem.type == MediaFileType.VIDEO">{{
              t('video')
            }}</span>
            <span v-else-if="currentDetailsItem.type == MediaFileType.AUDIO">{{
              t('audio')
            }}</span>
            <span
              v-else-if="currentDetailsItem.type == MediaFileType.DOCUMENT"
              >{{ t('document') }}</span
            >
            <span v-else>{{ t('other') }}</span>
          </td>
        </tr>
        <tr v-if="currentDetailsItem.size">
          <td>{{ t('size') }}</td>
          <td>{{ humanFileSize(currentDetailsItem.size, true) }}</td>
        </tr>
        <tr v-if="currentDetailsItem.mimeType">
          <td>{{ t('mimeType') }}</td>
          <td>{{ currentDetailsItem.mimeType }}</td>
        </tr>
        <tr v-if="currentDetailsItem.sender">
          <td>{{ t('sendBy') }}</td>
          <td>{{ currentDetailsItem.sender.fullname }}</td>
        </tr>
        <tr v-if="currentDetailsItem.title">
          <td>{{ t('title') }}</td>
          <td>{{ currentDetailsItem.title }}</td>
        </tr>
        <tr v-if="currentDetailsItem.description">
          <td>{{ t('description') }}</td>
          <td>
            <small>
              {{ currentDetailsItem.description }}
            </small>
          </td>
        </tr>
        <tr v-if="currentDetailsItem.createdAt">
          <td>{{ t('date') }}</td>
          <td>{{ reformatDate(currentDetailsItem.createdAt) }}</td>
        </tr>
        <tr v-if="currentDetailsItem.additionalMetadata">
          <td>{{ t('metadata') }}</td>
          <td>
            <n-table striped single-line size="small">
              <tbody>
                <tr
                  v-for="(
                    value, key
                  ) in currentDetailsItem.additionalMetadata || []"
                  :key="key">
                  <td>{{ key }}</td>
                  <td>{{ value }}</td>
                </tr>
              </tbody>
            </n-table>
          </td>
        </tr>
      </tbody>
    </n-table>
  </n-modal>
  <n-modal
    v-model:show="showItemEditorDialog"
    preset="card"
    style="width: 600px"
    :bordered="false"
    :mask-closable="false"
    :close-on-esc="false"
    :title="currentEditorItem?.name">
    <ImageEditor
      :cropper-ratio="undefined"
      :round-preview="false"
      :src="currentEditorDataUrl ? currentEditorDataUrl : undefined"
      @cancel="showItemEditorDialog = false"
      @save="storeEditedImage" />
  </n-modal>
</template>

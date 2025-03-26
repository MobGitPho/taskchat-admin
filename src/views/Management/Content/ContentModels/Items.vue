<script setup lang="ts">
  import contentModelThumbnail from '@/assets/images/content-model-thumbnail.svg'

  import { ResponseErrorCode } from '@/enums/response-error-code'

  import { ContentModelModel } from '@/models/content-model'
  import { ContentModelItemModel } from '@/models/content-model-item'

  import DataForm from './DataForm.vue'
  import Links from './Links.vue'

  const { t } = useI18n()
  const { request } = useApi()
  const { extractItemTitle } = useContent()
  const { tr, displayFormErrors } = useHelper()

  const dialog = useDialog()
  const message = useMessage()
  const loadingBar = useLoadingBar()

  const contentModel = defineModel<ContentModelModel | null>()

  const isLoading = ref<boolean>(false)
  const isProceeding = ref<boolean>(false)
  const dialogVisible = ref<boolean>(false)
  const linksDialogVisible = ref<boolean>(false)
  const items = ref<ContentModelItemModel[]>([])

  // Pagination

  const total = ref(0)
  const pageSize = ref(12)
  const currentPage = ref(1)

  const requestUrl = computed(() => {
    return `/content-model/items?pageSize=${pageSize.value}&contentModelId=${contentModel.value?.id}`
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
      items.value = task.result.data?.items || []

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

  // Add & Edit item

  const currentEditItem = ref<ContentModelItemModel | null>(null)
  const formValue = ref<ContentModelItemModel>({
    title: '',
    contentModelData: '',
    isActive: true,
  })

  const openFormModal = (item: ContentModelItemModel | null) => {
    currentEditItem.value = _.cloneDeep(item)

    if (item) {
      formValue.value = _.cloneDeep(item)
    } else {
      formValue.value = {
        title: '',
        contentModelData: '',
        isActive: true,
      }
    }

    dialogVisible.value = true
  }

  const openLinksModal = (item: ContentModelItemModel) => {
    currentEditItem.value = _.cloneDeep(item)

    linksDialogVisible.value = true
  }

  const reopenLinksModal = async (id: number) => {
    await init()

    const newItem = items.value.find((item) => item.id === id)

    if (newItem) openLinksModal(newItem)
  }

  const deleteItem = async (item: ContentModelItemModel) => {
    dialog.warning({
      title: t('confirm'),
      content: t('confirmDeleteItem'),
      positiveText: t('yes'),
      negativeText: t('no'),
      onPositiveClick: async () => {
        const task = await request({
          method: 'delete',
          url: `/content-model/items/${item.id}`,
        })

        if (task.success) {
          message.success(t('success'))

          init()
        } else message.error(t('anErrorOccurred'))
      },
    })
  }

  const submit = async (contentModelData: any) => {
    loadingBar.start()
    isProceeding.value = true

    const data = {
      title: formValue.value.title,
      contentModelData: contentModelData,
      isActive: formValue.value.isActive,
      contentModelId: contentModel.value?.id,
    } as ContentModelItemModel

    const task = await request({
      method: currentEditItem.value ? 'put' : 'post',
      url: currentEditItem.value
        ? `/content-model/items/${currentEditItem.value.id}`
        : '/content-model/items',
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

      init(`${requestUrl.value}&page=${currentPage.value}`)

      dialogVisible.value = false
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
                url: `/content-model/items/${key}`,
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

  // Provide
  provide('currentEditItem', currentEditItem)
</script>

<template>
  <MountedTeleport to="#alt-action">
    <n-space align="center">
      <n-checkbox
        v-model:checked="selectAll"
        :disabled="!items.length"
        @update:checked="(checked: boolean) => {
            for (const item of items) {
              if (item.id) selectedItems[item.id] = checked
            }
            refreshKey = uuidv4()
        }">
        {{ t('selectAll') }}
      </n-checkbox>
      <n-button type="primary" @click="openFormModal(null)">
        <template #icon>
          <n-icon size="18">
            <Icon icon="carbon:add-alt" />
          </n-icon>
        </template>
        {{ t('addItem') }}
      </n-button>
    </n-space>
  </MountedTeleport>
  <n-page-header class="mt-2 mb-5" @back="contentModel = null">
    <template #title>
      {{ tr(contentModel?.title) }}
    </template>
    <template #back>
      <n-icon>
        <Icon icon="ic:baseline-arrow-back-ios" />
      </n-icon>
    </template>
    <template #extra>
      <section
        v-if="checkedItemsNumber > 0"
        class="w-full flex items-center justify-between gap-4">
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
                <Icon icon="carbon:close-filled" />
              </n-icon>
            </template>
            {{ t('cancelSelection') }}
          </n-button>
        </section>
      </section>
    </template>
  </n-page-header>
  <section v-if="items.length && !isLoading">
    <n-grid x-gap="12" y-gap="12" cols="1 400:2 600:3 900:3 1400:4 1800:5">
      <n-gi v-for="(item, i) in items" :key="i">
        <CustomTransition name="slide-fade" appear>
          <n-card size="small" bordered hoverable>
            <template #cover>
              <div class="flex items-center justify-center h-full">
                <img
                  :src="contentModel?.imageUrl ?? contentModelThumbnail"
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
                  {{ extractItemTitle(item, contentModel) }}
                </n-ellipsis>
              </div>
            </template>
            <template #action>
              <n-space justify="space-between" align="center">
                <n-tag
                  :bordered="false"
                  :type="item.isActive ? 'success' : 'error'">
                  {{ item.isActive ? t('visible') : t('hidden') }}
                </n-tag>
                <n-space>
                  <n-button
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
                    :title="t('links')"
                    @click="openLinksModal(item)">
                    <template #icon>
                      <n-icon><Icon icon="carbon:link" /></n-icon>
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
        {{ `${total} ${t('item_s')}` }}
      </template>
    </n-pagination>
  </section>
  <section v-else-if="isLoading" class="flex items-center justify-center">
    <n-spin size="medium" />
  </section>
  <n-empty v-else :description="t('noItemAdded')" class="my-16"> </n-empty>
  <DataForm
    v-model:show="dialogVisible"
    v-model:data="formValue"
    :content-model="contentModel"
    :submit-data="submit" />
  <Links v-model:show="linksDialogVisible" @update="reopenLinksModal" />
</template>

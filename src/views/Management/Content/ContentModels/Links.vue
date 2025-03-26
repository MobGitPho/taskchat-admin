<script lang="ts" setup>
  import { ResponseErrorCode } from '@/enums/response-error-code'

  import { ContentModelItemModel } from '@/models/content-model-item'

  import {
    FormInst,
    FormRules,
    FormValidationError,
    SelectOption,
  } from 'naive-ui'

  import { VNodeChild } from 'vue'

  const { t } = useI18n()
  const { request } = useApi()
  const { pickByTheme, tr, displayFormErrors, mergeArrays } = useHelper()
  const { extractItemTitle } = useContent()

  const { loadContentModels } = useContentStore()
  const { contentModels } = storeToRefs(useContentStore())
  const { isLightTheme } = storeToRefs(useUserInterfaceStore())

  const dialog = useDialog()
  const message = useMessage()
  const loadingBar = useLoadingBar()

  const emits = defineEmits(['update'])

  loadContentModels()

  const dialogVisible = defineModel<boolean>('show', {
    default: false,
    required: true,
  })

  const isLoading = ref(false)

  const currentEditItem =
    inject<Ref<ContentModelItemModel | null>>('currentEditItem')

  const deleteLink = async (item: ContentModelItemModel) => {
    dialog.warning({
      title: t('confirm'),
      content: t('confirmDeleteLink'),
      positiveText: t('yes'),
      negativeText: t('no'),
      onPositiveClick: async () => {
        loadingBar.start()

        const task = await request({
          method: 'put',
          url: `/content-model/items/${currentEditItem?.value?.id}`,
          data: {
            relatedItems: currentEditItem?.value?.relatedItems
              ?.filter((i) => i.id !== item.id)
              ?.map((i) => i.id),
          },
        })

        if (task.success) {
          message.success(t('success'))

          emits('update', currentEditItem?.value?.id)
        } else message.error(t('anErrorOccurred'))

        loadingBar.finish()
      },
    })
  }

  const contentModel = (item: ContentModelItemModel) => {
    return contentModels.value?.find(
      (contentModel) => contentModel.id === item.contentModelId
    )
  }

  const nestedDialogVisible = ref(false)
  const formRef = ref<FormInst | null>(null)
  const formValue = ref<{
    contentModelId: number | null
    itemId: number | null
  }>({
    contentModelId: null,
    itemId: null,
  })
  const rules: FormRules = {
    contentModelId: [
      {
        required: true,
        message: t('fillRequired'),
      },
    ],
    itemId: [
      {
        required: true,
        message: t('fillRequired'),
      },
    ],
  }

  const submit = async () => {
    formRef.value?.validate(
      async (errors: Array<FormValidationError> | undefined) => {
        if (!errors) {
          loadingBar.start()
          isLoading.value = true

          const ids =
            currentEditItem?.value?.relatedItems?.map((i) => i.id) || []

          const task = await request({
            method: 'put',
            url: `/content-model/items/${currentEditItem?.value?.id}`,
            data: {
              relatedItems: [...ids, formValue.value.itemId],
            },
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

            emits('update', currentEditItem?.value?.id)

            nestedDialogVisible.value = false
          }

          isLoading.value = false
          loadingBar.finish()
        }
      }
    )

    return false
  }

  const renderContentModelLabel = (option: SelectOption) => {
    return h(
      'span',
      {},
      {
        default: () => tr(option.title),
      }
    )
  }

  const renderContentModelItemLabel = (
    option: ContentModelItemModel
  ): ComputedRef<VNodeChild> => {
    return computed(() =>
      h(
        'span',
        {},
        {
          default: () => extractItemTitle(option, contentModel(option)),
        }
      )
    )
  }

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
    return (
      mergeArrays(
        contentModelItemsList.value,
        contentModelItemsFound.value,
        'id'
      ) as ContentModelItemModel[]
    ).filter((item) => item.id !== currentEditItem?.value?.id)
  })
</script>

<template>
  <n-modal
    v-model:show="dialogVisible"
    preset="card"
    style="width: 650px"
    :bordered="false"
    :show-icon="false"
    :mask-closable="false"
    :closable="false"
    :title="t('linkContentModelItems')">
    <template #header-extra>
      <n-space align="center">
        <n-button
          size="small"
          type="primary"
          :disabled="isLoading"
          @click="nestedDialogVisible = true">
          <Icon icon="carbon:add-alt" class="mr-1"></Icon>
          {{ t('add') }}
        </n-button>
        <n-button
          size="small"
          type="error"
          :disabled="isLoading"
          @click="dialogVisible = false">
          <Icon icon="carbon:close" class="mr-1"></Icon>
          {{ t('close') }}
        </n-button>
      </n-space>
    </template>
    <n-spin :show="isLoading">
      <n-scrollbar
        v-if="currentEditItem?.relatedItems?.length"
        style="max-height: 400px">
        <n-card
          v-for="item in currentEditItem?.relatedItems"
          :key="item.id"
          embedded
          size="small"
          class="mb-2">
          <div class="flex items-center justify-between">
            <div class="flex flex-col">
              <span class="text-sm font-bold">
                {{ extractItemTitle(item, contentModel(item)) }}
              </span>
              <span class="text-xs font-normal">
                {{ tr(contentModel(item)?.title) }}
              </span>
            </div>
            <n-space>
              <n-button
                size="small"
                type="error"
                :secondary="isLightTheme"
                @click="deleteLink(item)">
                <n-icon>
                  <Icon icon="carbon:trash-can" />
                </n-icon>
              </n-button>
            </n-space>
          </div>
        </n-card>
      </n-scrollbar>
      <n-card
        v-else
        size="large"
        :class="`mb-2 !border-dashed !border-2 ${pickByTheme(
          '!border-zinc-300',
          '!border-zinc-600'
        )}`">
        <n-empty :description="t('noLinkAdded')">
          <template #icon>
            <n-icon>
              <Icon icon="carbon:text-link" />
            </n-icon>
          </template>
        </n-empty>
      </n-card>
    </n-spin>
  </n-modal>
  <n-modal
    v-model:show="nestedDialogVisible"
    :loading="isLoading"
    preset="dialog"
    style="width: 500px"
    :bordered="false"
    :show-icon="false"
    :mask-closable="false"
    :title="t('addLink')"
    :positive-text="t('validate')"
    :negative-text="t('cancel')"
    @positive-click="submit"
    @negative-click="nestedDialogVisible = false">
    <n-form
      ref="formRef"
      :model="formValue"
      :rules="rules"
      :show-require-mark="false"
      size="medium"
      class="my-5">
      <n-form-item :label="t('contentModel')" path="contentModelId">
        <n-select
          v-model:value="formValue.contentModelId"
          :options="(contentModels as any[])"
          :placeholder="t('contentModel')"
          :render-label="renderContentModelLabel"
          label-field="title"
          value-field="id"
          filterable
          class="w-full" />
      </n-form-item>
      <n-form-item :label="t('itemToLink')" path="itemId">
        <n-select
          v-model:value="formValue.itemId"
          :options="((contentModelItems || []) as any[])"
          :placeholder="t('itemToLink')"
          :render-label="(option: ContentModelItemModel) => renderContentModelItemLabel(option).value"
          :loading="isSearchingContentModelItem"
          :disabled="!formValue.contentModelId"
          value-field="id"
          filterable
          remote
          class="w-full"
          @search="(query: string) => handleContentModelItemSearch(query, formValue.contentModelId)" />
      </n-form-item>
    </n-form>
  </n-modal>
</template>

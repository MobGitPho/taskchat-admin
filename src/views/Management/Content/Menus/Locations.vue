<script lang="ts" setup>
  import { ResponseErrorCode } from '@/enums/response-error-code'

  import { MenuLocationModel } from '@/models/menu-location'

  import { FormInst, FormRules, FormValidationError } from 'naive-ui'

  const { t } = useI18n()
  const { request } = useApi()
  const { pickByTheme, tr, displayFormErrors, formatKey } = useHelper()
  const dialogVisible = defineModel<boolean>('show', {
    default: false,
    required: true,
  })

  const { menuLocations } = storeToRefs(useContentStore())
  const { loadMenuLocations } = useContentStore()
  const { isLightTheme } = storeToRefs(useUserInterfaceStore())

  const isLoading = ref(false)

  const init = async () => {
    isLoading.value = true

    await loadMenuLocations()

    isLoading.value = false
  }

  init()

  // Actions
  const dialog = useDialog()
  const message = useMessage()
  const loadingBar = useLoadingBar()

  const isProceeding = ref(false)
  const nestedDialogVisible = ref(false)
  const currentEditItem = ref<MenuLocationModel | null>(null)
  const formRef = ref<FormInst | null>(null)
  const formValue = ref<MenuLocationModel>({
    name: '',
    description: '',
  })
  const rules: FormRules = {
    name: [
      {
        required: true,
        message: t('fillRequired'),
      },
    ],
  }

  const openFormModal = (item: MenuLocationModel | null) => {
    currentEditItem.value = _.cloneDeep(item)
    formValue.value = _.cloneDeep(item ? item : { name: '', description: '' })

    nestedDialogVisible.value = true
  }

  const submit = async () => {
    formRef.value?.validate(
      async (errors: Array<FormValidationError> | undefined) => {
        if (!errors) {
          loadingBar.start()
          isProceeding.value = true

          const data: any = {
            name: formValue.value.name,
            description: formValue.value.description,
          }

          const task = await request({
            method: currentEditItem.value ? 'put' : 'post',
            url: currentEditItem.value
              ? `/menu-locations/${currentEditItem.value.id}`
              : '/menu-locations',
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

            nestedDialogVisible.value = false
          }

          isProceeding.value = false
          loadingBar.finish()
        }
      }
    )

    return false
  }

  const deleteMenuLocation = async (item: MenuLocationModel) => {
    dialog.warning({
      title: t('confirm'),
      content: t('confirmDeleteMenuLocation'),
      positiveText: t('yes'),
      negativeText: t('no'),
      onPositiveClick: async () => {
        const task = await request({
          method: 'delete',
          url: `/menu-locations/${item.id}`,
        })

        if (task.success) {
          message.success(t('success'))

          init()
        } else message.error(t('anErrorOccurred'))
      },
    })
  }
</script>

<template>
  <n-modal
    v-model:show="dialogVisible"
    preset="card"
    style="width: 600px"
    :bordered="false"
    :show-icon="false"
    :mask-closable="false"
    :closable="false"
    :title="t('menuLocations')">
    <template #header-extra>
      <n-space align="center">
        <n-button
          size="small"
          type="primary"
          :disabled="isLoading"
          @click="openFormModal(null)">
          <n-icon class="mr-1">
            <Icon icon="carbon:add-alt" />
          </n-icon>
          {{ t('add') }}
        </n-button>
        <n-button
          size="small"
          type="error"
          :disabled="isLoading"
          @click="dialogVisible = false">
          <n-icon class="mr-1">
            <Icon icon="carbon:close" />
          </n-icon>
          {{ t('close') }}
        </n-button>
      </n-space>
    </template>
    <n-spin :show="isLoading">
      <n-scrollbar v-if="menuLocations.length" style="max-height: 400px">
        <n-card
          v-for="menuLocation in menuLocations"
          :key="menuLocation.id"
          embedded
          size="small"
          class="mb-2">
          <div class="flex items-center justify-between">
            <div class="flex flex-col">
              <span class="text-sm font-bold">
                {{ menuLocation.name }}
              </span>
              <n-ellipsis
                line-clamp="1"
                style="max-width: 240px"
                class="text-xs font-normal">
                {{ tr(menuLocation.description) }}
              </n-ellipsis>
            </div>
            <n-space>
              <n-button
                size="small"
                type="warning"
                :secondary="isLightTheme"
                @click="openFormModal(menuLocation)">
                <n-icon>
                  <Icon icon="carbon:edit" />
                </n-icon>
              </n-button>
              <n-button
                size="small"
                type="error"
                :secondary="isLightTheme"
                @click="deleteMenuLocation(menuLocation)">
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
        <n-empty :description="t('noMenuLocationAdded')">
          <template #icon>
            <n-icon>
              <Icon icon="carbon:template" />
            </n-icon>
          </template>
        </n-empty>
      </n-card>
    </n-spin>
  </n-modal>
  <n-modal
    v-model:show="nestedDialogVisible"
    :loading="isProceeding"
    preset="dialog"
    style="width: 500px"
    :bordered="false"
    :show-icon="false"
    :mask-closable="false"
    :title="currentEditItem ? t('editMenuLocation') : t('addMenuLocation')"
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
      <n-form-item :label="t('key')" path="name">
        <n-input
          :value="formValue.name"
          :placeholder="t('key')"
          class="w-full"
          @update:value="(value) => (formValue.name = formatKey(value))" />
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
    </n-form>
  </n-modal>
</template>

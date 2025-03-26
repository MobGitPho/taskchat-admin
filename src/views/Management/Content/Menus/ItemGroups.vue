<script lang="ts" setup>
  import { ResponseErrorCode } from '@/enums/response-error-code'

  import { MenuItemGroupModel } from '@/models/menu-item-group'

  import { FormInst, FormRules, FormValidationError } from 'naive-ui'

  const { t } = useI18n()
  const { request } = useApi()
  const { pickByTheme, tr, displayFormErrors } = useHelper()
  const dialogVisible = defineModel<boolean>('show', {
    default: false,
    required: true,
  })

  const { menuItemGroups } = storeToRefs(useContentStore())
  const { loadMenuItemGroups } = useContentStore()
  const { isLightTheme } = storeToRefs(useUserInterfaceStore())

  const isLoading = ref(false)

  const init = async () => {
    isLoading.value = true

    await loadMenuItemGroups()

    isLoading.value = false
  }

  init()

  // Actions
  const dialog = useDialog()
  const message = useMessage()
  const loadingBar = useLoadingBar()

  const isProceeding = ref(false)
  const nestedDialogVisible = ref(false)
  const currentEditItem = ref<MenuItemGroupModel | null>(null)
  const formRef = ref<FormInst | null>(null)
  const formValue = ref<MenuItemGroupModel>({
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

  const openFormModal = (item: MenuItemGroupModel | null) => {
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
              ? `/menu-item-groups/${currentEditItem.value.id}`
              : '/menu-item-groups',
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

  const deleteMenuItemGroup = async (item: MenuItemGroupModel) => {
    dialog.warning({
      title: t('confirm'),
      content: t('confirmDeleteMenuItemGroup'),
      positiveText: t('yes'),
      negativeText: t('no'),
      onPositiveClick: async () => {
        const task = await request({
          method: 'delete',
          url: `/menu-item-groups/${item.id}`,
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
    :title="t('menuItemGroups')">
    <template #header-extra>
      <n-space align="center">
        <n-button
          size="small"
          type="primary"
          :disabled="isLoading"
          @click="openFormModal(null)">
          <Icon icon="carbon:add-alt" class="mr-1" />
          {{ t('add') }}
        </n-button>
        <n-button
          size="small"
          type="error"
          :disabled="isLoading"
          @click="dialogVisible = false">
          <Icon icon="carbon:close" class="mr-1" />
          {{ t('close') }}
        </n-button>
      </n-space>
    </template>
    <n-spin :show="isLoading">
      <n-scrollbar v-if="menuItemGroups.length" style="max-height: 400px">
        <n-card
          v-for="menuItemGroup in menuItemGroups"
          :key="menuItemGroup.id"
          embedded
          size="small"
          class="mb-2">
          <div class="flex items-center justify-between">
            <div class="flex flex-col">
              <span class="text-sm font-bold">
                {{ tr(menuItemGroup.name) }}
              </span>
              <n-ellipsis
                line-clamp="1"
                style="max-width: 240px"
                class="text-xs font-normal">
                {{ tr(menuItemGroup.description) }}
              </n-ellipsis>
            </div>
            <n-space>
              <n-button
                size="small"
                type="warning"
                :secondary="isLightTheme"
                @click="openFormModal(menuItemGroup)">
                <n-icon>
                  <Icon icon="carbon:edit" />
                </n-icon>
              </n-button>
              <n-button
                size="small"
                type="error"
                :secondary="isLightTheme"
                @click="deleteMenuItemGroup(menuItemGroup)">
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
        <n-empty :description="t('noMenuItemGroupAdded')">
          <template #icon>
            <n-icon>
              <Icon icon="carbon:tag-group" />
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
    :title="currentEditItem ? t('editMenuItemGroup') : t('addMenuItemGroup')"
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
      <n-form-item :label="t('name')" path="name">
        <I18nInput
          v-model="formValue.name"
          :placeholder="t('name')"
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
    </n-form>
  </n-modal>
</template>

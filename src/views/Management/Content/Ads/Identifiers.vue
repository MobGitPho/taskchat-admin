<script lang="ts" setup>
  import { AdContentType } from '@/enums/ad-content-type'
  import { ResponseErrorCode } from '@/enums/response-error-code'

  import { AdIdentifierModel } from '@/models/ad-identifier'

  import { FormInst, FormRules, FormValidationError } from 'naive-ui'

  const { t } = useI18n()
  const { request } = useApi()
  const { pickByTheme, displayFormErrors, formatKey } = useHelper()
  const dialogVisible = defineModel<boolean>('show', {
    default: false,
    required: true,
  })

  const { adIdentifiers } = storeToRefs(useAdStore())
  const { loadAdIdentifiers } = useAdStore()
  const { isLightTheme } = storeToRefs(useUserInterfaceStore())

  const isLoading = ref(false)

  const init = async () => {
    isLoading.value = true

    await loadAdIdentifiers()

    isLoading.value = false
  }

  init()

  // Actions
  const dialog = useDialog()
  const message = useMessage()
  const loadingBar = useLoadingBar()

  const isProceeding = ref(false)
  const nestedDialogVisible = ref(false)
  const currentEditItem = ref<AdIdentifierModel | null>(null)
  const formRef = ref<FormInst | null>(null)
  const formValue = ref<AdIdentifierModel>({
    id: '',
    reusable: false,
    contentType: AdContentType.IMAGE,
    contentSize: '',
    params: [],
  })
  const rules: FormRules = {
    id: [
      {
        required: true,
        message: t('fillRequired'),
      },
    ],
  }

  const openFormModal = (item: AdIdentifierModel | null) => {
    currentEditItem.value = _.cloneDeep(item)
    formValue.value = _.cloneDeep(
      item
        ? item
        : {
            id: '',
            reusable: false,
            contentType: AdContentType.IMAGE,
            contentSize: '',
            params: [],
          }
    )

    nestedDialogVisible.value = true
  }

  const submit = async () => {
    formRef.value?.validate(
      async (errors: Array<FormValidationError> | undefined) => {
        if (!errors) {
          loadingBar.start()
          isProceeding.value = true

          const data: any = {
            id: formValue.value.id,
            reusable: formValue.value.reusable,
            contentType: formValue.value.contentType,
            contentSize: formValue.value.contentSize,
            params: formValue.value.params,
          }

          const task = await request({
            method: currentEditItem.value ? 'put' : 'post',
            url: currentEditItem.value
              ? `/ad-identifiers/${currentEditItem.value.id}`
              : '/ad-identifiers',
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

  const deleteAdIdentifier = async (item: AdIdentifierModel) => {
    dialog.warning({
      title: t('confirm'),
      content: t('confirmDeleteAdIdentifier'),
      positiveText: t('yes'),
      negativeText: t('no'),
      onPositiveClick: async () => {
        const task = await request({
          method: 'delete',
          url: `/ad-identifiers/${item.id}`,
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
    :title="t('adIdentifiers')">
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
      <n-scrollbar v-if="adIdentifiers.length" style="max-height: 400px">
        <n-card
          v-for="adIdentifier in adIdentifiers"
          :key="adIdentifier.id"
          embedded
          size="small"
          class="mb-2">
          <div class="flex items-center justify-between">
            <div class="flex flex-col">
              <span class="text-sm font-bold">
                {{ adIdentifier.id }}
              </span>
              <div>
                <span class="text-xs font-normal">
                  {{
                    adIdentifier.contentType === AdContentType.IMAGE
                      ? t('image')
                      : t('video')
                  }}
                </span>
                <span v-if="adIdentifier.contentSize" class="text-xs font-bold">
                  &nbsp;({{ adIdentifier.contentSize }})
                </span>
              </div>
            </div>
            <n-space>
              <n-tag
                size="medium"
                :bordered="false"
                :type="adIdentifier.reusable ? 'info' : 'warning'">
                {{ adIdentifier.reusable ? t('reusable') : t('notReusable') }}
              </n-tag>
              <n-divider
                vertical
                class="!mx-0"
                :class="pickByTheme('!bg-zinc-400', '!bg-slate-500')">
              </n-divider>
              <n-button
                size="small"
                type="warning"
                :secondary="isLightTheme"
                @click="openFormModal(adIdentifier)">
                <n-icon>
                  <Icon icon="carbon:edit" />
                </n-icon>
              </n-button>
              <n-button
                size="small"
                type="error"
                :secondary="isLightTheme"
                @click="deleteAdIdentifier(adIdentifier)">
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
        <n-empty :description="t('noIdentifierAdded')">
          <template #icon>
            <n-icon size="60">
              <Icon icon="mdi:identifier" />
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
    style="width: 600px"
    :bordered="false"
    :show-icon="false"
    :mask-closable="false"
    :title="currentEditItem ? t('editAdIdentifier') : t('addAdIdentifier')"
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
      <n-grid :span="24" x-gap="12">
        <n-form-item-gi :span="16" :label="t('identifier')" path="id">
          <n-input
            :value="formValue.id"
            :placeholder="t('identifier')"
            class="w-full"
            @update:value="(value) => (formValue.id = formatKey(value))" />
        </n-form-item-gi>
        <n-form-item-gi :span="8" :label="t('contentSize')" path="contentSize">
          <n-input
            v-model:value="formValue.contentSize"
            :placeholder="t('contentSize')"
            class="w-full" />
        </n-form-item-gi>
      </n-grid>
      <n-grid :span="24" x-gap="12">
        <n-form-item-gi :span="12" :label="t('status')" path="reusable">
          <n-radio-group
            v-model:value="formValue.reusable"
            name="reusable"
            class="w-full">
            <n-radio-button
              :value="false"
              :label="t('notReusable')"
              class="w-[50%]" />
            <n-radio-button
              :value="true"
              :label="t('reusable')"
              class="w-[50%]" />
          </n-radio-group>
        </n-form-item-gi>
        <n-form-item-gi :span="12" :label="t('contentType')" path="contentType">
          <n-radio-group
            v-model:value="formValue.contentType"
            name="contentType"
            class="w-full">
            <n-radio-button
              :value="AdContentType.IMAGE"
              :label="t('image')"
              class="w-[50%]" />
            <n-radio-button
              :value="AdContentType.VIDEO"
              :label="t('video')"
              class="w-[50%]" />
          </n-radio-group>
        </n-form-item-gi>
      </n-grid>
      <n-form-item :label="t('settings')" path="params">
        <n-dynamic-tags v-model:value="formValue.params" type="primary" />
      </n-form-item>
    </n-form>
  </n-modal>
</template>

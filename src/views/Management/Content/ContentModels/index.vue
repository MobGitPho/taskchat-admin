<script lang="ts" setup>
  import { AppConfig } from '@/utils/types'

  import { ResponseErrorCode } from '@/enums/response-error-code'

  import { ContentModelModel } from '@/models/content-model'

  import { FormInst, FormRules, FormValidationError } from 'naive-ui'

  import DataStructure from '../DataStructure/index.vue'
  import Items from './Items.vue'

  const { t } = useI18n()
  const { request } = useApi()
  const {
    tr,
    pickByTheme,
    displayFormErrors,
    fileUrl,
    isInDevMode,
    formatKey,
  } = useHelper()
  const { isLightTheme } = storeToRefs(useUserInterfaceStore())
  const { contentModels } = storeToRefs(useContentStore())
  const { loadContentModels } = useContentStore()

  const loadingBar = useLoadingBar()
  const message = useMessage()
  const dialog = useDialog()

  const isLoading = ref(false)
  const isProceeding = ref(false)

  const appConfig = inject<AppConfig>('appConfig')

  const init = async () => {
    loadingBar.start()
    isLoading.value = true

    await loadContentModels()

    isLoading.value = false
    loadingBar.finish()
  }

  init()

  // Pagination

  const pageSize = ref(12)
  const currentPage = ref(1)

  const handlePageSizeChange = (value: number) => {
    pageSize.value = value
  }

  // Edit section

  const defaultValue: ContentModelModel = {
    name: '',
    title: '',
    image: '',
    description: '',
    slug: '',
    titleFieldName: '',
    hasPermalink: false,
  }
  const dialogVisible = ref(false)
  const formRef = ref<FormInst | null>(null)
  const formValue = ref<ContentModelModel>(defaultValue)
  const rules: FormRules = {
    name: [
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
  }
  const currentEditItem = ref<ContentModelModel | null>(null)

  const openFormModal = (item: ContentModelModel | null) => {
    currentEditItem.value = _.cloneDeep(item)
    formValue.value = _.cloneDeep(item ? item : defaultValue)

    dialogVisible.value = true
  }

  const submitContentModel = async () => {
    formRef.value?.validate(
      async (errors: Array<FormValidationError> | undefined) => {
        if (!errors) {
          loadingBar.start()
          isProceeding.value = true

          const data: any = {
            name: formValue.value.name,
            title: formValue.value.title,
            image: formValue.value.image,
            description: formValue.value.description,
            titleFieldName: formValue.value.titleFieldName,
            hasPermalink: formValue.value.hasPermalink,
          }

          const task = await request({
            method: currentEditItem.value ? 'put' : 'post',
            url: currentEditItem.value
              ? `/content-models/${currentEditItem.value.id}`
              : '/content-models',
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

            dialogVisible.value = false
          }

          isProceeding.value = false
          loadingBar.finish()
        }
      }
    )

    return false
  }

  const deleteContentModel = async (item: ContentModelModel) => {
    dialog.warning({
      title: t('confirm'),
      content: t('confirmDeleteContentModel'),
      positiveText: t('yes'),
      negativeText: t('no'),
      onPositiveClick: async () => {
        const task = await request({
          method: 'delete',
          url: `/content-models/${item.id}`,
        })

        if (task.success) {
          message.success(t('success'))

          init()
        } else message.error(t('anErrorOccurred'))
      },
    })
  }

  // Data structure
  const dataStructureContentModel = ref<ContentModelModel | null>(null)
  const dataStructureDialogVisible = ref(false)

  const updateDataStructure = async (data: any) => {
    isProceeding.value = true
    loadingBar.start()

    const task = await request({
      url: `/content-models/${dataStructureContentModel.value?.id}`,
      method: 'put',
      data: {
        dataStructure: data,
      },
    })

    if (task.success && task.result) {
      message.success(t('success'))

      init()

      launchDataStructure(task.result.data)
    } else {
      message.error(t('anErrorOccurred'))
    }

    isProceeding.value = false
    loadingBar.finish()
  }

  const launchDataStructure = (section: ContentModelModel) => {
    dataStructureContentModel.value = section

    dataStructureDialogVisible.value = true
  }

  // Image

  const folder = 'previews'
  const pickerVisible = ref(false)

  const saveImage = async (url: string) => {
    formValue.value.image = url

    pickerVisible.value = false
  }

  const clearImage = () => {
    formValue.value.image = ''
  }

  // Items
  const store = defineStore('content-models-management', () => {
    const itemsContentModel = ref<ContentModelModel | null>(null)

    return { itemsContentModel }
  })()

  // Generate name
  watch(
    () => formValue.value.title,
    (value) => {
      if (currentEditItem.value) {
        //
      } else if (formValue.value.name.length <= 21) {
        formValue.value.name = slugify(tr(value), {
          trim: true,
          lower: true,
          strict: true,
        })
      }
    }
  )
</script>

<template>
  <MountedTeleport v-if="!store.itemsContentModel" to="#alt-action">
    <n-button
      v-if="contentModels && contentModels.length"
      type="primary"
      @click="openFormModal(null)">
      <template #icon>
        <n-icon size="18">
          <Icon icon="carbon:add-alt" />
        </n-icon>
      </template>
      {{ t('addContentModel') }}
    </n-button>
  </MountedTeleport>
  <Items v-if="store.itemsContentModel" v-model="store.itemsContentModel" />
  <section v-else>
    <CustomTransition appear name="slide-fade">
      <section>
        <template v-if="contentModels && contentModels.length">
          <n-card
            v-for="contentModel in contentModels.slice(
              (currentPage - 1) * pageSize,
              currentPage * pageSize
            )"
            :key="contentModel.id"
            embedded
            size="small"
            class="mb-2">
            <template #header>
              <div class="flex items-center">
                <n-space v-if="isInDevMode">
                  <n-button
                    size="small"
                    type="primary"
                    :secondary="isLightTheme"
                    @click.stop="launchDataStructure(contentModel)">
                    <n-icon class="mr-1">
                      <Icon icon="carbon:data-1" />
                    </n-icon>
                    {{ t('dataStructure') }}
                  </n-button>
                  <n-button
                    size="small"
                    type="primary"
                    :secondary="isLightTheme"
                    @click.stop="openFormModal(contentModel)">
                    <n-icon>
                      <Icon icon="carbon:edit" />
                    </n-icon>
                  </n-button>
                  <n-button
                    size="small"
                    type="error"
                    :secondary="isLightTheme"
                    @click.stop="deleteContentModel(contentModel)">
                    <n-icon>
                      <Icon icon="carbon:trash-can" />
                    </n-icon>
                  </n-button>
                </n-space>
                <n-divider
                  v-if="isInDevMode"
                  vertical
                  :class="pickByTheme('!bg-zinc-400', '!bg-slate-500')">
                </n-divider>
                <span class="text-base">{{ tr(contentModel.title) }}</span>
              </div>
            </template>
            <template #header-extra>
              <n-button
                size="small"
                type="primary"
                :secondary="isLightTheme"
                @click.stop="store.itemsContentModel = contentModel">
                <template #icon>
                  <n-icon>
                    <Icon icon="carbon:arrow-right" />
                  </n-icon>
                </template>
                {{ t('open') }}
              </n-button>
            </template>
          </n-card>
          <n-pagination
            v-model:page="currentPage"
            class="mt-5 justify-end"
            show-size-picker
            :page-size="pageSize"
            :page-sizes="[6, 10, 24, 36, 48]"
            :page-count="Math.ceil(contentModels.length / pageSize)"
            @update:page-size="handlePageSizeChange">
            <template #prefix>
              {{ `${contentModels.length} ${t('contentModel_s')}` }}
            </template>
          </n-pagination>
        </template>
        <n-card
          v-else
          size="large"
          :class="`mb-2 !border-dashed !border-2 ${pickByTheme(
            '!border-zinc-300',
            '!border-zinc-600'
          )}`">
          <n-empty :description="t('noContentModelAvailable')">
            <template #icon>
              <n-icon>
                <Icon icon="carbon:model-alt" />
              </n-icon>
            </template>
            <template #extra>
              <div class="mt-4">
                <n-button size="small" @click="openFormModal(null)">
                  <template #icon>
                    <n-icon>
                      <Icon icon="carbon:add-alt" />
                    </n-icon>
                  </template>
                  {{ t('addContentModel') }}
                </n-button>
              </div>
            </template>
          </n-empty>
        </n-card>
      </section>
    </CustomTransition>
    <n-modal
      v-model:show="dialogVisible"
      :loading="isProceeding"
      preset="dialog"
      style="width: 500px"
      :bordered="false"
      :show-icon="false"
      :mask-closable="false"
      :title="currentEditItem ? t('editContentModel') : t('addContentModel')"
      :positive-text="t('validate')"
      :negative-text="t('cancel')"
      @positive-click="submitContentModel"
      @negative-click="dialogVisible = false">
      <n-form
        ref="formRef"
        :model="formValue"
        :rules="rules"
        :show-require-mark="false"
        size="medium"
        class="my-5">
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
        <n-grid x-gap="12" :span="24">
          <n-gi :span="14">
            <n-form-item :label="t('contentModelKey')" path="name">
              <n-input
                :value="formValue.name"
                :placeholder="t('contentModelKey')"
                class="w-full"
                @update:value="
                  (value) => (formValue.name = formatKey(value))
                " />
            </n-form-item>
            <n-form-item :label="t('titleSingletonKey')" path="titleFieldName">
              <n-input
                :value="formValue.titleFieldName"
                :placeholder="t('titleSingletonKey')"
                class="w-full"
                @update:value="
                  (value) => (formValue.titleFieldName = formatKey(value))
                " />
            </n-form-item>
          </n-gi>
          <n-form-item-gi :span="10" :label="t('itemsPreview')" path="image">
            <n-space
              align="center"
              justify="start"
              style="height: 100%; width: 100%">
              <n-avatar
                class="cursor-pointer"
                object-fit="cover"
                :style="'border: 1px dashed ' + pickByTheme('green', 'white')"
                :size="150"
                :src="fileUrl(formValue.image || '')"
                @click="pickerVisible = true">
                <n-icon v-if="!formValue.image" :size="64">
                  <Icon icon="carbon:image" class="text-gray-400" />
                </n-icon>
              </n-avatar>
              <n-button v-if="formValue.image" quaternary @click="clearImage()">
                <template #icon>
                  <n-icon>
                    <Icon icon="carbon:trash-can" />
                  </n-icon>
                </template>
                {{ t('clear') }}
              </n-button>
            </n-space>
          </n-form-item-gi>
        </n-grid>
        <n-form-item :show-label="false" path="hasPermalink">
          <n-checkbox v-model:checked="formValue.hasPermalink">
            {{ t('associatePermalinkToContentModel') }}
          </n-checkbox>
        </n-form-item>
      </n-form>
    </n-modal>
    <MediaPicker
      v-model:show="pickerVisible"
      :title="t('selectImage')"
      :upload-config="{
        folder: folder,
        limit: 0,
        maxSize: 0,
        baseUrl: appConfig?.apiUrl + '/media-files/upload',
        excludedExtensions: [],
      }"
      @submit="saveImage" />
    <DataStructure
      v-model:show="dataStructureDialogVisible"
      :title="tr(dataStructureContentModel?.title)"
      :raw-data-structure="dataStructureContentModel?.dataStructure"
      :update-data-structure="updateDataStructure" />
  </section>
</template>

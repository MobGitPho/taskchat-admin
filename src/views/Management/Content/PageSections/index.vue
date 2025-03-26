<script setup lang="ts">
  import { ResponseErrorCode } from '@/enums/response-error-code'

  import { SectionModel } from '@/models/section'

  import { FormInst, FormRules, FormValidationError } from 'naive-ui'

  import DataStructure from '../DataStructure/index.vue'

  const { t } = useI18n()
  const { request } = useApi()
  const { tr, pickByTheme, displayFormErrors, isInDevMode } = useHelper()
  const { sections } = storeToRefs(useContentStore())
  const { loadSections } = useContentStore()
  const { isLightTheme } = storeToRefs(useUserInterfaceStore())

  const loadingBar = useLoadingBar()
  const message = useMessage()

  const isProceeding = ref(false)

  loadSections()

  // Pagination

  const pageSize = ref(12)
  const currentPage = ref(1)

  const handlePageSizeChange = (value: number) => {
    pageSize.value = value
  }

  // Edit section

  const defaultValue: SectionModel = {
    name: '',
    title: '',
    content: '',
    slug: '',
  }
  const dialogVisible = ref(false)
  const formRef = ref<FormInst | null>(null)
  const formValue = ref<SectionModel>(defaultValue)
  const rules: FormRules = {
    title: [
      {
        required: true,
        message: t('fillRequired'),
      },
    ],
  }
  const currentEditItem = ref<SectionModel | null>(null)

  const openFormModal = (item: SectionModel | null) => {
    currentEditItem.value = _.cloneDeep(item)
    formValue.value = _.cloneDeep(item ? item : defaultValue)

    dialogVisible.value = true
  }

  const submitSection = async () => {
    formRef.value?.validate(
      async (errors: Array<FormValidationError> | undefined) => {
        if (!errors) {
          loadingBar.start()
          isProceeding.value = true

          const data: any = {
            title: formValue.value.title,
          }

          if (!currentEditItem.value) {
            data.name = _.startCase(
              _.camelCase(tr(formValue.value.title))
            ).replace(/\s+/g, '')
          }

          const task = await request({
            method: currentEditItem.value ? 'put' : 'post',
            url: currentEditItem.value
              ? `/sections/${currentEditItem.value.slug}`
              : '/sections',
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

            loadSections()

            dialogVisible.value = false
          }

          isProceeding.value = false
          loadingBar.finish()
        }
      }
    )

    return false
  }

  // Data structure
  const dataStructureSection = ref<SectionModel | null>(null)
  const dataStructureDialogVisible = ref(false)

  const updateDataStructure = async (data: any) => {
    isProceeding.value = true
    loadingBar.start()

    const task = await request({
      url: `/sections/${dataStructureSection.value?.slug}`,
      method: 'put',
      data: {
        dataStructure: data,
      },
    })

    if (task.success && task.result) {
      message.success(t('success'))

      loadSections()

      launchDataStructure(task.result.data)
    } else {
      message.error(t('anErrorOccurred'))
    }

    isProceeding.value = false
    loadingBar.finish()
  }

  const launchDataStructure = (section: SectionModel) => {
    dataStructureSection.value = section

    dataStructureDialogVisible.value = true
  }
</script>

<template>
  <template v-if="sections && sections.length">
    <n-card
      v-for="section in sections.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
      )"
      :key="section.id"
      hoverable
      embedded
      size="small"
      class="mb-2">
      <n-collapse :default-expanded-names="[]" display-directive="show">
        <template #header-extra="{ collapsed }">
          <n-icon>
            <Icon v-if="collapsed" icon="fa-solid:chevron-left" />
            <Icon v-else icon="fa-solid:chevron-down" />
          </n-icon>
        </template>
        <template #arrow>
          <span></span>
        </template>
        <n-collapse-item name="1">
          <template #header>
            <div class="flex items-center">
              <n-space>
                <n-button
                  v-if="isInDevMode"
                  size="small"
                  type="primary"
                  :secondary="isLightTheme"
                  @click.stop="launchDataStructure(section)">
                  <n-icon class="mr-1">
                    <Icon icon="carbon:data-1" />
                  </n-icon>
                  {{ t('dataStructure') }}
                </n-button>
                <n-button
                  size="small"
                  type="primary"
                  :secondary="isLightTheme"
                  @click.stop="openFormModal(section)">
                  <n-icon>
                    <Icon icon="carbon:edit" />
                  </n-icon>
                </n-button>
              </n-space>
              <n-divider
                vertical
                :class="pickByTheme('!bg-zinc-400', '!bg-slate-500')">
              </n-divider>
              <span class="text-base">{{ tr(section.title) }}</span>
            </div>
          </template>
          <div>{{ t('sectionUsedInXPages', [section.pagesCount]) }}</div>
          <section class="mt-2">
            <n-tag
              v-for="page in section.pages"
              :key="page.id"
              size="small"
              class="mr-1"
              type="success">
              {{ tr(page.title) }}
            </n-tag>
          </section>
          <div class="mt-2 text-xs">
            {{ t('dataRetrievalSlug') }}: <b>{{ section.slug }}</b>
          </div>
        </n-collapse-item>
      </n-collapse>
    </n-card>
    <n-pagination
      v-model:page="currentPage"
      class="mt-5 justify-end"
      show-size-picker
      :page-size="pageSize"
      :page-sizes="[6, 10, 24, 36, 48]"
      :page-count="Math.ceil(sections.length / pageSize)"
      @update:page-size="handlePageSizeChange">
      <template #prefix>
        {{ `${sections.length} ${t('section_s')}` }}
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
    <n-empty :description="t('noSectionAvailable')">
      <template #icon>
        <n-icon>
          <Icon icon="carbon:page-break" />
        </n-icon>
      </template>
    </n-empty>
  </n-card>
  <n-modal
    v-model:show="dialogVisible"
    :loading="isProceeding"
    preset="dialog"
    style="width: 500px"
    :bordered="false"
    :show-icon="false"
    :mask-closable="false"
    :title="currentEditItem ? t('editSection') : t('addSection')"
    :positive-text="t('validate')"
    :negative-text="t('cancel')"
    @positive-click="submitSection"
    @negative-click="dialogVisible = false">
    <n-form
      ref="formRef"
      :model="formValue"
      :rules="rules"
      :show-require-mark="false"
      size="medium">
      <n-form-item :label="t('title')" path="title" class="mt-5">
        <I18nInput
          v-model="formValue.title"
          :placeholder="t('title')"
          :selector-span="5"
          class="w-full"
          sync />
      </n-form-item>
    </n-form>
  </n-modal>
  <DataStructure
    v-model:show="dataStructureDialogVisible"
    :title="tr(dataStructureSection?.title)"
    :raw-data-structure="dataStructureSection?.dataStructure"
    :update-data-structure="updateDataStructure" />
</template>

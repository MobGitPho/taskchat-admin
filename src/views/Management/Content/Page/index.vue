<script setup lang="ts">
  import { isRealObject } from '@/utils/functions'

  import { PageModel } from '@/models/page'
  import { SectionModel } from '@/models/section'

  import { SelectOption } from 'naive-ui'

  import FormGenerator from './FormGenerator.vue'

  interface Props {
    slug: string
    openFormModal: (item: PageModel | null) => void
  }

  const dialog = useDialog()

  const { t } = useI18n()

  const props = defineProps<Props>()
  const emits = defineEmits(['delete'])

  const refreshKey = ref(uuidv4())
  const data = ref<any>({})
  const initialData = ref<any>({})
  const formValueValidate1 = ref()
  const formValueValidate2 = ref()
  const page = ref<PageModel>()
  const pageSections = ref<SectionModel[]>([])
  const initialPageSections = ref<SectionModel[]>([])
  const pageSectionsEnabled = ref<{ [key: string]: boolean }>({})
  const initialPageSectionsEnabled = ref<{ [key: string]: boolean }>({})
  const isInitializing = ref(false)
  const isLoading = ref(false)

  const message = useMessage()
  const loadingBar = useLoadingBar()

  const { request } = useApi()
  const { tr, pickByTheme, editKeysToCamelCase } = useHelper()
  const { sections } = storeToRefs(useContentStore())
  const { isLightTheme } = storeToRefs(useUserInterfaceStore())

  const init = async () => {
    isLoading.value = isInitializing.value = true
    loadingBar.start()

    const task = await request({
      url: `/pages/${props.slug}`,
    })

    if (task.success && task.result) {
      page.value = task.result.data

      if (page.value?.sections && Array.isArray(page.value?.sections)) {
        const sectionsData: any = {}

        for (const section of page.value.sections) {
          if (section) {
            sectionsData[section.slug] =
              section.dataSourcePageSectionsData ?? {}
          }
        }

        for (const section of page.value.sections) {
          if (section) {
            if (
              _.isObject(sectionsData) &&
              _.has(sectionsData, section.slug) &&
              isRealObject((sectionsData as any)[section.slug])
            ) {
              data.value[section.slug] = reactive(
                (sectionsData as any)[section.slug]
              )
            } else data.value[section.slug] = reactive({})

            _.forIn(
              editKeysToCamelCase(section.dataStructure),
              (value: any, key: string) => {
                if (
                  !data.value[section.slug][key] ||
                  (Array.isArray(data.value[section.slug][key]) &&
                    data.value[section.slug][key].length == 0)
                ) {
                  if (key === 'index') {
                    data.value[section.slug][key] = reactive({})
                  } else {
                    data.value[section.slug][key] = reactive([])
                  }
                }
              }
            )
          }
        }
      }

      if (page.value && Array.isArray(page.value?.sections)) {
        const tempSections = page.value.sections

        if (Array.isArray(page.value?.sectionsOrder)) {
          pageSections.value = []
          for (const section of page.value.sectionsOrder) {
            if (section) {
              const item = tempSections.find((value) => value.slug === section)
              if (item) {
                pageSections.value.push(item)
              }
            }
          }
          for (const section of tempSections) {
            if (!pageSections.value.map((s) => s.slug).includes(section.slug)) {
              pageSections.value.push(section)
            }
          }
        } else {
          pageSections.value = _.cloneDeep(tempSections)
        }

        if (Array.isArray(page.value.sectionsDisabled)) {
          for (const section of page.value.sections) {
            if (section) {
              pageSectionsEnabled.value[section.slug] =
                !page.value.sectionsDisabled.includes(section.slug)
            }
          }
        } else {
          for (const section of page.value.sections) {
            if (section) {
              pageSectionsEnabled.value[section.slug] = true
            }
          }
        }
      }

      initialPageSectionsEnabled.value = _.cloneDeep(pageSectionsEnabled.value)

      initialPageSections.value = _.cloneDeep(pageSections.value)

      initialData.value = _.cloneDeep(data.value)
    }

    refreshKey.value = uuidv4()

    function sleep(ms: number) {
      return new Promise((resolve) => setTimeout(resolve, ms))
    }
    await sleep(5000)

    loadingBar.finish()
    isLoading.value = isInitializing.value = false
  }

  init()

  const renderSelectLabel = (option: SelectOption) => {
    return h(
      'span',
      {},
      {
        default: () =>
          option.id === page.value?.id ? t('currentPage') : tr(option.title),
      }
    )
  }

  const saveBtnDisabled = computed(() => {
    return (
      _.isEqual(data.value, initialData.value) &&
      _.isEqual(pageSections.value, initialPageSections.value) &&
      _.isEqual(pageSectionsEnabled.value, initialPageSectionsEnabled.value)
    )
  })

  const submit = async () => {
    isLoading.value = true
    loadingBar.start()

    const firstValidation =
      formValueValidate1.value && (await formValueValidate1.value())
    const secondValidation =
      formValueValidate2.value && (await formValueValidate2.value())

    const updateData = async () => {
      const task = await request({
        url: `/pages/${props.slug}`,
        method: 'put',
        data: {
          dispatchData: true,
          sectionsData: data.value,
          sectionsOrder: pageSections.value.map((section) => section.slug),
          sectionsDisabled: Object.keys(pageSectionsEnabled.value).filter(
            (key) => !pageSectionsEnabled.value[key]
          ),
        },
      })

      if (task.success && task.result) {
        message.success(t('success'))

        init()
      } else {
        message.error(t('anErrorOccurred'))
      }
    }

    if (
      (!formValueValidate1.value || firstValidation) &&
      (!formValueValidate2.value || secondValidation)
    ) {
      await updateData()
    } else {
      dialog.warning({
        title: t('confirm'),
        content: t('mandatoryFieldsNotFilledInConfirmation'),
        positiveText: t('yes'),
        negativeText: t('cancel'),
        onPositiveClick: async () => {
          await updateData()
        },
      })
    }

    loadingBar.finish()
    isLoading.value = false
  }

  // Delete page

  const deletePage = async (item: PageModel) => {
    dialog.warning({
      title: t('confirm'),
      content: t('confirmDeletePage'),
      positiveText: t('yes'),
      negativeText: t('no'),
      onPositiveClick: async () => {
        const task = await request({
          method: 'delete',
          url: `/pages/${item.slug}`,
        })

        if (task.success) {
          emits('delete', page.value)

          message.success(t('success'))
        } else message.error(t('anErrorOccurred'))
      },
    })
  }

  // Add new sections

  const isProceeding = ref(false)
  const selectedSectionsIds = ref<number[]>([])
  const addSectionsDialogVisible = ref(false)

  const openAddSectionsDialog = () => {
    selectedSectionsIds.value = []

    pageSections.value.forEach((section) => {
      if (section.id) selectedSectionsIds.value.push(section.id)
    })

    addSectionsDialogVisible.value = true
  }

  const toggleSectionSelection = (section: SectionModel) => {
    if (!section.id) return

    if (selectedSectionsIds.value.includes(section.id)) {
      selectedSectionsIds.value = selectedSectionsIds.value.filter(
        (id) => id !== section.id
      )
    } else {
      selectedSectionsIds.value.push(section.id)
    }
  }

  const isSectionChecked = (section: SectionModel) => {
    return computed({
      get: () =>
        section.id ? selectedSectionsIds.value.includes(section.id) : false,
      set: (checked: boolean) => {
        if (section.id) {
          if (checked) {
            selectedSectionsIds.value = selectedSectionsIds.value.filter(
              (id) => id !== section.id
            )
          } else {
            if (!selectedSectionsIds.value.includes(section.id)) {
              selectedSectionsIds.value.push(section.id)
            }
          }
        }
      },
    })
  }

  const removeSection = (section: SectionModel) => {
    if (section.id) {
      selectedSectionsIds.value = []

      pageSections.value.forEach((pageSection) => {
        if (pageSection.id && pageSection.id !== section.id)
          selectedSectionsIds.value.push(pageSection.id)
      })

      submitSections()
    }
  }

  const submitSections = async () => {
    isProceeding.value = true
    loadingBar.start()

    const task = await request({
      url: `/pages/${props.slug}`,
      method: 'put',
      data: {
        sectionsIds: selectedSectionsIds.value,
      },
    })

    if (task.success && task.result) {
      message.success(t('success'))

      init()
    } else {
      message.error(t('anErrorOccurred'))
    }

    loadingBar.finish()
    isProceeding.value = false
  }

  const updateDataSourcePage = async (
    section: SectionModel,
    sourcePageId: number | null
  ) => {
    isProceeding.value = true
    loadingBar.start()

    const task = await request({
      url: `/sections/${section.slug}/data-source-page`,
      method: 'put',
      data: {
        pageId: page.value?.id,
        sourcePageId: sourcePageId,
      },
    })

    if (task.success && task.result) {
      message.success(t('success'))

      init()
    } else {
      message.error(t('anErrorOccurred'))
    }

    loadingBar.finish()
    isProceeding.value = false
  }

  const confirmUpdateDataSourcePage = async (
    section: SectionModel,
    sourcePageId: number | null
  ) => {
    if (saveBtnDisabled.value) updateDataSourcePage(section, sourcePageId)
    else {
      dialog.warning({
        title: t('confirm'),
        content: t('confirmUpdateDataSourcePage'),
        positiveText: t('yes'),
        negativeText: t('cancel'),
        onPositiveClick: () => updateDataSourcePage(section, sourcePageId),
      })
    }
  }
</script>

<template>
  <MountedTeleport to="#alt-action">
    <n-space align="center">
      <n-button
        type="error"
        :disabled="isLoading"
        @click="page ? deletePage(page) : null">
        <template #icon>
          <n-icon><Icon icon="carbon:trash-can" /></n-icon>
        </template>
        {{ t('delete') }}
      </n-button>
      <n-button
        type="info"
        :disabled="isLoading"
        @click="page ? openFormModal(page) : null">
        <template #icon>
          <n-icon><Icon icon="carbon:edit" /></n-icon>
        </template>
        {{ t('editPage') }}
      </n-button>
      <n-divider
        vertical
        :class="pickByTheme('!bg-zinc-400', '!bg-slate-500')"></n-divider>
      <n-button
        type="primary"
        :loading="isLoading"
        :disabled="saveBtnDisabled"
        @click="submit()">
        <template #icon>
          <n-icon><Icon icon="carbon:save" /></n-icon>
        </template>
        {{ t('save') }}
      </n-button>
    </n-space>
  </MountedTeleport>
  <CustomTransition appear name="slide-fade">
    <section v-if="isInitializing">
      <n-skeleton
        v-for="i in 6"
        :key="i"
        height="50px"
        width="100%"
        :sharp="false"
        class="mb-2" />
    </section>
    <section v-else>
      <section
        v-if="page && Array.isArray(page.sections) && page.sections.length">
        <Draggable :list="pageSections">
          <n-card
            v-for="(section, index) in pageSections"
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
                    <n-icon size="21" class="cursor-move mr-4">
                      <Icon icon="fa-solid:grip-lines" />
                    </n-icon>
                    <n-checkbox
                      v-model:checked="pageSectionsEnabled[section.slug]"
                      size="small"
                      class="mr-4"
                      @click.stop>
                      {{ t('display') }}
                    </n-checkbox>
                    <n-tag size="small" type="info">
                      {{ index + 1 }}
                    </n-tag>
                    <n-divider
                      vertical
                      :class="pickByTheme('!bg-zinc-400', '!bg-slate-500')">
                    </n-divider>
                    <span class="text-base">{{ tr(section.title) }}</span>
                  </div>
                </template>
                <template
                  v-for="(value, key) in editKeysToCamelCase(
                    section.dataStructure
                  )"
                  :key="key">
                  <n-card
                    v-if="String(key) === 'index'"
                    size="small"
                    class="mb-2">
                    <FormGenerator
                      :key="`${refreshKey}-${key}-form-1`"
                      v-model="data[section.slug][key]"
                      :items="value"
                      @update="(
                    value: any,
                    validate: () => Promise<boolean>
                  ) => {
                    formValueValidate1 = validate
                  }" />
                  </n-card>
                  <n-card
                    v-else
                    :title="tr(value.title)"
                    size="small"
                    class="mb-2">
                    <template #header-extra>
                      <n-button
                        quaternary
                        size="small"
                        @click="() => data[section.slug][key].push({})">
                        <template #icon>
                          <n-icon>
                            <Icon icon="carbon:add-alt" />
                          </n-icon>
                        </template>
                        {{ t('add') }}
                      </n-button>
                    </template>
                    <n-card
                      v-for="(item, i) in data[section.slug][key]"
                      :key="i"
                      :title="String(i + 1)"
                      size="small"
                      class="mb-2">
                      <template #header-extra>
                        <n-button
                          type="error"
                          size="small"
                          @click="() => data[section.slug][key].splice(i, 1)">
                          <template #icon>
                            <n-icon>
                              <Icon icon="carbon:trash-can" />
                            </n-icon>
                          </template>
                        </n-button>
                      </template>
                      <FormGenerator
                        :key="`${refreshKey}-${key}-${i}-form-2`"
                        v-model="data[section.slug][key][i]"
                        :items="value.items"
                        @update="(
                      value: any,
                      validate: () => Promise<boolean>
                    ) => {
                      formValueValidate2 = validate
                    }" />
                    </n-card>
                  </n-card>
                </template>
                <n-space>
                  <n-button
                    size="small"
                    type="error"
                    :secondary="isLightTheme"
                    @click="removeSection(section)">
                    <n-icon size="21">
                      <Icon icon="carbon:close" />
                    </n-icon>
                    {{ t('removeSection') }}
                  </n-button>
                  <n-divider
                    vertical
                    :class="pickByTheme('!bg-zinc-400', '!bg-slate-500')">
                  </n-divider>
                  <n-space align="center">
                    <span>{{ t('dataSourcePage') }}</span>
                    <n-select
                      :value="section.dataSourcePageId"
                      :options="
                    (section.pages || [] as any[])
                  "
                      :placeholder="t('select')"
                      :render-label="renderSelectLabel"
                      label-field="title"
                      value-field="id"
                      filterable
                      size="small"
                      class="!w-[225px]"
                      @update:value="(value: number) => confirmUpdateDataSourcePage(section, value)" />
                  </n-space>
                </n-space>
              </n-collapse-item>
            </n-collapse>
          </n-card>
        </Draggable>
        <n-card
          hoverable
          size="small"
          class="mb-2 !border-dashed !border-2"
          @click="openAddSectionsDialog()">
          <div class="flex items-center justify-center cursor-pointer gap-2">
            <n-icon size="20">
              <Icon icon="carbon:add-alt" />
            </n-icon>
            {{ t('addSection') }}
          </div>
        </n-card>
      </section>
      <section v-else>
        <n-card
          size="large"
          :class="`mb-2 !border-dashed !border-2 ${pickByTheme(
            '!border-zinc-300',
            '!border-zinc-600'
          )}`">
          <n-empty :description="t('noSectionOnThisPage')">
            <template #icon>
              <n-icon>
                <Icon icon="carbon:page-break" />
              </n-icon>
            </template>
            <template #extra>
              <div class="mt-4">
                <n-button size="small" @click="openAddSectionsDialog()">
                  <template #icon>
                    <n-icon>
                      <Icon icon="carbon:add-alt" />
                    </n-icon>
                  </template>
                  {{ t('addSection') }}
                </n-button>
              </div>
            </template>
          </n-empty>
        </n-card>
      </section>
      <div v-if="page" class="mt-2 text-xs">
        {{ t('dataRetrievalSlug') }}: <b>{{ page.slug }}</b>
      </div>
    </section>
  </CustomTransition>
  <n-modal
    v-model:show="addSectionsDialogVisible"
    :loading="isProceeding"
    preset="dialog"
    style="width: 600px"
    :bordered="false"
    :show-icon="false"
    :mask-closable="false"
    :title="t('addSections')"
    :positive-text="t('validate')"
    :negative-text="t('cancel')"
    @positive-click="submitSections"
    @negative-click="addSectionsDialogVisible = false">
    <section class="my-8">
      <n-scrollbar style="max-height: 400px">
        <n-card
          v-for="section in sections"
          :key="section.id"
          hoverable
          embedded
          size="small"
          class="mb-2 cursor-pointer"
          @click="toggleSectionSelection(section)">
          <div class="flex items-center justify-between">
            <span class="text-base">{{ tr(section.title) }}</span>
            <n-checkbox
              v-model:checked="isSectionChecked(section).value"
              size="medium">
            </n-checkbox>
          </div>
        </n-card>
      </n-scrollbar>
    </section>
  </n-modal>
</template>

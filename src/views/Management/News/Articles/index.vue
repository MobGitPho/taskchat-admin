<script setup lang="ts">
  import { formatDate, reformatDate } from '@/utils/chronos'
  import { AppConfig } from '@/utils/types'

  import { NewsArticleStatus } from '@/enums/news-article-status'
  import { ResponseErrorCode } from '@/enums/response-error-code'

  import { NewsArticleModel } from '@/models/news-article'
  import { UserModel } from '@/models/user'

  import {
    FormInst,
    FormRules,
    FormValidationError,
    NButton,
    NEllipsis,
    NIcon,
    NInput,
    NInputGroup,
    NTag,
  } from 'naive-ui'
  import type {
    DataTableColumns,
    DataTableRowKey,
    SelectOption,
  } from 'naive-ui'

  import { Icon } from '@iconify/vue'
  import { VNodeChild } from 'vue'

  const loadingBar = useLoadingBar()
  const message = useMessage()
  const dialog = useDialog()

  const { displayFormErrors, tr, pickByTheme, fileUrl } = useHelper()
  const { newsArticleStatus } = useNews()
  const { request } = useApi()

  const { tags, orderedCategories } = storeToRefs(useNewsStore())
  const { loadCategories, loadTags } = useNewsStore()

  const { t, locale } = useI18n()

  const authStore = useAuthStore()

  const appConfig = inject<AppConfig>('appConfig')

  // Filter data
  const filterCategoriesIds = ref<number[]>([])
  const filterTagsIds = ref<number[]>([])
  const filterMonths = ref<string[]>([])
  const filterStatus = ref<number>(0)

  const buildPath = (part: string) => {
    let path = `${part}&query=${search.value}&status=${filterStatus.value}`

    for (const id of filterCategoriesIds.value) {
      path += `&categories[]=${id}`
    }

    for (const id of filterTagsIds.value) {
      path += `&tags[]=${id}`
    }

    for (const month of filterMonths.value) {
      path += `&months[]=${month}`
    }

    return path
  }

  const search = ref<string>('')
  const searchInputRef = ref()
  const newsArticles = ref<NewsArticleModel[]>([])
  const administrators = ref<UserModel[]>([])
  const months = ref<{ value: string; label: string }[]>([])
  const nbNewsArticlesStatus = ref<Record<number, number>>({})
  const nbMyNewsArticles = ref(0)
  const nbNewsArticles = ref(0)
  const statusEditionDialogVisible = ref(false)
  const statusEditionItem = ref<NewsArticleModel | null>(null)
  const statusEditionValue = ref<NewsArticleStatus | null>(null)
  const isLoading = ref(false)
  const columns = computed<DataTableColumns<NewsArticleModel>>(() => [
    {
      type: 'selection',
    },
    {
      title: t('title'),
      key: 'title',
      resizable: true,
      width: 250,
      fixed: 'left',
      ellipsis: {
        tooltip: true,
      },
      render(row: NewsArticleModel) {
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
      title: t('summary'),
      key: 'summary',
      resizable: true,
      width: 200,
      render(row: NewsArticleModel) {
        return h(
          NEllipsis,
          {
            class: 'text-xs',
            lineClamp: 1,
            expandTrigger: 'click',
            tooltip: false,
          },
          {
            default: () => tr(row.summary),
          }
        )
      },
    },
    {
      title: t('categories'),
      key: 'categories',
      width: 150,
      render(row: NewsArticleModel) {
        return h(
          'div',
          {},
          {
            default: () =>
              row.categories
                ?.map((c) => c.name)
                .map((name) =>
                  h(
                    NTag,
                    { type: 'info', size: 'small', class: 'mr-1 mb-1' },
                    { default: () => tr(name) }
                  )
                ),
          }
        )
      },
    },
    {
      title: t('tags'),
      key: 'tags',
      width: 150,
      render(row: NewsArticleModel) {
        return h(
          'div',
          {},
          {
            default: () =>
              row.tags
                ?.map((c) => c.name)
                .map((name) =>
                  h(
                    NTag,
                    { type: 'primary', size: 'small', class: 'mr-1 mb-1' },
                    { default: () => tr(name) }
                  )
                ),
          }
        )
      },
    },
    {
      title: t('headline'),
      key: 'isHeadline',
      resizable: true,
      width: 150,
      ellipsis: {
        tooltip: true,
      },
      render(row: NewsArticleModel) {
        return h(
          NTag,
          { type: row.isHeadline ? 'success' : 'error', bordered: false },
          {
            default: () => (row.isHeadline ? t('yes') : t('no')),
          }
        )
      },
    },
    {
      title: t('author'),
      key: 'author',
      resizable: true,
      width: 150,
      ellipsis: {
        tooltip: true,
      },
      render(row: NewsArticleModel) {
        return h(
          'div',
          {},
          {
            default: () => row.author?.firstname + ' ' + row.author?.lastname,
          }
        )
      },
    },
    {
      title: t('lastEdition'),
      key: 'updatedAt',
      width: 125,
      render(row: NewsArticleModel) {
        return h(
          'div',
          {},
          {
            default: () =>
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              reformatDate(row.updatedAt!, { locale: locale.value }),
          }
        )
      },
    },
    {
      title: t('creation'),
      key: 'createdAt',
      width: 125,
      render(row: NewsArticleModel) {
        return h(
          'div',
          {},
          {
            default: () =>
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              reformatDate(row.createdAt!, { locale: locale.value }),
          }
        )
      },
    },
    {
      title: () => {
        return h(
          NInputGroup,
          {},
          {
            default: () => [
              h(NInput, {
                ref: searchInputRef,
                placeholder: t('search'),
                value: search.value,
                onInput: (value: string) => {
                  search.value = value

                  if (!search.value) {
                    init(
                      buildPath(
                        `/news-articles?pageSize=${pageSize.value}&page=${currentPage.value}`
                      )
                    )
                  }

                  // if (searchInputRef.value) searchInputRef.value.focus()
                },
                clearable: true,
              }),
              h(
                NButton,
                {
                  onClick: () => {
                    init(
                      buildPath(
                        `/news-articles?pageSize=${pageSize.value}&page=${currentPage.value}`
                      )
                    )
                  },
                },
                {
                  default: () =>
                    h(
                      NIcon,
                      {
                        color: 'white',
                      },
                      { default: () => h(Icon, { icon: 'carbon:search' }) }
                    ),
                }
              ),
            ],
          }
        )
      },
      key: 'actions',
      width: 225,
      render(row: NewsArticleModel) {
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
            },
            { default: () => t('edit') }
          ),
          h('div', {
            class: 'w-2',
          }),
          h(
            NButton,
            {
              size: 'small',
              type: 'info',
              onClick: () => {
                statusEditionItem.value = row
                statusEditionValue.value = row.status
                statusEditionDialogVisible.value = true
              },
              renderIcon: () =>
                h(NIcon, null, {
                  default: () => h(Icon, { icon: 'mdi:equal' }),
                }),
            },
            filterStatus.value == NewsArticleStatus.TRASH
              ? {}
              : { default: () => t('status') }
          ),
          h('div', {
            class: 'w-2',
          }),
          filterStatus.value == NewsArticleStatus.TRASH
            ? h(NButton, {
                size: 'small',
                type: 'error',
                onClick: () => {
                  dialog.warning({
                    title: t('confirm'),
                    content: t('confirmDeleteComment'),
                    positiveText: t('yes'),
                    negativeText: t('no'),
                    onPositiveClick: async () => {
                      loadingBar.start()

                      const task = await request({
                        url: `/news-articles/${row.id}`,
                        method: 'delete',
                      })

                      if (task.success) message.success(t('success'))
                      else message.error(t('anErrorOccurred'))

                      loadingBar.finish()

                      init(
                        buildPath(
                          `/news-articles?pageSize=${pageSize.value}&page=${currentPage.value}`
                        )
                      )
                    },
                  })
                },
                renderIcon: () =>
                  h(NIcon, null, {
                    default: () => h(Icon, { icon: 'carbon:trash-can' }),
                  }),
              })
            : null,
        ])
      },
      fixed: 'right',
    },
  ])

  // Pagination

  const total = ref(0)
  const pageSize = ref(10)
  const currentPage = ref(1)

  const handlePageChange = (value: number) => {
    init(buildPath(`/news-articles?pageSize=${pageSize.value}&page=${value}`))
  }

  const handlePageSizeChange = (value: number) => {
    pageSize.value = value
    init(buildPath(`/news-articles?pageSize=${pageSize.value}`))
  }

  // Initialization

  const init = async (url: string | null = null, loadAllData = false) => {
    isLoading.value = true
    loadingBar.start()

    const task = await request({
      url: url ? url : buildPath(`/news-articles?pageSize=${pageSize.value}`),
    })

    if (task.success && task.result) {
      total.value = task.result.data?.meta?.total || 0
      currentPage.value = task.result.data?.meta?.currentPage || 1

      newsArticles.value = task.result.data?.articles || []
    }

    if (loadAllData) {
      const task = await request({
        url: `/users/type/administrators`,
      })

      if (task.success && task.result) {
        administrators.value = task.result.data || []
      }

      const task2 = await request({
        url: `/news-articles/list/months`,
      })

      if (task2.success && task2.result) {
        months.value = (task2.result.data || []).map((item: string) => ({
          label: item,
          value: item,
        }))
      }

      const task3 = await request({
        url: `/count/news-articles`,
      })

      if (task3.success && task3.result) {
        nbNewsArticles.value = task3.result.data
      }

      const task4 = await request({
        url: `/count/news-articles/status/${NewsArticleStatus.DRAFT}`,
      })

      if (task4.success && task4.result) {
        nbNewsArticlesStatus.value[NewsArticleStatus.DRAFT] = task4.result.data
      }

      const task5 = await request({
        url: `/count/news-articles/status/${NewsArticleStatus.PUBLISHED}`,
      })

      if (task5.success && task5.result) {
        nbNewsArticlesStatus.value[NewsArticleStatus.PUBLISHED] =
          task5.result.data
      }

      const task6 = await request({
        url: `/count/news-articles/status/${NewsArticleStatus.PENDING}`,
      })

      if (task6.success && task6.result) {
        nbNewsArticlesStatus.value[NewsArticleStatus.PENDING] =
          task6.result.data
      }

      const task7 = await request({
        url: `/count/news-articles/status/${NewsArticleStatus.TRASH}`,
      })

      if (task7.success && task7.result) {
        nbNewsArticlesStatus.value[NewsArticleStatus.TRASH] = task7.result.data
      }

      const task8 = await request({
        url: `/count/news-articles/author/${authStore.userData?.id}`,
      })

      if (task8.success && task8.result) {
        nbMyNewsArticles.value = task8.result.data
      }

      await loadCategories()
      await loadTags()
    }

    cancelSelection()

    loadingBar.finish()
    isLoading.value = false
  }

  init(null, true)

  // Add & Edit news article

  const isProceeding = ref(false)
  const dialogVisible = ref(false)
  const tagsIds = ref<number[]>([])
  const initialTagsIds = ref<number[]>(tagsIds.value)
  const categoriesIds = ref<number[]>([])
  const initialCategoriesIds = ref<number[]>(categoriesIds.value)
  const currentEditItem = ref<NewsArticleModel | null>(null)
  const formRef = ref<FormInst | null>(null)
  const formValue = ref<NewsArticleModel>({
    authorId: authStore.userData?.id,
    publisherId: authStore.userData?.id,
    title: '',
    slug: '',
    summary: '',
    content: '{"fr":""}',
    featuredImage: '',
    featuredImageUrl: '',
    legend: '',
    allowComments: true,
    isHeadline: false,
    status: NewsArticleStatus.DRAFT,
    publishedAt: formatDate(new Date(), {
      outPattern: 'YYYY-MM-DD HH:mm:ss',
      locale: locale.value,
    }),
  })
  const initialFormValue = ref<NewsArticleModel>(formValue.value)
  const rules: FormRules = {
    title: [
      {
        required: true,
        message: t('fillRequired'),
      },
    ],
    slug: [
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
    summary: [
      {
        required: true,
        message: t('fillRequired'),
      },
    ],
    featuredImage: [
      {
        required: true,
        message: t('fillRequired'),
      },
    ],
    authorId: [
      {
        required: true,
        message: t('fillRequired'),
      },
    ],
    publisherId: [
      {
        required: true,
        message: t('fillRequired'),
      },
    ],
  }

  const saveBtnDisabled = computed(() => {
    return (
      _.isEqual(tagsIds.value, initialTagsIds.value) &&
      _.isEqual(categoriesIds.value, initialCategoriesIds.value) &&
      _.isEqual(formValue.value, initialFormValue.value)
    )
  })

  const openFormModal = (item: NewsArticleModel | null) => {
    currentEditItem.value = _.cloneDeep(item)

    if (item) {
      formValue.value = _.cloneDeep(item)

      tagsIds.value = item.tags?.map((item) => item.id as number) ?? []
      categoriesIds.value =
        item.categories?.map((item) => item.id as number) ?? []
    } else {
      formValue.value = {
        authorId: authStore.userData?.id,
        publisherId: authStore.userData?.id,
        title: '',
        slug: '',
        summary: '',
        content: '{"fr":""}',
        featuredImage: '',
        featuredImageUrl: '',
        legend: '',
        allowComments: true,
        isHeadline: false,
        status: NewsArticleStatus.DRAFT,
        publishedAt: formatDate(new Date(), {
          outPattern: 'YYYY-MM-DD HH:mm:ss',
          locale: locale.value,
        }),
      }

      tagsIds.value = []
      categoriesIds.value = []
    }

    initialTagsIds.value = _.cloneDeep(tagsIds.value)
    initialCategoriesIds.value = _.cloneDeep(categoriesIds.value)
    initialFormValue.value = _.cloneDeep(formValue.value)

    dialogVisible.value = true
  }

  const submit = async () => {
    formRef.value?.validate(
      async (errors: Array<FormValidationError> | undefined) => {
        if (!errors) {
          if (currentEditItem.value) {
            loadingBar.start()
            isProceeding.value = true

            const task = await request({
              url: `/news-articles/${currentEditItem.value.id}`,
              method: 'put',
              data: {
                authorId: formValue.value.authorId,
                publisherId: formValue.value.publisherId,
                title: formValue.value.title,
                slug: formValue.value.slug,
                summary: formValue.value.summary,
                content: formValue.value.content,
                featuredImage: formValue.value.featuredImage,
                legend: formValue.value.legend,
                allowComments: formValue.value.allowComments,
                isHeadline: formValue.value.isHeadline,
                status: formValue.value.status,
                publishedAt: formValue.value.publishedAt,
                categories: categoriesIds.value,
                tags: tagsIds.value,
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
            }

            isProceeding.value = false
            loadingBar.finish()

            init(
              buildPath(
                `/news-articles?pageSize=${pageSize.value}&page=${currentPage.value}`
              )
            )

            dialogVisible.value = false
          } else {
            loadingBar.start()
            isProceeding.value = true

            const task = await request({
              url: `/news-articles`,
              method: 'post',
              data: {
                authorId: formValue.value.authorId,
                publisherId: formValue.value.publisherId,
                title: formValue.value.title,
                slug: formValue.value.slug,
                summary: formValue.value.summary,
                content: formValue.value.content,
                featuredImage: formValue.value.featuredImage,
                legend: formValue.value.legend,
                allowComments: formValue.value.allowComments,
                isHeadline: formValue.value.isHeadline,
                status: formValue.value.status,
                publishedAt: formValue.value.publishedAt,
                categories: categoriesIds.value,
                tags: tagsIds.value,
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
            }

            isProceeding.value = false
            loadingBar.finish()

            init(
              buildPath(
                `/news-articles?pageSize=${pageSize.value}&page=${currentPage.value}`
              )
            )

            dialogVisible.value = false
          }
        }
      }
    )

    return false
  }

  const submitStatus = async () => {
    if (statusEditionItem.value) {
      loadingBar.start()
      isProceeding.value = true

      const task = await request({
        url: `/news-articles/${statusEditionItem.value.id}`,
        method: 'put',
        data: {
          status: statusEditionValue.value,
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
      }

      init(
        buildPath(
          `/news-articles?pageSize=${pageSize.value}&page=${currentPage.value}`
        ),
        true
      )

      isProceeding.value = false
      loadingBar.finish()
    }

    statusEditionItem.value = null
    statusEditionValue.value = null
    statusEditionDialogVisible.value = false
  }

  // Render Select Label

  const renderCategorySelectLabel = (option: SelectOption): VNodeChild => {
    return [
      option.parentId
        ? h(
            NIcon,
            {
              style: {
                verticalAlign: '-0.15em',
                marginRight: '4px',
              },
            },
            {
              default: () => h(Icon, { icon: 'mdi:arrow-right' }),
            }
          )
        : null,
      `${tr(option.name)}`,
    ]
  }

  const renderTagSelectLabel = (option: SelectOption): VNodeChild => {
    return h('span', {}, { default: () => `${tr(option.name) || option.name}` })
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

  // Handle slug

  const slugFormatter = (value: string) => {
    const regex = /^[a-z0-9_-]*$/

    return regex.test(value)
  }

  watch(
    () => formValue.value.title,
    (value) => {
      if (currentEditItem.value) {
        //
      } else {
        formValue.value.slug = slugify(tr(value), {
          trim: true,
          lower: true,
          strict: true,
        })
      }
    }
  )

  // Featured Image

  const folder = 'articles'
  const pickerVisible = ref(false)

  const saveFeaturedImage = async (url: string) => {
    formValue.value.featuredImage = url

    pickerVisible.value = false
  }

  const clearFeaturedImage = () => {
    formValue.value.featuredImage = ''
  }

  // Multiselect
  const tableKey = ref(uuidv4())
  const checkedRowKeys = ref<DataTableRowKey[]>([])

  const rowKey = (row: NewsArticleModel) => row.id

  const handleCheck = (rowKeys: DataTableRowKey[]) => {
    checkedRowKeys.value = rowKeys
  }

  function cancelSelection() {
    checkedRowKeys.value = []

    tableKey.value = uuidv4()
  }

  // Delete selection

  const deleteSelection = async () => {
    if (checkedRowKeys.value.length) {
      dialog.warning({
        title: t('confirm'),
        content: t('deleteSelectionWarningMessage', [
          checkedRowKeys.value.length,
        ]),
        positiveText: t('yes'),
        negativeText: t('no'),
        onPositiveClick: async () => {
          isProceeding.value = true
          loadingBar.start()

          for (let i = 0; i < checkedRowKeys.value.length; i++) {
            const task = await request({
              url: `/news-articles/${checkedRowKeys.value[i]}`,
              method: 'delete',
            })

            if (task.success) {
              //
            }
          }

          init(null, true)

          loadingBar.finish()
          isProceeding.value = false

          message.success(t('success'))

          cancelSelection()
        },
      })
    } else message.warning(t('noItemSelected'))

    return false
  }

  // Edit selection status

  const editSelectionStatus = async () => {
    if (checkedRowKeys.value.length) {
      dialog.warning({
        title: t('confirm'),
        content: t('editSelectionStatusWarningMessage', [
          checkedRowKeys.value.length,
        ]),
        positiveText: t('yes'),
        negativeText: t('no'),
        onPositiveClick: async () => {
          isProceeding.value = true
          loadingBar.start()

          for (let i = 0; i < checkedRowKeys.value.length; i++) {
            const task = await request({
              url: `/news-articles/${checkedRowKeys.value[i]}`,
              method: 'put',
              data: {
                status: statusEditionValue.value,
              },
            })

            if (task.success) {
              //
            }
          }

          init(null, true)

          loadingBar.finish()
          isProceeding.value = false
          statusEditionDialogVisible.value = false

          message.success(t('success'))

          cancelSelection()
        },
      })
    } else message.warning(t('noItemSelected'))

    return false
  }
</script>

<template>
  <MountedTeleport to="#add-article-action">
    <section v-if="checkedRowKeys.length" class="flex items-center gap-3">
      <span>{{ t('nbItemsSelected', [checkedRowKeys.length]) }}</span>
      <n-button
        v-if="filterStatus == NewsArticleStatus.TRASH"
        type="error"
        size="small"
        @click="deleteSelection">
        <template #icon>
          <n-icon>
            <Icon icon="carbon:trash-can" />
          </n-icon>
        </template>
        {{ t('delete') }}
      </n-button>
      <n-button
        type="info"
        size="small"
        @click="
          () => {
            statusEditionItem = null
            statusEditionValue = null
            statusEditionDialogVisible = true
          }
        ">
        <template #icon>
          <n-icon>
            <Icon icon="mdi:equal" />
          </n-icon>
        </template>
        {{ t('editStatus') }}
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
      <n-select
        v-model:value="filterTagsIds"
        :render-label="renderTagSelectLabel"
        :placeholder="t('tags')"
        :options="(tags as any[])"
        max-tag-count="responsive"
        filterable
        multiple
        label-field="name"
        value-field="id"
        class="!w-[200px]"
        @update:value="init()">
        <template #action>
          <n-checkbox
            size="large"
            class="w-full"
            :default-checked="
              tags.length && filterTagsIds.length === tags.length
            "
            @update:checked="
            (checked: boolean) => {
              if (checked) {
                filterTagsIds = tags
                  .map((t) => t.id)
                  .filter((id) => id) as number[]
              } else {
                filterTagsIds = []
              }

              init()
            }
          ">
            {{ t('selectAll') }}
          </n-checkbox>
        </template>
      </n-select>
      <n-select
        v-model:value="filterCategoriesIds"
        :render-label="renderCategorySelectLabel"
        :options="(orderedCategories as any[])"
        :placeholder="t('categories')"
        max-tag-count="responsive"
        filterable
        multiple
        label-field="name"
        value-field="id"
        class="!w-[250px]"
        @update:value="init()">
        <template #action>
          <n-checkbox
            size="large"
            class="w-full"
            :default-checked="
              orderedCategories.length &&
              filterCategoriesIds.length === orderedCategories.length
            "
            @update:checked="
            (checked: boolean) => {
              if (checked) {
                filterCategoriesIds = orderedCategories
                  .map((o) => o.id)
                  .filter((id) => id) as number[]
              } else {
                filterCategoriesIds = []
              }

              init()
            }
          ">
            {{ t('selectAll') }}
          </n-checkbox>
        </template>
      </n-select>
      <n-button type="primary" @click="openFormModal(null)">
        <template #icon>
          <n-icon>
            <Icon icon="carbon:add-alt" />
          </n-icon>
        </template>
        {{ t('addArticle') }}
      </n-button>
    </section>
  </MountedTeleport>
  <n-card size="small" class="mb-5">
    <div class="flex justify-end">
      <n-radio-group
        v-model:value="filterStatus"
        name="filterstatusradiobuttongroup"
        size="medium"
        :disabled="!!checkedRowKeys.length"
        @update:value="init()">
        <n-radio-button :value="0">
          {{ t('all') }}&nbsp;
          <span v-if="nbNewsArticles"> ({{ nbNewsArticles }}) </span>
        </n-radio-button>
        <n-radio-button :value="10">
          {{ t('myArticles') }}&nbsp;
          <span v-if="nbMyNewsArticles"> ({{ nbMyNewsArticles }}) </span>
        </n-radio-button>
        <n-radio-button
          v-for="status in newsArticleStatus"
          :key="status.value"
          :value="status.value">
          {{ status.label }}&nbsp;
          <span v-if="nbNewsArticlesStatus[status.value]">
            ({{ nbNewsArticlesStatus[status.value] }})
          </span>
        </n-radio-button>
      </n-radio-group>
    </div>
  </n-card>
  <NaiveMobileTableAdapter>
    <n-data-table
      :key="tableKey"
      :columns="columns"
      :data="newsArticles"
      :loading="isLoading"
      :single-line="false"
      :scroll-x="1500"
      :row-key="(rowKey as any)"
      pagination-behavior-on-filter="first"
      size="small"
      striped
      @update:checked-row-keys="handleCheck" />
  </NaiveMobileTableAdapter>
  <n-pagination
    v-model:page="currentPage"
    class="mt-5 justify-end"
    show-size-picker
    :page-size="pageSize"
    :page-sizes="[6, 10, 24, 36, 48]"
    :page-count="Math.ceil(total / pageSize)"
    @update:page="handlePageChange"
    @update:page-size="handlePageSizeChange" />
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
    @submit="saveFeaturedImage" />
  <n-modal
    v-model:show="statusEditionDialogVisible"
    preset="card"
    style="width: 500px"
    :bordered="false"
    :mask-closable="false"
    :close-on-esc="false"
    :title="t('editStatus')">
    <n-spin :show="isProceeding">
      <div class="flex justify-center">
        <n-radio-group
          v-model:value="statusEditionValue"
          name="filterstatusradiobuttongroup"
          size="large"
          @update:value="
            () => {
              if (checkedRowKeys.length) {
                editSelectionStatus()
              } else {
                submitStatus()
              }
            }
          ">
          <n-radio-button
            v-for="status in newsArticleStatus"
            :key="status.value"
            :value="status.value"
            size="large">
            {{ status.label }}
          </n-radio-button>
        </n-radio-group>
      </div>
    </n-spin>
  </n-modal>
  <NFullscreenModal v-model="dialogVisible" class="w-full">
    <template #header>
      <div class="text-base">
        <n-text depth="1">{{
          currentEditItem ? t('editArticle') : t('addArticle')
        }}</n-text>
      </div>
    </template>
    <template #header-extra>
      <n-space class="mr-10" align="center">
        <n-button
          type="success"
          :title="t('save')"
          :loading="isLoading || isProceeding"
          :disabled="saveBtnDisabled"
          @click="submit()">
          <template #icon>
            <n-icon>
              <Icon icon="carbon:save" />
            </n-icon>
          </template>
          {{ t('save') }}
        </n-button>
      </n-space>
    </template>

    <section class="px-10 mt-20">
      <n-form
        ref="formRef"
        :model="formValue"
        :rules="rules"
        :show-require-mark="false"
        size="medium">
        <n-grid cols="5" :x-gap="14" :y-gap="12" item-responsive>
          <n-grid-item span="0:5 400:5 600:2 800:2">
            <n-form-item :label="t('title')" path="title">
              <I18nInput
                v-model="formValue.title"
                :placeholder="t('title')"
                :selector-span="4"
                class="w-full"
                sync />
            </n-form-item>
            <n-form-item :label="t('slug')" path="slug">
              <n-input
                v-model:value="formValue.slug"
                :placeholder="t('slug')"
                :allow-input="slugFormatter"
                class="w-full" />
            </n-form-item>
            <n-grid x-gap="12" :span="24">
              <n-form-item-gi :span="12" :label="t('status')" path="status">
                <n-select
                  v-model:value="formValue.status"
                  :placeholder="t('status')"
                  :options="newsArticleStatus as any[]"
                  class="w-full" />
              </n-form-item-gi>
              <n-form-item-gi :span="12" :label="t('author')" path="authorId">
                <n-select
                  v-model:value="formValue.authorId"
                  :placeholder="t('author')"
                  :options="(administrators as any[])"
                  label-field="fullname"
                  value-field="id"
                  class="w-full" />
              </n-form-item-gi>
            </n-grid>
            <n-form-item
              v-show="formValue.status === NewsArticleStatus.PUBLISHED"
              :label="t('publicationDate')"
              path="publishedAt">
              <n-date-picker
                v-model:formatted-value="formValue.publishedAt"
                value-format="yyyy-MM-dd HH:mm:ss"
                format="dd MMMM yyyy - HH:mm"
                type="datetime"
                class="w-full" />
            </n-form-item>
            <n-form-item :label="t('featuredImage')" path="featuredImage">
              <n-card>
                <section class="w-full text-center">
                  <div
                    class="cursor-pointer w-full h-[200px] flex items-center justify-center rounded-sm"
                    :style="`
                      border: 1px dashed ${pickByTheme('green', 'white')};
                      background-image: url('${fileUrl(
                        formValue.featuredImageUrl ||
                          formValue.featuredImage ||
                          ''
                      )}');
                      background-position: center;
                      background-size: cover
                    `"
                    @click="pickerVisible = true">
                    <n-icon v-if="!formValue.featuredImage" :size="64">
                      <Icon icon="carbon:image" class="text-gray-400" />
                    </n-icon>
                  </div>
                  <n-button
                    v-if="formValue.featuredImage"
                    class="!mt-5"
                    quaternary
                    @click="clearFeaturedImage()">
                    <template #icon>
                      <n-icon>
                        <Icon icon="carbon:trash-can" />
                      </n-icon>
                    </template>
                    {{ t('clear') }}
                  </n-button>
                </section>
              </n-card>
            </n-form-item>
            <n-form-item :label="t('legend')" path="legend">
              <I18nInput
                v-model="formValue.legend"
                :placeholder="t('legend')"
                :selector-span="4"
                class="w-full"
                sync />
            </n-form-item>
          </n-grid-item>
          <n-grid-item span="0:5 400:5 600:3 800:3">
            <n-form-item :label="t('summary')" path="summary">
              <I18nInput
                v-model="formValue.summary"
                :placeholder="t('summary')"
                :selector-span="3"
                type="textarea"
                class="w-full"
                :autosize="{
                  minRows: 3,
                  maxRows: 4,
                }"
                sync />
            </n-form-item>
            <n-form-item :label="t('content')" path="content">
              <I18nInput
                v-model="formValue.content"
                should-not-group-editor-when-full
                :placeholder="t('content')"
                :selector-span="3"
                type="editor"
                class="w-full"
                sync />
            </n-form-item>
            <n-form-item :label="t('categories')" path="categories">
              <n-select
                v-model:value="categoriesIds"
                :render-label="renderCategorySelectLabel"
                :placeholder="t('categories')"
                :options="(orderedCategories as any[])"
                max-tag-count="responsive"
                filterable
                multiple
                label-field="name"
                value-field="id"
                class="w-full" />
            </n-form-item>
            <n-form-item :label="t('tags')" path="tags">
              <n-select
                v-model:value="tagsIds"
                :render-label="renderTagSelectLabel"
                :placeholder="t('tags')"
                :options="(tags as any[])"
                max-tag-count="responsive"
                filterable
                multiple
                tag
                label-field="name"
                value-field="id"
                class="w-full" />
            </n-form-item>
            <n-grid x-gap="12" :span="24">
              <n-form-item-gi
                :show-label="false"
                :span="12"
                path="allowComments">
                <n-checkbox v-model:checked="formValue.allowComments">
                  {{ t('allowComments') }}
                </n-checkbox>
              </n-form-item-gi>
              <n-form-item-gi :show-label="false" :span="12" path="isHeadline">
                <n-checkbox v-model:checked="formValue.isHeadline">
                  {{ t('headline') }}
                </n-checkbox>
              </n-form-item-gi>
            </n-grid>
          </n-grid-item>
        </n-grid>
      </n-form>
    </section>
  </NFullscreenModal>
</template>

<style scoped>
  ::v-deep(.ck-editor__editable) {
    min-height: 150px !important;
  }
</style>

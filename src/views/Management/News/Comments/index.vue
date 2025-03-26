<script setup lang="ts">
  import { reformatDate } from '@/utils/chronos'

  import { ResponseErrorCode } from '@/enums/response-error-code'

  import { NewsArticleModel } from '@/models/news-article'
  import { NewsCommentModel } from '@/models/news-comment'

  import {
    FormInst,
    FormItemRule,
    FormRules,
    FormValidationError,
    NButton,
    NEllipsis,
    NIcon,
    NInput,
    NInputGroup,
    NPopselect,
    NTag,
  } from 'naive-ui'
  import type { DataTableColumns } from 'naive-ui'

  import { Icon } from '@iconify/vue'

  const loadingBar = useLoadingBar()
  const message = useMessage()
  const dialog = useDialog()

  const { displayFormErrors, mergeArrays, tr } = useHelper()
  const { request } = useApi()

  const { t, locale } = useI18n()

  const search = ref<string>('')
  const searchInputRef = ref()
  const newsComments = ref<NewsCommentModel[]>([])
  const isLoading = ref(false)
  const columns = computed<DataTableColumns<NewsCommentModel>>(() => [
    {
      title: t('content'),
      key: 'content',
      resizable: true,
      width: 300,
      fixed: 'left',
      sortOrder: false,
      sorter: 'default',
      render(row: NewsCommentModel) {
        return h(
          NEllipsis,
          {
            class: 'text-xs',
            lineClamp: 1,
            expandTrigger: 'click',
            tooltip: false,
          },
          {
            default: () => row.content,
          }
        )
      },
    },
    {
      title: t('name'),
      key: 'name',
      resizable: true,
      width: 150,
      ellipsis: {
        tooltip: true,
      },
    },
    {
      title: t('article'),
      key: 'article',
      resizable: true,
      width: 250,
      ellipsis: {
        tooltip: true,
      },
      render(row: NewsCommentModel) {
        return h(
          'div',
          {},
          {
            default: () => tr(row.article?.title),
          }
        )
      },
      sortOrder: false,
      sorter: 'default',
    },
    {
      title: t('email'),
      key: 'email',
      resizable: true,
      width: 150,
      ellipsis: {
        tooltip: true,
      },
    },
    {
      title: t('status'),
      key: 'isActive',
      width: 100,
      render(row: NewsCommentModel) {
        return h(
          NTag,
          {
            type: row.isActive ? 'success' : 'error',
            bordered: false,
          },
          {
            default: () => (row.isActive ? t('published') : t('unpublished')),
          }
        )
      },
      sortOrder: false,
      sorter: 'default',
    },
    {
      title: t('lastEdition'),
      key: 'updatedAt',
      width: 125,
      render(row: NewsCommentModel) {
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
      render(row: NewsCommentModel) {
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
                      `/news-comments?pageSize=${pageSize.value}&page=${currentPage.value}&query=${search.value}`
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
                      `/news-comments?pageSize=${pageSize.value}&page=${currentPage.value}&query=${search.value}`
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
      width: 200,
      render(row: NewsCommentModel) {
        return h('div', { class: 'flex justify-end items-center w-full' }, [
          // eslint-disable-next-line no-constant-condition
          false
            ? h(
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
              )
            : h(
                NPopselect,
                {
                  value: row.isActive ? 1 : 0,
                  'onUpdate:value': async (newValue: boolean) => {
                    loadingBar.start()
                    isProceeding.value = true

                    const task = await request({
                      url: `/news-comments/${row.id}`,
                      method: 'put',
                      data: {
                        isActive: newValue,
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

                      init(
                        `/news-comments?pageSize=${pageSize.value}&page=${currentPage.value}&query=${search.value}`
                      )
                    }

                    isProceeding.value = false
                    loadingBar.finish()
                  },
                  trigger: 'click',
                  placement: 'left',
                  options: [
                    {
                      label: t('published'),
                      value: 1,
                    },
                    {
                      label: t('unpublished'),
                      value: 0,
                    },
                  ],
                },
                {
                  default: () => [
                    h(
                      NButton,
                      {
                        size: 'small',
                        type: 'warning',
                        renderIcon: () =>
                          h(NIcon, null, {
                            default: () =>
                              h(Icon, {
                                icon: 'carbon:certificate-check',
                              }),
                          }),
                      },
                      { default: () => t('status') }
                    ),
                  ],
                }
              ),
          h('div', {
            class: 'w-2',
          }),
          h(NButton, {
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
                    url: `/news-comments/${row.id}`,
                    method: 'delete',
                  })

                  if (task.success) message.success(t('success'))
                  else message.error(t('anErrorOccurred'))

                  loadingBar.finish()

                  init(
                    `/news-comments?pageSize=${pageSize.value}&page=${currentPage.value}&query=${search.value}`
                  )
                },
              })
            },
            renderIcon: () =>
              h(NIcon, null, {
                default: () => h(Icon, { icon: 'carbon:trash-can' }),
              }),
          }),
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
    init(
      `/news-comments?pageSize=${pageSize.value}&page=${value}&query=${search.value}`
    )
  }

  const handlePageSizeChange = (value: number) => {
    pageSize.value = value
    init(`/news-comments?pageSize=${pageSize.value}&query=${search.value}`)
  }

  const init = async (url: string | null = null, loadAllData = false) => {
    isLoading.value = true
    loadingBar.start()

    const task = await request({
      url: url
        ? url
        : `/news-comments?pageSize=${pageSize.value}&query=${search.value}`,
    })

    if (task.success && task.result) {
      total.value = task.result.data?.meta?.total || 0
      currentPage.value = task.result.data?.meta?.currentPage || 1

      newsComments.value = task.result.data?.comments || []
    }

    if (loadAllData) {
      //
    }

    loadingBar.finish()
    isLoading.value = false
  }

  init(null, true)

  // Add & Edit news comment

  const isProceeding = ref(false)
  const dialogVisible = ref(false)
  const currentEditItem = ref<NewsCommentModel | null>(null)
  const formRef = ref<FormInst | null>(null)
  const formValue = ref<NewsCommentModel>({
    name: '',
    email: '',
    content: '',
    isActive: true,
    articleId: undefined,
  })
  const rules: FormRules = {
    name: [
      {
        required: true,
        message: t('fillRequired'),
      },
    ],
    email: [
      {
        required: true,
        message: t('fillRequired'),
      },
      {
        trigger: ['input'],
        validator(rule: FormItemRule, value: string) {
          if (value && !_v.isEmail(value)) {
            return new Error(t('invalidEmail'))
          }

          return true
        },
      },
    ],
    content: [
      {
        required: true,
        message: t('fillRequired'),
      },
    ],
    articleId: [
      {
        required: true,
        message: t('fillRequired'),
      },
    ],
  }

  const openFormModal = (item: NewsCommentModel | null) => {
    currentEditItem.value = _.cloneDeep(item)

    if (item) {
      formValue.value = _.cloneDeep(item)
    } else {
      formValue.value = {
        name: '',
        email: '',
        content: '',
        isActive: true,
        articleId: undefined,
      }
    }

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
              url: `/news-comments/${currentEditItem.value.id}`,
              method: 'put',
              data: {
                name: formValue.value.name,
                email: formValue.value.email,
                content: formValue.value.content,
                isActive: formValue.value.isActive,
                articleId: formValue.value.articleId,
              },
            })

            if (task.success) message.success(t('success'))
            else message.error(t('anErrorOccurred'))

            isProceeding.value = false
            loadingBar.finish()

            init(
              `/news-comments?pageSize=${pageSize.value}&page=${currentPage.value}&query=${search.value}`
            )

            dialogVisible.value = false
          } else {
            loadingBar.start()
            isProceeding.value = true

            const task = await request({
              url: `/news-comments`,
              method: 'post',
              data: {
                name: formValue.value.name,
                email: formValue.value.email,
                content: formValue.value.content,
                isActive: formValue.value.isActive,
                articleId: formValue.value.articleId,
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
              `/news-comments?pageSize=${pageSize.value}&page=${currentPage.value}&query=${search.value}`
            )

            dialogVisible.value = false
          }
        }
      }
    )

    return false
  }

  // Search News Article
  const isSearchingNewsArticle = ref(false)
  const newsArticlesList = ref<NewsArticleModel[]>([])
  const newsArticlesFound = ref<NewsArticleModel[]>([])

  const handleNewsArticleSearch = async (query: string) => {
    if (!query.length) {
      newsArticlesFound.value = []
      return
    }

    isSearchingNewsArticle.value = true

    const task = await request({
      url: `/news-articles/search/${query}`,
    })

    if (task.success && task.result) {
      newsArticlesFound.value = task.result.data
    }

    isSearchingNewsArticle.value = false
  }

  watch(
    () => formValue.value.articleId,
    async (nv: number | undefined) => {
      if (!nv) return

      isSearchingNewsArticle.value = true

      const task = await request({
        url: `/news-articles/list`,
        method: 'post',
        data: { ids: [nv] },
      })

      if (task.success && task.result) {
        newsArticlesList.value = task.result.data
      }

      isSearchingNewsArticle.value = false
    }
  )

  const newsArticles = computed(() => {
    return mergeArrays(
      newsArticlesList.value,
      newsArticlesFound.value,
      'id'
    ) as NewsArticleModel[]
  })
</script>

<template>
  <MountedTeleport to="#add-comment-action">
    <n-button v-show="false" type="primary" @click="openFormModal(null)">
      <template #icon>
        <n-icon size="18">
          <Icon icon="carbon:add-alt" />
        </n-icon>
      </template>
      {{ t('addComment') }}
    </n-button>
  </MountedTeleport>
  <NaiveMobileTableAdapter>
    <n-data-table
      pagination-behavior-on-filter="first"
      :columns="columns"
      :data="newsComments"
      :loading="isLoading"
      :single-line="false"
      :scroll-x="1500"
      striped />
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
  <n-modal
    v-model:show="dialogVisible"
    :loading="isProceeding"
    preset="dialog"
    style="width: 500px"
    :show-icon="false"
    :bordered="false"
    :mask-closable="false"
    :title="currentEditItem ? t('editComment') : t('addComment')"
    :positive-text="t('validate')"
    :negative-text="t('cancel')"
    @positive-click="submit"
    @negative-click="dialogVisible = false">
    <n-form
      ref="formRef"
      class="mt-5"
      :model="formValue"
      :rules="rules"
      :show-require-mark="false"
      size="medium">
      <n-form-item :label="t('name')" path="name">
        <n-input
          v-model:value="formValue.name"
          :placeholder="t('name')"
          class="w-full" />
      </n-form-item>
      <n-form-item :label="t('email')" path="email">
        <n-input
          v-model:value="formValue.email"
          :placeholder="t('email')"
          class="w-full" />
      </n-form-item>
      <n-form-item :label="t('article')" path="article">
        <n-select
          v-model:value="formValue.articleId"
          :options="(newsArticles as any[])"
          :placeholder="t('article')"
          :loading="isSearchingNewsArticle"
          filterable
          clearable
          remote
          value-field="id"
          label-field="fullname"
          class="w-full"
          @search="handleNewsArticleSearch" />
      </n-form-item>
      <n-form-item :label="t('content')" path="content">
        <n-input
          v-model:value="formValue.content"
          :placeholder="t('content')"
          type="textarea"
          class="w-full" />
      </n-form-item>
      <n-form-item :label="t('status')" path="isActive">
        <n-switch v-model:value="formValue.isActive" size="small">
          <template #checked> {{ t('published') }} </template>
          <template #unchecked> {{ t('unpublished') }} </template>
        </n-switch>
      </n-form-item>
    </n-form>
  </n-modal>
</template>

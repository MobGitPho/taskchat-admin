<script setup lang="ts">
  import { reformatDate } from '@/utils/chronos'

  import { ResponseErrorCode } from '@/enums/response-error-code'

  import { NewsTagModel } from '@/models/news-tag'

  import {
    FormInst,
    FormRules,
    FormValidationError,
    NButton,
    NIcon,
    NInput,
    NTag,
  } from 'naive-ui'
  import type { DataTableColumns, PaginationProps } from 'naive-ui'

  import { Icon } from '@iconify/vue'

  const loadingBar = useLoadingBar()
  const message = useMessage()
  const dialog = useDialog()

  const { displayFormErrors, tr } = useHelper()
  const { request } = useApi()

  const { t, locale } = useI18n()

  const isLoading = ref(false)
  const newsTags = ref<NewsTagModel[]>([])
  const search = ref<string>('')
  const searchInputRef = ref()
  const pagination = {
    pageSize: 12,
    prefix: ({ itemCount }: PaginationProps) => {
      return h(
        'div',
        { class: 'font-bold' },
        { default: () => `${t('total')}: ${itemCount}` }
      )
    },
  }

  const columns: DataTableColumns<NewsTagModel> = [
    {
      title: t('name'),
      key: 'name',
      resizable: true,
      width: 150,
      ellipsis: {
        tooltip: true,
      },
      fixed: 'left',
      sortOrder: false,
      sorter: 'default',
      render(row: NewsTagModel) {
        return h(
          'div',
          {},
          {
            default: () => tr(row.name),
          }
        )
      },
    },
    {
      title: t('description'),
      key: 'description',
      resizable: true,
      width: 200,
      ellipsis: {
        tooltip: true,
      },
      render(row: NewsTagModel) {
        return h(
          'small',
          {},
          {
            default: () => tr(row.description),
          }
        )
      },
    },
    {
      title: t('status'),
      key: 'isActive',
      width: 100,
      render(row: NewsTagModel) {
        return h(
          NTag,
          {
            type: row.isActive ? 'success' : 'error',
            bordered: false,
          },
          {
            default: () => (row.isActive ? t('visible') : t('hidden')),
          }
        )
      },
      sortOrder: false,
      sorter: 'default',
    },
    {
      title: t('article_s'),
      key: 'articlesCount',
      width: 90,
      render(row: NewsTagModel) {
        return h(
          NTag,
          {
            type: 'info',
            bordered: false,
          },
          {
            default: () => row.articlesCount,
          }
        )
      },
      sortOrder: false,
      sorter: 'default',
    },
    {
      title: t('updateAt'),
      key: 'updatedAt',
      width: 125,
      render(row: NewsTagModel) {
        return h(
          'div',
          {},
          {
            default: () =>
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              reformatDate(row.updatedAt!, {
                locale: locale.value,
                outPattern: 'DD MMMM YYYY',
              }),
          }
        )
      },
    },
    {
      title: t('createdAt'),
      key: 'createdAt',
      width: 125,
      render(row: NewsTagModel) {
        return h(
          'div',
          {},
          {
            default: () =>
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              reformatDate(row.createdAt!, {
                locale: locale.value,
                outPattern: 'DD MMMM YYYY',
              }),
          }
        )
      },
    },
    {
      title: () => {
        return h(
          NInput,
          {
            ref: searchInputRef,
            placeholder: t('search'),
            value: search.value,
            onInput: (value: string) => {
              search.value = value
            },
          },
          {
            suffix: () =>
              h(
                NIcon,
                {},
                { default: () => h(Icon, { icon: 'carbon:search' }) }
              ),
          }
        )
      },
      key: 'actions',
      width: 150,
      render(row: NewsTagModel) {
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
            }
            // { default: () => t('edit') }
          ),
          h('div', { class: 'w-2' }),
          h(
            NButton,
            {
              size: 'small',
              type: 'error',
              onClick: () => {
                dialog.warning({
                  title: t('confirm'),
                  content: t('confirmDeleteNewsTag'),
                  positiveText: t('yes'),
                  negativeText: t('no'),
                  onPositiveClick: async () => {
                    const task = await request({
                      method: 'delete',
                      url: `/news-tags/${row.id}`,
                    })

                    if (task.success) {
                      message.success(t('success'))

                      init()
                    } else message.error(t('anErrorOccurred'))
                  },
                })
              },
              renderIcon: () =>
                h(NIcon, null, {
                  default: () => h(Icon, { icon: 'carbon:trash-can' }),
                }),
            }
            // { default: () => t('delete') }
          ),
        ])
      },
      fixed: 'right',
    },
  ]

  const searchedNewsTags = computed(() => {
    if (!search.value) return newsTags.value

    const searchedData = newsTags.value.filter(
      (newsTag) =>
        newsTag.name.toLowerCase().includes(search.value.toLowerCase()) ||
        newsTag.description?.toLowerCase().includes(search.value.toLowerCase())
    )

    if (searchInputRef.value) searchInputRef.value.focus()

    return searchedData
  })

  const init = async () => {
    isLoading.value = true

    const task = await request({
      url: '/news-tags',
    })

    if (task.success && task.result) {
      newsTags.value = task.result.data
    }

    isLoading.value = false
  }

  init()

  // Add & Edit courseType

  const isProceeding = ref(false)
  const dialogVisible = ref(false)
  const currentEditItem = ref<NewsTagModel | null>(null)
  const formRef = ref<FormInst | null>(null)
  const formValue = ref<NewsTagModel>({
    name: '',
    description: '',
    isActive: true,
  })
  const rules: FormRules = {
    name: [
      {
        required: true,
        message: t('fillRequired'),
      },
    ],
    description: [
      {
        required: true,
        message: t('fillRequired'),
      },
    ],
  }

  const openFormModal = (item: NewsTagModel | null) => {
    currentEditItem.value = _.cloneDeep(item)

    if (item) {
      formValue.value = _.cloneDeep(item)
    } else {
      formValue.value = {
        name: '',
        description: '',
        isActive: true,
      }
    }

    dialogVisible.value = true
  }

  const submit = async () => {
    formRef.value?.validate(
      async (errors: Array<FormValidationError> | undefined) => {
        if (!errors) {
          if (currentEditItem.value) {
            if (
              currentEditItem.value.name !== formValue.value.name &&
              newsTags.value.findIndex((c) => c.name == formValue.value.name) >
                -1
            ) {
              message.error(t('sameTagNameMessage'))
            } else {
              loadingBar.start()
              isProceeding.value = true

              const data = {
                name: formValue.value.name,
                description: formValue.value.description,
                isActive: formValue.value.isActive,
              } as NewsTagModel

              const task = await request({
                method: 'put',
                url: `/news-tags/${currentEditItem.value.id}`,
                data,
              })

              if (task.success && task.result.data) {
                message.success(t('success'))

                init()
              }

              isProceeding.value = false
              loadingBar.finish()

              dialogVisible.value = false
            }
          } else {
            if (
              newsTags.value.findIndex((c) => c.name == formValue.value.name) >
              -1
            ) {
              message.error(t('sameTagNameMessage'))
            } else {
              loadingBar.start()
              isProceeding.value = true

              const data = {
                name: formValue.value.name,
                description: formValue.value.description,
                isActive: formValue.value.isActive,
              } as NewsTagModel

              const task = await request({
                method: 'post',
                url: '/news-tags',
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
              }

              isProceeding.value = false
              loadingBar.finish()

              dialogVisible.value = false
            }
          }
        }
      }
    )

    return false
  }
</script>

<template>
  <MountedTeleport to="#add-tag-action">
    <n-button type="primary" @click="openFormModal(null)">
      <template #icon>
        <n-icon size="18">
          <Icon icon="carbon:add-alt" />
        </n-icon>
      </template>
      {{ t('addTag') }}
    </n-button>
  </MountedTeleport>
  <NaiveMobileTableAdapter>
    <n-data-table
      :columns="columns"
      :data="searchedNewsTags"
      :pagination="pagination"
      :loading="isLoading"
      :single-line="false"
      :scroll-x="1000"
      size="small"
      striped />
  </NaiveMobileTableAdapter>
  <n-modal
    v-model:show="dialogVisible"
    :loading="isProceeding"
    preset="dialog"
    style="width: 450px"
    :bordered="false"
    :show-icon="false"
    :mask-closable="false"
    :title="currentEditItem ? t('editTag') : t('addTag')"
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
      <n-form-item :label="t('status')" path="isActive">
        <n-switch v-model:value="formValue.isActive" size="small">
          <template #checked> {{ t('visible') }} </template>
          <template #unchecked> {{ t('hidden') }} </template>
        </n-switch>
      </n-form-item>
    </n-form>
  </n-modal>
</template>

<style scoped lang="scss"></style>

<script setup lang="ts">
  import { reformatDate } from '@/utils/chronos'

  import { ResponseErrorCode } from '@/enums/response-error-code'

  import { NewsletterEmailModel } from '@/models/newsletter-email'

  import {
    FormInst,
    FormRules,
    FormValidationError,
    NButton,
    NIcon,
    NInput,
  } from 'naive-ui'
  import type {
    DataTableColumns,
    DataTableRowKey,
    FormItemRule,
    MessageReactive,
    PaginationProps,
  } from 'naive-ui'

  import { Icon } from '@iconify/vue'

  const loadingBar = useLoadingBar()
  const message = useMessage()
  const dialog = useDialog()

  const { displayFormErrors } = useHelper()
  const { request } = useApi()

  const { t, locale } = useI18n()

  const isLoading = ref(false)
  const newsletterEmails = ref<NewsletterEmailModel[]>([])
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

  const columns: DataTableColumns<NewsletterEmailModel> = [
    {
      type: 'selection',
    },
    {
      title: t('email'),
      key: 'email',
      resizable: true,
      width: 200,
      ellipsis: {
        tooltip: true,
      },
      render(row: NewsletterEmailModel) {
        return h(
          'div',
          {},
          {
            default: () => row.email,
          }
        )
      },
    },
    {
      title: t('updateAt'),
      key: 'updatedAt',
      width: 125,
      render(row: NewsletterEmailModel) {
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
      render(row: NewsletterEmailModel) {
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
      render(row: NewsletterEmailModel) {
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
                  content: t('confirmDeleteEmailAddress'),
                  positiveText: t('yes'),
                  negativeText: t('no'),
                  onPositiveClick: async () => {
                    const task = await request({
                      method: 'delete',
                      url: `/newsletter/emails/${row.id}`,
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

  const searchedNewsletterEmails = computed(() => {
    if (!search.value) return newsletterEmails.value

    const searchedData = newsletterEmails.value.filter((newsletterEmail) =>
      newsletterEmail.email.toLowerCase().includes(search.value.toLowerCase())
    )

    if (searchInputRef.value) searchInputRef.value.focus()

    return searchedData
  })

  const init = async () => {
    isLoading.value = true

    const task = await request({
      url: '/newsletter/emails',
    })

    if (task.success && task.result) {
      newsletterEmails.value = task.result.data
    }

    isLoading.value = false
  }

  init()

  // Add & Edit email

  const isProceeding = ref(false)
  const dialogVisible = ref(false)
  const currentEditItem = ref<NewsletterEmailModel | null>(null)
  const formRef = ref<FormInst | null>(null)
  const formValue = ref<NewsletterEmailModel>({
    email: '',
  })
  const rules: FormRules = {
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
  }

  const openFormModal = (item: NewsletterEmailModel | null) => {
    currentEditItem.value = _.cloneDeep(item)

    if (item) {
      formValue.value = _.cloneDeep(item)
    } else {
      formValue.value = {
        email: '',
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
              currentEditItem.value.email !== formValue.value.email &&
              newsletterEmails.value.findIndex(
                (c) => c.email == formValue.value.email
              ) > -1
            ) {
              message.error(t('sameEmailAddressMessage'))
            } else {
              loadingBar.start()
              isProceeding.value = true

              const data = {
                email: formValue.value.email,
              } as NewsletterEmailModel

              const task = await request({
                method: 'put',
                url: `/newsletter/emails/${currentEditItem.value.id}`,
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
              newsletterEmails.value.findIndex(
                (c) => c.email == formValue.value.email
              ) > -1
            ) {
              message.error(t('sameEmailAddressMessage'))
            } else {
              loadingBar.start()
              isProceeding.value = true

              const data = {
                email: formValue.value.email,
              } as NewsletterEmailModel

              const task = await request({
                method: 'post',
                url: '/newsletter/emails',
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

  let messageReactive: MessageReactive | null = null

  const removeMessage = () => {
    if (messageReactive) {
      messageReactive.destroy()
      messageReactive = null
    }
  }

  onBeforeUnmount(removeMessage)

  const formatJson = (filterVal: any, jsonData: any) => {
    return jsonData.map((v: any) =>
      filterVal.map((j: any) => {
        return v[j]
      })
    )
  }

  // Download table data

  const downloadData = () => {
    messageReactive = message.info(t('pleaseBePatient'), {
      duration: 0,
      type: 'loading',
    })

    import('@/utils/export2excel').then((excel) => {
      var tHeader = ['no', 'email', 'createdAt', 'updatedAt']

      const list = _.sortBy(
        newsletterEmails.value.map((item, i) => ({ no: i + 1, ...item })),
        'email'
      )
      const data = formatJson(tHeader, list)

      try {
        excel.export_json_to_excel({
          // @ts-ignore
          header: tHeader,
          data,
          filename: `newsletter_emails_${Date.now().toString()}`,
          autoWidth: true,
          bookType: 'xlsx',
        })

        removeMessage()
      } catch (error) {
        removeMessage()

        message.error(t('anErrorOccurred'))
      }
    })
  }

  const downloadDataTemplate = () => {
    messageReactive = message.info(t('pleaseBePatient'), {
      duration: 0,
      type: 'loading',
    })

    import('@/utils/export2excel').then((excel) => {
      var tHeader = ['email']

      const data = formatJson(tHeader, [
        {
          email: 'adresse@email.com',
        },
      ])

      try {
        excel.export_json_to_excel({
          // @ts-ignore
          header: tHeader,
          data,
          filename: 'newsletter_emails_template',
          autoWidth: true,
          bookType: 'xlsx',
        })

        removeMessage()
      } catch (error) {
        removeMessage()

        message.error(t('anErrorOccurred'))
      }
    })
  }

  // Import
  const importFromExcelFileDialog = ref(false)

  const importFromExcelFile = async ({
    results,
  }: {
    header: any
    results: any
  }) => {
    isProceeding.value = true
    loadingBar.start()

    if (!messageReactive) {
      messageReactive = message.info(t('pleaseBePatient'), {
        duration: 0,
        type: 'loading',
      })
    }

    for (let i = 0; i < results.length; i++) {
      if (
        results[i]['email'] &&
        newsletterEmails.value.findIndex(
          (d) => d.email == results[i]['email']
        ) == -1
      ) {
        if (messageReactive) {
          messageReactive.content = `${t('pleaseBePatient')}: ${i} ${t(
            'task_s'
          )} / ${results.length}`
        }

        await request({
          method: 'post',
          url: '/newsletter/emails',
          data: {
            email: results[i]['email'],
          },
        })
      }
    }

    await init()

    removeMessage()

    loadingBar.finish()
    isProceeding.value = false

    importFromExcelFileDialog.value = false
  }

  // Multiselect
  const tableKey = ref(uuidv4())
  const checkedRowKeys = ref<DataTableRowKey[]>([])

  const rowKey = (row: NewsletterEmailModel) => row.id

  const handleCheck = (rowKeys: DataTableRowKey[]) => {
    checkedRowKeys.value = rowKeys
  }

  const cancelSelection = () => {
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
              url: `/newsletter/emails/${checkedRowKeys.value[i]}`,
              method: 'delete',
            })

            if (task.success) {
              //
            }
          }

          init()

          loadingBar.finish()
          isProceeding.value = false

          message.success(t('success'))

          cancelSelection()
        },
      })
    } else message.warning(t('noItemSelected'))

    return false
  }
</script>

<template>
  <MountedTeleport to="#alt-action">
    <n-space>
      <n-popconfirm @positive-click="downloadData()">
        <template #trigger>
          <n-button type="success">
            <template #icon>
              <n-icon size="18"><Icon icon="mdi:upload" /></n-icon>
            </template>
            {{ t('export') }}
          </n-button>
        </template>
        {{ t('exportDataInExcelFile') }}
      </n-popconfirm>

      <n-button type="info" @click="importFromExcelFileDialog = true">
        <template #icon>
          <n-icon size="18"><Icon icon="mdi:download" /></n-icon>
        </template>
        {{ t('import') }}
      </n-button>

      <n-button type="primary" @click="openFormModal(null)">
        <template #icon>
          <n-icon size="18"><Icon icon="carbon:add-alt" /></n-icon>
        </template>
        {{ t('addEmailAddress') }}
      </n-button>
    </n-space>
  </MountedTeleport>
  <CustomTransition name="slide-fade" appear>
    <n-card v-if="checkedRowKeys.length" class="my-2" size="small" embedded>
      <n-space align="center" justify="space-between">
        <span>{{ t('nbItemsSelected', [checkedRowKeys.length]) }}</span>
        <n-space align="center" justify="space-between">
          <n-button type="error" size="small" @click="deleteSelection">
            <template #icon>
              <n-icon>
                <Icon icon="carbon:trash-can" />
              </n-icon>
            </template>
            {{ t('delete') }}
          </n-button>
          <n-button type="warning" size="small" @click="cancelSelection">
            <template #icon>
              <n-icon>
                <Icon icon="mdi:close" />
              </n-icon>
            </template>
            {{ t('cancelSelection') }}
          </n-button>
        </n-space>
      </n-space>
    </n-card>
  </CustomTransition>
  <NaiveMobileTableAdapter>
    <n-data-table
      :key="tableKey"
      :columns="columns"
      :data="searchedNewsletterEmails"
      :pagination="pagination"
      :loading="isLoading"
      :single-line="false"
      :scroll-x="800"
      :row-key="(rowKey as any)"
      size="small"
      striped
      @update:checked-row-keys="handleCheck" />
  </NaiveMobileTableAdapter>
  <n-modal
    v-model:show="dialogVisible"
    :loading="isProceeding"
    preset="dialog"
    style="width: 400px"
    :show-icon="false"
    :bordered="false"
    :mask-closable="false"
    :title="currentEditItem ? t('editEmailAddress') : t('addEmailAddress')"
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
      <n-form-item :label="t('emailAddress')" path="email">
        <n-input
          v-model:value="formValue.email"
          :placeholder="t('emailAddress')"
          class="w-full" />
      </n-form-item>
    </n-form>
  </n-modal>
  <n-modal
    v-model:show="importFromExcelFileDialog"
    :loading="isProceeding"
    preset="dialog"
    style="width: 600px"
    :bordered="false"
    :mask-closable="false"
    :title="t('import')">
    <UploadExcel class="my-5" :on-success="importFromExcelFile" />
    <div class="flex items-center justify-center">
      <n-button type="info" size="small" @click="downloadDataTemplate()">
        <template #icon>
          <n-icon><Icon icon="mdi:download" /></n-icon>
        </template>
        {{ t('downloadDataTemplate') }}
      </n-button>
    </div>
  </n-modal>
</template>

<style scoped lang="scss"></style>

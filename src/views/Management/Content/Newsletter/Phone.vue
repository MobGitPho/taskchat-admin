<script setup lang="ts">
  import { reformatDate } from '@/utils/chronos'

  import { ResponseErrorCode } from '@/enums/response-error-code'

  import { NewsletterPhoneModel } from '@/models/newsletter-phone'

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
  import { isValidPhoneNumber } from 'libphonenumber-js'

  const loadingBar = useLoadingBar()
  const message = useMessage()
  const dialog = useDialog()

  const { displayFormErrors } = useHelper()
  const { request } = useApi()

  const { t, locale } = useI18n()

  const isLoading = ref(false)
  const newsletterPhones = ref<NewsletterPhoneModel[]>([])
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

  const columns: DataTableColumns<NewsletterPhoneModel> = [
    {
      type: 'selection',
    },
    {
      title: t('phone'),
      key: 'phone',
      resizable: true,
      width: 200,
      ellipsis: {
        tooltip: true,
      },
      render(row: NewsletterPhoneModel) {
        return h(
          'div',
          {},
          {
            default: () => row.phone,
          }
        )
      },
    },
    {
      title: t('updateAt'),
      key: 'updatedAt',
      width: 125,
      render(row: NewsletterPhoneModel) {
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
      render(row: NewsletterPhoneModel) {
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
      render(row: NewsletterPhoneModel) {
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
                  content: t('confirmDeletePhoneNumber'),
                  positiveText: t('yes'),
                  negativeText: t('no'),
                  onPositiveClick: async () => {
                    const task = await request({
                      method: 'delete',
                      url: `/newsletter/phones/${row.id}`,
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

  const searchedNewsletterPhones = computed(() => {
    if (!search.value) return newsletterPhones.value

    const searchedData = newsletterPhones.value.filter((newsletterPhone) =>
      newsletterPhone.phone.toLowerCase().includes(search.value.toLowerCase())
    )

    if (searchInputRef.value) searchInputRef.value.focus()

    return searchedData
  })

  const init = async () => {
    isLoading.value = true

    const task = await request({
      url: '/newsletter/phones',
    })

    if (task.success && task.result) {
      newsletterPhones.value = task.result.data
    }

    isLoading.value = false
  }

  init()

  // Add & Edit phone

  const isProceeding = ref(false)
  const dialogVisible = ref(false)
  const currentEditItem = ref<NewsletterPhoneModel | null>(null)
  const formRef = ref<FormInst | null>(null)
  const formValue = ref<NewsletterPhoneModel>({
    phone: '',
  })
  const rules: FormRules = {
    phone: [
      {
        required: true,
        message: t('fillRequired'),
      },
      {
        trigger: ['input'],
        validator(rule: FormItemRule, value: string) {
          if (value && !isValidPhoneNumber(value)) {
            return new Error(t('invalidNumber'))
          }

          return true
        },
      },
    ],
  }

  const openFormModal = (item: NewsletterPhoneModel | null) => {
    currentEditItem.value = _.cloneDeep(item)

    if (item) {
      formValue.value = _.cloneDeep(item)
    } else {
      formValue.value = {
        phone: '',
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
              currentEditItem.value.phone !==
                formValue.value.phone.replace(/\s+/g, '') &&
              newsletterPhones.value.findIndex(
                (c) => c.phone == formValue.value.phone.replace(/\s+/g, '')
              ) > -1
            ) {
              message.error(t('samePhoneNumberMessage'))
            } else {
              loadingBar.start()
              isProceeding.value = true

              const data = {
                phone: formValue.value.phone.replace(/\s+/g, ''),
              } as NewsletterPhoneModel

              const task = await request({
                method: 'put',
                url: `/newsletter/phones/${currentEditItem.value.id}`,
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
              newsletterPhones.value.findIndex(
                (c) => c.phone == formValue.value.phone.replace(/\s+/g, '')
              ) > -1
            ) {
              message.error(t('samePhoneNumberMessage'))
            } else {
              loadingBar.start()
              isProceeding.value = true

              const data = {
                phone: formValue.value.phone.replace(/\s+/g, ''),
              } as NewsletterPhoneModel

              const task = await request({
                method: 'post',
                url: '/newsletter/phones',
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
      var tHeader = ['no', 'phone', 'createdAt', 'updatedAt']

      const list = _.sortBy(
        newsletterPhones.value.map((item, i) => ({ no: i + 1, ...item })),
        'phone'
      )
      const data = formatJson(tHeader, list)

      try {
        excel.export_json_to_excel({
          // @ts-ignore
          header: tHeader,
          data,
          filename: `newsletter_phones_${Date.now().toString()}`,
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
      var tHeader = ['phone']

      const data = formatJson(tHeader, [
        {
          phone: '+22899999999',
        },
      ])

      try {
        excel.export_json_to_excel({
          // @ts-ignore
          header: tHeader,
          data,
          filename: 'newsletter_phones_template',
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
        results[i]['phone'] &&
        newsletterPhones.value.findIndex(
          (d) =>
            d.phone.replace(/\s+/g, '') ==
            results[i]['phone'].replace(/\s+/g, '')
        ) == -1
      ) {
        if (messageReactive) {
          messageReactive.content = `${t('pleaseBePatient')}: ${i} ${t(
            'task_s'
          )} / ${results.length}`
        }

        await request({
          method: 'post',
          url: '/newsletter/phones',
          data: {
            phone: results[i]['phone'].replace(/\s+/g, ''),
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

  const rowKey = (row: NewsletterPhoneModel) => row.id

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
              url: `/newsletter/phones/${checkedRowKeys.value[i]}`,
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
        {{ t('addPhoneNumber') }}
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
      :data="searchedNewsletterPhones"
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
    :title="currentEditItem ? t('editPhoneNumber') : t('addPhoneNumber')"
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
      <n-form-item :label="t('phone')" path="phone">
        <VueTelInputWrapper v-model="formValue.phone" />
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

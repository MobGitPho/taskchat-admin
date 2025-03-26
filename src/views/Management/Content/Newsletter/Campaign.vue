<script setup lang="ts">
  import { formatDate, reformatDate } from '@/utils/chronos'

  import { ResponseErrorCode } from '@/enums/response-error-code'

  import { NewsletterCampaignModel } from '@/models/newsletter-campaign'
  import { NewsletterEmailModel } from '@/models/newsletter-email'
  import { NewsletterPhoneModel } from '@/models/newsletter-phone'

  import {
    FormInst,
    FormRules,
    FormValidationError,
    NButton,
    NIcon,
    NInput,
  } from 'naive-ui'
  import type { DataTableColumns, PaginationProps } from 'naive-ui'

  import { Icon } from '@iconify/vue'

  const loadingBar = useLoadingBar()
  const message = useMessage()
  const dialog = useDialog()

  const appInformationStore = useAppInformationStore()

  const { displayFormErrors, ckEditorToolbarItems } = useHelper()
  const { request } = useApi()

  const { t, locale } = useI18n()

  const isLoading = ref(false)
  const newsletterEmails = ref<NewsletterEmailModel[]>([])
  const newsletterPhones = ref<NewsletterPhoneModel[]>([])
  const newsletterRecipients = ref<{ recipient: string; type: string }[]>([])
  const newsletterCampaigns = ref<NewsletterCampaignModel[]>([])
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

  const columns: DataTableColumns<NewsletterCampaignModel> = [
    {
      title: t('title'),
      key: 'title',
      resizable: true,
      width: 200,
      ellipsis: {
        tooltip: true,
      },
      fixed: 'left',
      sortOrder: false,
      sorter: 'default',
      render(row: NewsletterCampaignModel) {
        return h(
          'div',
          {},
          {
            default: () => row.title,
          }
        )
      },
    },
    {
      title: t('subject'),
      key: 'subject',
      resizable: true,
      width: 250,
      ellipsis: {
        tooltip: true,
      },
      render(row: NewsletterCampaignModel) {
        return h(
          'small',
          {},
          {
            default: () => row.subject,
          }
        )
      },
    },
    {
      title: t('numberOfRecipients'),
      key: 'recipients',
      width: 200,
      render(row: NewsletterCampaignModel) {
        return h(
          'div',
          {},
          {
            default: () => row.recipients.length,
          }
        )
      },
      sortOrder: false,
      sorter: 'default',
    },
    {
      title: t('updateAt'),
      key: 'updatedAt',
      width: 150,
      render(row: NewsletterCampaignModel) {
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
      width: 150,
      render(row: NewsletterCampaignModel) {
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
      width: 175,
      render(row: NewsletterCampaignModel) {
        return h('div', { class: 'flex justify-end items-center w-full' }, [
          h(NButton, {
            size: 'small',
            type: 'primary',
            title: t('history'),
            onClick: () => {
              currentEditItem.value = row

              historyDialogVisible.value = true
            },
            renderIcon: () =>
              h(NIcon, null, {
                default: () => h(Icon, { icon: 'mdi:history' }),
              }),
          }),
          h('div', { class: 'w-2' }),
          h(NButton, {
            size: 'small',
            type: 'info',
            title: t('launchCampaign'),
            onClick: () => {
              const d = dialog.info({
                title: t('launchCampaign'),
                content: t('confirmLaunchCampaign', [row.recipients.length]),
                closeOnEsc: false,
                maskClosable: false,
                positiveText: t('yes'),
                negativeText: t('cancel'),
                onPositiveClick: async () => {
                  d.loading = true

                  const task1 = await request({
                    url: `/email`,
                    method: 'post',
                    data: {
                      title: row.title,
                      subject: row.subject,
                      content: row.content,
                      recipients: row.recipients.filter((r) => _v.isEmail(r)),
                      tags: [],
                    },
                  })

                  const phone = (
                    appInformationStore.getSettingValue(
                      'phone',
                      'string'
                    ) as string
                  )?.split(',')[0]

                  const task2 = await request({
                    url: `/sms`,
                    method: 'post',
                    data: {
                      from: phone.replace(/\s+/g, ''),
                      content: row.rawContent,
                      recipients: row.recipients.filter((r) => !_v.isEmail(r)),
                    },
                  })

                  if (task1.failure && task1.error) {
                    switch (task1.error?.response?.data?.errorCode) {
                      case ResponseErrorCode.FORM_INVALID_DATA:
                        message.error(t('invalidData'))
                        break
                      default:
                        message.error(t('sendingFailed'))
                    }
                  } else if (task2.failure && task2.error) {
                    switch (task2.error?.response?.data?.errorCode) {
                      case ResponseErrorCode.FORM_INVALID_DATA:
                        message.error(t('invalidData'))
                        break
                      default:
                        message.error(t('sendingFailed'))
                    }
                  } else {
                    const history = row.history || []

                    history.push({
                      id: uuidv4(),
                      date: formatDate(new Date(), {
                        locale: locale.value,
                        outPattern: 'DD MMMM YYYY - HH:mm',
                      }),
                      report:
                        'Email: ' +
                        task1.result.message +
                        ' Phone: ' +
                        task2.result.message,
                    })

                    const task3 = await request({
                      method: 'put',
                      url: `/newsletter/campaigns/${row.id}`,
                      data: {
                        history,
                      },
                    })

                    if (task3.success && task3.result.data) {
                      message.success(t('success'))

                      init()
                    } else message.error(t('anErrorOccurred'))
                  }

                  d.loading = false
                },
              })
            },
            renderIcon: () =>
              h(NIcon, null, {
                default: () => h(Icon, { icon: 'mdi:send' }),
              }),
          }),
          h('div', { class: 'w-2' }),
          h(NButton, {
            size: 'small',
            type: 'warning',
            title: t('edit'),
            onClick: () => {
              openFormModal(row)
            },
            renderIcon: () =>
              h(NIcon, null, {
                default: () => h(Icon, { icon: 'carbon:edit' }),
              }),
          }),
          h('div', { class: 'w-2' }),
          h(NButton, {
            size: 'small',
            type: 'error',
            title: t('delete'),
            onClick: () => {
              dialog.warning({
                title: t('confirm'),
                content: t('confirmDeleteCampaign'),
                positiveText: t('yes'),
                negativeText: t('no'),
                onPositiveClick: async () => {
                  const task = await request({
                    method: 'delete',
                    url: `/newsletter/campaigns/${row.id}`,
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
          }),
        ])
      },
      fixed: 'right',
    },
  ]

  const searchedNewsletterCampaigns = computed(() => {
    if (!search.value) return newsletterCampaigns.value

    const searchedData = newsletterCampaigns.value.filter(
      (campaign) =>
        campaign.title.toLowerCase().includes(search.value.toLowerCase()) ||
        campaign.subject.toLowerCase().includes(search.value.toLowerCase())
    )

    if (searchInputRef.value) searchInputRef.value.focus()

    return searchedData
  })

  const init = async (loadAllData = false) => {
    isLoading.value = true

    const task = await request({
      url: '/newsletter/campaigns',
    })

    if (task.success && task.result) {
      newsletterCampaigns.value = task.result.data
    }

    if (loadAllData) {
      const task1 = await request({
        url: '/newsletter/emails',
      })

      if (task1.success && task1.result) {
        newsletterEmails.value = task1.result.data
      }

      const task2 = await request({
        url: '/newsletter/phones',
      })

      if (task2.success && task2.result) {
        newsletterPhones.value = task2.result.data
      }

      newsletterRecipients.value = [
        ...newsletterEmails.value.map((item) => ({
          recipient: item.email,
          type: 'email',
        })),
        ...newsletterPhones.value.map((item) => ({
          recipient: item.phone,
          type: 'phone',
        })),
      ]
    }

    isLoading.value = false
  }

  init(true)

  // Add & Edit courseType

  const isProceeding = ref(false)
  const dialogVisible = ref(false)
  const historyDialogVisible = ref(false)
  const currentEditItem = ref<NewsletterCampaignModel | null>(null)
  const formRef = ref<FormInst | null>(null)
  const formValue = ref<NewsletterCampaignModel>({
    title: '',
    subject: '',
    content: '',
    rawContent: '',
    recipients: [],
  })
  const rules: FormRules = {
    title: [
      {
        required: true,
        message: t('fillRequired'),
      },
    ],
    subject: [
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
    rawContent: [
      {
        required: true,
        message: t('fillRequired'),
      },
    ],
    recipients: [
      {
        required: true,
        message: t('fillRequired'),
      },
    ],
  }

  const openFormModal = (item: NewsletterCampaignModel | null) => {
    currentEditItem.value = _.cloneDeep(item)

    if (item) {
      formValue.value = _.cloneDeep(item)
    } else {
      formValue.value = {
        title: '',
        subject: '',
        content: '',
        rawContent: '',
        recipients: [],
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
              currentEditItem.value.title !== formValue.value.title &&
              newsletterCampaigns.value.findIndex(
                (c) => c.title == formValue.value.title
              ) > -1
            ) {
              message.error(t('sameCampaignTitleMessage'))
            } else {
              loadingBar.start()
              isProceeding.value = true

              const data = {
                title: formValue.value.title,
                subject: formValue.value.subject,
                content: formValue.value.content,
                rawContent: formValue.value.rawContent,
                recipients: formValue.value.recipients,
              } as NewsletterCampaignModel

              const task = await request({
                method: 'put',
                url: `/newsletter/campaigns/${currentEditItem.value.id}`,
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
              newsletterCampaigns.value.findIndex(
                (c) => c.title == formValue.value.title
              ) > -1
            ) {
              message.error(t('sameCampaignTitleMessage'))
            } else {
              loadingBar.start()
              isProceeding.value = true

              const data = {
                title: formValue.value.title,
                subject: formValue.value.subject,
                content: formValue.value.content,
                rawContent: formValue.value.rawContent,
                recipients: formValue.value.recipients,
              } as NewsletterCampaignModel

              const task = await request({
                method: 'post',
                url: '/newsletter/campaigns',
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

  const arraysHaveSameValues = (arr1: string[], arr2: string[]) =>
    _.isEqual(arr1.slice().sort(), arr2.slice().sort())
</script>

<template>
  <MountedTeleport to="#alt-action">
    <n-button type="primary" @click="openFormModal(null)">
      <template #icon>
        <n-icon size="18"><Icon icon="carbon:add-alt" /></n-icon>
      </template>
      {{ t('addCampaign') }}
    </n-button>
  </MountedTeleport>
  <NaiveMobileTableAdapter>
    <n-data-table
      :columns="columns"
      :data="searchedNewsletterCampaigns"
      :pagination="pagination"
      :loading="isLoading"
      :single-line="false"
      :scroll-x="1300"
      size="small"
      striped />
  </NaiveMobileTableAdapter>
  <n-modal
    v-model:show="dialogVisible"
    :loading="isProceeding"
    preset="dialog"
    style="width: 600px"
    :bordered="false"
    :show-icon="false"
    :mask-closable="false"
    :title="currentEditItem ? t('editCampaign') : t('addCampaign')"
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
      <n-form-item :label="t('title')" path="title">
        <n-input
          v-model:value="formValue.title"
          :placeholder="t('title')"
          class="w-full" />
      </n-form-item>
      <n-form-item :label="t('subject')" path="subject">
        <n-input
          v-model:value="formValue.subject"
          :placeholder="t('subject')"
          type="textarea"
          class="w-full"
          :rows="2" />
      </n-form-item>
      <n-form-item :label="t('content')" path="content">
        <div class="w-full">
          <CKEditorWrapper
            v-model="formValue.content"
            :toolbar-items="ckEditorToolbarItems"
            :placeholder="t('content')"
            :should-not-group-when-full="false"
            enable-upload />
        </div>
      </n-form-item>
      <n-form-item :label="t('rawContent')" path="rawContent">
        <n-input
          v-model:value="formValue.rawContent"
          :placeholder="t('rawContentPlaceholder')"
          type="textarea"
          class="w-full"
          :rows="5" />
      </n-form-item>
      <n-form-item :label="t('recipients')" path="recipients">
        <n-select
          v-model:value="formValue.recipients"
          :options="(newsletterRecipients as any[])"
          :placeholder="t('recipients')"
          :loading="isLoading"
          max-tag-count="responsive"
          filterable
          multiple
          value-field="recipient"
          label-field="recipient"
          class="w-full">
          <template #action>
            <n-checkbox
              size="large"
              class="w-full"
              :default-checked="
                newsletterRecipients.length &&
                arraysHaveSameValues(
                  formValue.recipients,
                  newsletterRecipients
                    .filter((s) => s.type == 'email')
                    .map((s) => s.recipient)
                )
              "
              @update:checked="
                (checked: boolean) => {
                  if (checked) {
                    formValue.recipients = newsletterRecipients
                    .filter((s) => s.type == 'email')
                    .map((s) => s.recipient)
                  } else {
                    formValue.recipients = formValue.recipients
                    .filter((s) => !_v.isEmail(s))
                  }
                }
              ">
              {{ t('selectOnlyEmails') }}
            </n-checkbox>
            <div class="h-2"></div>
            <n-checkbox
              size="large"
              class="w-full"
              :default-checked="
                newsletterRecipients.length &&
                arraysHaveSameValues(
                  formValue.recipients,
                  newsletterRecipients
                    .filter((s) => s.type == 'phone')
                    .map((s) => s.recipient)
                )
              "
              @update:checked="
                (checked: boolean) => {
                  if (checked) {
                    formValue.recipients = newsletterRecipients
                    .filter((s) => s.type == 'phone')
                    .map((s) => s.recipient)
                  } else {
                    formValue.recipients = formValue.recipients
                    .filter((s) => _v.isEmail(s))
                  }
                }
              ">
              {{ t('selectOnlyPhoneNumbers') }}
            </n-checkbox>
            <div class="h-2"></div>
            <n-checkbox
              size="large"
              class="w-full"
              :default-checked="
                newsletterRecipients.length &&
                formValue.recipients.length === newsletterRecipients.length
              "
              @update:checked="
                (checked: boolean) => {
                  if (checked) {
                    formValue.recipients = newsletterRecipients
                    .filter((s) => s.recipient)
                    .map((s) => s.recipient)
                  } else {
                    formValue.recipients = []
                  }
                }
              ">
              {{ t('selectAll') }}
            </n-checkbox>
          </template>
        </n-select>
      </n-form-item>
    </n-form>
  </n-modal>
  <n-modal
    v-model:show="historyDialogVisible"
    :loading="isProceeding"
    preset="card"
    style="width: 500px"
    :bordered="false"
    :show-icon="false"
    :mask-closable="false"
    :title="t('history')">
    <n-scrollbar
      v-if="currentEditItem?.history?.length"
      style="max-height: 400px">
      <n-list hoverable>
        <n-list-item
          v-for="item in currentEditItem?.history.slice().reverse()"
          :key="item.id">
          <n-thing :title="item.date" content-style="margin-top: 10px;">
            {{ item.report }}
          </n-thing>
        </n-list-item>
      </n-list>
    </n-scrollbar>
    <n-empty v-else :description="t('noCampaignHistory')" class="mb-10 mt-5" />
  </n-modal>
</template>

<style scoped lang="scss"></style>

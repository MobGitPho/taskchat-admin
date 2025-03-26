<script setup lang="ts">
  import { ResponseErrorCode } from '@/enums/response-error-code'

  import { AutoCompleteInst } from 'naive-ui'

  import jsPDF from 'jspdf'

  interface Props {
    modelValue: boolean
    title?: string
  }

  const props = withDefaults(defineProps<Props>(), {
    title: '',
  })
  const emits = defineEmits(['update:modelValue'])

  const { t } = useI18n()
  const { request } = useApi()
  const { logo, isSmScreen } = useHelper()

  const isLoading = ref(false)
  const size = ref<any>(null)

  const dialogVisible = computed({
    get() {
      return props.modelValue
    },
    set(value) {
      emits('update:modelValue', value)
    },
  })

  const message = useMessage()
  const loadingBar = useLoadingBar()
  const appInformationStore = useAppInformationStore()

  const download = (print = false) => {
    isLoading.value = true
    loadingBar.start()

    const page = document.getElementById('page')

    const doc = new jsPDF({
      orientation: 'p',
      format: 'a4',
      unit: 'pt',
    })

    const dWidth = doc.internal.pageSize.width
    const srcWidth = page?.scrollWidth
    const margin = 24

    if (page && srcWidth) {
      const scale = (dWidth - margin * 2) / srcWidth

      doc.html(page, {
        callback: function (doc) {
          if (print) doc.autoPrint({ variant: 'non-conform' })
          doc.save(`${props.title}.pdf`)
        },
        x: margin,
        y: margin,
        html2canvas: {
          scale,
        },
      })
    }

    loadingBar.finish()
    isLoading.value = false
  }

  const autoCompleteInstRef = ref<AutoCompleteInst | null>(null)
  watch(autoCompleteInstRef, (value) => {
    if (value) nextTick(() => value.focus())
  })
  const autoCompleteInputValue = ref('')
  const autoCompleteOptions = computed(() => {
    if (autoCompleteInputValue.value === null) {
      return []
    }
    const prefix = autoCompleteInputValue.value.split('@')[0]
    const inputSuffix = autoCompleteInputValue.value.split('@')[1]
    if (inputSuffix) {
      return [
        {
          label: prefix + '@' + inputSuffix,
          value: prefix + '@' + inputSuffix,
        },
      ]
    }
    return ['@gmail.com', '@yahoo.com', '@outlook.com'].map((suffix) => {
      return {
        label: prefix + suffix,
        value: prefix + suffix,
      }
    })
  })
  const emails = ref([])
  const sendByEmail = () => {
    isLoading.value = true
    loadingBar.start()

    const page = document.getElementById('page')

    const doc = new jsPDF({
      orientation: 'p',
      format: 'a4',
      unit: 'pt',
    })

    const dWidth = doc.internal.pageSize.width
    const srcWidth = page?.scrollWidth
    const margin = 24

    if (page && srcWidth) {
      const scale = (dWidth - margin * 2) / srcWidth

      doc.html(page, {
        callback: async function (doc) {
          try {
            const blob = doc.output('blob')
            const file = new File([blob], `${new Date().getTime()}.pdf`, {
              type: 'application/pdf',
            })

            const formData = new FormData()
            // @ts-ignore
            // eslint-disable-next-line no-undef
            formData.append('subject', `${props.title} - ${__APP_NAME__}`)
            // @ts-ignore
            // eslint-disable-next-line no-undef
            formData.append('title', `${props.title} - ${__APP_NAME__}`)
            formData.append('content', t('documentPreview'))
            formData.append('attachments[]', file)
            formData.append('folder', 'documents')

            for (let i = 0; i < emails.value.length; i++) {
              formData.append('recipients[]', emails.value[i])
            }

            const task = await request({
              url: `/email`,
              method: 'post',
              data: formData,
            })

            if (task.failure && task.error) {
              switch (task.error?.response?.data?.errorCode) {
                case ResponseErrorCode.FORM_INVALID_DATA:
                  message.error(t('invalidData'))
                  break
                default:
                  message.error(t('sendingFailed'))
              }
            } else {
              emails.value = []

              message.success(t('success'))
            }
          } catch (e) {
            console.error(e)
          }

          loadingBar.finish()
          isLoading.value = false
        },
        x: margin,
        y: margin,
        html2canvas: {
          scale,
        },
      })
    }
  }

  const displayPageFooter = ref(false)
</script>

<template>
  <NFullscreenModal
    v-model="dialogVisible"
    @on-size-change="(value: any) => {
    size = value
  }">
    <template #header>
      <div v-if="!isSmScreen" class="text-base">
        <n-text depth="1">{{ props.title }}</n-text>
      </div>
    </template>
    <template #header-extra>
      <n-space class="mr-10" align="center">
        <n-checkbox v-model:checked="displayPageFooter" size="small">
          {{ t('displayPageFooter') }}
        </n-checkbox>
        <n-button
          type="warning"
          :title="t('print')"
          :disabled="isLoading"
          @click="download(true)">
          <template #icon>
            <n-icon>
              <Icon icon="mdi:printer" />
            </n-icon>
          </template>
        </n-button>
        <n-button
          type="success"
          :title="t('download')"
          :disabled="isLoading"
          @click="download()">
          <template #icon>
            <n-icon>
              <Icon icon="mdi:download" />
            </n-icon>
          </template>
        </n-button>
        <n-popover placement="bottom" trigger="click">
          <template #trigger>
            <n-button
              type="info"
              :title="t('sendByMail')"
              :disabled="isLoading">
              <template #icon>
                <n-icon>
                  <Icon icon="mdi:email" />
                </n-icon>
              </template>
            </n-button>
          </template>
          <template #header>
            <n-text strong depth="1" class="text-sm">
              {{ t('enterDocRecipientsEmails') }}
            </n-text>
          </template>
          <n-dynamic-tags v-model:value="emails">
            <template #input="{ submit, deactivate }">
              <n-auto-complete
                ref="autoCompleteInstRef"
                v-model:value="autoCompleteInputValue"
                size="small"
                :options="autoCompleteOptions"
                :placeholder="t('email')"
                :clear-after-select="true"
                @select="submit($event)"
                @blur="deactivate" />
            </template>
            <template #trigger="{ activate, disabled }">
              <n-button
                size="small"
                type="primary"
                dashed
                :disabled="disabled"
                @click="activate()">
                <template #icon>
                  <n-icon>
                    <Icon icon="carbon:add-alt" />
                  </n-icon>
                </template>
                {{ t('add') }}
              </n-button>
            </template>
          </n-dynamic-tags>
          <template #footer>
            <div class="flex justify-end">
              <n-button
                size="small"
                type="info"
                :loading="isLoading"
                :disabled="!emails.length"
                @click="sendByEmail()">
                {{ t('send') }}
              </n-button>
            </div>
          </template>
        </n-popover>
      </n-space>
    </template>
    <n-scrollbar
      :style="`max-height: ${size?.windowHeight - size?.headerHeight}px`">
      <section
        :style="`min-height: ${size?.windowHeight - size?.headerHeight}px`"
        class="w-full h-full flex justify-center items-center bg-slate-200 py-21">
        <section
          id="page"
          class="a4-page-portrait bg-white text-black relative">
          <div class="flex items-center justify-around">
            <div class="flex-1">
              <div v-if="false" class="font-bold text-xl">
                {{ appInformationStore.getSettingValue('name') }}
              </div>
              <div class="text-xs font-semibold my-2">
                {{ appInformationStore.getSettingValue('address') }}
              </div>
              <div class="text-xs">
                <b>Tel :</b> {{ appInformationStore.getSettingValue('phone') }}
              </div>
              <div class="text-xs">
                <b>Email :</b>
                {{ appInformationStore.getSettingValue('email') }}
              </div>
              <div
                v-if="appInformationStore.getSettingValue('postalCode')"
                class="text-xs">
                <b>{{ t('postalCode') }} :</b>
                {{ appInformationStore.getSettingValue('postalCode') }}
              </div>
            </div>
            <div class="flex-1 flex justify-end">
              <img class="h-28" :src="logo" />
            </div>
          </div>
          <n-divider></n-divider>
          <slot></slot>
          <CustomTransition appear name="slide-fade">
            <div
              v-if="displayPageFooter"
              class="absolute bottom-0 right-0 w-full">
              <n-divider></n-divider>
              <div class="mb-2 flex justify-around items-center">
                <div
                  v-for="(item, i) in (appInformationStore.getSettingValue(
                      'additionalInfo',
                      'array'
                    ) || []) as any[]"
                  :key="i"
                  class="text-[0.65rem]">
                  <b>{{ item.name }} :</b> {{ item.content }}
                </div>
              </div>
            </div>
          </CustomTransition>
        </section>
      </section>
    </n-scrollbar>
  </NFullscreenModal>
</template>

<style scoped lang="scss">
  #page {
    font-family: 'Arial';
  }

  .a4-page-portrait {
    width: 21cm;
    min-height: 29.7cm;
    padding: 0.5cm;
  }
</style>

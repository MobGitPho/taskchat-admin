<script setup lang="ts">
  import { isRealObject } from '@/utils/functions'

  import { ContentModelModel } from '@/models/content-model'
  import { ContentModelItemModel } from '@/models/content-model-item'

  import FormGenerator from '../Page/FormGenerator.vue'

  interface Props {
    submitData: (data: any) => Promise<void>
    contentModel: ContentModelModel | null | undefined
  }

  const props = withDefaults(defineProps<Props>(), {})

  const dialogVisible = defineModel<boolean>('show', {
    default: false,
    required: true,
  })

  const formValue = defineModel<ContentModelItemModel>('data', {
    default: {},
    required: true,
  })

  const loadingBar = useLoadingBar()
  const message = useMessage()

  const { t } = useI18n()
  const { tr, pickByTheme, editKeysToCamelCase } = useHelper()
  const size = ref<any>(null)
  const isProceeding = ref(false)

  const currentEditItem =
    inject<Ref<ContentModelItemModel | null>>('currentEditItem')

  const saveBtnDisabled = computed(() => {
    return (
      _.isEqual(formValue.value, currentEditItem?.value) &&
      _.isEqual(data.value, initialData.value)
    )
  })

  const closeModal = () => {
    dialogVisible.value = false
    isProceeding.value = false
  }

  const data = ref<any>({})
  const refreshKey = ref(uuidv4())
  const initialData = ref<any>({})
  const formValueValidate1 = ref()
  const formValueValidate2 = ref()

  watch(
    () => dialogVisible.value,
    (nv) => {
      if (nv) {
        if (isRealObject(formValue.value.contentModelData)) {
          data.value = reactive(formValue.value.contentModelData)
        } else {
          data.value = reactive({})
        }

        _.forIn(
          editKeysToCamelCase(props.contentModel?.dataStructure ?? {}),
          (value: any, key: string) => {
            if (
              !data.value[key] ||
              (Array.isArray(data.value[key]) && data.value[key].length == 0)
            ) {
              if (key === 'index') {
                data.value[key] = reactive({})
              } else {
                data.value[key] = reactive([])
              }
            }
          }
        )

        initialData.value = _.cloneDeep(data.value)

        refreshKey.value = uuidv4()
      }
    },
    {
      immediate: true,
    }
  )

  const submit = async () => {
    isProceeding.value = true
    loadingBar.start()

    const firstValidation =
      formValueValidate1.value && (await formValueValidate1.value())
    const secondValidation =
      formValueValidate2.value && (await formValueValidate2.value())

    if (
      (!formValueValidate1.value || firstValidation) &&
      (!formValueValidate2.value || secondValidation)
    ) {
      await props.submitData(data.value)
    } else {
      message.error(t('mandatoryFieldsNotFilledIn'))
    }

    loadingBar.finish()
    isProceeding.value = false
  }
</script>

<template>
  <NFullscreenModal
    v-model="dialogVisible"
    :close-on-esc="false"
    :closable="false"
    @on-size-change="(value: any) => {
      size = value
    }">
    <template #header>
      <div class="text-base">
        <n-text depth="1">
          {{ tr(props.contentModel?.title) }}
          <span>
            &nbsp;-&nbsp;{{ currentEditItem ? t('editItem') : t('addItem') }}
          </span>
        </n-text>
      </div>
    </template>
    <template #header-extra>
      <n-space align="center">
        <span class="text-base">{{ t('status') }}:</span>
        <n-radio-group
          v-model:value="formValue.isActive"
          name="isActive"
          class="w-full">
          <n-radio-button :value="false" :label="t('hidden')" class="w-[50%]" />
          <n-radio-button :value="true" :label="t('visible')" class="w-[50%]" />
        </n-radio-group>
        <div class="w-4"></div>
        <n-button
          type="success"
          :title="t('save')"
          :loading="isProceeding"
          :disabled="saveBtnDisabled"
          @click="submit()">
          <template #icon>
            <n-icon><Icon icon="carbon:save" /></n-icon>
          </template>
          {{ t('save') }}
        </n-button>
        <n-button
          type="error"
          :title="t('close')"
          :disabled="isProceeding"
          @click="closeModal()">
          <template #icon>
            <n-icon><Icon icon="carbon:close" /></n-icon>
          </template>
          {{ t('close') }}
        </n-button>
      </n-space>
    </template>
    <section
      :style="`min-height: ${size?.windowHeight - size?.headerHeight - 5}px`"
      :class="`w-full h-full ${pickByTheme('bg-slate-200', 'bg-zinc-800')}`">
      <n-grid x-gap="12" cols="1 s:2 m:2 l:2 xl:2 2xl:2" responsive="screen">
        <n-gi class="ml-4 mt-2">
          <n-scrollbar
            :style="`height: ${
              size?.windowHeight - size?.headerHeight - 50
            }px`">
            <template
              v-for="(value, key) in editKeysToCamelCase(
                contentModel?.dataStructure
              )"
              :key="key">
              <n-card v-if="String(key) === 'index'" size="small" class="mb-2">
                <FormGenerator
                  :key="`${refreshKey}-${key}-form-1`"
                  v-model="data[key]"
                  :items="value"
                  @update="(
                    value: any,
                    validate: () => Promise<boolean>
                  ) => {
                    formValueValidate1 = validate
                  }" />
              </n-card>
            </template>
          </n-scrollbar>
        </n-gi>
        <n-gi class="mr-4 mt-2">
          <n-scrollbar
            :style="`height: ${
              size?.windowHeight - size?.headerHeight - 50
            }px`">
            <template
              v-for="(value, key) in editKeysToCamelCase(
                contentModel?.dataStructure
              )"
              :key="key">
              <n-card
                v-if="String(key) !== 'index'"
                :title="tr(value.title)"
                size="small"
                class="mb-2">
                <template #header-extra>
                  <n-button
                    quaternary
                    size="small"
                    @click="() => data[key].push({})">
                    <template #icon>
                      <n-icon>
                        <Icon icon="carbon:add-alt" />
                      </n-icon>
                    </template>
                    {{ t('add') }}
                  </n-button>
                </template>
                <n-card
                  v-for="(item, i) in data[key]"
                  :key="i"
                  :title="String(i + 1)"
                  size="small"
                  class="mb-2">
                  <template #header-extra>
                    <n-button
                      type="error"
                      size="small"
                      @click="() => data[key].splice(i, 1)">
                      <template #icon>
                        <n-icon>
                          <Icon icon="carbon:trash-can" />
                        </n-icon>
                      </template>
                    </n-button>
                  </template>
                  <FormGenerator
                    :key="`${refreshKey}-${key}-${i}-form-2`"
                    v-model="data[key][i]"
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
          </n-scrollbar>
        </n-gi>
      </n-grid>
    </section>
  </NFullscreenModal>
</template>

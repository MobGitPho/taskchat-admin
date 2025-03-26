<script setup lang="ts">
  import { DataStructureField, ItemOption } from '@/utils/types'

  import PickColors from 'vue-pick-colors'

  import settingsMap from './settings-map'
  import typeOptions from './type-options'

  interface Props {
    type: 'collection' | 'singleton'
    collectionKey?: string | number
    parentItemIndex?: number
  }

  const { t } = useI18n()
  const { tr, formatKey } = useHelper()
  const { isLightTheme } = storeToRefs(useUserInterfaceStore())
  const { contentModels } = storeToRefs(useContentStore())

  const props = withDefaults(defineProps<Props>(), {
    collectionKey: undefined,
    parentItemIndex: undefined,
  })
  const fields = defineModel<DataStructureField[]>({
    default: [],
    required: true,
  })

  // Inject methods
  const renderSelectLabel = inject<(option: any) => string>('renderSelectLabel')

  const removeCollectionField = inject<
    (collectionKey: any, itemIndex: number) => void
  >('removeCollectionField')

  const removeSingleton = inject<(itemIndex: number) => void>('removeSingleton')

  const onCreateItemOption =
    inject<(index: number, itemIndex: number) => ItemOption>(
      'onCreateItemOption'
    )
  const expandedNames = inject<(id: string) => WritableComputedRef<string[]>>(
    'expandedNames',
    // @ts-ignore
    () => computed(() => ref([]).value)
  )
</script>

<template>
  <n-card
    v-for="(field, itemIndex) in fields"
    :key="`field-${itemIndex}`"
    size="small"
    class="my-2">
    <n-collapse
      v-model:expanded-names="
        expandedNames(
          props.type == 'collection'
            ? `c-${props.parentItemIndex}-f-${itemIndex}`
            : `s-${itemIndex}`
        ).value
      "
      display-directive="show"
      :default-expanded-names="['1']"
      class="field-collapse">
      <n-collapse-item name="1">
        <template #header>
          <div class="flex items-center justify-between w-full">
            <n-space>
              <n-tag size="small" type="info">
                {{ itemIndex + 1 }}
              </n-tag>
              <span class="text-base font-semibold">
                {{ tr(field.label) }}
              </span>
            </n-space>
            <n-button
              size="small"
              type="error"
              :secondary="isLightTheme"
              @click="
                () => {
                  if (props.type === 'collection') {
                    removeCollectionField
                      ? removeCollectionField(props.collectionKey, itemIndex)
                      : null
                  } else {
                    removeSingleton ? removeSingleton(itemIndex) : null
                  }
                }
              ">
              <n-icon class="mr-1">
                <Icon icon="carbon:trash-can" />
              </n-icon>
              {{ t('delete') }}
            </n-button>
          </div>
        </template>
        <n-grid :span="24" x-gap="6">
          <n-gi :span="6">
            <span class="text-xs text-slate-400">
              {{ t('fieldKey') }}
            </span>
            <n-input
              :value="field.key"
              :placeholder="t('fieldKey')"
              class="w-full"
              @update:value="(value) => (field.key = formatKey(value))" />
          </n-gi>
          <n-gi :span="10">
            <span class="text-xs text-slate-400">
              {{ t('title') }}
            </span>
            <I18nInput
              v-model="field.label"
              :placeholder="t('title')"
              :selector-span="6"
              class="w-full"
              sync />
          </n-gi>
          <n-gi :span="8">
            <span class="text-xs text-slate-400">
              {{ t('type') }}
            </span>
            <n-select
              v-model:value="field.type"
              :options="typeOptions"
              :placeholder="t('type')"
              value-field="value"
              label-field="label"
              filterable
              class="w-full" />
          </n-gi>
        </n-grid>
        <n-divider class="!mt-4 !mb-2"></n-divider>
        <n-grid :span="24" x-gap="6">
          <n-gi :span="10" class="flex items-center">
            <n-checkbox v-model:checked="field.required" size="medium">
              {{ t('requiredField') }}
            </n-checkbox>
          </n-gi>
          <n-gi :span="14">
            <template
              v-if="
                ['content-model-item', 'content-model-items'].includes(
                  field.type
                )
              ">
              <span class="text-xs text-slate-400">
                {{ t('contentModel') }}
              </span>
              <n-select
                v-model:value="field.defaultValue"
                :options="(contentModels as any[])"
                :placeholder="t('contentModel')"
                :render-label="renderSelectLabel"
                label-field="title"
                value-field="id"
                filterable
                class="w-full" />
            </template>
            <template v-else>
              <span class="text-xs text-slate-400">
                {{ t('defaultValue') }}
              </span>
              <div v-if="field.type === 'color'">
                <pick-colors
                  v-model:value="field.defaultValue"
                  class="cursor-pointer"
                  :theme="isLightTheme ? 'light' : 'dark'"
                  :z-index="5000"
                  format="hex"
                  size="25">
                </pick-colors>
              </div>
              <n-input
                v-else
                v-model:value="field.defaultValue"
                :placeholder="t('defaultValue')"
                class="w-full" />
            </template>
          </n-gi>
        </n-grid>
        <n-divider
          v-if="field.type === 'multi-select' || field.type === 'single-select'"
          title-placement="left"
          class="!my-4">
          {{ t('options') }}
        </n-divider>
        <CustomTransition name="slide-fade" appear>
          <div
            v-if="
              field.type === 'multi-select' || field.type === 'single-select'
            "
            class="w-full flex items-center">
            <n-dynamic-input
              v-model:value="field.options"
              :placeholder="t('addOption')"
              :on-create="(index: number) => onCreateItemOption ? onCreateItemOption(index, itemIndex) : null"
              show-sort-button
              class="w-full">
              <template #create-button-default>
                {{ t('addOption') }}
              </template>
              <template #default="{ value: option }">
                <div class="w-full flex items-center">
                  <n-input
                    :value="option.value"
                    :placeholder="t('optionValue')"
                    style="margin-right: 1%; width: 30%"
                    type="text"
                    @update:value="
                      (value) => (option.value = formatKey(value))
                    " />
                  <I18nInput
                    v-model="option.label"
                    :placeholder="t('optionText')"
                    :selector-span="4"
                    class="w-full"
                    sync />
                </div>
              </template>
            </n-dynamic-input>
          </div>
        </CustomTransition>
        <template v-for="(settingMap, key, index) in settingsMap" :key="index">
          <template v-if="field.type === key">
            <n-collapse
              arrow-placement="right"
              display-directive="show"
              :default-expanded-names="[]"
              class="settings-collapse">
              <template #arrow>
                <n-icon size="18">
                  <Icon icon="carbon:chevron-right" />
                </n-icon>
              </template>
              <n-collapse-item name="1">
                <template #header>
                  <n-divider title-placement="left" class="!my-4">
                    {{ t('settings') }}
                  </n-divider>
                </template>

                <CustomTransition name="slide-fade" appear>
                  <div class="w-full">
                    <n-grid
                      v-for="item in settingMap"
                      :key="item.key"
                      :span="24"
                      x-gap="12"
                      class="mb-2">
                      <n-gi :span="10">
                        <n-input
                          :value="item.key"
                          :placeholder="t('settingKey')"
                          class="w-full"
                          readonly />
                      </n-gi>
                      <n-gi :span="14">
                        <n-input-number
                          v-if="item.isNumber"
                          v-model:value="field.settings[item.key]"
                          :default-value="
                            item.defaultValue
                              ? parseInt(item.defaultValue)
                              : undefined
                          "
                          :placeholder="item.placeholder || t('settingValue')"
                          class="w-full" />
                        <n-input
                          v-else
                          v-model:value="field.settings[item.key]"
                          :default-value="item.defaultValue"
                          :placeholder="item.placeholder || t('settingValue')"
                          class="w-full" />
                      </n-gi>
                    </n-grid>
                  </div>
                </CustomTransition>
              </n-collapse-item>
            </n-collapse>
          </template>
        </template>
      </n-collapse-item>
    </n-collapse>
  </n-card>
</template>

<style scoped>
  :deep(.settings-collapse.n-collapse .n-collapse-item),
  :deep(.field-collapse.n-collapse .n-collapse-item) {
    margin-left: 0;
  }
</style>

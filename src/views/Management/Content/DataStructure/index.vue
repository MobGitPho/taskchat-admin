<script setup lang="ts">
  import { renameKey } from '@/utils/functions'
  import { DataStructureField, ItemOption } from '@/utils/types'

  import { SelectOption } from 'naive-ui'

  import DataStructureFields from './Fields.vue'

  const { t } = useI18n()
  const { tr, pickByTheme, formatKey } = useHelper()
  const { isLightTheme } = storeToRefs(useUserInterfaceStore())
  const { loadContentModels } = useContentStore()

  loadContentModels()

  interface Props {
    title: string | null
    rawDataStructure: { [key: string]: any } | null
    updateDataStructure: (data: { [key: string]: any }) => Promise<void>
  }

  const props = withDefaults(defineProps<Props>(), {
    rawDataStructure: () => ({}),
    title: '',
  })

  const dataStructureDialogVisible = defineModel<boolean>('show', {
    default: false,
    required: true,
  })

  const loadingBar = useLoadingBar()
  const message = useMessage()
  const dialog = useDialog()

  const isProceeding = ref(false)
  const size = ref<any>(null)
  const dataStructure = ref<{ [key: string]: any }>({})
  const initialDataStructure = ref<{ [key: string]: any }>({})
  const newDataStructureField: DataStructureField = {
    key: '',
    label: '',
    type: 'text',
    required: false,
    options: [],
    settings: {},
    defaultValue: '',
  }
  const expandSingletons = ref<boolean>(false)
  const expandCollections = ref<boolean>(false)
  const expandedIds = ref<{ [key: string]: boolean }>({})
  const expandedNames = (id: string) => {
    return computed({
      get: () => {
        return expandedIds.value[id] ? ['1'] : []
      },
      set: (value: string[]) => {
        expandedIds.value[id] = value.length > 0
      },
    })
  }

  watch(
    () => expandCollections.value,
    (expand) => {
      Object.entries(dataStructure.value).forEach(([key, value], index) => {
        if (key !== 'index') {
          expandedIds.value[`c-${index}`] = expand

          value?.items?.forEach((v: any, i: number) => {
            expandedIds.value[`c-${index}-f-${i}`] = expand
          })
        }
      })
    }
  )

  watch(
    () => expandSingletons.value,
    (expand) => {
      Object.entries(dataStructure.value).forEach(([key, value], _index) => {
        if (key === 'index') {
          value?.forEach((v: any, i: number) => {
            expandedIds.value[`s-${i}`] = expand
          })
        }
      })
    }
  )

  const saveBtnDisabled = computed(() => {
    return _.isEqual(dataStructure.value, initialDataStructure.value)
  })

  const addSingleton = () => {
    if (dataStructure.value) {
      if (
        dataStructure.value.index &&
        Array.isArray(dataStructure.value.index)
      ) {
        dataStructure.value.index.push(_.cloneDeep(newDataStructureField))
      } else {
        dataStructure.value.index = [_.cloneDeep(newDataStructureField)]
      }
    } else {
      dataStructure.value = {
        index: [_.cloneDeep(newDataStructureField)] as DataStructureField[],
      }
    }
  }

  const removeSingleton = (itemIndex: number) => {
    if (dataStructure.value && Array.isArray(dataStructure.value.index)) {
      dataStructure.value.index.splice(itemIndex, 1)
    }
  }

  const addCollection = () => {
    const randomKey = uuidv4()
    if (dataStructure.value) {
      dataStructure.value[randomKey] = {
        key: '',
        title: '',
        items: [],
      }
    } else {
      dataStructure.value = {
        [randomKey]: {
          key: '',
          title: '',
          items: [],
        },
      }
    }
  }

  const removeCollection = (collectionKey: any) => {
    if (dataStructure.value) {
      const { [collectionKey]: _, ...rest } = dataStructure.value
      dataStructure.value = rest
    }
  }

  const addCollectionField = (collectionKey: any) => {
    if (dataStructure.value) {
      dataStructure.value[collectionKey].items.push(
        _.cloneDeep(newDataStructureField)
      )
    }
  }

  const removeCollectionField = (collectionKey: any, itemIndex: number) => {
    if (dataStructure.value) {
      const collection = dataStructure.value[collectionKey]
      if (collection && Array.isArray(collection.items)) {
        collection.items.splice(itemIndex, 1)
      }
    }
  }

  const canAddCollectionField = (collection: any) => {
    return collection.title && collection.key && collection.key !== 'index'
  }

  const countCollections = () => {
    return dataStructure.value && typeof dataStructure.value === 'object'
      ? Object.keys(dataStructure.value).filter((key) => key !== 'index').length
      : 0
  }

  const collectionsKeysList = computed(() => {
    return dataStructure.value
      ? Object.keys(dataStructure.value).filter((key) => key !== 'index')
      : []
  })

  const getCollectionIndex = (collectionKey: string) => {
    return collectionsKeysList.value.indexOf(collectionKey)
  }

  const shouldStop = ref(false)
  const submitDataStructure = async () => {
    const data = _.cloneDeep(dataStructure.value)
    const tempData = _.cloneDeep(dataStructure.value)

    shouldStop.value = false
    isProceeding.value = true
    loadingBar.start()

    // Validation
    const collectionKeys: string[] = []
    _.forIn(data, (value: any, key: string) => {
      if (key !== 'index') {
        collectionKeys.push(value.key)
      }
    })

    _.forIn(data, (value: any, key: string) => {
      if (key !== 'index') {
        const collectionIndex = _.keys(data)
          .filter((k: string) => k !== 'index')
          .indexOf(key)

        if (value && value.key) {
          if (value.key === 'index') {
            message.error(t('keyIndexIsReservedInCollections'))
            shouldStop.value = true
            return false
          }

          const count = collectionKeys.filter(
            (k: string) => k == value.key
          ).length

          if (count > 1) {
            message.error(t('collectionKeyIsNotUnique', [value.key]))
            shouldStop.value = true
            return false
          }

          if (Array.isArray(value.items)) {
            for (const [fieldIndex, item] of value.items.entries()) {
              if (item.key) {
                const count = value.items.filter(
                  (i: any) => i.key === item.key
                ).length

                if (count > 1) {
                  message.error(
                    t('fieldKeyOfCollectionIsNotUnique', [item.key, value.key])
                  )
                  shouldStop.value = true
                  return false
                }
              } else {
                message.error(
                  t('fieldKeyOfCollectionIsRequired', [
                    fieldIndex + 1,
                    value.key,
                  ])
                )
                shouldStop.value = true
                return false
              }
            }
          }
        } else {
          message.error(t('collectionKeyIsRequired', [collectionIndex + 1]))
          shouldStop.value = true
          return false
        }
      } else {
        if (Array.isArray(value)) {
          for (const [index, item] of value.entries()) {
            if (item.key) {
              const count = value.filter((i: any) => i.key === item.key).length

              if (count > 1) {
                message.error(t('singletonKeyIsNotUnique', [item.key]))
                shouldStop.value = true
                return false
              }
            } else {
              message.error(t('singletonKeyIsRequired', [index + 1]))
              shouldStop.value = true
              return false
            }
          }
        }
      }
    })

    if (shouldStop.value) {
      isProceeding.value = false
      loadingBar.finish()
      return
    }

    // Replace collections auto generated keys by user defined keys
    _.forIn(tempData, (value: any, key: string) => {
      if (key !== 'index' && key !== value.key) {
        renameKey(data, key, value.key)
      }
    })

    await props.updateDataStructure(data)

    isProceeding.value = false
    loadingBar.finish()
  }

  const closeDataStructure = () => {
    if (_.isEqual(dataStructure.value, initialDataStructure.value)) {
      dataStructureDialogVisible.value = false
    } else {
      dialog.warning({
        title: t('confirm'),
        content: t('confirmCloseDataStructure'),
        positiveText: t('yes'),
        negativeText: t('no'),
        onPositiveClick: async () => {
          dataStructureDialogVisible.value = false
        },
      })
    }
  }

  watch(
    () => props.rawDataStructure,
    (rawDataStructure) => {
      dataStructure.value = rawDataStructure
        ? _.cloneDeep(rawDataStructure)
        : {}

      _.forIn(rawDataStructure, (value: any, key: string) => {
        if (key !== 'index') {
          dataStructure.value[key].key = key

          value?.items?.forEach((item: DataStructureField, index: number) => {
            if (!dataStructure.value[key]['items'][index]['settings']) {
              dataStructure.value[key]['items'][index]['settings'] = {}
            }
          })
        } else {
          value?.forEach((item: DataStructureField, index: number) => {
            if (!dataStructure.value[key][index]['settings']) {
              dataStructure.value[key][index]['settings'] = {}
            }
          })
        }
      })

      initialDataStructure.value = _.cloneDeep(dataStructure.value)
    },
    { immediate: true, deep: true }
  )

  const renderSelectLabel = (option: SelectOption) => {
    return h(
      'span',
      {},
      {
        default: () => tr(option.title),
      }
    )
  }

  const onCreateItemOption = (
    index: number,
    itemIndex: number
  ): ItemOption => ({
    value: `option_${itemIndex + 1}${index + 1}`,
    label: '',
  })

  // Provide methods
  provide('removeCollectionField', removeCollectionField)
  provide('onCreateItemOption', onCreateItemOption)
  provide('renderSelectLabel', renderSelectLabel)
  provide('removeSingleton', removeSingleton)
  provide('addSingleton', addSingleton)
  provide('expandCollections', expandCollections)
  provide('expandSingletons', expandSingletons)
  provide('expandedNames', expandedNames)
</script>

<template>
  <NFullscreenModal
    v-model="dataStructureDialogVisible"
    :close-on-esc="false"
    :closable="false"
    @on-size-change="(value: any) => {
      size = value
    }">
    <template #header>
      <div class="text-base">
        <n-text depth="1">
          {{ t('dataStructure') }}
          <span v-if="title">&nbsp;-&nbsp;{{ title }}</span>
        </n-text>
      </div>
    </template>
    <template #header-extra>
      <n-space align="center">
        <n-button
          type="success"
          :title="t('save')"
          :loading="isProceeding"
          :disabled="saveBtnDisabled"
          @click="submitDataStructure()">
          <template #icon>
            <n-icon><Icon icon="carbon:save" /></n-icon>
          </template>
          {{ t('save') }}
        </n-button>
        <n-button
          type="error"
          :title="t('close')"
          :disabled="isProceeding"
          @click="closeDataStructure()">
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
          <n-card embedded bordered segmented>
            <template #header>
              {{ t('singletons') }}&nbsp;
              <span v-if="dataStructure.index?.length">
                ({{ dataStructure.index?.length }})
              </span>
            </template>
            <template #header-extra>
              <n-space>
                <n-button
                  size="small"
                  type="primary"
                  :secondary="isLightTheme"
                  @click="expandSingletons = !expandSingletons">
                  <n-icon>
                    <Icon
                      v-if="expandSingletons"
                      icon="carbon:collapse-categories" />
                    <Icon v-else icon="carbon:expand-categories" />
                  </n-icon>
                </n-button>
                <n-button
                  size="small"
                  type="primary"
                  :secondary="isLightTheme"
                  @click="addSingleton()">
                  <n-icon class="mr-1">
                    <Icon icon="carbon:add-alt" />
                  </n-icon>
                  {{ t('addSingleton') }}
                </n-button>
              </n-space>
            </template>
          </n-card>
          <n-scrollbar
            :style="`max-height: ${
              size?.windowHeight - size?.headerHeight - 100
            }px`">
            <DataStructureFields
              v-model="dataStructure.index"
              type="singleton" />
          </n-scrollbar>
        </n-gi>
        <n-gi class="mr-4 mt-2">
          <n-card embedded bordered segmented>
            <template #header>
              {{ t('collections') }}&nbsp;
              <span v-if="countCollections() > 0">
                ({{ countCollections() }})
              </span>
            </template>
            <template #header-extra>
              <n-space>
                <n-button
                  size="small"
                  type="primary"
                  :secondary="isLightTheme"
                  @click="expandCollections = !expandCollections">
                  <n-icon>
                    <Icon
                      v-if="expandCollections"
                      icon="carbon:collapse-categories" />
                    <Icon v-else icon="carbon:expand-categories" />
                  </n-icon>
                </n-button>
                <n-button
                  size="small"
                  type="primary"
                  :secondary="isLightTheme"
                  @click="addCollection()">
                  <n-icon class="mr-1">
                    <Icon icon="carbon:add-alt" />
                  </n-icon>
                  {{ t('addCollection') }}
                </n-button>
              </n-space>
            </template>
          </n-card>
          <n-scrollbar
            :style="`max-height: ${
              size?.windowHeight - size?.headerHeight - 100
            }px`">
            <template
              v-for="(
                collection, collectionKey, collectionIndex
              ) in dataStructure || {}"
              :key="collectionIndex">
              <n-card
                v-if="collectionKey != 'index'"
                size="small"
                class="my-2"
                embedded>
                <n-collapse
                  v-model:expanded-names="
                    expandedNames(`c-${collectionIndex}`).value
                  "
                  display-directive="show"
                  :default-expanded-names="['1']">
                  <n-collapse-item name="1">
                    <template #header>
                      <div class="flex items-center justify-between w-full">
                        <n-space>
                          <n-tag size="small" type="success">
                            {{
                              getCollectionIndex(collectionKey as string) + 1
                            }}
                          </n-tag>
                          <span class="text-base font-semibold">
                            {{ tr(collection.title) }}
                          </span>
                        </n-space>

                        <n-button
                          size="small"
                          type="error"
                          :secondary="isLightTheme"
                          @click="removeCollection(collectionKey)">
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
                          :value="collection.key"
                          :placeholder="t('collectionKey')"
                          class="w-full"
                          size="small"
                          @update:value="
                            (value) => (collection.key = formatKey(value))
                          " />
                      </n-gi>
                      <n-gi :span="11">
                        <span class="text-xs text-slate-400">
                          {{ t('title') }}
                        </span>
                        <I18nInput
                          v-model="collection.title"
                          :placeholder="t('title')"
                          :selector-span="6"
                          class="w-full"
                          size="small"
                          sync />
                      </n-gi>
                      <n-gi :span="7">
                        <span class="text-xs text-slate-400">
                          {{ t('actions') }}
                        </span>
                        <n-button
                          block
                          size="small"
                          type="primary"
                          :disabled="!canAddCollectionField(collection)"
                          :secondary="isLightTheme"
                          class="w-full"
                          @click="addCollectionField(collectionKey)">
                          <n-icon class="mr-1">
                            <Icon icon="carbon:add-alt" />
                          </n-icon>
                          {{ t('addField') }}
                        </n-button>
                      </n-gi>
                    </n-grid>
                    <n-divider class="!my-4.75"></n-divider>
                    <DataStructureFields
                      v-if="canAddCollectionField(collection)"
                      v-model="dataStructure[collectionKey]['items']"
                      :parent-item-index="collectionIndex"
                      :collection-key="collectionKey"
                      type="collection" />
                    <n-alert v-else bordered type="info">
                      {{ t('cannotAddCollectionField') }}
                    </n-alert>
                  </n-collapse-item>
                </n-collapse>
              </n-card>
            </template>
          </n-scrollbar>
        </n-gi>
      </n-grid>
    </section>
  </NFullscreenModal>
</template>

<script lang="ts">
  export default defineComponent({
    name: 'GridImagesPicker',
  })
</script>

<script setup lang="ts">
  import { AppConfig } from '@/utils/types'

  interface Props {
    uploadFolder?: string
    readonly?: boolean
    title?: string
  }

  const images = defineModel<string[]>()

  const appConfig = inject<AppConfig>('appConfig')

  const props = withDefaults(defineProps<Props>(), {
    uploadFolder: 'images',
    readonly: false,
    title: '',
  })

  const { t } = useI18n()
  const { fileUrl } = useHelper()

  const pickerVisible = ref(false)

  const clearImage = (index: number) => {
    if (Array.isArray(images.value)) images.value.splice(index, 1)
    else images.value = []
  }

  const saveImages = async (paths: string) => {
    if (Array.isArray(images.value)) images.value.push(...paths)
    else images.value = [...paths]

    pickerVisible.value = false
  }
</script>

<template>
  <section class="w-full">
    <section class="mb-2">
      <n-card
        size="small"
        embedded
        hoverable
        :segmented="images && images.length > 0">
        <template #header>
          <div class="text-base text-left">{{ props.title }}</div>
        </template>
        <template #header-extra>
          <n-button
            v-if="!props.readonly"
            quaternary
            @click="pickerVisible = true">
            <template #icon>
              <n-icon size="18">
                <Icon icon="carbon:add-alt" />
              </n-icon>
            </template>
            {{ t('add') }}
          </n-button>
        </template>
        <n-scrollbar style="max-height: 100%">
          <n-image-group
            v-if="images && images.length"
            show-toolbar
            show-toolbar-tooltip>
            <Draggable :list="images" class="w-full grid grid-cols-3 gap-4">
              <div
                v-for="(path, i) in images"
                :key="'img-' + i"
                class="relative border-dotted border border-green-500 h-[120px] picked-item">
                <n-image width="100" object-fit="cover" :src="fileUrl(path)" />
                <n-button
                  v-if="!props.readonly"
                  strong
                  circle
                  color="black"
                  style="position: absolute; top: 4px; right: 4px"
                  @click="clearImage(i)">
                  <template #icon>
                    <n-icon>
                      <Icon icon="carbon:trash-can" />
                    </n-icon>
                  </template>
                </n-button>
              </div>
            </Draggable>
          </n-image-group>
        </n-scrollbar>
      </n-card>
    </section>
    <MediaPicker
      v-model:show="pickerVisible"
      :title="t('selectImage')"
      :upload-config="{
        folder: 'images',
        limit: 0,
        maxSize: 0,
        baseUrl: appConfig?.apiUrl + '/media-files/upload',
        excludedExtensions: [],
      }"
      selection-multiple
      @submit="saveImages" />
  </section>
</template>

<style scoped>
  ::v-deep(.picked-item > .n-image > img) {
    object-fit: cover !important;
    height: 120px !important;
  }
</style>

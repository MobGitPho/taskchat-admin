<script lang="ts">
  export default defineComponent({
    name: 'MediaPicker',
  })
</script>

<script setup lang="ts">
  import MediaLibrary from './MediaLibrary.vue'
  import AddFromAnUrl from './AddFromAnUrl.vue'
  import UploadFiles from './UploadFiles.vue'

  import { Props, TabKey, propsKey } from './types'
  import { MediaFileModel } from '@/models/media-file'

  const { t } = useI18n()

  const props = withDefaults(defineProps<Props>(), {
    enableUploadFiles: true,
    enableMediaLibrary: true,
    enableAddFromAnUrl: true,
    displayImages: true,
    displayVideos: true,
    displayAudios: true,
    displayDocuments: true,
    displayOtherTypes: true,
    preselectedMediaList: null,
    selectionType: 'path',
    selectionMultiple: false,
    selectionLimit: 0,
    title: '',
    uploadConfig: () => ({
      folder: 'uploads',
      limit: 0,
      maxSize: 0,
      baseUrl: null,
      excludedExtensions: [],
    }),
  })

  provide(propsKey, props)

  const showModal = defineModel<boolean>('show', {
    required: true,
    default: false,
  })

  const tab = defineModel<TabKey>('tab', {
    default: 'media-library',
  })

  const emits = defineEmits(['submit'])

  const validateSelection = (
    selection: string | string[] | MediaFileModel | MediaFileModel[]
  ) => {
    emits('submit', selection)

    showModal.value = false
  }

  const validateUrls = (urls: string | string[]) => {
    emits('submit', urls)

    showModal.value = false
  }
</script>

<template>
  <NFullscreenModal v-model="showModal" :title="title" class="w-full">
    <n-tabs v-model:value="tab" type="card" size="large" animated>
      <n-tab-pane
        v-if="props.enableUploadFiles"
        name="upload-files"
        :tab="t('uploadFiles')">
        <UploadFiles />
      </n-tab-pane>
      <n-tab-pane
        v-if="props.enableMediaLibrary"
        name="media-library"
        :tab="t('mediaLibrary')">
        <MediaLibrary @validate="validateSelection" />
      </n-tab-pane>
      <n-tab-pane
        v-if="props.enableAddFromAnUrl"
        name="add-from-an-url"
        :tab="t('addFromAnUrl')">
        <AddFromAnUrl @validate="validateUrls" />
      </n-tab-pane>
      <template #suffix>
        <div id="actions" class="pr-10"></div>
      </template>
    </n-tabs>
  </NFullscreenModal>
</template>

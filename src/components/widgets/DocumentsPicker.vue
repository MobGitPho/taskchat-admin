<script lang="ts">
  export default defineComponent({
    name: 'DocumentsPicker',
  })
</script>

<script setup lang="ts">
  import { filenameFromUrl } from '@/utils/functions'

  import { AppConfig } from '@/utils/types'

  interface Props {
    uploadFolder?: string
    readonly?: boolean
    title?: string
  }

  const documents = defineModel<string[]>()

  const props = withDefaults(defineProps<Props>(), {
    uploadFolder: 'documents',
    readonly: false,
    title: '',
  })

  const { t } = useI18n()
  const { fileUrl } = useHelper()

  const pickerVisible = ref(false)

  const appConfig = inject<AppConfig>('appConfig')

  const clearDocument = (index: number) => {
    if (Array.isArray(documents.value)) documents.value.splice(index, 1)
    else documents.value = []
  }

  const openDocument = (url: string) => {
    window.open(url, '_blank')
  }
</script>

<template>
  <section class="w-full">
    <section class="mb-2">
      <n-card
        size="small"
        embedded
        hoverable
        :segmented="documents && documents.length > 0">
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
          <template v-if="documents && documents.length">
            <Draggable :list="documents" class="w-full">
              <div
                v-for="(path, i) in documents"
                :key="'doc-' + i"
                class="mb-4">
                <n-input-group>
                  <n-input
                    :value="path ? filenameFromUrl(path) : ''"
                    :placeholder="t('docname')"
                    readonly />
                  <template v-if="path">
                    <n-button
                      type="primary"
                      ghost
                      @click="openDocument(fileUrl(path))">
                      <template #icon>
                        <n-icon>
                          <Icon icon="mdi:open-in-new" />
                        </n-icon>
                      </template>
                      {{ t('open') }}
                    </n-button>
                    <n-button
                      v-if="!props.readonly"
                      type="primary"
                      ghost
                      @click="clearDocument(i)">
                      <template #icon>
                        <n-icon>
                          <Icon icon="carbon:trash-can" />
                        </n-icon>
                      </template>
                      {{ t('clear') }}
                    </n-button>
                  </template>
                </n-input-group>
              </div>
            </Draggable>
          </template>
        </n-scrollbar>
      </n-card>
    </section>
    <MediaPicker
      v-model:show="pickerVisible"
      :title="t('selectDocument')"
      :display-images="false"
      :display-videos="false"
      :display-audios="false"
      :display-documents="true"
      :display-other-types="false"
      :upload-config="{
        folder: props.uploadFolder,
        limit: 0,
        maxSize: 0,
        baseUrl: appConfig?.apiUrl + '/media-files/upload',
        excludedExtensions: [],
      }"
      @submit="(path: string) => {
      if (Array.isArray(documents)) documents.push(path)
      else documents = [path]

      pickerVisible = false
    }" />
  </section>
</template>

<style scoped></style>

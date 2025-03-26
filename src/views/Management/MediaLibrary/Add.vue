<script lang="ts">
  export default defineComponent({
    name: Routes.MEDIA_LIBRARY.NAME + 'Add',
  })
</script>

<script setup lang="ts">
  import type { UploadCustomRequestOptions, UploadFileInfo } from 'naive-ui'

  import Routes from '@/router/routes'
  import { AppConfig } from '@/utils/types'
  import { compressImage } from '@/utils/functions'

  const { t } = useI18n()

  const message = useMessage()
  const loadingBar = useLoadingBar()

  const upload = ref()

  const maxLimit = 0
  const sizeLimit = 0
  const excludedExtensionsList: string[] = []
  const filesList = ref<UploadFileInfo[]>([])
  const isProceeding = ref(false)

  const authStore = useAuthStore()

  const appConfig = inject<AppConfig>('appConfig')

  const headers = appConfig?.apiRequestHeaders

  if (headers) headers['Authorization'] = `Bearer ${authStore.accessToken}`

  const sendFiles = async () => {
    upload.value.submit()
  }

  const clearFilesList = () => {
    upload.value?.clear()
    filesList.value = []
  }

  const handleBeforeUpload = (options: {
    file: UploadFileInfo
    fileList: Array<UploadFileInfo>
  }) => {
    const fFile = options.file.file

    if (sizeLimit && fFile && fFile.size) {
      const isLessThanSizeLimit = fFile.size / 1024 / 1024 <= sizeLimit

      if (!isLessThanSizeLimit) {
        message.error(t('fileSizeNotAllowed'))
      }

      return isLessThanSizeLimit
    }

    const fileExt = fFile?.name.split('.').pop()

    if (
      fileExt &&
      excludedExtensionsList
        .map((ext) => ext.toLowerCase())
        .includes(fileExt.toLowerCase())
    ) {
      message.error(t('fileTypeNotAllowed'))
      return false
    }

    return true
  }

  const handleChange = (data: { fileList: UploadFileInfo[] }) => {
    filesList.value = data.fileList
  }

  const handleFinish = ({
    file,
  }: {
    file: UploadFileInfo
    event?: ProgressEvent
  }) => {
    return file
  }

  const getMax = () => {
    if (maxLimit) return maxLimit

    return undefined
  }

  const customRequest = async ({
    file,
    data,
    headers,
    action,
    onFinish,
    onError,
    onProgress,
  }: UploadCustomRequestOptions) => {
    const formData = new FormData()
    if (data) {
      Object.keys(data).forEach((key) => {
        formData.append(
          key,
          data[key as keyof UploadCustomRequestOptions['data']]
        )
      })
    }
    const fFile = file.file
    const fileExt = fFile?.name.split('.').pop()
    const fileName = fFile?.name.replace('.' + fileExt, '')

    const cFile = await compressImage(fFile as File, { maxSizeMB: 1 })

    formData.append('file', cFile as File, fileName)

    isProceeding.value = true
    loadingBar.start()

    axios
      .post(action as string, formData, {
        headers: headers as Record<string, string>,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total !== null) {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            )
            onProgress({ percent })
          }
        },
      })
      .then(async () => {
        onFinish()

        const index = filesList.value.findIndex((item) => item.id === file.id)
        if (index !== -1) filesList.value.splice(index, 1)

        message.success(t('success'))

        loadingBar.finish()
        isProceeding.value = false
      })
      .catch((err) => {
        console.log(err)
        message.error(t('anErrorOccurred'))

        onError()

        loadingBar.finish()
        isProceeding.value = false
      })
  }

  // To avoid "Non-function value encountered for slot "default"" warning from Naive UI NUpload component
  const originalWarn = console.warn

  onMounted(() => {
    console.warn = (msg: any) => {
      if (
        typeof msg === 'string' &&
        msg.includes('Non-function value encountered for slot "default"')
      ) {
        return
      }
      originalWarn(msg)
    }
  })

  onUnmounted(() => {
    console.warn = originalWarn
  })
</script>

<template>
  <PageLayout>
    <template #header-extra>
      <n-space v-if="filesList.length" align="center">
        <n-button :disabled="filesList.length == 0" @click="clearFilesList">
          <template #icon>
            <n-icon>
              <Icon icon="mdi:close" />
            </n-icon>
          </template>
          {{ t('clearList') }}
        </n-button>
        <n-button
          type="primary"
          :disabled="filesList.length == 0"
          @click="sendFiles">
          {{ t('launchImport') }}
        </n-button>
      </n-space>
    </template>
    <n-spin :show="false">
      <n-upload
        ref="upload"
        multiple
        directory-dnd
        list-type="image"
        :max="getMax()"
        :default-upload="false"
        :headers="headers"
        :custom-request="customRequest"
        :action="appConfig?.apiUrl + '/media-files/upload'"
        @before-upload="handleBeforeUpload"
        @change="handleChange"
        @finish="handleFinish">
        <n-upload-dragger
          class="h-[250px] flex flex-col items-center justify-center">
          <div style="margin-bottom: 12px">
            <n-icon size="48" :depth="3">
              <Icon icon="carbon:upload" />
            </n-icon>
          </div>
          <n-text style="font-size: 16px">
            {{ t('uploadAreaTitle') }}
          </n-text>
          <n-p depth="3" class="mt-4">
            <span v-if="maxLimit" class="text-xs">{{
              t('limitToTheNumberOfFilesToSend', [maxLimit])
            }}</span>
            <span v-else class="text-xs">{{
              t('noLimitToTheNumberOfFilesToSend')
            }}</span>
            <br />
            <span v-if="sizeLimit" class="text-xs">{{
              t('limitToTheSizeOfFilesToSend', [sizeLimit])
            }}</span>
            <span v-else class="text-xs">{{
              t('noLimitToTheSizeOfFilesToSend')
            }}</span>
            <br />
            <span v-if="excludedExtensionsList.length" class="text-xs">{{
              t('extensionsAreNotAllowed', [excludedExtensionsList.join(', ')])
            }}</span>
            <span v-else class="text-xs">{{
              t('allFileExtensionsAreAllowed')
            }}</span>
          </n-p>
        </n-upload-dragger>
      </n-upload>
    </n-spin>
  </PageLayout>
</template>

<style scoped lang="scss"></style>

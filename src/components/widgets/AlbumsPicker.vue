<script lang="ts">
  export default defineComponent({
    name: 'AlbumsPicker',
  })
</script>

<script setup lang="ts">
  import { AppConfig } from '@/utils/types'

  interface Props {
    uploadFolder?: string
    readonly?: boolean
    title?: string
  }

  const albums = defineModel<{ name: string; medias: string[] }[]>()

  const props = withDefaults(defineProps<Props>(), {
    uploadFolder: 'albums',
    readonly: false,
    title: '',
  })

  const { t } = useI18n()
  const { fileUrl } = useHelper()

  const pickerVisible = ref(false)
  const videoPreviewVisible = ref(false)
  const currentAlbumIndex = ref(0)
  const currentVideoUrl = ref('')

  const appConfig = inject<AppConfig>('appConfig')

  const addAlbum = () => {
    if (albums.value && Array.isArray(albums.value))
      albums.value.push({ name: '', medias: [] })
    else albums.value = [{ name: '', medias: [] }]
  }

  const deleteAlbum = (index: number) => {
    if (albums.value && Array.isArray(albums.value))
      albums.value.splice(index, 1)
    else albums.value = []
  }

  const clearMedia = (index: number, albumId: number) => {
    if (albums.value && Array.isArray(albums.value[albumId].medias))
      albums.value[albumId].medias.splice(index, 1)
    else if (albums.value) albums.value[albumId].medias = []
  }

  const getFileType = (filePath: string) => {
    const extension = filePath.split('.')?.pop()?.toLowerCase() || ''
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'].includes(extension)) {
      return 'image'
    } else if (['mp4', 'avi', 'mov', 'mkv', 'wmv', 'flv'].includes(extension)) {
      return 'video'
    } else {
      return 'unknown'
    }
  }
</script>

<template>
  <section class="w-full">
    <section class="mb-2">
      <n-card size="small" :segmented="albums && albums.length > 0">
        <template #header>
          <div class="text-base text-left">{{ props.title }}</div>
        </template>
        <template #header-extra>
          <n-button v-if="!props.readonly" quaternary @click="addAlbum">
            <template #icon>
              <n-icon size="18">
                <Icon icon="carbon:folder-add" />
              </n-icon>
            </template>
            {{ t('addAlbum') }}
          </n-button>
        </template>
        <n-card
          v-for="(album, y) in albums"
          :key="y"
          size="small"
          embedded
          hoverable
          :segmented="album.medias && album.medias.length > 0"
          class="mb-4">
          <template #header>
            <I18nInput
              v-model="album.name"
              :placeholder="t('albumName')"
              :selector-span="5"
              :disabled="props.readonly"
              class="!max-w-[350px]"
              sync />
          </template>
          <template v-if="!props.readonly" #header-extra>
            <n-button
              quaternary
              class="mr-2"
              @click="
                () => {
                  currentAlbumIndex = y
                  pickerVisible = true
                }
              ">
              <template #icon>
                <n-icon>
                  <Icon icon="carbon:add-alt" />
                </n-icon>
              </template>
              {{ t('add') }}
            </n-button>
            <div class="w-2"></div>
            <n-button quaternary type="error" @click="deleteAlbum(y)">
              <template #icon>
                <n-icon>
                  <Icon icon="carbon:trash-can" />
                </n-icon>
              </template>
              {{ t('delete') }}
            </n-button>
          </template>
          <n-scrollbar style="max-height: 100%">
            <n-image-group
              v-if="album.medias && album.medias.length > 0"
              show-toolbar
              show-toolbar-tooltip>
              <Draggable
                :list="album.medias"
                class="w-full grid grid-cols-3 gap-4">
                <div
                  v-for="(path, i) in album.medias"
                  :key="'img-' + i"
                  class="relative border-dotted border border-green-500 h-[120px] w-full picked-item">
                  <n-image
                    v-if="getFileType(path) === 'image'"
                    object-fit="cover"
                    :src="fileUrl(path)" />
                  <video
                    v-else
                    muted
                    :src="fileUrl(path)"
                    class="w-full h-[120px] object-cover cursor-pointer"
                    @click="
                      () => {
                        currentVideoUrl = fileUrl(path)
                        videoPreviewVisible = true
                      }
                    "></video>
                  <n-button
                    v-if="!props.readonly"
                    strong
                    circle
                    color="black"
                    style="position: absolute; top: 4px; right: 4px"
                    @click="clearMedia(i, y)">
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
      </n-card>
    </section>
    <MediaPicker
      v-model:show="pickerVisible"
      :title="t('select')"
      :display-audios="false"
      :display-documents="false"
      :display-other-types="false"
      :upload-config="{
        folder: 'albums',
        limit: 0,
        maxSize: 0,
        baseUrl: appConfig?.apiUrl + '/media-files/upload',
        excludedExtensions: [],
      }"
      @submit="(path: string) => {
        if (
          albums &&
          Array.isArray(albums[currentAlbumIndex].medias)
        ) {
          albums[currentAlbumIndex].medias.push(path)
        } else if (albums) {
          albums[currentAlbumIndex].medias = [path]
        }

        pickerVisible = false
      }" />
    <n-modal
      v-model:show="videoPreviewVisible"
      preset="card"
      style="width: 500px"
      :title="t('video')"
      :bordered="false"
      :mask-closable="false"
      close-on-esc>
      <video
        v-if="currentVideoUrl"
        controls
        autoplay
        class="w-full"
        :src="currentVideoUrl"></video>
    </n-modal>
  </section>
</template>

<style scoped>
  ::v-deep(.picked-item > .n-image),
  ::v-deep(.picked-item > .n-image > img) {
    object-fit: cover !important;
    height: 120px !important;
    width: 100% !important;
  }
</style>

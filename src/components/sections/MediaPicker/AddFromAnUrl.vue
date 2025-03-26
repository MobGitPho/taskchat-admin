<script setup lang="ts">
  import { propsKey } from './types'

  const { t } = useI18n()

  const message = useMessage()

  const props = inject(propsKey)

  const emits = defineEmits(['validate'])

  const url = ref('')
  const urls = ref<string[]>([])
</script>

<template>
  <section class="px-10">
    <n-card>
      <section v-if="props?.selectionMultiple">
        <n-dynamic-input
          v-model:value="urls"
          :placeholder="t('fileUrl')"
          :min="1"
          :max="props.selectionLimit || undefined" />
        <div v-if="urls.length > 0" class="text-end">
          <n-divider></n-divider>
          <n-button
            type="primary"
            :disabled="urls.length != urls.filter((u) => u.trim()).length"
            @click="
              () => {
                const encodedUrls = urls.map((u) => encodeURI(u))
                if (encodedUrls.findIndex((u) => !_v.isURL(u)) > -1) {
                  message.error(t('invalidUrl'))
                } else {
                  emits('validate', encodedUrls)
                }
                emits('validate', urls)
              }
            ">
            <template #icon>
              <n-icon>
                <Icon icon="mdi:check" />
              </n-icon>
            </template>
            {{ t('validate') }}
          </n-button>
        </div>
      </section>
      <n-input-group v-else>
        <n-input-group-label> {{ t('fileUrl') }} </n-input-group-label>
        <n-input v-model:value="url" />
        <n-button
          v-if="url"
          type="primary"
          @click="
            () => {
              const encodedUrl = encodeURI(url)
              if (_v.isURL(encodedUrl)) {
                emits('validate', encodedUrl)
              } else {
                message.error(t('invalidUrl'))
              }
            }
          ">
          <template #icon>
            <n-icon>
              <Icon icon="mdi:check" />
            </n-icon>
          </template>
          {{ t('validate') }}
        </n-button>
      </n-input-group>
    </n-card>
  </section>
</template>

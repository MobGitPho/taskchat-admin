<script setup lang="ts">
  const route = useRoute()
  const router = useRouter()

  interface Props {
    title?: string | null
    displayTitle?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    title: null,
    displayTitle: true,
  })
</script>

<template>
  <n-page-header class="mb-5" @back="router.back()">
    <template #header>
      <slot name="header"></slot>
    </template>
    <template v-if="props.displayTitle" #title>
      {{ props.title || route?.meta?.title || '' }}
    </template>
    <template #back>
      <n-icon>
        <Icon icon="ic:baseline-arrow-back-ios" />
      </n-icon>
    </template>
    <template #extra>
      <slot name="header-extra"></slot>
    </template>
  </n-page-header>
  <slot></slot>
</template>

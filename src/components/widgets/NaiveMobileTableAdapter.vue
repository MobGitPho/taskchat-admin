<script lang="ts" setup>
  const { isSmScreen } = useHelper()
</script>

<template>
  <div v-if="isSmScreen" class="overflow-auto whitespace-pre">
    <slot />
  </div>
  <slot v-else />
</template>

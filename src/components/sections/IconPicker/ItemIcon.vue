<script setup lang="ts">
  import isSVG from 'is-svg'

  import { useIconsLoader } from './helper'

  export interface Props {
    data: string | null
    color?: string
    size?: number | string
  }

  const props = withDefaults(defineProps<Props>(), {
    color: undefined,
    size: 24,
  })

  const color = computed(() => props.color)
  const size = computed(() =>
    typeof props.size == 'number' ? props.size + 'px' : props.size || 'unset'
  )

  const svgCode = ref()

  watch(
    () => props.data,
    async (val) => {
      if (!isSVG(val || '')) {
        const { currentIconsList } = useIconsLoader()

        svgCode.value =
          currentIconsList.value?.find((icon) => icon.name == val)?.svgCode ||
          ''
      }
    },
    {
      immediate: true,
    }
  )
</script>

<template>
  <i v-html="isSVG(props.data || '') ? props.data : svgCode"></i>
</template>

<style scoped>
  ::v-deep(svg) {
    display: block;
    width: v-bind(size);
    height: v-bind(size);
    color: v-bind(color);
  }
</style>

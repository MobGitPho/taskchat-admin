<script setup lang="ts">
  import { onClickOutside, useElementSize } from '@vueuse/core'
  import { RecycleScroller } from 'vue-virtual-scroller'
  import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'

  import { useIconsLoader } from './helper'
  import ItemIcon from './ItemIcon.vue'
  import type { Icon, IconLibrary, ValueType } from './types'

  export interface Props {
    searchPlaceholder?: string
    iconsListPlaceholder?: string
    placeholder?: string
    modelValue: string | string[] | null | undefined
    multiple?: boolean
    iconLibrary?: IconLibrary | 'all' | IconLibrary[]
    selectedIconBgColor?: string
    selectedIconColor?: string
    multipleLimit?: number
    disabled?: boolean
    selectedItemsToDisplay?: number
    clearable?: boolean
    valueType?: ValueType
    includeIcons?: string[]
    excludeIcons?: string[]
    includeSearch?: string
    excludeSearch?: string
    emptyText?: string
    selectorHeight?: number | string
  }

  const props = withDefaults(defineProps<Props>(), {
    searchPlaceholder: 'Search',
    iconsListPlaceholder: 'Search for icons',
    placeholder: undefined,
    multiple: false,
    iconLibrary: 'fa',
    selectedIconBgColor: '#d3d3d3',
    selectedIconColor: '#000000',
    multipleLimit: Infinity,
    disabled: false,
    selectedItemsToDisplay: 9,
    clearable: false,
    valueType: 'svg',
    includeIcons: () => [],
    excludeIcons: () => [],
    includeSearch: undefined,
    excludeSearch: undefined,
    emptyText: 'Nothing to show',
    selectorHeight: 36,
  })

  const selectorHeight = computed(() =>
    typeof props.selectorHeight == 'number'
      ? `${props.selectorHeight}px`
      : props.selectorHeight
  )

  const emits = defineEmits(['change', 'update:modelValue'])

  const selectedIconBgColor = ref(props.selectedIconBgColor)
  const searchQuery = ref<string>('')
  const open = ref<boolean>(false)

  const { currentIconsList, searchIcons, isSearching } = useIconsLoader()

  watch(
    () => searchQuery.value,
    (nv) => {
      searchIcons(nv)
    },
    { immediate: true }
  )

  const filteredIcons = computed(() => {
    return _.uniqBy(
      _.uniqBy(
        currentIconsList.value.filter((icon) => {
          const belongsToIconLibs =
            (typeof props.iconLibrary === 'string' &&
              icon.library == props.iconLibrary) ||
            (Array.isArray(props.iconLibrary) &&
              props.iconLibrary.includes(icon.library as IconLibrary)) ||
            props.iconLibrary == 'all'

          const belongsToIncludes =
            !props.includeIcons ||
            !props.includeIcons.length ||
            props.includeIcons.includes(icon.name)

          const belongsToIncludeSearch =
            !props.includeSearch ||
            icon.name?.toLocaleLowerCase().includes(props.includeSearch)

          const doesNotBelongsToExcludes =
            !props.excludeIcons ||
            !props.excludeIcons.length ||
            !props.excludeIcons.includes(icon.name)

          const doesNotBelongsToExcludeSearch =
            !props.excludeSearch ||
            !icon.name?.toLocaleLowerCase().includes(props.excludeSearch)

          return (
            belongsToIconLibs &&
            belongsToIncludes &&
            belongsToIncludeSearch &&
            doesNotBelongsToExcludes &&
            doesNotBelongsToExcludeSearch
          )
        }),
        'svgCode'
      ),
      'name'
    )
  })

  const getValue = (icon: Icon) => {
    return props.valueType == 'name' ? icon.name : icon.svgCode
  }

  const getSvgCode = (value: string) => {
    return props.valueType == 'name'
      ? currentIconsList.value?.find((icon) => icon.name == value)?.svgCode ||
          ''
      : value
  }

  const isIconSelected = (icon: Icon) => {
    if (props.multiple) {
      if (
        props.modelValue &&
        Array.isArray(props.modelValue) &&
        props.modelValue.length
      )
        return (
          (props.modelValue as string[]).findIndex(
            (i: string) => i == getValue(icon)
          ) > -1
        )
      return false
    } else return props.modelValue == getValue(icon)
  }

  const onSelected = (icon: Icon | undefined) => {
    if (icon) {
      if (props.multiple) {
        if (
          props.modelValue &&
          Array.isArray(props.modelValue) &&
          props.modelValue.length
        ) {
          const tempArray = props.modelValue as string[]

          const index = (props.modelValue as string[]).findIndex(
            (i: string) => i == getValue(icon)
          )
          if (index > -1) {
            tempArray.splice(index, 1)
          } else {
            if (props.modelValue.length < props.multipleLimit) {
              if (typeof getValue(icon) != 'undefined')
                tempArray.push(getValue(icon) as string)
            }
          }
          emits('update:modelValue', tempArray)
          emits('change', tempArray, icon)
        } else {
          if (props.multipleLimit > 0) {
            emits('update:modelValue', [getValue(icon)])
            emits('change', [getValue(icon)], icon)
          }
        }
      } else {
        if (getValue(icon) == props.modelValue) {
          if (props.clearable) emits('update:modelValue', null)
        } else {
          emits('update:modelValue', getValue(icon))
        }
        emits('change', icon)
      }
    }
  }

  const picker = ref()
  onClickOutside(picker, () => (open.value = false))

  const scroller = ref()
  const { width } = useElementSize(scroller)

  const slots: any = useSlots()
  const hasSlot = (name: string) => {
    return !!slots[name]
  }
</script>

<template>
  <div ref="picker" class="v3ip__custom-select" @blur="open = false">
    <div
      class="v3ip__selected"
      :class="{ open: open, disabled: props.disabled }"
      @click="open = props.disabled ? false : !open">
      <template
        v-if="
          (!props.multiple && props.modelValue) ||
          (props.multiple &&
            Array.isArray(props.modelValue) &&
            props.modelValue?.length)
        ">
        <div v-if="props.multiple" class="multiple">
          <template v-if="Array.isArray(props.modelValue)">
            <template
              v-for="(value, i) in (props.modelValue as string[] || [])"
              :key="i">
              <ItemIcon
                v-if="i < props.selectedItemsToDisplay"
                class="item"
                :data="
                  typeof getSvgCode(value) == 'string'
                    ? getSvgCode(value)
                    : null
                "
                :size="20"
                @click.stop="
                  onSelected(
                    currentIconsList?.find((icon) => getValue(icon) == value)
                  )
                " />
            </template>
            <div
              v-if="props.modelValue?.length > props.selectedItemsToDisplay"
              class="item">
              <b>
                +{{ props.modelValue?.length - props.selectedItemsToDisplay }}
              </b>
            </div>
          </template>
        </div>
        <ItemIcon
          v-else
          :data="typeof getSvgCode(props.modelValue as string) == 'string' ? getSvgCode(props.modelValue as string) : null"
          :size="20"
          @click.stop="
            onSelected(
              currentIconsList?.find(
                (icon) => getValue(icon) == props.modelValue
              )
            )
          " />
        <div
          v-if="props.modelValue?.length && props.clearable"
          class="flex items-center ml-2">
          <n-button
            type="error"
            size="tiny"
            secondary
            @click.stop="
              () => {
                emits('update:modelValue', props.multiple ? [] : null)
              }
            ">
            <n-icon>
              <Icon icon="mdi:close" />
            </n-icon>
          </n-button>
        </div>
      </template>
      <span v-else class="placeholder">{{ props.placeholder }}</span>
    </div>
    <transition name="fade">
      <div v-show="open">
        <div class="v3ip__search">
          <input
            v-model="searchQuery"
            type="text"
            name="search"
            :placeholder="props.searchPlaceholder" />
        </div>
        <div v-if="isSearching" class="v3ip__loader">
          <n-spin size="small" />
        </div>
        <template v-else>
          <template v-if="filteredIcons && filteredIcons.length">
            <RecycleScroller
              ref="scroller"
              class="v3ip__items"
              :items="filteredIcons"
              :item-size="40"
              :grid-items="4"
              :item-secondary-size="width / 4">
              <template #default="{ item }">
                <div
                  :class="{ active: isIconSelected(item) }"
                  @click="onSelected(item)">
                  <ItemIcon
                    :data="
                      typeof item.svgCode == 'string' ? item.svgCode : null
                    "
                    :size="24"
                    :color="
                      isIconSelected(item) ? props.selectedIconColor : undefined
                    " />
                </div>
              </template>
            </RecycleScroller>
          </template>
          <div v-else class="v3ip__empty">
            <template v-if="searchQuery">
              <slot v-if="hasSlot('empty')" name="empty" />
              <div v-else class="default-text">
                <small>{{ props.emptyText }}</small>
              </div>
            </template>
            <div v-else class="default-text">
              <small>{{ props.iconsListPlaceholder }}</small>
            </div>
          </div>
        </template>
      </div>
    </transition>
  </div>
</template>

<style scoped>
  .v3ip__custom-select {
    position: relative;
    width: 100%;
    text-align: left;
    outline: none;
    height: v-bind(selectorHeight);
    line-height: v-bind(selectorHeight);
    min-width: 200px;
  }

  .v3ip__custom-select .v3ip__selected {
    background-color: #fff;
    border-radius: 6px;
    border: 1px solid rgb(224, 224, 230);
    color: #333639;
    padding-left: 1em;
    padding-right: 1.4em;
    cursor: pointer;
    user-select: none;
    min-height: v-bind(selectorHeight);
    display: flex;
    align-items: center;
  }

  .v3ip__custom-select .v3ip__selected .multiple {
    align-items: center;
    display: flex;
  }

  .v3ip__custom-select .v3ip__selected .multiple .item {
    display: inline-block;
    margin-right: 10px;
  }

  .v3ip__custom-select .v3ip__selected .placeholder {
    color: silver;
  }

  .v3ip__custom-select .v3ip__selected.open {
    border: 1px solid #c2c2c2;
    border-radius: 6px 6px 0px 0px;
  }

  .v3ip__custom-select .v3ip__selected.open:after {
    -webkit-transform: rotate(180deg);
    -moz-transform: rotate(180deg);
    -ms-transform: rotate(180deg);
    -o-transform: rotate(180deg);
    transform: rotate(180deg);
    top: 12px;
  }

  .v3ip__custom-select .v3ip__selected:after {
    position: absolute;
    content: '';
    top: 17px;
    right: 1em;
    width: 0;
    height: 0;
    border: 5px solid transparent;
    border-color: #333639 transparent transparent transparent;
  }

  .v3ip__custom-select .v3ip__selected.disabled {
    cursor: default;
    background-color: whitesmoke;
  }

  .v3ip__custom-select .v3ip__items {
    color: #222;
    border-radius: 0px 0px 6px 6px;
    overflow: hidden;
    border-right: 1px solid #c2c2c2;
    border-left: 1px solid #c2c2c2;
    border-bottom: 1px solid #c2c2c2;
    position: absolute;
    background-color: #fff;
    left: 0;
    right: 0;
    z-index: 1;
    max-height: 225px;
    overflow-y: auto;
    display: flex;
  }

  .v3ip__custom-select .v3ip__items div {
    color: #222;
    cursor: pointer;
    user-select: none;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 40px;
  }

  .v3ip__custom-select .v3ip__items div:hover {
    background-color: rgb(243, 243, 245);
  }

  .v3ip__custom-select .v3ip__items div.active {
    background-color: v-bind(selectedIconBgColor);
  }

  .v3ip__search {
    width: 100%;
    display: flex;
    justify-content: center;
    position: relative;
    z-index: 1;
  }
  .v3ip__search input,
  .v3ip__search input:focus-visible {
    width: 100%;
    border-radius: 0;
    line-height: 30px;
    border: 1px solid #c2c2c2;
    border-top: none;
    padding-right: 1em;
    padding-left: 1em;
  }

  .v3ip__search input:focus-visible {
    outline: 0;
  }

  .v3ip__empty,
  .v3ip__loader {
    border-radius: 0px 0px 6px 6px;
    border-right: 1px solid #c2c2c2;
    border-left: 1px solid #c2c2c2;
    border-bottom: 1px solid #c2c2c2;
    background-color: #fff;
    padding-bottom: 5px;
    padding-top: 5px;
    position: relative;
    z-index: 1;
  }

  .v3ip__empty > .default-text {
    text-align: center;
  }

  .v3ip__loader {
    display: flex;
    align-items: center;
    justify-content: center;
    padding-bottom: 15px;
    padding-top: 15px;
  }
</style>

<style scoped>
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.25s ease;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }
</style>

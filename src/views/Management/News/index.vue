<script lang="ts">
  export default defineComponent({
    name: Routes.NEWS_MANAGEMENT.NAME,
  })
</script>

<script setup lang="ts">
  import Routes from '@/router/routes'

  import { MenuOption, NIcon } from 'naive-ui'

  import Categories from './Categories/index.vue'
  import Comments from './Comments/index.vue'
  import Articles from './Articles/index.vue'
  import Tags from './Tags/index.vue'

  import { Icon } from '@iconify/vue'

  const menuKeys = ['articles', 'categories', 'comments', 'tags']

  type MenuKey = (typeof menuKeys)[number]

  const isMenuKey = (value: string): value is MenuKey => {
    return menuKeys.includes(value)
  }

  const { t } = useI18n()

  const route = useRoute()

  const {
    is2XlScreen,
    isXlScreen,
    isLgScreen,
    isMdScreen,
    isSmScreen,
    appSecondaryColor,
  } = useHelper()

  const uiStore = useUserInterfaceStore()

  const store = defineStore('news-management', () => {
    const currentMenuItemKey = ref<MenuKey>('articles')

    return { currentMenuItemKey }
  })()

  const renderIcon = (icon: string, key: MenuKey) => {
    return () =>
      h(
        NIcon,
        { color: store.currentMenuItemKey == key ? 'white' : '' },
        { default: () => h(Icon, { icon }) }
      )
  }

  const renderLabel = (label: string, key: MenuKey) => {
    return () =>
      h(
        'span',
        {
          class: `${store.currentMenuItemKey == key ? 'text-white' : ''}`,
          id: _.camelCase(key),
        },
        { default: () => label }
      )
  }

  const menuOptions = computed<MenuOption[]>(() => [
    {
      label: renderLabel(t('articles'), 'articles'),
      key: 'articles',
      icon: renderIcon('carbon:document', 'articles'),
    },
    {
      label: renderLabel(t('comments'), 'comments'),
      key: 'comments',
      icon: renderIcon('carbon:chat', 'comments'),
    },
    {
      label: renderLabel(t('categories'), 'categories'),
      key: 'categories',
      icon: renderIcon('carbon:categories', 'categories'),
    },
    {
      label: renderLabel(t('tags'), 'tags'),
      key: 'tags',
      icon: renderIcon('carbon:tag', 'tags'),
    },
  ])

  const layoutHeight = computed(() => {
    return uiStore.contentLayoutSize.height - 200
  })

  const sidebarCollapsed = ref<boolean | undefined>()
  watch(
    () => [
      isMdScreen.value,
      isSmScreen.value,
      isLgScreen.value,
      isXlScreen.value,
    ],
    ([nv1, nv2, nv3, nv4]) => {
      sidebarCollapsed.value = nv1 || nv2 || nv3 || nv4
      setTimeout(() => {
        sidebarCollapsed.value = undefined
      }, 500)
    }
  )

  onMounted(() => {
    if (route.params.key && isMenuKey(route.params.key as string)) {
      store.currentMenuItemKey = route.params.key as MenuKey
    }
  })
</script>

<template>
  <PageLayout>
    <template #header-extra>
      <n-space>
        <div id="header-btn">
          <div
            v-show="store.currentMenuItemKey === 'articles'"
            id="add-article-action"></div>
          <div
            v-show="store.currentMenuItemKey === 'comments'"
            id="add-comment-action"></div>
          <div
            v-show="store.currentMenuItemKey === 'categories'"
            id="add-category-action"></div>
          <div
            v-show="store.currentMenuItemKey === 'tags'"
            id="add-tag-action"></div>
        </div>
      </n-space>
    </template>
    <n-card embedded>
      <n-layout :style="`height: ${layoutHeight}px`">
        <n-layout position="absolute" style="top: 0; bottom: 0" has-sider>
          <n-layout-sider
            bordered
            show-trigger
            collapse-mode="width"
            content-style="padding: 4px"
            :collapsed="sidebarCollapsed"
            :default-collapsed="!is2XlScreen"
            :collapsed-width="64"
            :native-scrollbar="false"
            :width="is2XlScreen ? 300 : 275">
            <n-menu
              v-model:value="store.currentMenuItemKey"
              :collapsed-width="64"
              :collapsed-icon-size="22"
              :options="menuOptions" />
          </n-layout-sider>
          <n-layout
            content-style="padding: 10px 24px"
            :native-scrollbar="false">
            <TransitionGroup name="slide-fade">
              <section
                v-show="store.currentMenuItemKey === 'articles'"
                key="articles">
                <Articles />
              </section>

              <section
                v-show="store.currentMenuItemKey === 'comments'"
                key="comments">
                <Comments />
              </section>

              <section
                v-show="store.currentMenuItemKey === 'categories'"
                key="categories">
                <Categories />
              </section>

              <section v-show="store.currentMenuItemKey === 'tags'" key="tags">
                <Tags />
              </section>
            </TransitionGroup>
          </n-layout>
        </n-layout>
      </n-layout>
    </n-card>
  </PageLayout>
</template>

<style scoped lang="scss">
  .n-menu.n-menu--vertical {
    --n-item-color-active-hover: v-bind(appSecondaryColor) !important;
    --n-item-color-active-collapsed: v-bind(appSecondaryColor) !important;
  }
</style>

<style scoped>
  /* Fade Animation */
  .fade-enter-active {
    transition: opacity 0.5s;
  }

  .fade-enter-from {
    opacity: 0;
  }

  /* Slide Fade Animation */
  .slide-fade-enter-active {
    transition: all 0.3s ease-out;
  }

  .slide-fade-enter-from {
    transform: translateX(20px);
    opacity: 0;
  }
</style>

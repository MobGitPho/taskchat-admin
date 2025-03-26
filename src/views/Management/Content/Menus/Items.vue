<script lang="ts" setup>
  import { ContentType } from '@/enums/content-type'
  import { MenuItemTargetType } from '@/enums/menu-item-target-type'
  import { ResponseErrorCode } from '@/enums/response-error-code'

  import { MenuModel } from '@/models/menu'
  import { MenuItemModel } from '@/models/menu-item'

  import {
    FormInst,
    FormRules,
    FormValidationError,
    NButton,
    NIcon,
    NInput,
    SelectOption,
  } from 'naive-ui'

  import PickColors from 'vue-pick-colors'

  import ContentFormItems from './ContentFormItems.vue'

  const { t } = useI18n()
  const { request } = useApi()
  const { extractItemTitle } = useContent()
  const { tr, displayFormErrors, pickByTheme } = useHelper()

  const { isLightTheme } = storeToRefs(useUserInterfaceStore())
  const { pages, menuItemGroups, contentModels } = storeToRefs(
    useContentStore()
  )
  const { loadPages, loadMenuItemGroups } = useContentStore()

  const loadingBar = useLoadingBar()
  const message = useMessage()
  const dialog = useDialog()

  const menu = defineModel<MenuModel | null>()

  const menuItems = ref<(MenuItemModel & { children: MenuItemModel[] })[]>([])
  const otherMenuItems = ref<MenuItemModel[]>([])
  const isLoading = ref(false)
  const search = ref<string>('')
  const searchInputRef = ref()

  const searchedMenuItems = computed(() => {
    if (!search.value) return menuItems.value

    const searchedData = menuItems.value.filter(
      (menuItem) =>
        menuItem.title.toLowerCase().includes(search.value.toLowerCase()) ||
        menuItem.description
          ?.toLowerCase()
          .includes(search.value.toLowerCase()) ||
        menuItem.children.some(
          (child) =>
            child.title.toLowerCase().includes(search.value.toLowerCase()) ||
            child.description
              ?.toLowerCase()
              .includes(search.value.toLowerCase())
        )
    )

    if (searchInputRef.value) searchInputRef.value.focus()

    return searchedData
  })

  const init = async (loadAllData = false) => {
    loadingBar.start()
    isLoading.value = true

    const task = await request({
      url: `/menu/items`,
    })

    if (task.success && task.result) {
      menuItems.value = task.result.data.filter(
        (menuItem: MenuItemModel) =>
          !menuItem.parentId && menuItem.menuId === menu.value?.id
      )

      for (let index = 0; index < menuItems.value.length; index++) {
        menuItems.value[index].children = task.result.data.filter(
          (menuItem: MenuItemModel) =>
            menuItem.parentId === menuItems.value[index].id &&
            menuItem.menuId === menu.value?.id
        )
      }

      otherMenuItems.value = task.result.data.filter(
        (menuItem: MenuItemModel) => menuItem.menuId !== menu.value?.id
      )
    }

    if (loadAllData) {
      loadPages()
      await loadMenuItemGroups()
    }

    isLoading.value = false
    loadingBar.finish()
  }

  init(true)

  // Pagination

  const pageSize = ref(12)
  const currentPage = ref(1)

  const handlePageSizeChange = (value: number) => {
    pageSize.value = value
  }

  // Add & Edit menu item

  const defaultValue = {
    title: '',
    path: '/',
    url: 'https://',
    description: '',
    isActive: true,
    isVisible: true,
    color: '',
    icon: '',
    position: 0,
    targetType: MenuItemTargetType.PAGE_LINK,
    menuItemGroupId: undefined,
    sectionId: undefined,
    pageId: undefined,
    contentType: ContentType.CONTENT_MODEL,
    contentId: undefined,
  }
  const parentId = ref<number | null>(null)
  const isProceeding = ref(false)
  const dialogVisible = ref(false)
  const preDialogVisible = ref(false)
  const currentEditItem = ref<MenuItemModel | null>(null)
  const formRef = ref<FormInst | null>(null)
  const formValue = ref<MenuItemModel>(defaultValue)
  const rules = computed<FormRules>(() => {
    const rules: any = {
      title: [
        {
          required: true,
          message: t('fillRequired'),
        },
      ],
    }

    if (formValue.value.targetType === MenuItemTargetType.PAGE_LINK) {
      rules.pageId = [
        {
          required: true,
          message: t('fillRequired'),
        },
      ]
      rules.path = [
        {
          required: true,
          message: t('fillRequired'),
        },
      ]
    } else if (
      formValue.value.targetType === MenuItemTargetType.EXTERNAL_LINK
    ) {
      rules.url = [
        {
          required: true,
          message: t('fillRequired'),
        },
      ]
    } else if (formValue.value.targetType === MenuItemTargetType.CONTENT_LINK) {
      rules.contentId = [
        {
          required: true,
          message: t('fillRequired'),
        },
      ]
      rules.contentType = [
        {
          required: true,
          message: t('fillRequired'),
        },
      ]
    }

    return rules
  })

  const openFormModal = (
    item: MenuItemModel | null,
    pId: number | null = null
  ) => {
    currentEditItem.value = _.cloneDeep(item)

    parentId.value = pId

    if (item) {
      formValue.value = _.cloneDeep(item)

      dialogVisible.value = true
    } else {
      formValue.value = _.cloneDeep(defaultValue)

      if (otherMenuItems.value.length > 0) {
        preDialogVisible.value = true
      } else {
        dialogVisible.value = true
      }
    }
  }

  const deleteMenuItem = async (menuItem: MenuItemModel) => {
    dialog.warning({
      title: t('confirm'),
      content: menuItem.parentId
        ? t('confirmDeleteMenuSubItem')
        : t('confirmDeleteMenuItem'),
      positiveText: t('yes'),
      negativeText: t('no'),
      onPositiveClick: async () => {
        const task = await request({
          method: 'delete',
          url: `/menu/items/${menuItem.id}`,
        })

        if (task.success) {
          message.success(t('success'))

          init()
        } else message.error(t('anErrorOccurred'))
      },
    })
  }

  const addMenuItem = async (menuItem: MenuItemModel) => {
    loadingBar.start()
    isProceeding.value = true

    const task = await request({
      method: 'post',
      url: '/menu/items',
      data: {
        title: menuItem.title,
        path: menuItem.path,
        url: menuItem.url,
        description: menuItem.description,
        isActive: true,
        isVisible: true,
        color: menuItem.color,
        icon: menuItem.icon,
        position: menuItem.position,
        targetType: menuItem.targetType,
        parentId: parentId.value,
        menuId: menu.value?.id,
        sectionId: menuItem.sectionId,
        menuItemGroupId: menuItem.menuItemGroupId,
        pageId: menuItem.pageId,
      },
    })

    if (task.failure && task.error) {
      switch (task.error?.response?.data?.errorCode) {
        case ResponseErrorCode.FORM_INVALID_DATA:
          displayFormErrors(task.error?.response?.data?.data)
          break
        default:
          message.error(t('anErrorOccurred'))
      }
    } else {
      message.success(t('success'))

      init()
    }

    isProceeding.value = false
    loadingBar.finish()

    preDialogVisible.value = false
  }

  const submit = async () => {
    formRef.value?.validate(
      async (errors: Array<FormValidationError> | undefined) => {
        if (!errors) {
          const data = {
            title: formValue.value.title,
            path: formValue.value.path,
            url: formValue.value.url,
            description: formValue.value.description,
            isActive: formValue.value.isActive,
            isVisible: formValue.value.isVisible,
            color: formValue.value.color,
            icon: formValue.value.icon,
            position: formValue.value.position,
            targetType: formValue.value.targetType,
            parentId: parentId.value,
            menuId: menu.value?.id,
            sectionId: formValue.value.sectionId,
            menuItemGroupId: formValue.value.menuItemGroupId,
            pageId: formValue.value.pageId,
            contentId: formValue.value.contentId,
            contentType: formValue.value.contentType,
          } as MenuItemModel

          if (currentEditItem.value) {
            if (
              currentEditItem.value.title !== formValue.value.title &&
              menuItems.value.findIndex(
                (c) => c.title == formValue.value.title
              ) > -1
            ) {
              message.error(t('sameMenuItemTitleMessage'))
            } else {
              loadingBar.start()
              isProceeding.value = true

              const task = await request({
                method: 'put',
                url: `/menu/items/${currentEditItem.value.id}`,
                data,
              })

              if (task.success && task.result.data) {
                message.success(t('success'))

                init()
              }

              isProceeding.value = false
              loadingBar.finish()

              dialogVisible.value = false
            }
          } else {
            if (
              menuItems.value.findIndex(
                (c) => c.title == formValue.value.title
              ) > -1
            ) {
              message.error(t('sameMenuItemTitleMessage'))
            } else {
              loadingBar.start()
              isProceeding.value = true

              const task = await request({
                method: 'post',
                url: '/menu/items',
                data,
              })

              if (task.failure && task.error) {
                switch (task.error?.response?.data?.errorCode) {
                  case ResponseErrorCode.FORM_INVALID_DATA:
                    displayFormErrors(task.error?.response?.data?.data)
                    break
                  default:
                    message.error(t('anErrorOccurred'))
                }
              } else {
                message.success(t('success'))

                init()
              }

              isProceeding.value = false
              loadingBar.finish()

              dialogVisible.value = false
            }
          }
        }
      }
    )

    return false
  }

  const onPositionChange = async (event: any, items: Array<MenuItemModel>) => {
    const task = await request({
      method: 'put',
      url: `/menu/items/position`,
      data: { items },
    })

    if (task.success) init()
  }

  const renderSelectLabel = (option: SelectOption) => {
    return h(
      'span',
      {},
      {
        default: () => tr(option.title),
      }
    )
  }

  const renderGroupSelectLabel = (option: SelectOption) => {
    return h(
      'span',
      {},
      {
        default: () => tr(option.name),
      }
    )
  }

  const pathFormatter = (value: string): boolean => {
    const regex = /^\/[a-zA-Z0-9/\-_{}?]*$/
    return regex.test(value)
  }

  const subtitle = (item: MenuItemModel) => {
    if (item.targetType == MenuItemTargetType.EXTERNAL_LINK) {
      return item.url
    } else if (item.targetType == MenuItemTargetType.PAGE_LINK) {
      return item.path
    } else if (item.targetType == MenuItemTargetType.CONTENT_LINK) {
      switch (item.contentType) {
        case ContentType.CONTENT_MODEL:
          return t('contentModel')
        case ContentType.NEWS_CATEGORY:
          return t('newsCategory')
        case ContentType.NEWS_ARTICLE:
          return t('newsArticle')
        case ContentType.NEWS_TAG:
          return t('newsTag')
      }
    }

    return ''
  }

  const updateContent = async (
    value: any,
    option: any,
    contentType: ContentType
  ) => {
    // Update form title if empty
    if (!tr(formValue.value.title)) {
      switch (contentType) {
        case ContentType.CONTENT_MODEL:
          formValue.value.title = extractItemTitle(
            option,
            contentModels.value?.find(
              (contentModel) => contentModel.id === option.contentModelId
            )
          )
          break
        case ContentType.NEWS_ARTICLE:
          formValue.value.title = option.title
          break
        case ContentType.NEWS_CATEGORY:
        case ContentType.NEWS_TAG:
          formValue.value.title = option.name
          break
      }
    }
  }
</script>

<template>
  <MountedTeleport to="#alt-action">
    <n-space align="center">
      <n-button
        v-if="searchedMenuItems.length"
        type="primary"
        @click="openFormModal(null)">
        <template #icon>
          <n-icon size="18">
            <Icon icon="carbon:add-alt" />
          </n-icon>
        </template>
        {{ t('addMenuItem') }}
      </n-button>
    </n-space>
  </MountedTeleport>
  <n-page-header class="mt-2 mb-5" @back="menu = null">
    <template #title>
      {{ tr(menu?.title) }}
    </template>
    <template #back>
      <n-icon>
        <Icon icon="ic:baseline-arrow-back-ios" />
      </n-icon>
    </template>
    <template #extra>
      <n-input
        ref="searchInputRef"
        v-model:value="search"
        :clearable="true"
        :placeholder="t('search')">
        <template #suffix>
          <n-icon>
            <Icon icon="carbon:search" />
          </n-icon>
        </template>
      </n-input>
    </template>
  </n-page-header>
  <CustomTransition appear name="slide-fade">
    <section>
      <template v-if="searchedMenuItems && searchedMenuItems.length">
        <Draggable
          :list="menuItems"
          @change="(event:any) => onPositionChange(event, menuItems)">
          <n-card
            v-for="menuItem in searchedMenuItems.slice(
              (currentPage - 1) * pageSize,
              currentPage * pageSize
            )"
            :key="menuItem.id"
            embedded
            size="small"
            class="mb-1">
            <n-collapse
              :default-expanded-names="
                menuItem.children.length > 0 ? ['1'] : []
              "
              display-directive="show">
              <template #header-extra="{ collapsed }">
                <n-space align="center">
                  <n-tag
                    size="small"
                    :bordered="false"
                    :type="menuItem.isActive ? 'success' : 'error'">
                    {{ menuItem.isActive ? t('published') : t('unpublished') }}
                  </n-tag>
                  <n-tag
                    size="small"
                    :bordered="false"
                    :type="menuItem.isVisible ? 'info' : 'warning'">
                    {{ menuItem.isVisible ? t('visible') : t('hidden') }}
                  </n-tag>
                  <n-divider
                    vertical
                    class="!mx-0"
                    :class="pickByTheme('!bg-zinc-400', '!bg-slate-500')">
                  </n-divider>
                  <n-button
                    size="small"
                    type="primary"
                    :secondary="isLightTheme"
                    @click.stop="openFormModal(menuItem)">
                    <n-icon>
                      <Icon icon="carbon:edit" />
                    </n-icon>
                  </n-button>
                  <n-button
                    size="small"
                    type="error"
                    :secondary="isLightTheme"
                    @click.stop="deleteMenuItem(menuItem)">
                    <n-icon>
                      <Icon icon="carbon:trash-can" />
                    </n-icon>
                  </n-button>
                  <n-button
                    size="small"
                    type="info"
                    :secondary="isLightTheme"
                    @click.stop="openFormModal(null, menuItem.id)">
                    <template #icon>
                      <n-icon>
                        <Icon icon="carbon:category" />
                      </n-icon>
                    </template>
                    {{ t('subMenuItem') }}
                    <n-tag
                      size="small"
                      :bordered="false"
                      type="primary"
                      class="ml-1">
                      {{ menuItem.children.length }}
                    </n-tag>
                  </n-button>
                </n-space>
                <div class="w-6"></div>
                <n-icon>
                  <Icon v-if="collapsed" icon="fa-solid:chevron-left" />
                  <Icon v-else icon="fa-solid:chevron-down" />
                </n-icon>
              </template>
              <template #arrow>
                <span></span>
              </template>
              <n-collapse-item name="1">
                <template #header>
                  <div class="flex items-center">
                    <n-icon size="21" class="cursor-move mr-4">
                      <Icon icon="fa-solid:grip-lines" />
                    </n-icon>
                    <n-divider
                      vertical
                      :class="pickByTheme('!bg-zinc-400', '!bg-slate-500')">
                    </n-divider>
                    <div class="flex flex-col">
                      <div>
                        <span class="text-sm font-bold">
                          {{ tr(menuItem.title) }}
                        </span>
                        <span v-if="menuItem.group" class="text-sm">
                          &nbsp;({{ tr(menuItem.group?.name) }})
                        </span>
                      </div>
                      <small class="text-xs font-normal">
                        {{ subtitle(menuItem) }}
                      </small>
                    </div>
                  </div>
                </template>
                <template v-if="menuItem.description">
                  <n-divider
                    :class="pickByTheme('!bg-zinc-300', '!bg-slate-500')"
                    class="!my-0 !h-0.5">
                  </n-divider>
                  <div class="text-xs my-1">
                    {{ tr(menuItem.description) }}
                  </div>
                </template>
                <template v-if="menuItem.children.length">
                  <n-divider
                    :class="pickByTheme('!bg-zinc-300', '!bg-slate-500')"
                    class="!mt-0 !mb-2 !h-0.5">
                  </n-divider>
                  <Draggable
                    :list="menuItem.children"
                    @change="(event:any) => onPositionChange(event, menuItem.children)">
                    <n-card
                      v-for="subMenuItem in menuItem.children"
                      :key="subMenuItem.id"
                      size="small"
                      class="mb-1">
                      <template #header>
                        <div class="flex items-center">
                          <n-icon size="21" class="cursor-move mr-4">
                            <Icon icon="fa-solid:grip-lines" />
                          </n-icon>
                          <n-divider
                            vertical
                            :class="
                              pickByTheme('!bg-zinc-400', '!bg-slate-500')
                            ">
                          </n-divider>
                          <div class="flex flex-col">
                            <span class="text-sm font-bold">
                              {{ tr(subMenuItem.title) }}
                            </span>
                            <small class="text-xs font-normal">
                              {{ subtitle(subMenuItem) }}
                            </small>
                          </div>
                        </div>
                      </template>
                      <template #header-extra>
                        <n-space align="center">
                          <n-tag
                            size="small"
                            :bordered="false"
                            :type="subMenuItem.isActive ? 'success' : 'error'">
                            {{
                              subMenuItem.isActive
                                ? t('published')
                                : t('unpublished')
                            }}
                          </n-tag>
                          <n-tag
                            size="small"
                            :bordered="false"
                            :type="subMenuItem.isVisible ? 'info' : 'warning'">
                            {{
                              subMenuItem.isVisible ? t('visible') : t('hidden')
                            }}
                          </n-tag>
                          <n-divider
                            vertical
                            class="!mx-0"
                            :class="
                              pickByTheme('!bg-zinc-400', '!bg-slate-500')
                            ">
                          </n-divider>
                          <n-button
                            size="small"
                            type="primary"
                            :secondary="isLightTheme"
                            @click.stop="
                              openFormModal(subMenuItem, menuItem.id)
                            ">
                            <n-icon>
                              <Icon icon="carbon:edit" />
                            </n-icon>
                          </n-button>
                          <n-button
                            size="small"
                            type="error"
                            :secondary="isLightTheme"
                            @click.stop="deleteMenuItem(subMenuItem)">
                            <n-icon>
                              <Icon icon="carbon:trash-can" />
                            </n-icon>
                          </n-button>
                        </n-space>
                      </template>
                    </n-card>
                  </Draggable>
                </template>
              </n-collapse-item>
            </n-collapse>
          </n-card>
        </Draggable>
        <n-pagination
          v-model:page="currentPage"
          class="mt-5 justify-end"
          show-size-picker
          :page-size="pageSize"
          :page-sizes="[6, 10, 24, 36, 48]"
          :page-count="Math.ceil(menuItems.length / pageSize)"
          @update:page-size="handlePageSizeChange">
          <template #prefix>
            {{ `${menuItems.length} ${t('menuItem_s')}` }}
          </template>
        </n-pagination>
      </template>
      <n-card
        v-else
        size="large"
        :class="`mb-2 !border-dashed !border-2 ${pickByTheme(
          '!border-zinc-300',
          '!border-zinc-600'
        )}`">
        <n-empty :description="t('noMenuItemAvailable')">
          <template #icon>
            <n-icon>
              <Icon v-if="search" icon="carbon:search" />
              <Icon v-else icon="carbon:menu" />
            </n-icon>
          </template>
          <template #extra>
            <div v-if="!search" class="mt-4">
              <n-button size="small" @click="openFormModal(null)">
                <template #icon>
                  <n-icon>
                    <Icon icon="carbon:add-alt" />
                  </n-icon>
                </template>
                {{ t('addMenuItem') }}
              </n-button>
            </div>
          </template>
        </n-empty>
      </n-card>
    </section>
  </CustomTransition>
  <n-modal
    v-model:show="preDialogVisible"
    :loading="isProceeding"
    preset="dialog"
    style="width: 600px"
    :show-icon="false"
    :bordered="false"
    :mask-closable="false"
    :title="t('menuItems')"
    :positive-text="parentId ? t('createSubMenuItem') : t('createMenuItem')"
    :negative-text="t('cancel')"
    @positive-click="
      () => {
        preDialogVisible = false
        dialogVisible = true
      }
    "
    @negative-click="preDialogVisible = false">
    <section class="my-8">
      <n-scrollbar style="max-height: 400px">
        <n-card
          v-for="menuItem in otherMenuItems"
          :key="menuItem.id"
          embedded
          size="small"
          class="mb-2">
          <div class="flex items-center justify-between">
            <div class="flex flex-col">
              <span class="text-sm font-bold">
                {{ tr(menuItem.title) }}
              </span>
              <small class="text-xs font-normal">
                {{ subtitle(menuItem) }}
              </small>
            </div>
            <n-button
              size="small"
              type="primary"
              :secondary="isLightTheme"
              @click="addMenuItem(menuItem)">
              <template #icon>
                <n-icon>
                  <Icon icon="carbon:add-alt" />
                </n-icon>
              </template>
              {{ t('add') }}
            </n-button>
          </div>
        </n-card>
      </n-scrollbar>
    </section>
  </n-modal>
  <n-modal
    v-model:show="dialogVisible"
    :loading="isProceeding"
    preset="dialog"
    style="width: 650px"
    :show-icon="false"
    :bordered="false"
    :mask-closable="false"
    :title="
      currentEditItem
        ? parentId
          ? t('editSubMenuItem')
          : t('editMenuItem')
        : parentId
        ? otherMenuItems.length
          ? t('createSubMenuItem')
          : t('addSubMenuItem')
        : otherMenuItems.length
        ? t('createMenuItem')
        : t('addMenuItem')
    "
    :positive-text="t('validate')"
    :negative-text="t('cancel')"
    @positive-click="submit"
    @negative-click="dialogVisible = false">
    <n-form
      ref="formRef"
      class="mt-5"
      :model="formValue"
      :rules="rules"
      :show-require-mark="false"
      size="medium">
      <n-form-item :label="t('title')" path="title">
        <I18nInput
          v-model="formValue.title"
          :placeholder="t('title')"
          :selector-span="5"
          class="w-full"
          sync />
      </n-form-item>
      <n-form-item :label="t('description')" path="description">
        <I18nInput
          v-model="formValue.description"
          :placeholder="t('description')"
          :selector-span="5"
          type="textarea"
          class="w-full"
          :rows="2"
          sync />
      </n-form-item>
      <n-grid x-gap="12" :span="24">
        <n-form-item-gi :span="5" :label="t('position')" path="position">
          <n-input-number
            v-model:value="formValue.position"
            :placeholder="t('position')"
            class="w-full"
            :min="0" />
        </n-form-item-gi>
        <n-form-item-gi :span="10" :label="t('publication')" path="isActive">
          <n-radio-group
            v-model:value="formValue.isActive"
            name="isActive"
            class="w-full">
            <n-radio-button
              :value="false"
              :label="t('unpublished')"
              class="w-[50%]" />
            <n-radio-button
              :value="true"
              :label="t('published')"
              class="w-[50%]" />
          </n-radio-group>
        </n-form-item-gi>
        <n-form-item-gi :span="9" :label="t('visibility')" path="isVisible">
          <n-radio-group
            v-model:value="formValue.isVisible"
            name="isVisible"
            class="w-full">
            <n-radio-button
              :value="false"
              :label="t('hidden')"
              class="w-[50%]" />
            <n-radio-button
              :value="true"
              :label="t('visible')"
              class="w-[50%]" />
          </n-radio-group>
        </n-form-item-gi>
      </n-grid>
      <n-divider class="!my-2"></n-divider>
      <n-grid x-gap="12" :span="24">
        <n-form-item-gi :span="10" :label="t('icon')" path="icon">
          <IconPicker
            v-model="formValue.icon"
            :placeholder="t('icon')"
            :icons-list-placeholder="t('enterIconNameInSearchBar')"
            :search-placeholder="t('search')"
            :empty-text="t('noIconsFound')"
            :selector-height="32"
            icon-library="all"
            clearable />
        </n-form-item-gi>
        <n-form-item-gi :span="4" :label="t('color')" path="color">
          <div class="flex items-center">
            <template v-if="formValue.color">
              <n-button
                text
                type="error"
                style="font-size: 21px"
                @click="formValue.color = ''">
                <n-icon>
                  <Icon icon="carbon:trash-can" />
                </n-icon>
              </n-button>
              <n-divider vertical></n-divider>
            </template>
            <pick-colors
              v-model:value="formValue.color"
              class="cursor-pointer"
              :theme="isLightTheme ? 'light' : 'dark'"
              :z-index="5000"
              format="hex"
              size="25">
            </pick-colors>
          </div>
        </n-form-item-gi>
        <n-form-item-gi :span="10" :label="t('group')" path="menuItemGroupId">
          <n-select
            v-model:value="formValue.menuItemGroupId"
            :options="(menuItemGroups as any)"
            :placeholder="t('group')"
            :render-label="renderGroupSelectLabel"
            label-field="name"
            value-field="id"
            filterable
            clearable
            size="small"
            class="w-full" />
        </n-form-item-gi>
        <n-form-item-gi :span="24" :label="t('targetType')" path="targetType">
          <n-radio-group
            v-model:value="formValue.targetType"
            class="w-full"
            size="small">
            <n-radio-button
              :value="MenuItemTargetType.PAGE_LINK"
              class="w-[33.33%]">
              {{ t('pageLink') }}
            </n-radio-button>
            <n-radio-button
              :value="MenuItemTargetType.CONTENT_LINK"
              class="w-[33.33%]">
              {{ t('contentLink') }}
            </n-radio-button>
            <n-radio-button
              :value="MenuItemTargetType.EXTERNAL_LINK"
              class="w-[33.33%]">
              {{ t('externalLink') }}
            </n-radio-button>
          </n-radio-group>
        </n-form-item-gi>
      </n-grid>
      <CustomTransition appear name="slide-fade">
        <section v-if="formValue.targetType === MenuItemTargetType.PAGE_LINK">
          <n-grid x-gap="12" :span="24">
            <n-form-item-gi :span="12" :label="t('page')" path="pageId">
              <n-select
                v-model:value="formValue.pageId"
                :options="
                    ((pages || []) as any[])
                  "
                :placeholder="t('selectPage')"
                :render-label="renderSelectLabel"
                label-field="title"
                value-field="id"
                filterable
                clearable
                class="w-full" />
            </n-form-item-gi>
            <n-form-item-gi :span="12" :label="t('section')" path="sectionId">
              <n-select
                v-model:value="formValue.sectionId"
                :options="
                  ((pages || []).find((p) => p.id === formValue.pageId)
                    ?.sections || []) as any[]
                "
                :placeholder="t('selectSection')"
                :render-label="renderSelectLabel"
                :disabled="!formValue.pageId"
                label-field="title"
                value-field="id"
                filterable
                clearable
                class="w-full" />
            </n-form-item-gi>
          </n-grid>
          <n-form-item :label="t('path')" path="path">
            <n-input
              v-model:value="formValue.path"
              :placeholder="t('path')"
              :allow-input="pathFormatter"
              class="w-full" />
          </n-form-item>
        </section>
        <section
          v-else-if="formValue.targetType === MenuItemTargetType.CONTENT_LINK">
          <ContentFormItems
            v-model:content-type="formValue.contentType"
            v-model:content-id="formValue.contentId"
            @update="updateContent" />
        </section>
        <section
          v-else-if="formValue.targetType === MenuItemTargetType.EXTERNAL_LINK">
          <n-form-item :label="t('url')" path="url">
            <n-input
              v-model:value="formValue.url"
              :placeholder="t('url')"
              class="w-full" />
          </n-form-item>
        </section>
      </CustomTransition>
    </n-form>
  </n-modal>
</template>

<script setup lang="ts">
  import { ResponseErrorCode } from '@/enums/response-error-code'

  import { MenuModel } from '@/models/menu'

  import { FormInst, FormRules, FormValidationError } from 'naive-ui'

  import ItemGroups from './ItemGroups.vue'
  import Items from './Items.vue'
  import Locations from './Locations.vue'

  const { t } = useI18n()
  const { request } = useApi()
  const { tr, pickByTheme, displayFormErrors, isInDevMode, formatKey } =
    useHelper()

  const { isLightTheme } = storeToRefs(useUserInterfaceStore())
  const { menuLocations } = storeToRefs(useContentStore())
  const { loadMenuLocations } = useContentStore()

  const loadingBar = useLoadingBar()
  const message = useMessage()
  const dialog = useDialog()

  const isLoading = ref(false)
  const isProceeding = ref(false)
  const menus = ref<MenuModel[]>([])

  const init = async (loadAllData = false) => {
    loadingBar.start()
    isLoading.value = true

    const task = await request({
      url: '/menus',
    })

    if (task.success && task.result) {
      menus.value = task.result.data
    }

    if (loadAllData) {
      await loadMenuLocations()
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

  // Edit section

  const defaultValue: MenuModel = {
    name: '',
    title: '',
    description: '',
    menuLocationId: undefined,
  }
  const dialogVisible = ref(false)
  const locationsDialogVisible = ref(false)
  const itemGroupsDialogVisible = ref(false)
  const formRef = ref<FormInst | null>(null)
  const formValue = ref<MenuModel>(defaultValue)
  const rules: FormRules = {
    name: [
      {
        required: true,
        message: t('fillRequired'),
      },
    ],
    title: [
      {
        required: true,
        message: t('fillRequired'),
      },
    ],
  }
  const currentEditItem = ref<MenuModel | null>(null)

  const openFormModal = (item: MenuModel | null) => {
    currentEditItem.value = _.cloneDeep(item)
    formValue.value = _.cloneDeep(item ? item : defaultValue)

    dialogVisible.value = true
  }

  const submitMenu = async () => {
    formRef.value?.validate(
      async (errors: Array<FormValidationError> | undefined) => {
        if (!errors) {
          loadingBar.start()
          isProceeding.value = true

          const data: any = {
            name: formValue.value.name,
            title: formValue.value.title,
            description: formValue.value.description,
            menuLocationId: formValue.value.menuLocationId,
          }

          const task = await request({
            method: currentEditItem.value ? 'put' : 'post',
            url: currentEditItem.value
              ? `/menus/${currentEditItem.value.id}`
              : '/menus',
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

            dialogVisible.value = false
          }

          isProceeding.value = false
          loadingBar.finish()
        }
      }
    )

    return false
  }

  const deleteMenu = async (item: MenuModel) => {
    dialog.warning({
      title: t('confirm'),
      content: t('confirmDeleteMenu'),
      positiveText: t('yes'),
      negativeText: t('no'),
      onPositiveClick: async () => {
        const task = await request({
          method: 'delete',
          url: `/menus/${item.id}`,
        })

        if (task.success) {
          message.success(t('success'))

          init()
        } else message.error(t('anErrorOccurred'))
      },
    })
  }

  // Items
  const store = defineStore('menus-management', () => {
    const itemsMenu = ref<MenuModel | null>(null)

    return { itemsMenu }
  })()

  // Generate name
  watch(
    () => formValue.value.title,
    (value) => {
      if (currentEditItem.value) {
        //
      } else if (formValue.value.name.length <= 21) {
        formValue.value.name = slugify(tr(value), {
          trim: true,
          lower: true,
          strict: true,
        })
      }
    }
  )
</script>

<template>
  <MountedTeleport v-if="!store.itemsMenu" to="#alt-action">
    <n-space align="center">
      <n-button
        v-if="isInDevMode"
        type="success"
        @click="locationsDialogVisible = true">
        <template #icon>
          <n-icon size="18">
            <Icon icon="carbon:template" />
          </n-icon>
        </template>
        {{ t('locations') }}
      </n-button>
      <n-button type="warning" @click="itemGroupsDialogVisible = true">
        <template #icon>
          <n-icon size="18">
            <Icon icon="carbon:tag-group" />
          </n-icon>
        </template>
        {{ t('groups') }}
      </n-button>
      <n-button
        v-if="menus && menus.length"
        type="primary"
        @click="openFormModal(null)">
        <template #icon>
          <n-icon size="18">
            <Icon icon="carbon:add-alt" />
          </n-icon>
        </template>
        {{ t('addMenu') }}
      </n-button>
    </n-space>
  </MountedTeleport>
  <Items v-if="store.itemsMenu" v-model="store.itemsMenu" />
  <section v-else>
    <CustomTransition appear name="slide-fade">
      <section>
        <template v-if="menus && menus.length">
          <n-card
            v-for="menu in menus.slice(
              (currentPage - 1) * pageSize,
              currentPage * pageSize
            )"
            :key="menu.id"
            embedded
            size="small"
            class="mb-2">
            <template #header>
              <div class="flex items-center">
                <n-space>
                  <n-button
                    size="small"
                    type="primary"
                    :secondary="isLightTheme"
                    @click.stop="openFormModal(menu)">
                    <n-icon>
                      <Icon icon="carbon:edit" />
                    </n-icon>
                  </n-button>
                  <n-button
                    size="small"
                    type="error"
                    :secondary="isLightTheme"
                    @click.stop="deleteMenu(menu)">
                    <n-icon>
                      <Icon icon="carbon:trash-can" />
                    </n-icon>
                  </n-button>
                </n-space>
                <n-divider
                  vertical
                  :class="pickByTheme('!bg-zinc-400', '!bg-slate-500')">
                </n-divider>
                <div class="flex flex-col">
                  <span
                    :class="`${
                      menu.location ? 'text-sm' : 'text-base'
                    } font-bold`">
                    {{ tr(menu.title) }}
                  </span>
                  <small v-if="menu.location" class="text-xs font-normal">
                    {{ menu.location?.name }}
                  </small>
                </div>
              </div>
            </template>
            <template #header-extra>
              <n-button
                size="small"
                type="primary"
                :secondary="isLightTheme"
                @click.stop="store.itemsMenu = menu">
                <template #icon>
                  <n-icon>
                    <Icon icon="carbon:arrow-right" />
                  </n-icon>
                </template>
                {{ t('open') }}
              </n-button>
            </template>
          </n-card>
          <n-pagination
            v-model:page="currentPage"
            class="mt-5 justify-end"
            show-size-picker
            :page-size="pageSize"
            :page-sizes="[6, 10, 24, 36, 48]"
            :page-count="Math.ceil(menus.length / pageSize)"
            @update:page-size="handlePageSizeChange">
            <template #prefix>
              {{ `${menus.length} ${t('menu_s')}` }}
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
          <n-empty :description="t('noMenuAvailable')">
            <template #icon>
              <n-icon>
                <Icon icon="carbon:model-alt" />
              </n-icon>
            </template>
            <template #extra>
              <div class="mt-4">
                <n-button size="small" @click="openFormModal(null)">
                  <template #icon>
                    <n-icon>
                      <Icon icon="carbon:add-alt" />
                    </n-icon>
                  </template>
                  {{ t('addMenu') }}
                </n-button>
              </div>
            </template>
          </n-empty>
        </n-card>
      </section>
    </CustomTransition>
    <n-modal
      v-model:show="dialogVisible"
      :loading="isProceeding"
      preset="dialog"
      style="width: 500px"
      :bordered="false"
      :show-icon="false"
      :mask-closable="false"
      :title="currentEditItem ? t('editMenu') : t('addMenu')"
      :positive-text="t('validate')"
      :negative-text="t('cancel')"
      @positive-click="submitMenu"
      @negative-click="dialogVisible = false">
      <n-form
        ref="formRef"
        :model="formValue"
        :rules="rules"
        :show-require-mark="false"
        size="medium"
        class="my-5">
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
            :rows="3"
            sync />
        </n-form-item>
        <n-grid x-gap="12" :span="24">
          <n-form-item-gi :span="12" :label="t('key')" path="name">
            <n-input
              :value="formValue.name"
              :placeholder="t('key')"
              class="w-full"
              @update:value="(value) => (formValue.name = formatKey(value))" />
          </n-form-item-gi>
          <n-form-item-gi
            :span="12"
            :label="t('location')"
            path="menuLocationId">
            <n-select
              v-model:value="formValue.menuLocationId"
              :options="(menuLocations as any)"
              :placeholder="t('location')"
              value-field="id"
              label-field="name"
              filterable
              clearable
              class="w-full" />
          </n-form-item-gi>
        </n-grid>
      </n-form>
    </n-modal>
    <Locations v-model:show="locationsDialogVisible" />
    <ItemGroups v-model:show="itemGroupsDialogVisible" />
  </section>
</template>

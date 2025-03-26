<script setup lang="ts">
  import { AppConfig } from '@/utils/types'

  import { ResponseErrorCode } from '@/enums/response-error-code'

  import { NewsCategoryModel } from '@/models/news-category'

  import {
    FormInst,
    FormRules,
    FormValidationError,
    NButton,
    NIcon,
    NInput,
    NTag,
  } from 'naive-ui'

  import PickColors from 'vue-pick-colors'

  const loadingBar = useLoadingBar()
  const message = useMessage()
  const dialog = useDialog()

  const { tr, fileUrl, pickByTheme, displayFormErrors } = useHelper()
  const { request } = useApi()

  const { t } = useI18n()

  const { categories } = storeToRefs(useNewsStore())
  const { loadCategories } = useNewsStore()

  const { isLightTheme } = storeToRefs(useUserInterfaceStore())

  const appConfig = inject<AppConfig>('appConfig')

  const categoryItems = ref<
    (NewsCategoryModel & { children?: NewsCategoryModel[] })[]
  >([])
  const isLoading = ref(false)
  const search = ref<string>('')
  const searchInputRef = ref()

  const searchedCategoryItems = computed(() => {
    if (!search.value) return categoryItems.value

    const searchedData = categoryItems.value.filter(
      (categoryItem) =>
        categoryItem.name.toLowerCase().includes(search.value.toLowerCase()) ||
        categoryItem.description
          ?.toLowerCase()
          .includes(search.value.toLowerCase()) ||
        categoryItem.children?.some(
          (child) =>
            child.name.toLowerCase().includes(search.value.toLowerCase()) ||
            child.description
              ?.toLowerCase()
              .includes(search.value.toLowerCase())
        )
    )

    if (searchInputRef.value) searchInputRef.value.focus()

    return searchedData
  })

  const init = async () => {
    loadingBar.start()
    isLoading.value = true

    await loadCategories()

    categoryItems.value = categories.value.filter(
      (item: NewsCategoryModel) => !item.parentId
    )

    for (let index = 0; index < categoryItems.value.length; index++) {
      categoryItems.value[index].children = categories.value.filter(
        (item: NewsCategoryModel) =>
          item.parentId === categoryItems.value[index].id
      )
    }

    isLoading.value = false
    loadingBar.finish()
  }

  init()

  // Pagination

  const pageSize = ref(12)
  const currentPage = ref(1)

  const handlePageSizeChange = (value: number) => {
    pageSize.value = value
  }

  // Add & Edit category

  const parentId = ref<number | null>(null)
  const isProceeding = ref(false)
  const dialogVisible = ref(false)
  const currentEditItem = ref<NewsCategoryModel | null>(null)
  const formRef = ref<FormInst | null>(null)
  const formValue = ref<NewsCategoryModel>({
    name: '',
    description: '',
    isActive: true,
    position: 0,
    image: '',
    color: '',
  })
  const rules: FormRules = {
    name: [
      {
        required: true,
        message: t('fillRequired'),
      },
    ],
  }

  const openFormModal = (
    item: NewsCategoryModel | null,
    pId: number | null = null
  ) => {
    currentEditItem.value = _.cloneDeep(item)

    if (item) {
      formValue.value = _.cloneDeep(item)
    } else {
      formValue.value = {
        name: '',
        description: '',
        isActive: true,
        position: 0,
        image: '',
        color: '',
      }
    }

    parentId.value = pId

    dialogVisible.value = true
  }

  const deleteCategoryItem = async (item: NewsCategoryModel) => {
    dialog.warning({
      title: t('confirm'),
      content: item.parentId
        ? t('confirmDeleteSubCategory')
        : t('confirmDeleteCategory'),
      positiveText: t('yes'),
      negativeText: t('no'),
      onPositiveClick: async () => {
        const task = await request({
          method: 'delete',
          url: `/news-categories/${item.id}`,
        })

        if (task.success) {
          message.success(t('success'))

          init()
        } else message.error(t('anErrorOccurred'))
      },
    })
  }

  const submit = async () => {
    formRef.value?.validate(
      async (errors: Array<FormValidationError> | undefined) => {
        if (!errors) {
          if (currentEditItem.value) {
            if (
              currentEditItem.value.name !== formValue.value.name &&
              categories.value.findIndex(
                (c) => c.name == formValue.value.name
              ) > -1
            ) {
              message.error(t('sameCategoryNameMessage'))
            } else {
              loadingBar.start()
              isProceeding.value = true

              const data = {
                name: formValue.value.name,
                description: formValue.value.description,
                isActive: formValue.value.isActive,
                position: formValue.value.position,
                image: formValue.value.image,
                color: formValue.value.color,
                parentId: parentId.value,
              } as NewsCategoryModel

              const task = await request({
                method: 'put',
                url: `/news-categories/${currentEditItem.value.id}`,
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
              categories.value.findIndex(
                (c) => c.name == formValue.value.name
              ) > -1
            ) {
              message.error(t('sameCategoryNameMessage'))
            } else {
              loadingBar.start()
              isProceeding.value = true

              const data = {
                name: formValue.value.name,
                description: formValue.value.description,
                isActive: formValue.value.isActive,
                position: formValue.value.position,
                image: formValue.value.image,
                color: formValue.value.color,
                parentId: parentId.value,
              } as NewsCategoryModel

              const task = await request({
                method: 'post',
                url: '/news-categories',
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

  const onPositionChange = async (
    event: any,
    items: Array<NewsCategoryModel>
  ) => {
    const task = await request({
      method: 'put',
      url: `/news-categories/position`,
      data: { items },
    })

    if (task.success) init()
  }

  // Image

  const folder = 'categories'
  const pickerVisible = ref(false)

  const saveImage = async (url: string) => {
    formValue.value.image = url

    pickerVisible.value = false
  }

  const clearImage = () => {
    formValue.value.image = ''
  }
</script>

<template>
  <MountedTeleport to="#add-category-action">
    <n-space align="center">
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
      <n-button
        v-if="searchedCategoryItems.length"
        type="primary"
        @click="openFormModal(null)">
        <template #icon>
          <n-icon size="18">
            <Icon icon="carbon:add-alt" />
          </n-icon>
        </template>
        {{ t('addCategory') }}
      </n-button>
    </n-space>
  </MountedTeleport>
  <CustomTransition appear name="slide-fade">
    <section>
      <template v-if="searchedCategoryItems && searchedCategoryItems.length">
        <Draggable
          :list="categoryItems"
          @change="(event:any) => onPositionChange(event, categoryItems)">
          <n-card
            v-for="categoryItem in searchedCategoryItems.slice(
              (currentPage - 1) * pageSize,
              currentPage * pageSize
            )"
            :key="categoryItem.id"
            embedded
            size="small"
            class="mb-1">
            <n-collapse
              :default-expanded-names="
                categoryItem.children?.length ? ['1'] : []
              "
              display-directive="show">
              <template #header-extra="{ collapsed }">
                <n-space align="center">
                  <n-tag
                    size="small"
                    :bordered="false"
                    :type="categoryItem.isActive ? 'success' : 'error'">
                    {{ categoryItem.isActive ? t('visible') : t('hidden') }}
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
                    @click.stop="openFormModal(categoryItem)">
                    <n-icon>
                      <Icon icon="carbon:edit" />
                    </n-icon>
                  </n-button>
                  <n-button
                    size="small"
                    type="error"
                    :secondary="isLightTheme"
                    @click.stop="deleteCategoryItem(categoryItem)">
                    <n-icon>
                      <Icon icon="carbon:trash-can" />
                    </n-icon>
                  </n-button>
                  <n-button
                    size="small"
                    type="info"
                    :secondary="isLightTheme"
                    @click.stop="openFormModal(null, categoryItem.id)">
                    <template #icon>
                      <n-icon>
                        <Icon icon="carbon:category" />
                      </n-icon>
                    </template>
                    {{ t('subCategory') }}
                    <n-tag
                      size="small"
                      :bordered="false"
                      type="primary"
                      class="ml-1">
                      {{ categoryItem.children?.length }}
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
                      <span class="text-sm font-bold">
                        {{ tr(categoryItem.name) }}&nbsp;({{
                          categoryItem.articlesCount
                        }}&nbsp;{{ t('article_s') }})
                      </span>
                      <small class="text-xs font-normal">
                        {{ categoryItem.slug }}
                      </small>
                    </div>
                  </div>
                </template>
                <template v-if="categoryItem.description">
                  <n-divider
                    :class="pickByTheme('!bg-zinc-300', '!bg-slate-500')"
                    class="!my-0 !h-0.5">
                  </n-divider>
                  <div class="text-xs my-1">
                    {{ tr(categoryItem.description) }}
                  </div>
                </template>
                <template v-if="categoryItem.children?.length">
                  <n-divider
                    :class="pickByTheme('!bg-zinc-300', '!bg-slate-500')"
                    class="!mt-0 !mb-2 !h-0.5">
                  </n-divider>
                  <Draggable
                    :list="categoryItem.children"
                    @change="(event:any) => onPositionChange(event, categoryItem.children || [])">
                    <n-card
                      v-for="subCategoryItem in categoryItem.children"
                      :key="subCategoryItem.id"
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
                              {{ tr(subCategoryItem.name) }}
                            </span>
                            <small class="text-xs font-normal">
                              {{ subCategoryItem.slug }}
                            </small>
                          </div>
                        </div>
                      </template>
                      <template #header-extra>
                        <n-space align="center">
                          <n-tag
                            size="small"
                            :bordered="false"
                            :type="
                              subCategoryItem.isActive ? 'success' : 'error'
                            ">
                            {{
                              subCategoryItem.isActive
                                ? t('visible')
                                : t('hidden')
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
                              openFormModal(subCategoryItem, categoryItem.id)
                            ">
                            <n-icon>
                              <Icon icon="carbon:edit" />
                            </n-icon>
                          </n-button>
                          <n-button
                            size="small"
                            type="error"
                            :secondary="isLightTheme"
                            @click.stop="deleteCategoryItem(subCategoryItem)">
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
          :page-count="Math.ceil(categoryItems.length / pageSize)"
          @update:page-size="handlePageSizeChange">
          <template #prefix>
            {{ `${categoryItems.length} ${t('categorie_s')}` }}
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
        <n-empty :description="t('noCategoryAvailable')">
          <template #icon>
            <n-icon>
              <Icon v-if="search" icon="carbon:search" />
              <Icon v-else icon="carbon:categories" />
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
                {{ t('addCategory') }}
              </n-button>
            </div>
          </template>
        </n-empty>
      </n-card>
    </section>
  </CustomTransition>
  <MediaPicker
    v-model:show="pickerVisible"
    :title="t('selectImage')"
    :upload-config="{
      folder: folder,
      limit: 0,
      maxSize: 0,
      baseUrl: appConfig?.apiUrl + '/media-files/upload',
      excludedExtensions: [],
    }"
    @submit="saveImage" />
  <n-modal
    v-model:show="dialogVisible"
    :loading="isProceeding"
    preset="dialog"
    style="width: 500px"
    :show-icon="false"
    :bordered="false"
    :mask-closable="false"
    :title="
      currentEditItem
        ? parentId
          ? t('editSubCategory')
          : t('editCategory')
        : parentId
        ? t('addSubCategory')
        : t('addCategory')
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
      <n-form-item :label="t('name')" path="name">
        <I18nInput
          v-model="formValue.name"
          :placeholder="t('name')"
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
        <n-form-item-gi :span="12" :label="t('position')" path="position">
          <n-input-number
            v-model:value="formValue.position"
            :placeholder="t('position')"
            class="w-full"
            :min="0" />
        </n-form-item-gi>
        <n-form-item-gi :span="12" :label="t('color')" path="color">
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
      </n-grid>
      <n-divider dashed class="!my-2"></n-divider>
      <n-grid x-gap="12" :span="24">
        <n-form-item-gi :span="12" :label="t('preview')" path="image">
          <n-space align="center" justify="center" style="height: 100%">
            <n-avatar
              class="cursor-pointer"
              object-fit="cover"
              :style="'border: 1px dashed ' + pickByTheme('green', 'white')"
              :size="150"
              :src="fileUrl(formValue.image || '')"
              @click="pickerVisible = true">
              <n-icon v-if="!formValue.image" :size="64">
                <Icon icon="carbon:image" class="text-gray-400" />
              </n-icon>
            </n-avatar>
            <n-button v-if="formValue.image" quaternary @click="clearImage()">
              <template #icon>
                <n-icon>
                  <Icon icon="carbon:trash-can" />
                </n-icon>
              </template>
              {{ t('clear') }}
            </n-button>
          </n-space>
        </n-form-item-gi>
        <n-form-item-gi :span="12" :label="t('status')" path="isActive">
          <n-switch v-model:value="formValue.isActive" size="small">
            <template #checked> {{ t('visible') }} </template>
            <template #unchecked> {{ t('hidden') }} </template>
          </n-switch>
        </n-form-item-gi>
      </n-grid>
    </n-form>
  </n-modal>
</template>

<style scoped lang="scss"></style>

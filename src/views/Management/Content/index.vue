<script lang="ts">
  export default defineComponent({
    name: Routes.CONTENT_MANAGEMENT.NAME,
  })
</script>

<script setup lang="ts">
  import { AppInformationModel } from '@/models/app-information'
  import Routes from '@/router/routes'
  import {
    AppInformationKey,
    AppInformationObject,
  } from '@/stores/app-information'

  import {
    FormInst,
    FormItemRule,
    FormRules,
    FormValidationError,
    MenuOption,
    NIcon,
  } from 'naive-ui'
  import { Icon } from '@iconify/vue'

  import Ads from './Ads/index.vue'
  import Page from './Page/index.vue'
  import Menus from './Menus/index.vue'
  import Videos from './Videos/index.vue'
  import PageSections from './PageSections/index.vue'
  import NewsletterEmail from './Newsletter/Email.vue'
  import NewsletterPhone from './Newsletter/Phone.vue'
  import ContentModels from './ContentModels/index.vue'
  import ContentPermalinks from './ContentPermalinks/index.vue'
  import NewsletterCampaign from './Newsletter/Campaign.vue'

  import PickColors, { Theme } from 'vue-pick-colors'

  import { PageModel } from '@/models/page'
  import { ResponseErrorCode } from '@/enums/response-error-code'
  import { AppConfig } from '@/utils/types'

  const menuKeys = [
    'contact-info',
    'appearance',
    'social-networks',
    'newsletter-email',
    'newsletter-phone',
    'newsletter-campaign',
    'ads',
    'videos',
    'menus',
    'content-permalinks',
    'content-models',
    'page-sections',
    'add-new-page',
  ]

  type MenuKey = (typeof menuKeys)[number]

  const isMenuKey = (value: string): value is MenuKey => {
    return menuKeys.includes(value)
  }

  const { t } = useI18n()

  const route = useRoute()
  const dialog = useDialog()
  const message = useMessage()
  const loadingBar = useLoadingBar()

  const { request } = useApi()
  const {
    displayFormErrors,
    appPrimaryColor,
    appSecondaryColor,
    pickByTheme,
    fileUrl,
    isLgScreen,
    isMdScreen,
    isSmScreen,
    isXlScreen,
    is2XlScreen,
    tr,
  } = useHelper()

  const uiStore = useUserInterfaceStore()
  const appInformationStore = useAppInformationStore()
  const { pages } = storeToRefs(useContentStore())
  const { loadPages, loadSections } = useContentStore()

  const appConfig = inject<AppConfig>('appConfig')

  const isProceeding = ref<boolean>(false)
  const settings = ref<AppInformationObject>({
    name: '',
    icon: '',
    adminIcon: '',
    oneColorIcon: '',
    oneColorAdminIcon: '',
    logo: '',
    adminLogo: '',
    oneColorLogo: '',
    oneColorAdminLogo: '',
    adminAuthDarkBg: '',
    adminAuthLightBg: '',
    phone: '',
    email: '',
    address: '',
    postalCode: '',
    description: '',
    primaryColor: '',
    secondaryColor: '',
    accentColor: '',

    facebook: '',
    twitter: '',
    instagram: '',
    whatsapp: '',
    linkedin: '',
    youtube: '',
    pinterest: '',
    snapchat: '',
    tiktok: '',
    telegram: '',
    discord: '',
    reddit: '',
    tumblr: '',
    vimeo: '',
    messenger: '',
    twitch: '',
    github: '',
    dribbble: '',
    behance: '',
    medium: '',
    stackOverflow: '',
    playstore: '',
    appstore: '',
    threads: '',

    additionalInfo: '',
  })
  const initialSettings = ref<AppInformationObject>(settings.value)

  const store = defineStore('content-management', () => {
    const currentMenuItemKey = ref<MenuKey>('contact-info')

    return { currentMenuItemKey }
  })()

  const renderIcon = (icon: string, key: MenuKey | any) => {
    return () =>
      h(
        NIcon,
        { color: store.currentMenuItemKey == key ? 'white' : '' },
        { default: () => h(Icon, { icon }) }
      )
  }

  const renderLabel = (label: string, key: MenuKey | any) => {
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

  const menuOptions = computed<MenuOption[]>(() => {
    const options = [
      {
        label: renderLabel(t('contactInfo'), 'contact-info'),
        key: 'contact-info',
        icon: renderIcon('carbon:identification', 'contact-info'),
      },
      {
        label: renderLabel(t('appearance'), 'appearance'),
        key: 'appearance',
        icon: renderIcon('carbon:color-palette', 'appearance'),
      },
      {
        label: renderLabel(t('socialNetworks'), 'social-networks'),
        key: 'social-networks',
        icon: renderIcon('carbon:share', 'social-networks'),
      },
      {
        key: 'divider',
        type: 'divider',
      },
      {
        label: renderLabel(t('newsletterEmails'), 'newsletter-email'),
        key: 'newsletter-email',
        icon: renderIcon('carbon:at', 'newsletter-email'),
      },
      {
        label: renderLabel(t('newsletterNumbers'), 'newsletter-phone'),
        key: 'newsletter-phone',
        icon: renderIcon('carbon:phone', 'newsletter-phone'),
      },
      {
        label: renderLabel(t('newsletterCampaigns'), 'newsletter-campaign'),
        key: 'newsletter-campaign',
        icon: renderIcon('carbon:bullhorn', 'newsletter-campaign'),
      },
      {
        key: 'divider',
        type: 'divider',
      },
      {
        label: renderLabel(t('ads'), 'ads'),
        key: 'ads',
        icon: renderIcon('ic:baseline-ads-click', 'ads'),
      },
      {
        key: 'divider',
        type: 'divider',
      },
      {
        label: renderLabel(t('videos'), 'videos'),
        key: 'videos',
        icon: renderIcon('carbon:video-player', 'videos'),
      },
      {
        key: 'divider',
        type: 'divider',
      },
      {
        label: renderLabel(t('menusManagement'), 'menus'),
        key: 'menus',
        icon: renderIcon('carbon:menu', 'menus'),
      },
      {
        label: renderLabel(t('contentPermalinks'), 'content-permalinks'),
        key: 'content-permalinks',
        icon: renderIcon('carbon:link', 'content-permalinks'),
      },
      {
        key: 'divider',
        type: 'divider',
      },
      {
        label: renderLabel(t('contentModels'), 'content-models'),
        key: 'content-models',
        icon: renderIcon('carbon:model-alt', 'content-models'),
      },
      {
        label: renderLabel(t('pageSections'), 'page-sections'),
        key: 'page-sections',
        icon: renderIcon('carbon:list-boxes', 'page-sections'),
      },
      {
        key: 'divider',
        type: 'divider',
      },
    ]

    for (const page of pages.value) {
      options.push({
        label: renderLabel(
          `${t('page')} ${tr(page.title)}`,
          `${page.slug}-page`
        ),
        key: `${page.slug}-page`,
        icon: renderIcon('carbon:document', `${page.slug}-page`),
      })
    }

    options.push(
      ...[
        {
          key: 'divider',
          type: 'divider',
        },
        {
          label: renderLabel(t('addPage'), 'add-new-page'),
          key: 'add-new-page',
          icon: renderIcon('carbon:add-alt', 'add-new-page'),
        },
      ]
    )

    return options
  })

  const saveBtnDisabled = computed(() => {
    return _.isEqual(settings.value, initialSettings.value)
  })

  const layoutHeight = computed(() => {
    return uiStore.contentLayoutSize.height - 200
  })

  const theme = computed<Theme>(() => {
    return uiStore.isLightTheme ? 'light' : 'dark'
  })

  // Contact Info

  const contactInfoFormRef = ref<FormInst | null>(null)
  const contactInfoRules: FormRules = {
    email: [
      {
        required: false,
        message: t('fillRequired'),
      },
      {
        trigger: ['input'],
        validator(rule: FormItemRule, value: string) {
          if (value && !_v.isEmail(value)) {
            return new Error(t('invalidEmail'))
          }

          return true
        },
      },
    ],
  }

  const additionalInfo = ref()

  watch(
    () => additionalInfo.value,
    (nv) => {
      settings.value.additionalInfo = JSON.stringify(nv || '[]')
    },
    {
      deep: true,
    }
  )

  // Social Networks

  const socialNetworksFormRef = ref<FormInst | null>(null)
  const socialNetworksRules: FormRules = {}

  const socialNetworks = [
    { name: 'facebook', icon: 'fa-brands:facebook' },
    { name: 'twitter', icon: 'fa6-brands:x-twitter' },
    { name: 'instagram', icon: 'fa-brands:instagram' },
    { name: 'whatsapp', icon: 'fa-brands:whatsapp' },
    { name: 'linkedin', icon: 'fa-brands:linkedin' },
    { name: 'youtube', icon: 'fa-brands:youtube' },
    { name: 'pinterest', icon: 'fa-brands:pinterest' },
    { name: 'snapchat', icon: 'fa-brands:snapchat' },
    { name: 'tiktok', icon: 'fa-brands:tiktok' },
    { name: 'threads', icon: 'fa6-brands:threads' },
    { name: 'telegram', icon: 'fa-brands:telegram' },
    { name: 'discord', icon: 'fa-brands:discord' },
    { name: 'reddit', icon: 'fa-brands:reddit' },
    { name: 'tumblr', icon: 'fa-brands:tumblr' },
    { name: 'vimeo', icon: 'fa-brands:vimeo' },
    { name: 'messenger', icon: 'fa6-brands:facebook-messenger' },
    { name: 'twitch', icon: 'fa-brands:twitch' },
    { name: 'github', icon: 'fa-brands:github' },
    { name: 'dribbble', icon: 'fa-brands:dribbble' },
    { name: 'behance', icon: 'fa-brands:behance' },
    { name: 'medium', icon: 'fa-brands:medium' },
    { name: 'stackOverflow', icon: 'fa-brands:stack-overflow' },
    { name: 'playstore', icon: 'fa-brands:google-play' },
    { name: 'appstore', icon: 'fa-brands:app-store' },
  ]

  // LOGO & ICON & BACKGROUND

  const folder = ref<
    | 'logos'
    | 'icons'
    | 'admin-logos'
    | 'admin-icons'
    | 'monochrome-logos'
    | 'monochrome-icons'
    | 'monochrome-admin-logos'
    | 'monochrome-admin-icons'
    | 'dark-backgrounds'
    | 'light-backgrounds'
  >('logos')
  const pickerVisible = ref(false)

  const saveImage = async (url: string) => {
    switch (folder.value) {
      case 'logos':
        settings.value.logo = url
        break
      case 'icons':
        settings.value.icon = url
        break
      case 'admin-logos':
        settings.value.adminLogo = url
        break
      case 'admin-icons':
        settings.value.adminIcon = url
        break
      case 'monochrome-logos':
        settings.value.oneColorLogo = url
        break
      case 'monochrome-icons':
        settings.value.oneColorIcon = url
        break
      case 'monochrome-admin-logos':
        settings.value.oneColorAdminLogo = url
        break
      case 'monochrome-admin-icons':
        settings.value.oneColorAdminIcon = url
        break
      case 'dark-backgrounds':
        settings.value.adminAuthDarkBg = url
        break
      case 'light-backgrounds':
        settings.value.adminAuthLightBg = url
        break
    }

    pickerVisible.value = false
  }

  // Add new page
  const addPageDefaultValue: PageModel = {
    name: '',
    title: '',
    content: '',
    slug: '',
  }
  const addPageDialogVisible = ref(false)
  const addPageFormRef = ref<FormInst | null>(null)
  const addPageFormValue = ref<PageModel>(addPageDefaultValue)
  const addPageRules: FormRules = {
    title: [
      {
        required: true,
        message: t('fillRequired'),
      },
    ],
  }
  const currentEditPageItem = ref<PageModel | null>(null)

  const openPageFormModal = (item: PageModel | null) => {
    currentEditPageItem.value = _.cloneDeep(item)
    addPageFormValue.value = _.cloneDeep(item ? item : addPageDefaultValue)

    addPageDialogVisible.value = true
  }

  const submitPage = async () => {
    addPageFormRef.value?.validate(
      async (errors: Array<FormValidationError> | undefined) => {
        if (!errors) {
          loadingBar.start()
          isProceeding.value = true

          const data: any = {
            title: addPageFormValue.value.title,
          }

          if (!currentEditPageItem.value) {
            data.name = _.startCase(
              _.camelCase(tr(addPageFormValue.value.title))
            ).replace(/\s+/g, '')
          }

          const task = await request({
            method: currentEditPageItem.value ? 'put' : 'post',
            url: currentEditPageItem.value
              ? `/pages/${currentEditPageItem.value.slug}`
              : '/pages',
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

            loadPages()

            store.currentMenuItemKey = `${task.result.data?.slug}-page`
            addPageDialogVisible.value = false
          }

          isProceeding.value = false
          loadingBar.finish()
        }
      }
    )

    return false
  }

  // Initialization

  const init = async (loadAllData = false) => {
    loadingBar.start()
    isProceeding.value = true

    loadPages()
    if (loadAllData) loadSections()

    await appInformationStore.loadInformation()

    appInformationStore.items?.forEach((setting: AppInformationModel) => {
      if (settings.value[setting.key as keyof typeof settings.value] != null) {
        settings.value[setting.key as keyof typeof settings.value] =
          setting.value
      }
    })

    initialSettings.value = _.cloneDeep(settings.value)

    try {
      additionalInfo.value = JSON.parse(settings.value.additionalInfo || '[]')
    } catch (e) {
      additionalInfo.value = []
    }

    isProceeding.value = false
    loadingBar.finish()
  }

  init(true)

  onMounted(() => {
    if (route.params.key && isMenuKey(route.params.key as string)) {
      store.currentMenuItemKey = route.params.key as MenuKey
    }
  })

  const submit = async () => {
    isProceeding.value = true

    const task = await request({
      url: `/app-information`,
      method: 'put',
      data: settings.value,
    })

    if (task.success && task.result) {
      message.success(t('success'))
    } else {
      message.error(t('unableToUpdateSettings'))
    }

    await init()
  }

  const baseSections: MenuKey[] = [
    'contact-info',
    'appearance',
    'social-networks',
  ]

  watch(
    () => store.currentMenuItemKey,
    (nv, ov) => {
      if (nv === 'add-new-page') {
        store.currentMenuItemKey = ov

        openPageFormModal(null)
      } else {
        if (baseSections.includes(ov) && !baseSections.includes(nv)) {
          if (!saveBtnDisabled.value) {
            dialog.warning({
              title: t('confirm'),
              content: t('marketInfoDiscardChangesConfirm'),
              positiveText: t('yes'),
              negativeText: t('cancel'),
              onPositiveClick: async () => {
                //
              },
              onNegativeClick: async () => {
                store.currentMenuItemKey = ov
              },
            })
          }
        }
      }
    }
  )

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
    },
    {
      immediate: true,
    }
  )
</script>

<template>
  <PageLayout>
    <template #header-extra>
      <n-space>
        <div id="header-btn">
          <n-button
            v-if="baseSections.includes(store.currentMenuItemKey)"
            :loading="isProceeding"
            :disabled="saveBtnDisabled"
            type="primary"
            @click="submit">
            <template #icon>
              <n-icon><Icon icon="carbon:save" /></n-icon>
            </template>
            {{ t('save') }}
          </n-button>
          <div v-else id="alt-action"></div>
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
                v-show="store.currentMenuItemKey === 'contact-info'"
                key="contact-info">
                <n-card embedded>
                  <n-card hoverable>
                    <n-form
                      ref="contactInfoFormRef"
                      :model="settings"
                      :rules="contactInfoRules"
                      :show-label="true"
                      :show-require-mark="false"
                      size="medium">
                      <n-form-item path="name">
                        <template #label>
                          <b class="text-xs">{{ t('websiteName') }}</b>
                        </template>
                        <n-input
                          v-model:value="settings.name"
                          :placeholder="t('websiteName')"
                          class="w-full" />
                      </n-form-item>
                      <n-grid x-gap="12" :span="24">
                        <n-form-item-gi :span="12" path="email">
                          <template #label>
                            <b class="text-xs">{{ t('email') }}</b>
                          </template>
                          <n-input
                            v-model:value="settings.email"
                            :placeholder="t('email')"
                            class="w-full">
                            <template #prefix>
                              <n-icon>
                                <Icon icon="carbon:email" />
                              </n-icon>
                            </template>
                          </n-input>
                        </n-form-item-gi>
                        <n-form-item-gi :span="12" path="phone">
                          <template #label>
                            <b class="text-xs">{{ t('phone') }}</b>
                          </template>
                          <n-input
                            v-model:value="settings.phone"
                            :placeholder="t('phone')"
                            class="w-full">
                            <template #prefix>
                              <n-icon>
                                <Icon icon="carbon:phone" />
                              </n-icon>
                            </template>
                          </n-input>
                        </n-form-item-gi>
                      </n-grid>
                      <n-form-item path="address">
                        <template #label>
                          <span class="text-xs">
                            <b>{{ t('address') }}</b>
                          </span>
                        </template>
                        <n-input
                          v-model:value="settings.address"
                          :placeholder="t('address')"
                          class="w-full">
                          <template #prefix>
                            <n-icon>
                              <Icon icon="carbon:location" />
                            </n-icon>
                          </template>
                        </n-input>
                      </n-form-item>
                      <n-grid x-gap="12" :span="24">
                        <n-form-item-gi :span="12" path="postalCode">
                          <template #label>
                            <b class="text-xs">{{ t('postalCode') }}</b>
                          </template>
                          <n-input
                            v-model:value="settings.postalCode"
                            :placeholder="t('postalCode')"
                            class="w-full">
                            <template #prefix>
                              <n-icon>
                                <Icon icon="carbon:text-short-paragraph" />
                              </n-icon>
                            </template>
                          </n-input>
                        </n-form-item-gi>
                      </n-grid>
                      <n-form-item path="description">
                        <template #label>
                          <b class="text-xs">{{ t('description') }}</b>
                        </template>
                        <I18nInput
                          v-model="settings.description"
                          :placeholder="t('description')"
                          :selector-span="3"
                          type="textarea"
                          class="w-full"
                          :rows="6"
                          sync />
                      </n-form-item>
                      <n-form-item path="additionalInfo">
                        <template #label>
                          <b class="text-xs">{{ t('additionalInfo') }}</b>
                        </template>
                        <n-dynamic-input
                          v-model:value="additionalInfo"
                          :show-sort-button="false"
                          :on-create="() => ({ name: '', content: '' })">
                          <template #create-button-default>
                            {{ t('add') }}
                          </template>
                          <template #default="{ value }">
                            <div class="flex items-center gap-2 w-full">
                              <n-input
                                v-model:value="value.name"
                                :placeholder="t('name')"
                                class="w-full" />
                              <n-input
                                v-model:value="value.content"
                                :placeholder="t('content')"
                                class="w-full" />
                            </div>
                          </template>
                        </n-dynamic-input>
                      </n-form-item>
                    </n-form>
                  </n-card>
                </n-card>
              </section>

              <section
                v-show="store.currentMenuItemKey === 'appearance'"
                key="appearance">
                <n-card embedded>
                  <n-card segmented size="small">
                    <template #header>
                      <span class="text-sm">
                        {{ t('website') }}
                      </span>
                    </template>
                    <n-grid
                      cols="1 s:1 m:2 l:2 xl:4 2xl:4"
                      responsive="screen"
                      x-gap="8"
                      y-gap="8">
                      <n-gi>
                        <n-card hoverable segmented size="small" class="h-full">
                          <template #header>
                            <span class="text-sm">{{ t('logo') }}</span>
                          </template>
                          <n-space
                            align="center"
                            justify="center"
                            style="height: 100%"
                            vertical>
                            <n-avatar
                              v-if="settings.logo"
                              class="cursor-pointer"
                              object-fit="contain"
                              :style="
                                'border: 1px dashed ' +
                                pickByTheme(appPrimaryColor, 'white')
                              "
                              :size="125"
                              :src="fileUrl(settings.logo)"
                              @click="
                                () => {
                                  folder = 'logos'
                                  pickerVisible = true
                                }
                              ">
                            </n-avatar>
                            <section
                              v-else
                              class="cursor-pointer flex items-center justify-center"
                              :style="`border: 1px dashed ${pickByTheme(
                                appPrimaryColor,
                                'white'
                              )}; width: 125px; height: 125px`"
                              @click="
                                () => {
                                  folder = 'logos'
                                  pickerVisible = true
                                }
                              ">
                              <div
                                class="flex flex-col items-center justify-center text-gray-400">
                                <n-icon size="50">
                                  <Icon icon="carbon:image" />
                                </n-icon>
                                <span>{{ t('import') }}</span>
                              </div>
                            </section>
                            <n-button
                              v-if="settings.logo"
                              quaternary
                              @click="() => (settings.logo = '')">
                              <template #icon>
                                <n-icon>
                                  <Icon icon="carbon:trash-can" />
                                </n-icon>
                              </template>
                              {{ t('clear') }}
                            </n-button>
                          </n-space>
                        </n-card>
                      </n-gi>
                      <n-gi>
                        <n-card hoverable segmented size="small" class="h-full">
                          <template #header>
                            <span class="text-sm">{{ t('icon') }}</span>
                          </template>
                          <n-space
                            align="center"
                            justify="center"
                            style="height: 100%"
                            vertical>
                            <n-avatar
                              v-if="settings.icon"
                              class="cursor-pointer"
                              object-fit="contain"
                              :style="
                                'border: 1px dashed ' +
                                pickByTheme(appPrimaryColor, 'white')
                              "
                              :size="125"
                              :src="fileUrl(settings.icon)"
                              @click="
                                () => {
                                  folder = 'icons'
                                  pickerVisible = true
                                }
                              ">
                            </n-avatar>
                            <section
                              v-else
                              class="cursor-pointer flex items-center justify-center"
                              :style="`border: 1px dashed ${pickByTheme(
                                appPrimaryColor,
                                'white'
                              )}; width: 125px; height: 125px`"
                              @click="
                                () => {
                                  folder = 'icons'
                                  pickerVisible = true
                                }
                              ">
                              <div
                                class="flex flex-col items-center justify-center text-gray-400">
                                <n-icon size="50">
                                  <Icon icon="carbon:image" />
                                </n-icon>
                                <span>{{ t('import') }}</span>
                              </div>
                            </section>
                            <n-button
                              v-if="settings.icon"
                              quaternary
                              @click="() => (settings.icon = '')">
                              <template #icon>
                                <n-icon>
                                  <Icon icon="carbon:trash-can" />
                                </n-icon>
                              </template>
                              {{ t('clear') }}
                            </n-button>
                          </n-space>
                        </n-card>
                      </n-gi>
                      <n-gi>
                        <n-card hoverable segmented size="small" class="h-full">
                          <template #header>
                            <span class="text-sm">{{
                              t('logoMonochrome')
                            }}</span>
                          </template>
                          <n-space
                            align="center"
                            justify="center"
                            style="height: 100%"
                            vertical>
                            <n-avatar
                              v-if="settings.oneColorLogo"
                              class="cursor-pointer !bg-black !text-white"
                              object-fit="contain"
                              :style="
                                'border: 1px dashed ' +
                                pickByTheme(appPrimaryColor, 'white')
                              "
                              :size="125"
                              :src="fileUrl(settings.oneColorLogo)"
                              @click="
                                () => {
                                  folder = 'monochrome-logos'
                                  pickerVisible = true
                                }
                              ">
                            </n-avatar>
                            <section
                              v-else
                              class="cursor-pointer flex items-center justify-center bg-black text-white"
                              :style="`border: 1px dashed ${pickByTheme(
                                appPrimaryColor,
                                'white'
                              )}; width: 125px; height: 125px`"
                              @click="
                                () => {
                                  folder = 'monochrome-logos'
                                  pickerVisible = true
                                }
                              ">
                              <div
                                class="flex flex-col items-center justify-center text-gray-400">
                                <n-icon size="50">
                                  <Icon icon="carbon:image" />
                                </n-icon>
                                <span>{{ t('import') }}</span>
                              </div>
                            </section>
                            <n-button
                              v-if="settings.oneColorLogo"
                              quaternary
                              @click="() => (settings.oneColorLogo = '')">
                              <template #icon>
                                <n-icon>
                                  <Icon icon="carbon:trash-can" />
                                </n-icon>
                              </template>
                              {{ t('clear') }}
                            </n-button>
                          </n-space>
                        </n-card>
                      </n-gi>
                      <n-gi>
                        <n-card hoverable segmented size="small" class="h-full">
                          <template #header>
                            <span class="text-sm">{{
                              t('iconMonochrome')
                            }}</span>
                          </template>
                          <n-space
                            align="center"
                            justify="center"
                            style="height: 100%"
                            vertical>
                            <n-avatar
                              v-if="settings.oneColorIcon"
                              class="cursor-pointer !bg-black !text-white"
                              object-fit="contain"
                              :style="
                                'border: 1px dashed ' +
                                pickByTheme(appPrimaryColor, 'white')
                              "
                              :size="125"
                              :src="fileUrl(settings.oneColorIcon)"
                              @click="
                                () => {
                                  folder = 'monochrome-icons'
                                  pickerVisible = true
                                }
                              ">
                            </n-avatar>
                            <section
                              v-else
                              class="cursor-pointer flex items-center justify-center bg-black text-white"
                              :style="`border: 1px dashed ${pickByTheme(
                                appPrimaryColor,
                                'white'
                              )}; width: 125px; height: 125px`"
                              @click="
                                () => {
                                  folder = 'monochrome-icons'
                                  pickerVisible = true
                                }
                              ">
                              <div
                                class="flex flex-col items-center justify-center text-gray-400">
                                <n-icon size="50">
                                  <Icon icon="carbon:image" />
                                </n-icon>
                                <span>{{ t('import') }}</span>
                              </div>
                            </section>
                            <n-button
                              v-if="settings.oneColorIcon"
                              quaternary
                              @click="() => (settings.oneColorIcon = '')">
                              <template #icon>
                                <n-icon>
                                  <Icon icon="carbon:trash-can" />
                                </n-icon>
                              </template>
                              {{ t('clear') }}
                            </n-button>
                          </n-space>
                        </n-card>
                      </n-gi>
                    </n-grid>
                  </n-card>
                </n-card>
                <n-card embedded content-class="!pt-0">
                  <n-card segmented size="small">
                    <template #header>
                      <span class="text-sm">
                        {{ t('administration') }}
                      </span>
                    </template>
                    <n-grid
                      cols="1 s:1 m:2 l:2 xl:4 2xl:4"
                      responsive="screen"
                      x-gap="8"
                      y-gap="8">
                      <n-gi>
                        <n-card hoverable segmented size="small" class="h-full">
                          <template #header>
                            <span class="text-sm">{{ t('logo') }}</span>
                          </template>
                          <n-space
                            align="center"
                            justify="center"
                            style="height: 100%"
                            vertical>
                            <n-avatar
                              v-if="settings.adminLogo"
                              class="cursor-pointer"
                              object-fit="contain"
                              :style="
                                'border: 1px dashed ' +
                                pickByTheme(appPrimaryColor, 'white')
                              "
                              :size="125"
                              :src="fileUrl(settings.adminLogo)"
                              @click="
                                () => {
                                  folder = 'admin-logos'
                                  pickerVisible = true
                                }
                              ">
                            </n-avatar>
                            <section
                              v-else
                              class="cursor-pointer flex items-center justify-center"
                              :style="`border: 1px dashed ${pickByTheme(
                                appPrimaryColor,
                                'white'
                              )}; width: 125px; height: 125px`"
                              @click="
                                () => {
                                  folder = 'admin-logos'
                                  pickerVisible = true
                                }
                              ">
                              <div
                                class="flex flex-col items-center justify-center text-gray-400">
                                <n-icon size="50">
                                  <Icon icon="carbon:image" />
                                </n-icon>
                                <span>{{ t('import') }}</span>
                              </div>
                            </section>
                            <n-button
                              v-if="settings.adminLogo"
                              quaternary
                              @click="() => (settings.adminLogo = '')">
                              <template #icon>
                                <n-icon>
                                  <Icon icon="carbon:trash-can" />
                                </n-icon>
                              </template>
                              {{ t('clear') }}
                            </n-button>
                          </n-space>
                        </n-card>
                      </n-gi>
                      <n-gi>
                        <n-card hoverable segmented size="small" class="h-full">
                          <template #header>
                            <span class="text-sm">{{ t('icon') }}</span>
                          </template>
                          <n-space
                            align="center"
                            justify="center"
                            style="height: 100%"
                            vertical>
                            <n-avatar
                              v-if="settings.adminIcon"
                              class="cursor-pointer"
                              object-fit="contain"
                              :style="
                                'border: 1px dashed ' +
                                pickByTheme(appPrimaryColor, 'white')
                              "
                              :size="125"
                              :src="fileUrl(settings.adminIcon)"
                              @click="
                                () => {
                                  folder = 'admin-icons'
                                  pickerVisible = true
                                }
                              ">
                            </n-avatar>
                            <section
                              v-else
                              class="cursor-pointer flex items-center justify-center"
                              :style="`border: 1px dashed ${pickByTheme(
                                appPrimaryColor,
                                'white'
                              )}; width: 125px; height: 125px`"
                              @click="
                                () => {
                                  folder = 'admin-icons'
                                  pickerVisible = true
                                }
                              ">
                              <div
                                class="flex flex-col items-center justify-center text-gray-400">
                                <n-icon size="50">
                                  <Icon icon="carbon:image" />
                                </n-icon>
                                <span>{{ t('import') }}</span>
                              </div>
                            </section>
                            <n-button
                              v-if="settings.adminIcon"
                              quaternary
                              @click="() => (settings.adminIcon = '')">
                              <template #icon>
                                <n-icon>
                                  <Icon icon="carbon:trash-can" />
                                </n-icon>
                              </template>
                              {{ t('clear') }}
                            </n-button>
                          </n-space>
                        </n-card>
                      </n-gi>
                      <n-gi>
                        <n-card hoverable segmented size="small" class="h-full">
                          <template #header>
                            <span class="text-sm">{{
                              t('logoMonochrome')
                            }}</span>
                          </template>
                          <n-space
                            align="center"
                            justify="center"
                            style="height: 100%"
                            vertical>
                            <n-avatar
                              v-if="settings.oneColorAdminLogo"
                              class="cursor-pointer !bg-black !text-white"
                              object-fit="contain"
                              :style="
                                'border: 1px dashed ' +
                                pickByTheme(appPrimaryColor, 'white')
                              "
                              :size="125"
                              :src="fileUrl(settings.oneColorAdminLogo)"
                              @click="
                                () => {
                                  folder = 'monochrome-admin-logos'
                                  pickerVisible = true
                                }
                              ">
                            </n-avatar>
                            <section
                              v-else
                              class="cursor-pointer flex items-center justify-center bg-black text-white"
                              :style="`border: 1px dashed ${pickByTheme(
                                appPrimaryColor,
                                'white'
                              )}; width: 125px; height: 125px`"
                              @click="
                                () => {
                                  folder = 'monochrome-admin-logos'
                                  pickerVisible = true
                                }
                              ">
                              <div
                                class="flex flex-col items-center justify-center text-gray-400">
                                <n-icon size="50">
                                  <Icon icon="carbon:image" />
                                </n-icon>
                                <span>{{ t('import') }}</span>
                              </div>
                            </section>
                            <n-button
                              v-if="settings.oneColorAdminLogo"
                              quaternary
                              @click="() => (settings.oneColorAdminLogo = '')">
                              <template #icon>
                                <n-icon>
                                  <Icon icon="carbon:trash-can" />
                                </n-icon>
                              </template>
                              {{ t('clear') }}
                            </n-button>
                          </n-space>
                        </n-card>
                      </n-gi>
                      <n-gi>
                        <n-card hoverable segmented size="small" class="h-full">
                          <template #header>
                            <span class="text-sm">{{
                              t('iconMonochrome')
                            }}</span>
                          </template>
                          <n-space
                            align="center"
                            justify="center"
                            style="height: 100%"
                            vertical>
                            <n-avatar
                              v-if="settings.oneColorAdminIcon"
                              class="cursor-pointer !bg-black !text-white"
                              object-fit="contain"
                              :style="
                                'border: 1px dashed ' +
                                pickByTheme(appPrimaryColor, 'white')
                              "
                              :size="125"
                              :src="fileUrl(settings.oneColorAdminIcon)"
                              @click="
                                () => {
                                  folder = 'monochrome-admin-icons'
                                  pickerVisible = true
                                }
                              ">
                            </n-avatar>
                            <section
                              v-else
                              class="cursor-pointer flex items-center justify-center bg-black text-white"
                              :style="`border: 1px dashed ${pickByTheme(
                                appPrimaryColor,
                                'white'
                              )}; width: 125px; height: 125px`"
                              @click="
                                () => {
                                  folder = 'monochrome-admin-icons'
                                  pickerVisible = true
                                }
                              ">
                              <div
                                class="flex flex-col items-center justify-center text-gray-400">
                                <n-icon size="50">
                                  <Icon icon="carbon:image" />
                                </n-icon>
                                <span>{{ t('import') }}</span>
                              </div>
                            </section>
                            <n-button
                              v-if="settings.oneColorAdminIcon"
                              quaternary
                              @click="() => (settings.oneColorAdminIcon = '')">
                              <template #icon>
                                <n-icon>
                                  <Icon icon="carbon:trash-can" />
                                </n-icon>
                              </template>
                              {{ t('clear') }}
                            </n-button>
                          </n-space>
                        </n-card>
                      </n-gi>
                    </n-grid>
                  </n-card>
                </n-card>
                <n-card embedded content-class="!pt-0">
                  <n-card segmented size="small">
                    <template #header>
                      <span class="text-sm">
                        {{ t('adminAuthPagesBg') }}
                      </span>
                    </template>
                    <n-grid
                      cols="1 s:1 m:2 l:2 xl:2 2xl:2"
                      responsive="screen"
                      x-gap="8"
                      y-gap="8">
                      <n-gi>
                        <n-card hoverable segmented size="small" class="h-full">
                          <template #header>
                            <span class="text-sm">
                              {{ t('lightMode') }}
                            </span>
                          </template>
                          <n-space
                            align="center"
                            justify="center"
                            style="height: 100%"
                            vertical>
                            <n-avatar
                              v-if="settings.adminAuthLightBg"
                              class="cursor-pointer"
                              object-fit="contain"
                              :style="
                                'border: 1px dashed ' +
                                pickByTheme(appPrimaryColor, 'white')
                              "
                              :size="125"
                              :src="fileUrl(settings.adminAuthLightBg)"
                              @click="
                                () => {
                                  folder = 'light-backgrounds'
                                  pickerVisible = true
                                }
                              ">
                            </n-avatar>
                            <section
                              v-else
                              class="cursor-pointer flex items-center justify-center"
                              :style="`border: 1px dashed ${pickByTheme(
                                appPrimaryColor,
                                'white'
                              )}; width: 125px; height: 125px`"
                              @click="
                                () => {
                                  folder = 'light-backgrounds'
                                  pickerVisible = true
                                }
                              ">
                              <div
                                class="flex flex-col items-center justify-center text-gray-400">
                                <n-icon size="50">
                                  <Icon icon="carbon:image" />
                                </n-icon>
                                <span>{{ t('import') }}</span>
                              </div>
                            </section>
                            <n-button
                              v-if="settings.adminAuthLightBg"
                              quaternary
                              @click="() => (settings.adminAuthLightBg = '')">
                              <template #icon>
                                <n-icon>
                                  <Icon icon="carbon:trash-can" />
                                </n-icon>
                              </template>
                              {{ t('clear') }}
                            </n-button>
                          </n-space>
                        </n-card>
                      </n-gi>
                      <n-gi>
                        <n-card hoverable segmented size="small" class="h-full">
                          <template #header>
                            <span class="text-sm">
                              {{ t('darkMode') }}
                            </span>
                          </template>
                          <n-space
                            align="center"
                            justify="center"
                            style="height: 100%"
                            vertical>
                            <n-avatar
                              v-if="settings.adminAuthDarkBg"
                              class="cursor-pointer"
                              object-fit="contain"
                              :style="
                                'border: 1px dashed ' +
                                pickByTheme(appPrimaryColor, 'white')
                              "
                              :size="125"
                              :src="fileUrl(settings.adminAuthDarkBg)"
                              @click="
                                () => {
                                  folder = 'dark-backgrounds'
                                  pickerVisible = true
                                }
                              ">
                            </n-avatar>
                            <section
                              v-else
                              class="cursor-pointer flex items-center justify-center"
                              :style="`border: 1px dashed ${pickByTheme(
                                appPrimaryColor,
                                'white'
                              )}; width: 125px; height: 125px`"
                              @click="
                                () => {
                                  folder = 'dark-backgrounds'
                                  pickerVisible = true
                                }
                              ">
                              <div
                                class="flex flex-col items-center justify-center text-gray-400">
                                <n-icon size="50">
                                  <Icon icon="carbon:image" />
                                </n-icon>
                                <span>{{ t('import') }}</span>
                              </div>
                            </section>
                            <n-button
                              v-if="settings.adminAuthDarkBg"
                              quaternary
                              @click="() => (settings.adminAuthDarkBg = '')">
                              <template #icon>
                                <n-icon>
                                  <Icon icon="carbon:trash-can" />
                                </n-icon>
                              </template>
                              {{ t('clear') }}
                            </n-button>
                          </n-space>
                        </n-card>
                      </n-gi>
                    </n-grid>
                  </n-card>
                </n-card>
                <n-card embedded content-class="!pt-0">
                  <n-card hoverable segmented size="small">
                    <template #header>
                      <span class="text-sm">{{ t('adminColors') }}</span>
                    </template>
                    <n-grid
                      cols="1 s:1 m:3 l:3 xl:3 2xl:3"
                      responsive="screen"
                      x-gap="42">
                      <n-gi>
                        <div class="flex items-center justify-between">
                          <span class="font-bold">{{ t('baseColor') }}</span>
                          <div class="flex items-center">
                            <template v-if="settings.primaryColor">
                              <n-button
                                text
                                type="error"
                                style="font-size: 21px"
                                @click="settings.primaryColor = ''">
                                <n-icon>
                                  <Icon icon="carbon:trash-can" />
                                </n-icon>
                              </n-button>
                              <n-divider vertical></n-divider>
                            </template>
                            <pick-colors
                              v-model:value="settings.primaryColor"
                              class="cursor-pointer"
                              :theme="theme"
                              format="hex"
                              size="25">
                            </pick-colors>
                          </div>
                        </div>
                      </n-gi>
                      <n-gi>
                        <div class="flex items-center justify-between">
                          <span class="font-bold">{{
                            t('secondaryColor')
                          }}</span>
                          <div class="flex items-center">
                            <template v-if="settings.secondaryColor">
                              <n-button
                                text
                                type="error"
                                style="font-size: 21px"
                                @click="settings.secondaryColor = ''">
                                <n-icon>
                                  <Icon icon="carbon:trash-can" />
                                </n-icon>
                              </n-button>
                              <n-divider vertical></n-divider>
                            </template>
                            <pick-colors
                              v-model:value="settings.secondaryColor"
                              class="cursor-pointer"
                              :theme="theme"
                              format="hex"
                              size="25">
                            </pick-colors>
                          </div>
                        </div>
                      </n-gi>
                      <n-gi>
                        <div class="flex items-center justify-between">
                          <span class="font-bold">{{
                            t('tertiaryColor')
                          }}</span>
                          <div class="flex items-center">
                            <template v-if="settings.accentColor">
                              <n-button
                                text
                                type="error"
                                style="font-size: 21px"
                                @click="settings.accentColor = ''">
                                <n-icon>
                                  <Icon icon="carbon:trash-can" />
                                </n-icon>
                              </n-button>
                              <n-divider vertical></n-divider>
                            </template>
                            <pick-colors
                              v-model:value="settings.accentColor"
                              class="cursor-pointer"
                              :theme="theme"
                              format="hex"
                              size="25">
                            </pick-colors>
                          </div>
                        </div>
                      </n-gi>
                    </n-grid>
                  </n-card>
                </n-card>
              </section>

              <section
                v-show="store.currentMenuItemKey === 'social-networks'"
                key="social-networks">
                <n-card embedded>
                  <n-card hoverable>
                    <n-form
                      ref="socialNetworksFormRef"
                      :model="settings"
                      :rules="socialNetworksRules"
                      :show-label="true"
                      :show-require-mark="false"
                      size="medium">
                      <n-grid x-gap="12" :span="24">
                        <n-form-item-gi
                          v-for="network in socialNetworks"
                          :key="network.name"
                          :span="12"
                          :path="network.name">
                          <template #label>
                            <b class="text-xs">{{ t(network.name) }}</b>
                          </template>
                          <n-input
                            v-model:value="settings[network.name as AppInformationKey]"
                            :placeholder="t(network.name)"
                            class="w-full">
                            <template #prefix>
                              <n-icon>
                                <Icon :icon="network.icon" />
                              </n-icon>
                            </template>
                          </n-input>
                        </n-form-item-gi>
                      </n-grid>
                    </n-form>
                  </n-card>
                </n-card>
              </section>

              <section
                v-if="store.currentMenuItemKey === 'newsletter-email'"
                key="newsletter-email">
                <NewsletterEmail />
              </section>

              <section
                v-if="store.currentMenuItemKey === 'newsletter-phone'"
                key="newsletter-phone">
                <NewsletterPhone />
              </section>

              <section
                v-if="store.currentMenuItemKey === 'newsletter-campaign'"
                key="newsletter-campaign">
                <NewsletterCampaign />
              </section>

              <section v-if="store.currentMenuItemKey === 'ads'" key="ads">
                <Ads />
              </section>

              <section
                v-if="store.currentMenuItemKey === 'videos'"
                key="videos">
                <Videos />
              </section>

              <section
                v-if="store.currentMenuItemKey === 'content-models'"
                key="content-models">
                <ContentModels />
              </section>

              <section v-if="store.currentMenuItemKey === 'menus'" key="menus">
                <Menus />
              </section>

              <section
                v-if="store.currentMenuItemKey === 'content-permalinks'"
                key="content-permalinks">
                <ContentPermalinks />
              </section>

              <section
                v-if="store.currentMenuItemKey === 'page-sections'"
                key="page-sections">
                <PageSections />
              </section>

              <template v-for="(page, i) in pages" :key="`${page.slug}-page`">
                <section
                  v-if="store.currentMenuItemKey === `${page.slug}-page`"
                  :key="`${page.slug}-page`">
                  <Page
                    :slug="page.slug"
                    :open-form-modal="openPageFormModal"
                    @delete="
                      () => {
                        store.currentMenuItemKey =
                          pages.length > 1
                            ? `${pages[i - 1].slug}-page`
                            : menuKeys[0]

                        loadPages()
                      }
                    " />
                </section>
              </template>
            </TransitionGroup>
          </n-layout>
        </n-layout>
      </n-layout>
    </n-card>
  </PageLayout>
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
    v-model:show="addPageDialogVisible"
    :loading="isProceeding"
    preset="dialog"
    style="width: 500px"
    :bordered="false"
    :show-icon="false"
    :mask-closable="false"
    :title="currentEditPageItem ? t('editPage') : t('addPage')"
    :positive-text="t('validate')"
    :negative-text="t('cancel')"
    @positive-click="submitPage"
    @negative-click="addPageDialogVisible = false">
    <n-form
      ref="addPageFormRef"
      :model="addPageFormValue"
      :rules="addPageRules"
      :show-require-mark="false"
      size="medium">
      <n-form-item :label="t('title')" path="title" class="mt-5">
        <I18nInput
          v-model="addPageFormValue.title"
          :placeholder="t('title')"
          :selector-span="5"
          class="w-full"
          sync
          @keydown.enter="submitPage" />
      </n-form-item>
    </n-form>
  </n-modal>
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

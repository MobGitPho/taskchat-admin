<script setup lang="ts">
  import { GOOGLE_MAPS_API_KEY } from '@/utils/constants'
  import { hexToRgba } from '@/utils/functions'

  import { darkTheme, dateEnUS, dateFrFR, enUS, frFR } from 'naive-ui'

  import { app } from '@/main'
  import Wrapper from '@/Wrapper.vue'
  import VueGoogleMaps from '@fawmi/vue-google-maps'

  const { locale } = useI18n()

  const { loadPages, startSectionsPolling } = useContentStore()
  const { startNotificationsPolling } = useNotificationStore()
  const { loadRoles, loadPermissions } = useAccessStore()
  const { loadInformation } = useAppInformationStore()
  const { loadTags, loadCategories } = useNewsStore()
  const { loadSettings } = useAppSettingStore()
  const { reloadUserData } = useAuthStore()

  const { isLightTheme } = storeToRefs(useUserInterfaceStore())
  const { isUserConnected } = storeToRefs(useAuthStore())

  const { appPrimaryColor, appSecondaryColor, appAccentColor, pickByTheme } =
    useHelper()

  const isLoading = ref(false)

  const themeOverrides = computed(() => {
    const settings: any = {
      common: {
        primaryColor: appPrimaryColor.value,
        fontWeightStrong: '600',
      },
      Menu: {
        itemTextColorHoverHorizontal: appSecondaryColor.value,
        itemIconColorHoverHorizontal: appSecondaryColor.value,
        itemColorActive: appSecondaryColor.value,
        itemColorHover: hexToRgba(appSecondaryColor.value, 0.3),
        itemColorActiveCollapsed: appSecondaryColor.value,
        arrowColorChildActiveHover: appAccentColor.value,
        arrowColorChildActive: appAccentColor.value,
        arrowColorActiveHover: appAccentColor.value,
        arrowColorActive: appAccentColor.value,
        arrowColorHover: appAccentColor.value,
        arrowColor: appAccentColor.value,
      },
      Button: {
        colorPrimary: appPrimaryColor.value,
        colorHoverPrimary: appSecondaryColor.value,
        colorFocusPrimary: appSecondaryColor.value,
        colorPressedPrimary: appSecondaryColor.value,
        borderHover: `1px solid ${appSecondaryColor.value}`,
        borderHoverPrimary: `1px solid ${appSecondaryColor.value}`,
        borderFocus: `1px solid ${appSecondaryColor.value}`,
        borderFocusPrimary: `1px solid ${appSecondaryColor.value}`,
        borderPressed: `1px solid ${appSecondaryColor.value}`,
        borderPressedPrimary: `1px solid ${appSecondaryColor.value}`,
        textColorPrimary: '#FFFFFF',
        textColorHoverPrimary: '#FFFFFF',
        textColorFocusPrimary: '#FFFFFF',
        textColorPressedPrimary: '#FFFFFF',
        textColorDisabledPrimary: '#FFFFFF',
        textColorHover: appPrimaryColor.value,
        textColorTextHover: appPrimaryColor.value,
        textColorTextFocus: appPrimaryColor.value,
        textColorTextPressed: appPrimaryColor.value,
      },
      Input: {
        caretColor: appPrimaryColor.value,
        loadingColor: appPrimaryColor.value,
        borderHover: `1px solid ${appPrimaryColor.value}`,
        borderFocus: `1px solid ${appPrimaryColor.value}`,
      },
      PageHeader: {
        backColorHover: appPrimaryColor.value,
        backColorPressed: appPrimaryColor.value,
      },
      Switch: {
        railColorActive: appSecondaryColor.value,
        loadingColor: appSecondaryColor.value,
      },
      Tabs: {
        colorSegment: pickByTheme('#f2f2f2', 'rgba(0, 0, 0, 1)'),
      },
      Card: {
        colorEmbedded: pickByTheme('#ECF0F1', 'rgb(44, 44, 50)'),
      },
      LoadingBar: {
        colorLoading: appSecondaryColor.value,
      },
      Spin: {
        color: appSecondaryColor.value,
      },
      Radio: {
        buttonColorActive: appSecondaryColor.value,
        buttonTextColorActive: '#ffffff',
      },
    }

    if (isLightTheme.value) {
      settings['DataTable'] = {
        thColor: '#ECF0F1',
        thColorHover: '#BDC3C7',
        // thIconColor: '#ffffff',
        // thTextColor: '#ffffff',
      }

      settings['Table'] = {
        tdColor: '#ECF0F1',
      }
    }

    return settings
  })

  // Initialize some stuffs
  reloadUserData()
  startNotificationsPolling()

  // Load access data
  loadRoles()
  loadPermissions()

  // Load news data
  loadTags()
  loadCategories()

  // Load content data
  loadPages()
  startSectionsPolling()

  // Load app settings and information
  loadSettings()
  loadInformation()

  // Initialize some plugins: VueGoogleMaps
  const init = async () => {
    isLoading.value = true

    const googleMapsOptions = {
      load: {
        key: GOOGLE_MAPS_API_KEY,
        libraries: ['places'],
      },
    }

    app.use(VueGoogleMaps, googleMapsOptions)

    isLoading.value = false
  }

  init()

  // Set theme root class
  watch(
    () => isLightTheme.value,
    () => {
      document.documentElement.className = `${pickByTheme(
        'light',
        'dark'
      )}-theme`
    },
    { immediate: true }
  )
</script>

<template>
  <router-view v-slot="{ Component }">
    <n-config-provider
      :theme-overrides="themeOverrides"
      :locale="locale == 'fr' ? frFR : enUS"
      :theme="isLightTheme ? null : darkTheme"
      :date-locale="locale == 'fr' ? dateFrFR : dateEnUS">
      <n-modal-provider>
        <n-loading-bar-provider>
          <n-message-provider :placement="isUserConnected ? 'top' : 'top'">
            <n-dialog-provider>
              <n-notification-provider :max="2" placement="bottom-right">
                <Wrapper>
                  <component :is="Component" :key="locale" />
                </Wrapper>
              </n-notification-provider>
            </n-dialog-provider>
          </n-message-provider>
        </n-loading-bar-provider>
      </n-modal-provider>
    </n-config-provider>
  </router-view>
</template>

<style lang="scss" src="@/assets/styles/app.scss"></style>

import fr from '@/assets/images/flags/fr.svg'
import gb from '@/assets/images/flags/gb.svg'
import iconReverseSvg from '@/assets/images/icon-reverse.svg'
import iconSvg from '@/assets/images/icon.svg'
import logoReverseSvg from '@/assets/images/logo-reverse.svg'
import logoSvg from '@/assets/images/logo.svg'

import { LANG_COOKIE } from '@/utils/constants'
import { getBaseUrl } from '@/utils/functions'
import { UserPrefs } from '@/utils/types'

import { appConfig } from '@/main'
import { fromUrl, parseDomain, ParseResultType } from 'parse-domain'

export const useHelper = () => {
  const { defaultPrefs } = useUserPreference()
  const { t, locale } = useI18n()
  const { request } = useApi()

  const appInformationStore = useAppInformationStore()
  const uiStore = useUserInterfaceStore()
  const authStore = useAuthStore()

  const fileUrl = (path: string) => {
    if (path) {
      const encodedPath = encodeURI(path)
      if (_v.isURL(encodedPath)) return encodedPath
      else return `${appConfig?.apiBaseUrl}/storage/${encodedPath}`
    }

    return ''
  }

  const appPrimaryColor = computed<string>(() => {
    const primaryColor: string = appInformationStore.getSettingValue(
      'primaryColor'
    ) as string

    return primaryColor || import.meta.env.APP_PRIMARY_COLOR
  })

  const appSecondaryColor = computed<string>(() => {
    const secondaryColor: string = appInformationStore.getSettingValue(
      'secondaryColor'
    ) as string

    return secondaryColor || import.meta.env.APP_SECONDARY_COLOR
  })

  const appAccentColor = computed<string>(() => {
    const accentColor: string = appInformationStore.getSettingValue(
      'accentColor'
    ) as string

    return accentColor || import.meta.env.APP_ACCENT_COLOR
  })

  const icon = computed<string>(() => {
    const icon: string = appInformationStore.getSettingValue(
      'adminIcon'
    ) as string
    const iconReverse: string = appInformationStore.getSettingValue(
      'oneColorAdminIcon'
    ) as string
    return (
      (uiStore.isLightTheme ? fileUrl(icon) : fileUrl(iconReverse)) ||
      (uiStore.isLightTheme ? iconSvg : iconReverseSvg)
    )
  })

  const logo = computed<string>(() => {
    const logo: string = appInformationStore.getSettingValue(
      'adminLogo'
    ) as string
    const logoReverse: string = appInformationStore.getSettingValue(
      'oneColorAdminLogo'
    ) as string
    return (
      (uiStore.isLightTheme ? fileUrl(logo) : fileUrl(logoReverse)) ||
      (uiStore.isLightTheme ? logoSvg : logoReverseSvg)
    )
  })

  const isInDevMode = computed<boolean>(() => {
    // npx parse-domain-update : Update listed TLDs
    const parseResult1 = parseDomain(fromUrl(getBaseUrl()))
    const parseResult2 = parseDomain(fromUrl(appConfig?.apiBaseUrl))

    if (typeof appConfig.forceDevMode === 'boolean' && appConfig.forceDevMode) {
      return true
    }

    return (
      parseResult1.type !== ParseResultType.Listed &&
      parseResult2.type !== ParseResultType.Listed
    )
  })

  const getTranslation = (data: any) => {
    let parsedData

    try {
      parsedData = JSON.parse(data)
    } catch (e) {
      parsedData = {}
    }

    return parsedData
      ? parsedData[locale.value.toUpperCase()] || parsedData['fr'] || ''
      : ''
  }

  const tr = (data: any) => {
    return getTranslation(data)
  }

  const pickByTheme = (
    lightVal: string | number | null,
    darkVal: string | number | null
  ) => {
    return uiStore.isLightTheme ? lightVal : darkVal
  }

  const is2XlScreen = useMediaQuery('(min-width: 1536px)')
  const isXlScreen = useMediaQuery(
    '(min-width: 1280px) and (max-width: 1535px)'
  )
  const isLgScreen = useMediaQuery(
    '(min-width: 1024px) and (max-width: 1279px)'
  )
  const isMdScreen = useMediaQuery('(min-width: 768px) and (max-width: 1023px)')
  const isSmScreen = useMediaQuery('(max-width: 767px)')

  interface Language {
    label: string
    value: string
    flag: string
  }

  const languages: Language[] = [
    {
      label: t('french'),
      value: 'fr',
      flag: fr,
    },
    {
      label: t('english'),
      value: 'en',
      flag: gb,
    },
  ]

  const getLangageLabel = (value: string) =>
    languages.find((l) => l.value == value)?.label

  const getLanguageValue = (label: string) =>
    languages.find((l) => l.label == label)?.value

  const updateLocale = async (
    val: string,
    reload = true,
    updateUserPrefs = true
  ) => {
    locale.value = val
    localStorage.setItem(LANG_COOKIE, val)

    if (authStore.isUserConnected && updateUserPrefs) {
      const userPrefs = (authStore.userData?.preferences ||
        defaultPrefs.value) as UserPrefs
      userPrefs.locale = val

      await request({
        url: `/users/self/${authStore.userData?.id}`,
        method: 'put',
        data: {
          preferences: userPrefs,
        },
      })
    }

    if (reload) location.reload()
  }

  const displayFormErrors = (errors: any) => {
    if (errors) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for (const [key, value] of Object.entries(errors)) {
        for (const error of value as string[]) {
          window.$message.error(error)
        }
      }
    }
  }

  const mergeArrays = (arr1: any, arr2: any, key: string) => {
    const arrayMap = new Map()

    arr1.concat(arr2).forEach((item: any) => {
      if (!arrayMap.has(item[key])) {
        arrayMap.set(item[key], { ...item })
      } else {
        arrayMap.set(item[key], { ...arrayMap.get(item[key]), ...item })
      }
    })

    return Array.from(arrayMap.values())
  }

  const formatKey = (key: string) => {
    return key
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[^a-zA-Z0-9-_]/g, '')
      .replace(/-+/g, '-')
      .replace(/_+/g, '_')
      .toLowerCase()
  }

  /**
   * Recursively converts the keys of an object or elements of an array to camelCase.
   * If the key is 'key' and the value is a string, it is converted to camelCase.
   * Otherwise, the value is processed recursively.
   *
   * @param {any} obj - The object or array to be processed.
   * @returns {any} A new object or array with keys converted to camelCase.
   */
  const editKeysToCamelCase = (obj: any): any => {
    if (Array.isArray(obj)) {
      return obj.map((item) => editKeysToCamelCase(item))
    } else if (typeof obj === 'object' && obj !== null) {
      const newObj = {}
      for (const [key, value] of Object.entries(obj)) {
        if (key === 'key' && typeof value === 'string') {
          ;(newObj as Record<string, string>)[key] = _.camelCase(value)
        } else {
          ;(newObj as Record<string, any>)[key] = editKeysToCamelCase(value)
        }
      }
      return newObj
    }
    return obj
  }

  const ckEditorToolbarItems = [
    'fullScreen',
    '|',
    'heading',
    '|',
    'addCreopseMedia',
    '|',
    'uploadImage',
    '|',
    'bold',
    'italic',
    'underline',
    'strikethrough',
    'code',
    'subscript',
    'superscript',
    'selectAll',
    '|',
    'fontSize',
    'fontFamily',
    'fontColor',
    'fontBackgroundColor',
    '|',
    'horizontalLine',
    'blockQuote',
    'bulletedList',
    'numberedList',
    'alignment',
    '|',
    'outdent',
    'indent',
    '|',
    'link',
    'insertTable',
    'mediaEmbed',
    '|',
    'undo',
    'redo',
  ]

  return {
    is2XlScreen,
    isXlScreen,
    isLgScreen,
    isMdScreen,
    isSmScreen,
    appAccentColor,
    appPrimaryColor,
    appSecondaryColor,
    getTranslation,
    getLangageLabel,
    getLanguageValue,
    ckEditorToolbarItems,
    editKeysToCamelCase,
    displayFormErrors,
    updateLocale,
    pickByTheme,
    mergeArrays,
    isInDevMode,
    formatKey,
    languages,
    fileUrl,
    logo,
    icon,
    tr,
  }
}

import App from './App.vue'
import { createApp } from 'vue'
import { AppConfig } from './utils/types'
import { getBaseUrl, removeTrailingSlash } from './utils/functions'

import CKEditor from '@ckeditor/ckeditor5-vue'
import stripJsonComments from 'strip-json-comments'
import { VueDraggableNext } from 'vue-draggable-next'
import { createHead } from '@unhead/vue'
import { PiniaColada } from '@pinia/colada'

import VueShepherdPlugin from 'vue-shepherd'
import './assets/styles/custom-shepherd.css'
import 'shepherd.js/dist/css/shepherd.css'

import VueTelInput from 'vue-tel-input'
import 'vue-tel-input/vue-tel-input.css'

import Vue3MapChart from 'vue3-map-chart'
import 'vue3-map-chart/dist/style.css'

import i18n from './i18n'
import pinia from './stores'
import router from './router'

import 'uno.css'
import 'animate.css'
import 'vfonts/Lato.css'
import 'vfonts/Roboto.css'
import 'vfonts/OpenSans.css'

import '@fontsource-variable/open-sans'

const meta = document.createElement('meta')
meta.name = 'naive-ui-style'
document.head.appendChild(meta)

export const app = createApp(App)
  .use(i18n)
  .use(pinia)
  .use(router)
  .use(CKEditor)
  .use(PiniaColada)
  // @ts-ignore
  .use(VueTelInput)
  .use(createHead())
  // @ts-ignore
  .use(VueShepherdPlugin)
  .use(Vue3MapChart)
  .component('Draggable', VueDraggableNext)

export async function loadConfig(): Promise<AppConfig> {
  const apiBaseUrl = removeTrailingSlash(
      import.meta.env.APP_API_BASE_URL || getBaseUrl()
  )

  const defaultConfig: AppConfig = {
    apiBaseUrl,
    apiUrl: `${apiBaseUrl}/api`,
    apiRequestHeaders: {
      'X-API-Key': import.meta.env.APP_X_API_KEY,
    },
    forceDevMode: false,
  }

  try {
    const response = await axios.get('./config.jsonc')
    const data = JSON.parse(stripJsonComments(response.data || '{}'))

    const mergedConfig = {
      ...defaultConfig,
      ...data,
      apiBaseUrl: data.apiBaseUrl || defaultConfig.apiBaseUrl, // Ensure apiBaseUrl is updated
    };

    mergedConfig.apiUrl = `${mergedConfig.apiBaseUrl}/api`;

    mergedConfig.apiRequestHeaders = {
      ...defaultConfig.apiRequestHeaders,
      ...data.apiRequestHeaders,
    };

    return mergedConfig;
  } catch (error) {
    console.error(error)
    return defaultConfig
  }
}

export let appConfig: AppConfig

loadConfig().then((config) => {
  appConfig = config
  app.provide('appConfig', config)
  app.mount('#app')
})

router.isReady().then(() => {
  /* Hide preloader */
  const preloader = document.getElementById('preloader')
  if (preloader) preloader.style.display = 'none'
})

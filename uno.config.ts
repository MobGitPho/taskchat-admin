// uno.config.ts
import presetAttributify from '@unocss/preset-attributify'
import presetWind from '@unocss/preset-wind'
import { defineConfig } from 'unocss'

export default defineConfig({
  presets: [
    presetWind({
      /* options */
    }),
    presetAttributify({
      /* options */
    }),
  ],
  rules: [
    /* custom rules */
  ],
  shortcuts: {
    'content-container':
      'sm:max-w-[640px] md:max-w-[768px] lg:max-w-[1024px] xl:max-w-[720px] 2xl:max-w-[960px]',
  },
})

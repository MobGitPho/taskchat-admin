import type { Icon } from './types'

export function useIconsLoader() {
  const { request } = useApi()

  const currentIconsList = ref<Icon[]>([])

  const extractIconData = (key: string) => {
    const parts = key.split('_')

    const realLibNames: { [key: string]: string } = {
      a: 'antd',
      b: 'carbon',
      fa: 'fa',
      f: 'fluent',
      i4: 'ionicons4',
      i5: 'ionicons5',
      m: 'material',
      t: 'tabler',
    }

    const realIconFormats: { [key: string]: string } = {
      F: 'Filled',
      O: 'Outlined',
      R: 'Round',
      S: 'Sharp',
      T: 'Twotone',
      E: 'Regular',
    }

    const restoreIconFormat = (filename: string) => {
      return filename.replace(/([A-Z])(?=\.\w+$)/, (match, shortFormat) => {
        return realIconFormats[shortFormat] || shortFormat
      })
    }

    return [
      restoreIconFormat(parts[0]),
      parts.length > 1 ? realLibNames[parts[1]] : '',
    ]
  }

  const oneMoment = () => {
    return new Promise((resolve) => setTimeout(resolve))
  }

  const prepareData = async (iconsRawList: { [key: string]: string }) => {
    currentIconsList.value = []

    let i = 1
    for (const [key, value] of Object.entries(iconsRawList)) {
      if (i && i % 5000 === 0) {
        await oneMoment()
      }
      const [name, library] = extractIconData(key)
      currentIconsList.value.push({
        id: i,
        name: name,
        svgCode: value,
        library: library,
      })
      i += 1
    }

    return currentIconsList.value
  }

  const isSearching = ref(false)
  const searchIcons = async (query: string) => {
    let data = {}

    isSearching.value = true

    const task = await request({
      url: '/search-icons',
      method: 'post',
      data: {
        query: query,
        decode: false,
      },
    })

    if (task.success && task.result) {
      try {
        data = JSON.parse(task.result.data)
      } catch (e) {
        data = {}
        console.error(e)
      }

      data = await prepareData(data)
    }

    isSearching.value = false

    return data
  }

  return {
    searchIcons,
    isSearching,
    currentIconsList,
  }
}

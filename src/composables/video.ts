import { VideoDisplayType } from '@/enums/video-display-type'

export const useVideo = () => {
  const { t } = useI18n()

  const videoDisplayTypes = [
    {
      label: t('horizontal'),
      value: VideoDisplayType.HORIZONTAL,
      tagType: 'info',
    },
    {
      label: t('vertical'),
      value: VideoDisplayType.VERTICAL,
      tagType: 'warning',
    },
  ]

  const getVideoDisplayTypeLabel = (value: VideoDisplayType) =>
    videoDisplayTypes.find((status) => status.value === value)?.label

  const getVideoDisplayTypeTagType = (value: VideoDisplayType) =>
    videoDisplayTypes.find((status) => status.value === value)?.tagType ||
    'default'

  return {
    getVideoDisplayTypeTagType,
    getVideoDisplayTypeLabel,
    videoDisplayTypes,
  }
}

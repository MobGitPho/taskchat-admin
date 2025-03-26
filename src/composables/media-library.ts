import { MediaFileType } from '@/enums/media-file-type'

export const useMediaLibrary = () => {
  const { t } = useI18n()

  const mediaFileTypes = [
    {
      label: t('image'),
      value: MediaFileType.IMAGE,
      tagType: 'default',
    },
    {
      label: t('video'),
      value: MediaFileType.VIDEO,
      tagType: 'info',
    },
    {
      label: t('audio'),
      value: MediaFileType.AUDIO,
      tagType: 'success',
    },
    {
      label: t('document'),
      value: MediaFileType.DOCUMENT,
      tagType: 'warning',
    },
    {
      label: t('other'),
      value: MediaFileType.OTHER,
      tagType: 'error',
    },
  ]

  const getMediaFileTypeLabel = (value: MediaFileType) =>
    mediaFileTypes.find((type) => type.value === value)?.label

  const getMediaFileTypeTagType = (value: MediaFileType) =>
    mediaFileTypes.find((type) => type.value === value)?.tagType || 'default'

  return {
    getMediaFileTypeTagType,
    getMediaFileTypeLabel,
    mediaFileTypes,
  }
}

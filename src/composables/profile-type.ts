import { ProfileType } from '@/enums/profile-type'

export const useProfileType = () => {
  const { t } = useI18n()

  const appSettingStore = useAppSettingStore()

  const adminProfileTypeLabel: string = appSettingStore.getSettingValue(
    'adminProfileTypeLabel'
  ) as string

  const profileTypes = [
    {
      label: adminProfileTypeLabel || t('admin'),
      value: ProfileType.ADMIN,
    },
  ]

  const getProfileTypeLabel = (value: ProfileType | string) => {
    return (
      profileTypes.find((type) => type.value === value)?.label || t('other')
    )
  }

  return {
    profileTypes,
    getProfileTypeLabel,
  }
}

<script lang="ts">
  export default defineComponent({
    name: Routes.DASHBOARD.NAME,
  })
</script>

<script setup lang="ts">
  import { AuthType } from '@/enums/auth-type'

  import Routes from '@/router/routes'

  import DataCount from './DataCount.vue'
  import { Icon } from '@iconify/vue'
  import { NButton, NIcon, NSpace } from 'naive-ui'

  const { t } = useI18n()
  const { request } = useApi()
  const { tr, fileUrl, icon, isSmScreen } = useHelper()
  const { userHasSuperAdminRole } = useAccess()

  const router = useRouter()
  const dialog = useDialog()
  const message = useMessage()

  const authStore = useAuthStore()

  // Email verification
  const isSending = ref(false)
  const resend = async () => {
    isSending.value = true

    const task = await request({
      url: `/auth/send-verification-email`,
    })

    if (task.failure && task.error) {
      message.error(t('failedToSend'))
    } else {
      dialog.success({
        title: t('success'),
        content: t('verificationLinkSent'),
        positiveText: t('ok'),
      })
    }

    isSending.value = false
  }

  // Check Market Info
  const appInformationStore = useAppInformationStore()

  const appInformationProvided = computed<boolean>(() => {
    return !!(
      appInformationStore.getSettingValue('name') &&
      appInformationStore.getSettingValue('address') &&
      (appInformationStore.getSettingValue('phone') ||
        appInformationStore.getSettingValue('email'))
    )
  })

  const EditButton = h(NSpace, null, {
    default: () => [
      h(
        NButton,
        {
          onClick: () => router.push(Routes.CONTENT_MANAGEMENT.PATH),
        },
        {
          icon: () =>
            h(NIcon, null, {
              default: () => [
                h(Icon, {
                  icon: 'carbon:edit',
                }),
              ],
            }),
          default: () => t('edit'),
        }
      ),
    ],
  })
</script>

<template>
  <template
    v-if="
      authStore.userData?.emailVerifiedAt === null &&
      authStore.userData?.authType != AuthType.PHONE
    ">
    <n-spin :show="isSending">
      <n-alert
        :title="t('verifyYourEmail')"
        type="warning"
        class="cursor-pointer mb-2"
        @click="resend">
        {{ t('weHaveSentYouVerificationEmail') }}
      </n-alert>
    </n-spin>
  </template>

  <CustomTransition name="slide-fade" appear>
    <n-card v-if="appInformationProvided" embedded size="small" class="mb-2">
      <NaiveMobileTableAdapter>
        <n-card hoverable>
          <n-page-header>
            <template #title>
              <h3>{{ appInformationStore.getSettingValue('name') }}</h3>
            </template>
            <template #avatar>
              <n-avatar
                object-fit="contain"
                class="p-1"
                :src="appInformationStore.getSettingValue('icon') ? fileUrl(appInformationStore.getSettingValue('icon') as string) : icon" />
            </template>
            <template v-if="!isSmScreen" #extra>
              <EditButton v-if="userHasSuperAdminRole()" />
            </template>
            <template v-if="isSmScreen">
              <EditButton v-if="userHasSuperAdminRole()" />
            </template>

            <n-p
              v-if="tr(appInformationStore.getSettingValue('description'))"
              depth="2">
              <n-ellipsis line-clamp="2" :tooltip="false">
                {{ tr(appInformationStore.getSettingValue('description')) }}
              </n-ellipsis>
            </n-p>
            <template #footer>
              <n-space>
                <n-h6
                  v-if="appInformationStore.getSettingValue('phone')"
                  prefix="bar">
                  <n-text depth="3" class="flex items-center text-sm">
                    <Icon icon="carbon:phone" />
                    &nbsp;
                    <span>{{
                      appInformationStore.getSettingValue('phone')
                    }}</span>
                  </n-text>
                </n-h6>
                <n-h6
                  v-if="appInformationStore.getSettingValue('email')"
                  prefix="bar">
                  <n-text depth="3" class="flex items-center text-sm">
                    <Icon icon="carbon:email" />
                    &nbsp;
                    <span>{{
                      appInformationStore.getSettingValue('email')
                    }}</span>
                  </n-text>
                </n-h6>
                <n-h6
                  v-if="appInformationStore.getSettingValue('address')"
                  prefix="bar">
                  <n-text depth="3" class="flex items-center text-sm">
                    <Icon icon="carbon:location" />
                    &nbsp;
                    <span>{{
                      appInformationStore.getSettingValue('address')
                    }}</span>
                  </n-text>
                </n-h6>
                <n-h6
                  v-if="appInformationStore.getSettingValue('postalCode')"
                  prefix="bar">
                  <n-text depth="3" class="flex items-center text-sm">
                    <Icon icon="carbon:text-short-paragraph" />
                    &nbsp;
                    <span>{{
                      appInformationStore.getSettingValue('postalCode')
                    }}</span>
                  </n-text>
                </n-h6>
              </n-space>
            </template>
          </n-page-header>
        </n-card>
      </NaiveMobileTableAdapter>
    </n-card>
    <n-alert
      v-else-if="userHasSuperAdminRole()"
      id="missingInfoAlert"
      :title="t('missingInfo')"
      type="warning"
      class="cursor-pointer mb-2"
      @click="router.push(Routes.CONTENT_MANAGEMENT.PATH)">
      {{ t('provideYourMarketInfo') }}
    </n-alert>
  </CustomTransition>

  <br />

  <DataCount />

  <br />
</template>

<style scoped lang="scss"></style>

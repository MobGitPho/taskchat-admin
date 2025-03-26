<script lang="ts" setup>
  import Routes from '@/router/routes'

  import { UserSessionModel } from '@/models/user-session'

  const { t } = useI18n()
  const { request } = useApi()
  const { appPrimaryColor, appSecondaryColor, isSmScreen } = useHelper()

  const router = useRouter()

  const nbAdministrators = ref(0)
  const nbOthers = ref(0)
  const nbNewsArticles = ref(0)
  const nbNewsCategories = ref(0)
  const nbNewsComments = ref(0)
  const nbNewsTags = ref(0)
  const visits = ref<UserSessionModel[]>([])

  const init = async () => {
    const task1 = await request({
      url: '/count/administrators',
    })

    if (task1.success && task1.result) {
      nbAdministrators.value = task1.result.data
    }

    const task2 = await request({
      url: '/count/others',
    })

    if (task2.success && task2.result) {
      nbOthers.value = task2.result.data
    }

    const task3 = await request({
      url: '/count/news-articles',
    })

    if (task3.success && task3.result) {
      nbNewsArticles.value = task3.result.data
    }

    const task4 = await request({
      url: '/count/news-categories',
    })

    if (task4.success && task4.result) {
      nbNewsCategories.value = task4.result.data
    }

    const task5 = await request({
      url: '/count/news-comments',
    })

    if (task5.success && task5.result) {
      nbNewsComments.value = task5.result.data
    }

    const task6 = await request({
      url: '/count/news-tags',
    })

    if (task6.success && task6.result) {
      nbNewsTags.value = task6.result.data
    }

    const task7 = await request({
      url: '/visits',
    })

    if (task7.success && task7.result) {
      visits.value = task7.result.data
    }
  }

  init()

  const mapsData = computed(() => {
    const data: { [key: string]: number } = {}

    visits.value.forEach((item) => {
      if (item.locationData?.iso) {
        if (!data[item.locationData.iso]) {
          data[item.locationData.iso] = 1
        } else {
          data[item.locationData.iso]++
        }
      }
    })

    return data
  })
</script>

<template>
  <section>
    <CustomTransition name="slide-fade" appear>
      <n-page-header :title="t('players')">
        <n-grid
          cols="1 s:1 m:2 l:2 xl:2 2xl:2"
          responsive="screen"
          :x-gap="12"
          :y-gap="24">
          <n-gi>
            <n-card
              class="w-full cursor-pointer"
              hoverable
              embedded
              @click="router.push(Routes.USERS_MANAGEMENT.PATH)">
              <n-statistic :label="t('administrators')">
                <template #prefix>
                  <n-icon>
                    <Icon icon="carbon:user-admin" />
                  </n-icon>
                </template>
                <n-number-animation :from="0" :to="nbAdministrators" />
              </n-statistic>
            </n-card>
          </n-gi>
          <n-gi>
            <n-card
              class="w-full cursor-pointer"
              hoverable
              embedded
              @click="router.push(Routes.USERS_MANAGEMENT.PATH)">
              <n-statistic :label="t('others')">
                <template #prefix>
                  <n-icon>
                    <Icon icon="carbon:user" />
                  </n-icon>
                </template>
                <n-number-animation :from="0" :to="nbOthers" />
              </n-statistic>
            </n-card>
          </n-gi>
        </n-grid>
      </n-page-header>
    </CustomTransition>

    <br />

    <CustomTransition name="slide-fade" appear>
      <n-page-header :title="t('news')">
        <n-grid
          cols="1 s:2 m:2 l:4 xl:4 2xl:4"
          responsive="screen"
          :x-gap="12"
          :y-gap="24">
          <n-gi>
            <n-card
              class="w-full cursor-pointer"
              hoverable
              embedded
              @click="router.push(Routes.NEWS_MANAGEMENT.PATH + '/articles')">
              <n-statistic :label="t('articles')">
                <template #prefix>
                  <n-icon>
                    <Icon icon="carbon:document" />
                  </n-icon>
                </template>
                <n-number-animation :from="0" :to="nbNewsArticles" />
              </n-statistic>
            </n-card>
          </n-gi>
          <n-gi>
            <n-card
              class="w-full cursor-pointer"
              hoverable
              embedded
              @click="router.push(Routes.NEWS_MANAGEMENT.PATH + '/categories')">
              <n-statistic :label="t('categories')">
                <template #prefix>
                  <n-icon>
                    <Icon icon="carbon:categories" />
                  </n-icon>
                </template>
                <n-number-animation :from="0" :to="nbNewsCategories" />
              </n-statistic>
            </n-card>
          </n-gi>
          <n-gi>
            <n-card
              class="w-full cursor-pointer"
              hoverable
              embedded
              @click="router.push(Routes.NEWS_MANAGEMENT.PATH + '/tags')">
              <n-statistic :label="t('tags')">
                <template #prefix>
                  <n-icon>
                    <Icon icon="carbon:tag" />
                  </n-icon>
                </template>
                <n-number-animation :from="0" :to="nbNewsTags" />
              </n-statistic>
            </n-card>
          </n-gi>
          <n-gi>
            <n-card
              class="w-full cursor-pointer"
              hoverable
              embedded
              @click="router.push(Routes.NEWS_MANAGEMENT.PATH + '/comments')">
              <n-statistic :label="t('comments')">
                <template #prefix>
                  <n-icon>
                    <Icon icon="carbon:chat" />
                  </n-icon>
                </template>
                <n-number-animation :from="0" :to="nbNewsComments" />
              </n-statistic>
            </n-card>
          </n-gi>
        </n-grid>
      </n-page-header>
    </CustomTransition>

    <n-divider></n-divider>

    <n-card>
      <CustomTransition name="slide-fade" appear>
        <n-page-header :title="t('websiteVisits')">
          <n-grid
            cols="1 s:4 m:4 l:4 xl:4 2xl:4"
            responsive="screen"
            :x-gap="12"
            :y-gap="12">
            <n-gi>
              <n-card class="w-full" hoverable embedded>
                <n-statistic :label="t('visitsTotalNumber')">
                  <template #prefix>
                    <n-icon>
                      <Icon icon="carbon:chart-line" />
                    </n-icon>
                  </template>
                  <n-number-animation :from="0" :to="visits.length" />
                </n-statistic>
              </n-card>
            </n-gi>
          </n-grid>
          <MapChart
            v-if="!isSmScreen"
            :data="mapsData"
            :base-color="appPrimaryColor"
            legend-text-color="white"
            :legend-bg-color="appSecondaryColor"
            :display-legend-when-empty="false"
            :height="800"
            format-value-with-si-prefix />
        </n-page-header>
      </CustomTransition>
    </n-card>
  </section>
</template>

import { ProfileType } from '@/enums/profile-type'

import i18n from '@/i18n'
import ContainerView from '@/views/Container.vue'
import { createRouter, createWebHistory } from 'vue-router'

import Routes from './routes'

const { t } = i18n.global

export const routesList = [
  {
    path: Routes.HOME.PATH,
    name: Routes.HOME.NAME,
    alias: Routes.HOME.ALIAS,
    component: ContainerView,
    hidden: true,
    meta: {
      requiresAuth: true,
    },
  },

  {
    path: Routes.SETUP.PATH,
    name: Routes.SETUP.NAME,
    component: () => import('@/views/Setup/index.vue'),
    meta: {
      title: t('installer'),
    },
    hidden: true,
  },

  {
    path: Routes.LOGIN.PATH,
    name: Routes.LOGIN.NAME,
    component: () => import('@/views/Login/index.vue'),
    meta: {
      title: t('login'),
    },
    hidden: true,
  },

  {
    path: Routes.REGISTER.PATH,
    name: Routes.REGISTER.NAME,
    component: () => import('@/views/Register/index.vue'),
    meta: {
      title: t('register'),
    },
    hidden: true,
  },

  {
    path: Routes.ADD_NEW_PASSWORD.PATH,
    name: Routes.ADD_NEW_PASSWORD.NAME,
    component: () => import('@/views/ResetPassword/AddNewPassword.vue'),
    meta: {
      title: t('newPassword'),
    },
    hidden: true,
  },

  {
    path: Routes.RESET_PASSWORD.PATH,
    name: Routes.RESET_PASSWORD.NAME,
    component: () => import('@/views/ResetPassword/index.vue'),
    meta: {
      title: t('resetPassword'),
    },
    hidden: true,
  },

  {
    path: Routes.VERIFY_EMAIL.PATH,
    name: Routes.VERIFY_EMAIL.NAME,
    component: () => import('@/views/VerifyEmail/index.vue'),
    meta: {
      requiresAuth: true,
      title: t('emailVerification'),
    },
    hidden: true,
  },

  {
    path: Routes.ACCOUNT_INFO_PORTAL.PATH,
    name: Routes.ACCOUNT_INFO_PORTAL.NAME,
    component: () => import('@/views/Account/InfoPortal/index.vue'),
    meta: {
      requiresAuth: true,
      title: t('accountInfo'),
    },
    hidden: true,
  },

  {
    redirect: Routes.DASHBOARD.PATH,
    path: Routes.DASHBOARD.PATH,
    name: Routes.DASHBOARD.NAME,
    component: ContainerView,
    children: [
      {
        path: Routes.DASHBOARD.PATH,
        name: Routes.DASHBOARD.NAME,
        meta: {
          requiresAuth: true,
          title: t('overview'),
          icon: 'carbon:dashboard',
          access: 'all',
        },
        component: () => import('@/views/Dashboard/index.vue'),
      },
    ],
  },

  {
    redirect: Routes.NEWS_MANAGEMENT.PATH,
    path: Routes.NEWS_MANAGEMENT.PATH + '/:key?',
    name: Routes.NEWS_MANAGEMENT.NAME,
    component: ContainerView,
    children: [
      {
        path: Routes.NEWS_MANAGEMENT.PATH + '/:key?',
        name: Routes.NEWS_MANAGEMENT.NAME,
        meta: {
          requiresAuth: true,
          title: t('newsManagement'),
          icon: 'carbon:document-multiple-01',
          access: [ProfileType.ADMIN],
          displayAccess: true,
        },
        component: () => import('@/views/Management/News/index.vue'),
      },
    ],
  },

  {
    redirect: Routes.MEDIA_LIBRARY.PATH,
    path: Routes.MEDIA_LIBRARY.PATH,
    name: Routes.MEDIA_LIBRARY.NAME,
    component: ContainerView,
    children: [
      {
        path: Routes.MEDIA_LIBRARY.PATH,
        name: Routes.MEDIA_LIBRARY.NAME,
        meta: {
          requiresAuth: true,
          title: t('mediaLibrary'),
          icon: 'carbon:media-library',
          access: [ProfileType.ADMIN],
          displayAccess: true,
        },
        component: () => import('@/views/Management/MediaLibrary/index.vue'),
      },
      {
        path: 'add',
        name: 'Add_' + Routes.MEDIA_LIBRARY.NAME,
        meta: {
          requiresAuth: true,
          title: t('addMediaFiles'),
          icon: 'mdi:minus',
          access: [ProfileType.ADMIN],
          displayAccess: true,
        },
        hidden: true,
        component: () => import('@/views/Management/MediaLibrary/Add.vue'),
      },
    ],
  },

  {
    redirect: Routes.CONTENT_MANAGEMENT.PATH,
    path: Routes.CONTENT_MANAGEMENT.PATH + '/:key?',
    name: Routes.CONTENT_MANAGEMENT.NAME,
    component: ContainerView,
    children: [
      {
        path: Routes.CONTENT_MANAGEMENT.PATH + '/:key?',
        name: Routes.CONTENT_MANAGEMENT.NAME,
        meta: {
          requiresAuth: true,
          title: t('contentManagement'),
          icon: 'carbon:open-panel-left',
          access: [ProfileType.ADMIN],
          displayAccess: true,
        },
        component: () => import('@/views/Management/Content/index.vue'),
      },
    ],
  },

  {
    redirect: Routes.USERS_MANAGEMENT.PATH,
    path: Routes.USERS_MANAGEMENT.PATH,
    name: Routes.USERS_MANAGEMENT.NAME,
    component: ContainerView,
    children: [
      {
        path: Routes.USERS_MANAGEMENT.PATH,
        name: Routes.USERS_MANAGEMENT.NAME,
        meta: {
          requiresAuth: true,
          title: t('usersManagement'),
          icon: 'carbon:user-multiple',
          access: [ProfileType.ADMIN],
          displayAccess: true,
        },
        component: () => import('@/views/Management/Users/index.vue'),
      },
    ],
  },

  {
    redirect: Routes.ROLES_MANAGEMENT.PATH,
    path: Routes.ROLES_MANAGEMENT.PATH,
    name: Routes.ROLES_MANAGEMENT.NAME,
    component: ContainerView,
    children: [
      {
        path: Routes.ROLES_MANAGEMENT.PATH,
        name: Routes.ROLES_MANAGEMENT.NAME,
        meta: {
          requiresAuth: true,
          title: t('roleManagement'),
          icon: 'carbon:user-role',
          access: [ProfileType.ADMIN],
          displayAccess: true,
        },
        component: () => import('@/views/Management/Roles/index.vue'),
      },
    ],
  },

  {
    redirect: Routes.ACCOUNT.PATH,
    path: Routes.ACCOUNT.PATH,
    name: Routes.ACCOUNT.NAME,
    component: ContainerView,
    children: [
      {
        path: Routes.ACCOUNT.PATH,
        name: Routes.ACCOUNT.NAME,
        meta: {
          requiresAuth: true,
          title: t('accountInfo'),
          icon: 'carbon:user-avatar',
          access: 'all',
        },
        component: () => import('@/views/Account/index.vue'),
      },
    ],
  },

  {
    redirect: Routes.APP_SETTINGS.PATH,
    path: Routes.APP_SETTINGS.PATH,
    name: Routes.APP_SETTINGS.NAME,
    component: ContainerView,
    children: [
      {
        path: Routes.APP_SETTINGS.PATH,
        name: Routes.APP_SETTINGS.NAME,
        meta: {
          requiresAuth: true,
          title: t('appSettings'),
          icon: 'carbon:settings',
          access: [ProfileType.ADMIN],
          displayAccess: true,
        },
        component: () => import('@/views/AppSettings/index.vue'),
      },
    ],
  },

  {
    redirect: Routes.ABOUT.PATH,
    path: Routes.ABOUT.PATH,
    name: Routes.ABOUT.NAME,
    component: ContainerView,
    children: [
      {
        path: Routes.ABOUT.PATH,
        name: Routes.ABOUT.NAME,
        meta: {
          requiresAuth: true,
          title: t('about'),
          icon: 'carbon:information',
          access: 'all',
        },
        component: () => import('@/views/About/index.vue'),
      },
    ],
  },

  {
    redirect: Routes.NOTIFICATIONS.PATH,
    path: Routes.NOTIFICATIONS.PATH,
    name: Routes.NOTIFICATIONS.NAME,
    component: ContainerView,
    hidden: true,
    children: [
      {
        path: Routes.NOTIFICATIONS.PATH,
        name: Routes.NOTIFICATIONS.NAME,
        meta: {
          requiresAuth: true,
          title: t('notifications'),
          icon: 'carbon:notification',
          access: 'all',
        },
        component: () => import('@/views/Notifications/index.vue'),
      },
    ],
  },

  {
    path: Routes.NOT_FOUND.PATH,
    name: Routes.NOT_FOUND.NAME,
    component: () => import('@/views/NotFound.vue'),
    hidden: true,
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: routesList,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ left: 0, top: 0, behavior: 'smooth' })
        }, 250)
      })
    }
  },
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const helperStore = useHelperStore()

  helperStore.previousRouteName = String(from.name)
  helperStore.nextRouteName = String(to.name)

  if (to.matched.some((record) => record.meta.requiresAuth)) {
    if (authStore.isUserConnected) {
      if (
        to.name != Routes.HOME.NAME &&
        to.name != Routes.VERIFY_EMAIL.NAME &&
        to.name != Routes.ACCOUNT_INFO_PORTAL.NAME
      ) {
        helperStore.lastHomeRoutePath = to.path
      }

      if (
        from.name == Routes.ACCOUNT_INFO_PORTAL.NAME ||
        from.name == Routes.VERIFY_EMAIL.NAME
      ) {
        helperStore.lastHomeRoutePath = null
      }

      next()
    } else next({ path: Routes.LOGIN.PATH })
  } else next()
})

export default router

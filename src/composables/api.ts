import { getCurrentTimestamp } from '@/utils/chronos'

import Routes from '@/router/routes'

import { appConfig } from '@/main'
import router from '@/router'

type Method = 'get' | 'post' | 'put' | 'delete'

interface Payload {
  method?: Method
  routeBase?: string
  responseType?: string
  params?: object
  data?: object
  url?: string
  id?: string
}

export const useApi = () => {
  const handleError = (error: any) => {
    if (import.meta.env.DEV) {
      if (error.response) {
        console.log('data:', error.response.data)
        console.log('status:', error.response.status)
        console.log('headers:', error.response.headers)
      } else if (error.request) {
        console.log('request:', error.request)
      } else {
        console.log('error:', error.message)
      }

      console.log('config:', error.config)
    }
  }

  const request = async (payload: Payload): Promise<any> => {
    const authStore = useAuthStore()

    let success = false

    let response = null
    let error = null

    try {
      const headers = appConfig?.apiRequestHeaders

      if (headers) headers['Authorization'] = `Bearer ${authStore.accessToken}`

      const finalPayload: { [key: string]: any } = {
        method: payload.method || 'get',
        params: payload.params || {},
        data: payload.data || {},
        url: payload.url || '/',
        baseURL: appConfig?.apiUrl,
        headers,
      }

      if (payload.responseType) {
        finalPayload['responseType'] = payload.responseType
      }

      response = await axios.request(finalPayload)

      success = true
    } catch (err: any) {
      error = err

      success = false

      if (err.response && err.response.status == 401) {
        if (
          ![
            Routes.LOGIN.NAME,
            Routes.REGISTER.NAME,
            Routes.NOT_FOUND.NAME,
            Routes.RESET_PASSWORD.NAME,
          ].includes(String(router.currentRoute.value.name))
        ) {
          try {
            const response = await axios.request({
              url: '/auth/tokens/refresh',
              baseURL: appConfig?.apiUrl,
              method: 'post',
              data: {
                userId: authStore.userData?.id,
                expiredAccessToken: authStore.accessToken,
              },
              headers: appConfig?.apiRequestHeaders,
            })

            const result = response.data

            if (result.data && result.data.accessToken) {
              authStore.userData = result.data.user
              authStore.accessToken = result.data.accessToken
              authStore.accessTokenDate = getCurrentTimestamp()

              return await request(payload)
            } else throw new Error()
          } catch (error) {
            authStore.resetAuthData()

            router.replace(Routes.LOGIN.PATH)
          }
        }
      } else handleError(err)
    }

    return {
      success: success,
      failure: !success,
      result: response ? response.data : null,
      error: error,
    }
  }

  const addItem = async (payload: Payload) => {
    const task = await request({
      url: `/${payload.routeBase}`,
      method: 'post',
      data: payload.data,
    })

    return task
  }

  const deleteItem = async (payload: Payload) => {
    const task = await request({
      url: `/${payload.routeBase}/${payload.id}`,
      method: 'delete',
    })

    return task
  }

  const updateItem = async (payload: Payload) => {
    const task = await request({
      url: `/${payload.routeBase}/${payload.id}`,
      method: 'put',
      data: payload.data,
    })

    return task
  }

  const getAllItems = async (payload: Payload) => {
    const task = await request({
      url: `/${payload.routeBase}`,
    })

    return task
  }

  const getItem = async (payload: Payload) => {
    const task = await request({
      url: `/${payload.routeBase}/${payload.id}`,
    })

    return task
  }

  return {
    request,
    getItem,
    addItem,
    updateItem,
    deleteItem,
    getAllItems,
    handleError,
  }
}

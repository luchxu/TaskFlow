import axios, { type AxiosError, type AxiosInstance } from 'axios'

export const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  timeout: 10_000,
})

apiClient.interceptors.request.use((config) => {
  const rawSession = window.localStorage.getItem('taskflow:auth-session')

  if (rawSession) {
    try {
      const session = JSON.parse(rawSession) as { token?: string }
      if (session.token) {
        config.headers.Authorization = `Bearer ${session.token}`
      }
    } catch {
      // 会话格式异常时交给认证层处理
    }
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    const message = error.response?.data?.message ?? error.message ?? '请求失败，请稍后重试'
    return Promise.reject(new Error(message))
  },
)

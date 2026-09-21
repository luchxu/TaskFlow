import { getDemoData } from '@/mock'
import type { AuthSession, LoginCredentials } from '@/types'
import { apiClient } from './client'
import { isRealApi } from './mode'

const SESSION_KEY = 'taskflow:auth-session'
const DEMO_PASSWORD = 'TaskFlow123'
const REQUEST_DELAY = 350

function delay(): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, REQUEST_DELAY))
}

function createToken(): string {
  return `mock-token-${crypto.randomUUID()}`
}

function saveSession(session: AuthSession): void {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

function clearSession(): void {
  window.localStorage.removeItem(SESSION_KEY)
}

function readSession(): AuthSession | null {
  const rawSession = window.localStorage.getItem(SESSION_KEY)

  if (!rawSession) {
    return null
  }

  try {
    const session = JSON.parse(rawSession) as AuthSession
    const isExpired = session.expiresAt ? Date.parse(session.expiresAt) <= Date.now() : false

    if (!session.token || !session.user || isExpired) {
      clearSession()
      return null
    }

    return session
  } catch {
    clearSession()
    return null
  }
}

export const authApi = {
  async login(credentials: LoginCredentials): Promise<AuthSession> {
    await delay()

    if (isRealApi) {
      const response = await apiClient.post<AuthSession>('/auth/login', credentials)
      saveSession(response.data)
      return response.data
    }

    const user = getDemoData().users.find(
      (item) => item.email.toLowerCase() === credentials.email.trim().toLowerCase(),
    )

    if (!user || credentials.password !== DEMO_PASSWORD) {
      throw new Error('邮箱或密码错误')
    }

    const session: AuthSession = {
      token: createToken(),
      user,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }

    saveSession(session)
    return session
  },

  async getSession(): Promise<AuthSession | null> {
    await delay()
    if (isRealApi) {
      const response = await apiClient.get<AuthSession | null>('/auth/session')
      if (response.data) saveSession(response.data)
      return response.data
    }
    return readSession()
  },

  async logout(): Promise<void> {
    await delay()
    if (isRealApi) {
      await apiClient.post('/auth/logout')
    }
    clearSession()
  },
}

// 保留 apiClient 的导入，明确真实接口替换点：
// authApi.login 将来可替换为 apiClient.post<AuthSession>('/auth/login', credentials)。
void apiClient

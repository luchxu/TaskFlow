import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { authApi } from '@/api'
import type { LoginCredentials, User } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const isLoading = ref(false)
  const hasRestoredSession = ref(false)

  const isAuthenticated = computed(() => Boolean(user.value && token.value))

  async function login(credentials: LoginCredentials): Promise<void> {
    isLoading.value = true

    try {
      const session = await authApi.login(credentials)
      user.value = session.user
      token.value = session.token
    } finally {
      isLoading.value = false
      hasRestoredSession.value = true
    }
  }

  async function restoreSession(): Promise<void> {
    if (hasRestoredSession.value) {
      return
    }

    isLoading.value = true

    try {
      const session = await authApi.getSession()
      user.value = session?.user ?? null
      token.value = session?.token ?? null
    } finally {
      isLoading.value = false
      hasRestoredSession.value = true
    }
  }

  async function logout(): Promise<void> {
    isLoading.value = true

    try {
      await authApi.logout()
      user.value = null
      token.value = null
    } finally {
      isLoading.value = false
    }
  }

  return {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    restoreSession,
    logout,
  }
})

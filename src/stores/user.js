import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '../api'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref(JSON.parse(localStorage.getItem('userInfo') || 'null'))

  const isLoggedIn = computed(() => !!token.value)
  const isManager = computed(() => ['MANAGER', 'HRBP', 'HR_ADMIN'].includes(userInfo.value?.role))
  const isAdmin = computed(() => userInfo.value?.role === 'HR_ADMIN')

  async function login(username, password) {
    const data = await authApi.login({ username, password })
    token.value = data.token
    userInfo.value = data
    localStorage.setItem('token', data.token)
    localStorage.setItem('userInfo', JSON.stringify(data))
    return data
  }

  function logout() {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
  }

  return { token, userInfo, isLoggedIn, isManager, isAdmin, login, logout }
})

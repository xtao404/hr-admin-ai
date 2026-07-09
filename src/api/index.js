import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../stores/user'
import router from '../router'

const api = axios.create({
  baseURL: '/api',
  timeout: 120000
})

api.interceptors.request.use(config => {
  const userStore = useUserStore()
  if (userStore.token) {
    config.headers.Authorization = `Bearer ${userStore.token}`
  }
  return config
})

api.interceptors.response.use(
  response => {
    const res = response.data
    if (res.code !== 200) {
      ElMessage.error(res.message || '请求失败')
      return Promise.reject(new Error(res.message))
    }
    return res.data
  },
  error => {
    if (error.response?.status === 401) {
      const userStore = useUserStore()
      userStore.logout()
      router.push('/login')
      ElMessage.error('登录已过期，请重新登录')
    } else if (error.response?.status === 403) {
      ElMessage.error('无权访问该资源')
    } else {
      ElMessage.error(error.response?.data?.message || error.message || '网络错误')
    }
    return Promise.reject(error)
  }
)

function getAuthHeaders() {
  const userStore = useUserStore()
  return {
    'Content-Type': 'application/json',
    ...(userStore.token ? { Authorization: `Bearer ${userStore.token}` } : {})
  }
}

function parseSseEvent(block) {
  if (!block.trim()) return null
  let event = 'message'
  let data = ''
  for (const line of block.replace(/\r\n/g, '\n').split('\n')) {
    if (line.startsWith('event:')) {
      event = line.slice(6).trim()
    } else if (line.startsWith('data:')) {
      data += (data ? '\n' : '') + line.slice(5).trim()
    }
  }
  if (!data) return null
  try {
    return { event, data: JSON.parse(data) }
  } catch {
    return { event, data }
  }
}

function dispatchSseEvents(buffer, handlers) {
  const normalized = buffer.replace(/\r\n/g, '\n')
  const parts = normalized.split('\n\n')
  for (const part of parts) {
    const evt = parseSseEvent(part)
    if (!evt) continue
    if (evt.event === 'trace') handlers.onTrace?.(evt.data)
    else if (evt.event === 'chunk') handlers.onChunk?.(evt.data)
    else if (evt.event === 'done') handlers.onDone?.(evt.data)
    else if (evt.event === 'error') handlers.onError?.(evt.data)
  }
  return parts.length > 0 ? parts[parts.length - 1] : buffer
}

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me')
}

export const chatApi = {
  ask: (data) => api.post('/chat/ask', data),
  askStream: async (data, handlers = {}) => {
    const response = await fetch('/api/chat/ask/stream', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    })
    if (!response.ok) {
      if (response.status === 401) {
        const userStore = useUserStore()
        userStore.logout()
        router.push('/login')
      }
      throw new Error(`请求失败 (${response.status})`)
    }
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    while (true) {
      const { done, value } = await reader.read()
      if (value) {
        buffer += decoder.decode(value, { stream: true })
        const normalized = buffer.replace(/\r\n/g, '\n')
        const parts = normalized.split('\n\n')
        buffer = parts.pop() || ''
        for (const part of parts) {
          const evt = parseSseEvent(part)
          if (!evt) continue
          if (evt.event === 'trace') handlers.onTrace?.(evt.data)
          else if (evt.event === 'chunk') handlers.onChunk?.(evt.data)
          else if (evt.event === 'done') handlers.onDone?.(evt.data)
          else if (evt.event === 'error') handlers.onError?.(evt.data)
        }
      }
      if (done) {
        buffer += decoder.decode()
        if (buffer.trim()) {
          dispatchSseEvents(buffer + '\n\n', handlers)
        }
        break
      }
    }
  },
  sessions: () => api.get('/chat/sessions'),
  messages: (sessionId) => api.get(`/chat/sessions/${sessionId}/messages`)
}

export const employeeApi = {
  profile: (employeeId) => api.get(`/employees/${employeeId}/profile`),
  profileByName: (name) => api.get(`/employees/by-name/${encodeURIComponent(name)}/profile`)
}

export const actionApi = {
  createTask: (data) => api.post('/actions/tasks', data)
}

export const analyticsApi = {
  dashboard: () => api.get('/analytics/dashboard'),
  turnover: (departmentId) => api.get('/analytics/turnover', { params: { departmentId } }),
  skillGaps: (departmentId) => api.get('/analytics/skill-gaps', { params: { departmentId } }),
  recruitment: () => api.get('/analytics/recruitment'),
  generateReport: (data) => api.post('/reports/generate', data)
}

export const knowledgeApi = {
  list: () => api.get('/knowledge'),
  create: (data) => api.post('/knowledge', data),
  delete: (id) => api.delete(`/knowledge/${id}`),
  upload: (file, category) => {
    const formData = new FormData()
    formData.append('file', file)
    if (category) {
      formData.append('category', category)
    }
    return api.post('/knowledge/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000
    })
  }
}

export default api

import axios from 'axios'

let BASE_URL = import.meta.env.VITE_API_BASE_URL || ''
// Enforce HTTPS to prevent Mixed Content errors on Vercel
if (BASE_URL.startsWith('http://') && !BASE_URL.includes('localhost')) {
  BASE_URL = BASE_URL.replace('http://', 'https://')
}
BASE_URL = BASE_URL.replace(/\/$/, '')

const api = axios.create({
  baseURL: BASE_URL ? `${BASE_URL}/api` : '/api',
  timeout: 30000,
})

// Inject JWT token into every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Users ──────────────────────────────────────────────────────────────────
export const getUsers = () => api.get('/users')
export const getUser = (id) => api.get(`/users/${id}`)
export const deleteUser = (id) => api.delete(`/users/${id}`)

export const registerUser = (formData) =>
  api.post('/users/register', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 180000, // 3 min — ArcFace on HuggingFace CPU can be slow
  })

export const addUserImages = (userId, formData) =>
  api.post(`/users/${userId}/add-images`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

// ── Attendance ─────────────────────────────────────────────────────────────
export const markAttendance = (data) =>
  api.post('/attendance/mark', data)

export const getAttendanceLogs = (params) =>
  api.get('/attendance/logs', { params })

export const getDailyReport = (date) =>
  api.get('/attendance/daily-report', { params: { date } })

export const getAttendanceTrend = () => api.get('/attendance/trend')

export const exportCSV = (date) => {
  const url = BASE_URL 
    ? `${BASE_URL}/api/attendance/export?date=${date}`
    : `http://localhost:8000/api/attendance/export?date=${date}`
  window.open(url, '_blank')
}

// ── Health ─────────────────────────────────────────────────────────────────
export const healthCheck = () => api.get('/health', { baseURL: '' })

// ── Organizations (Super Admin Only) ───────────────────────────────────────
export const getOrganizations = () => api.get('/organizations/')
export const updateOrganization = (id, data) => api.patch(`/organizations/${id}`, data)
export const deleteOrganization = (id) => api.delete(`/organizations/${id}`)
export const registerOrganization = (formData) => api.post('/auth/register-org', formData)
export const resetOrgPassword = (id, new_password) => api.post(`/organizations/${id}/reset-password`, { new_password })

// ── Cameras ────────────────────────────────────────────────────────────────
export const getCameras = () => api.get('/cameras/')
export const addCamera = (data) => api.post('/cameras/', data)
export const deleteCamera = (id) => api.delete(`/cameras/${id}`)

export default api

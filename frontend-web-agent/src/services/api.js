import axios from 'axios'

// import.meta.env.VITE_API_URL ||
const API_BASE_URL = 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Intercepteur pour ajouter le token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_profile')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// API Authentication
export const authAPI = {
  login: (credentials) => api.post('/admin/login', credentials),
  getProfile: () => api.get('/admin/profile'),
  updateProfile: (data) => api.put('/admin/profile', data),
}

// API Dashboard
export const dashboardAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getCharts: (period) => api.get(`/admin/dashboard/charts?period=${period}`),
}

// API Users
export const usersAPI = {
  getUsers: (params) => api.get('/admin/users', { params }),
  getUserDetail: (userId) => api.get(`/admin/users/${userId}`),
  updateUserStatus: (userId, data) => api.put(`/admin/users/${userId}/status`, data),
}

// API Declarations
export const declarationsAPI = {
  getDeclarations: (params) => api.get('/admin/declarations', { params }),
  getDeclarationDetail: (declarationId) => api.get(`/admin/declarations/${declarationId}`),
  validateDeclaration: (declarationId, data) => api.put(`/admin/declarations/${declarationId}/validate`, data),
}

// API Payments
export const paymentsAPI = {
  getPayments: (params) => api.get('/admin/payments', { params }),
  getPaymentDetail: (paymentId) => api.get(`/admin/payments/${paymentId}`),
  refundPayment: (paymentId, data) => api.put(`/admin/payments/${paymentId}/refund`, data),
}

// API NIF
export const nifAPI = {
  getPendingNIF: (params) => api.get('/admin/nif/pending', { params }),
  validateNIF: (userId, data) => api.put(`/admin/nif/${userId}/validate`, data),
}

// API Export - CORRIGÉ POUR LE BACKEND
export const exportAPI = {
  exportUsers: (params) => api.get('/admin/export/users', { 
    params,
    responseType: 'blob'
  }),
  exportDeclarations: (params) => api.get('/admin/export/declarations', {
    params,
    responseType: 'blob'
  }),
  exportPayments: (params) => api.get('/admin/export/payments', {
    params,
    responseType: 'blob'
  }),
}

// API System
export const systemAPI = {
  getConfig: () => api.get('/admin/system/config'),
  updateConfig: (data) => api.put('/admin/system/config', data),
  getZones: () => api.get('/admin/zones'),
}

// API Audit
export const auditAPI = {
  getAuditLogs: (params) => api.get('/admin/audit-logs', { params }),
}

export default api
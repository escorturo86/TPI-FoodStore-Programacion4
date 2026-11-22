import axios from 'axios'
import { useAuthStore } from '../../store/authStore'

export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
})

axiosInstance.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status
      const url = error.config?.url ?? ''
      const data: unknown = error.response?.data
      const desactivada =
        status === 400 &&
        typeof data === 'object' &&
        data !== null &&
        'detail' in data &&
        data.detail === 'Cuenta de usuario desactivada'
      const sesionVencida =
        status === 401 && !url.includes('/auth/token') && !url.includes('/auth/me')
      if (desactivada || sesionVencida) {
        useAuthStore.getState().clearSession()
      }
    }
    return Promise.reject(error)
  },
)
